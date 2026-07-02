# Design Document: Local Podcast Generation Pipeline

## Overview

This document describes the architecture and implementation plan for a local podcast generation pipeline that converts written transcripts into voice-cloned podcast audio. The system runs entirely on local hardware (RTX 5070, 12 GB VRAM) and integrates with the existing PurpleSec podcast content workflow.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Interface                             │
│  generate_podcast.py --transcript X --voice Y --title Z         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                     Config & Environment                         │
│  podcast_config.yaml │ env validation │ CUDA/FFmpeg checks       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    Transcript Parser                             │
│  .md/.txt → strip markdown → extract directives → segments      │
│  [pause:Ns] → silence │ [section:Title] → chapter markers       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                      Chunker                                     │
│  Split at sentence boundaries │ Respect engine max_tokens        │
│  Configurable overlap (0-2 sentences)                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    TTS Engine Adapter                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                  │
│  │Chatterbox│  │  F5-TTS  │  │ Orpheus/Ollama│                  │
│  └──────────┘  └──────────┘  └──────────────┘                  │
│  voice_profiles/ → load reference → synthesize per chunk        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                   Post-Processor                                 │
│  Concatenate chunks │ Crossfade │ Normalize (-16 LUFS)          │
│  Trim silence │ Fade in/out │ Export M4A (AAC 128kbps+)         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                  Episode Packager                                │
│  Generate .md frontmatter │ Compute duration │ Place files       │
│  docs/podcasts/{title}.md + {Title}.m4a                         │
└─────────────────────────────────────────────────────────────────┘
```

## TTS Engine Recommendation

### Primary: Chatterbox TTS (Resemble AI)

**Rationale:**
- MIT license — no commercial restrictions
- 0.5B parameters, ~3-6 GB VRAM — fits comfortably with headroom for batch processing
- Zero-shot voice cloning from ~5-10 seconds of reference audio
- Preferred over ElevenLabs 63.75% of the time in blind listening tests
- Simple pip install (`pip install chatterbox-tts`)
- Native PyTorch — straightforward integration, no llama.cpp complexity
- Best voice cloning quality among the candidates for natural podcast delivery

**Alternatives supported via adapter pattern:**
- **F5-TTS**: Flow-matching DiT, good quality, slightly more complex setup. Good fallback if Chatterbox has issues with specific voice characteristics.
- **Orpheus TTS**: Runs via Ollama (already installed). GGUF quantized (~4 GB). Supports emotion tags `[laugh]`, `[sigh]`. Lower voice cloning fidelity but interesting for expressive content. May require llama.cpp for voice cloning features rather than the Ollama server.

### Engine Adapter Interface

All engines implement a common interface:

```python
class TTSEngine(Protocol):
    def load(self, device: str = "cuda") -> None: ...
    def synthesize(self, text: str, voice_ref: Path, **kwargs) -> np.ndarray: ...
    def max_input_length(self) -> int: ...
    def sample_rate(self) -> int: ...
    def unload(self) -> None: ...
```

## File Structure

```
project_root/
├── generate_podcast.py          # CLI entry point
├── podcast_config.yaml          # Default configuration
├── podcast_pipeline/
│   ├── __init__.py
│   ├── cli.py                   # Argument parsing, progress display
│   ├── config.py                # Config loading, merging, validation
│   ├── environment.py           # Env checks (Python, CUDA, FFmpeg, packages)
│   ├── transcript_parser.py     # Parse .md/.txt → internal representation
│   ├── chunker.py               # Split text into engine-sized chunks
│   ├── engines/
│   │   ├── __init__.py          # Engine registry & factory
│   │   ├── base.py              # TTSEngine protocol + common utilities
│   │   ├── chatterbox_engine.py # Chatterbox TTS adapter
│   │   ├── f5tts_engine.py      # F5-TTS adapter
│   │   └── orpheus_engine.py    # Orpheus TTS (Ollama/llama.cpp) adapter
│   ├── voice_profile.py         # Voice profile management
│   ├── post_processor.py        # Audio normalization, trimming, export
│   └── packager.py              # Episode .md + .m4a output generation
├── voice_profiles/
│   └── default.wav              # User's voice reference sample
└── docs/podcasts/               # Output destination (existing)
```

## Component Design

### 1. Transcript Parser (`transcript_parser.py`)

**Internal Representation:**

```python
@dataclass
class SpokenSegment:
    text: str

@dataclass
class PauseDirective:
    duration_seconds: float

@dataclass
class SectionMarker:
    title: str

TranscriptElement = SpokenSegment | PauseDirective | SectionMarker

@dataclass
class ParsedTranscript:
    elements: list[TranscriptElement]
```

**Parsing flow:**
1. Detect format (.md vs .txt) from extension
2. If Markdown: use a lightweight Markdown-to-text converter (strip headings, links, images, code blocks, emphasis, lists — retain text content and paragraph breaks)
3. Scan for directive markers (`[pause:Ns]`, `[section:Title]`) and split into segments
4. Each contiguous text block → `SpokenSegment`
5. Each `[pause:N]` → `PauseDirective(N)`
6. Each `[section:Title]` → `SectionMarker(title)`

**Pretty printer:** Reassemble from internal representation back to text with markers. Used for testing round-trip correctness.

### 2. Chunker (`chunker.py`)

**Algorithm:**
1. Collect `SpokenSegment` elements (directives pass through as-is)
2. For each spoken segment, split into sentences using regex-based sentence boundary detection (handles abbreviations, decimals, URLs)
3. Group sentences into chunks where `len(chunk_text) <= engine.max_input_length()`
4. If a single sentence exceeds max length, sub-split at clause boundaries (`, ; — :`)
5. Apply configured overlap (0-2 trailing sentences from previous chunk prepended to next)
6. Return ordered list of `ChunkItem` (text chunk or directive)

### 3. TTS Engine — Chatterbox Adapter (`chatterbox_engine.py`)

```python
class ChatterboxEngine:
    def load(self, device="cuda"):
        from chatterbox.tts import ChatterboxTTS
        self.model = ChatterboxTTS.from_pretrained(device=device)

    def synthesize(self, text: str, voice_ref: Path, **kwargs) -> np.ndarray:
        audio = self.model.generate(text, audio_prompt=voice_ref)
        return audio.cpu().numpy()

    def max_input_length(self) -> int:
        return 500  # ~500 chars safe for single inference

    def sample_rate(self) -> int:
        return 24000  # Chatterbox outputs 24kHz
```

### 4. Post-Processor (`post_processor.py`)

**Processing chain (using pydub + pyloudnorm + FFmpeg):**
1. Receive list of audio arrays (numpy) from synthesis
2. Convert each to pydub `AudioSegment`
3. Concatenate with crossfade (default 50ms)
4. Insert silence segments for `PauseDirective` items
5. Normalize to -16 LUFS using pyloudnorm
6. Trim leading/trailing silence > 500ms
7. Reduce internal gaps > 2s to 1s
8. Apply fade-in (100ms) and fade-out (500ms)
9. Export to M4A via FFmpeg subprocess (AAC, 128kbps)

### 5. Episode Packager (`packager.py`)

Generates the Markdown file matching the existing format observed in `microsoft_insider_eight_zero_days.md`:

```markdown
---
title: "{title}"
description: "{description}"
date: {YYYY-MM-DD}
duration: {N} min
authors:
  name: {author_name}
  title: {author_title}
  picture: {author_picture}
  url: {author_url}
tags:
  - {tag1}
  - Podcast
image: assets/images/podcast_cover.png
---

<div class="ps-podcast-container">
  <div class="ps-podcast-card">
    <div class="ps-podcast-cover" style="background-image: url('/assets/images/podcast_cover.png');"></div>
    <div class="ps-podcast-info">
      <div class="ps-podcast-badge">Podcast Episode</div>
      <h3 class="ps-podcast-title">{title}</h3>
      <div class="ps-podcast-player-wrapper">
        <audio controls>
          <source src="/podcasts/{Audio_Filename}.m4a" type="audio/mp4">
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  </div>
</div>

{description or intro text}
```

### 6. Voice Profile Manager (`voice_profile.py`)

- Profiles stored as audio files in `voice_profiles/` directory
- Metadata (name, format, duration) tracked in `voice_profiles/profiles.json`
- On registration: validate duration (5-30s), convert to WAV if needed (standardize for engine compatibility), store
- Lookup by name, fallback to "default"

### 7. Configuration (`config.py`)

```yaml
# podcast_config.yaml
engine: chatterbox
voice: default
output_dir: docs/podcasts/
crossfade_ms: 50
target_lufs: -16
bitrate: 128k
author_name: "Bilash J. Shahi"
author_title: "Cybersecurity Professional"
author_picture: "https://avatars.githubusercontent.com/elodvk"
author_url: "https://purplesec.org"
```

## Dependencies

```
# Core
torch>=2.0
torchaudio>=2.0
chatterbox-tts          # Primary TTS engine
pydub>=0.25             # Audio manipulation
pyloudnorm>=0.1         # LUFS measurement & normalization
numpy>=1.24
pyyaml>=6.0

# System requirement (not pip)
# FFmpeg (must be on PATH for M4A export)

# Optional engines
# f5-tts                # Alternative engine
# orpheus-tts           # Alternative engine (or via Ollama)
```

## Correctness Properties

### Property 1: Transcript Parser Round-Trip (Req 10.3)
For all valid transcripts T: `parse(pretty_print(parse(T))) == parse(T)`

The parser converts text to an internal list of `TranscriptElement` objects, and the pretty printer converts back. A second parse of the pretty-printed output must produce an equivalent element list.

### Property 2: Chunk Size Invariant (Req 4.1, 4.2)
For all transcripts T and max_length M: every chunk produced by `chunker.split(T, M)` has `len(chunk.text) <= M`.

No chunk exceeds the engine's maximum input length.

### Property 3: Chunk Sentence Boundary (Req 4.2)
For all non-final chunks C produced by the chunker: C.text ends at a sentence boundary (terminal punctuation followed by whitespace or end-of-string).

### Property 4: Chunker Content Preservation (Req 4.1)
For all transcripts T: the concatenation of all chunk texts (minus overlap) equals the original spoken text content of T. No content is lost or duplicated (beyond configured overlap).

### Property 5: Markdown Stripping Completeness (Req 3.2, 10.4)
For all Markdown-formatted transcripts M: `strip_markdown(M)` contains no Markdown structural syntax (no `#`, `*`, `_`, `` ` ``, `[`, `]`, `>` in structural positions). The output is plain text only.

### Property 6: Filename Derivation Determinism (Req 6.3, 6.4)
For all episode titles T: `derive_audio_filename(T)` and `derive_markdown_filename(T)` are deterministic, produce valid filesystem names (no special characters beyond underscores), and the audio filename uses title case while the markdown filename uses lowercase.

### Property 7: Voice Profile Duration Validation (Req 2.3)
For all audio files A with duration D: if 5 ≤ D ≤ 30, the profile is accepted; if D < 5, it is rejected; if D > 30, it is truncated to 30 seconds.

### Property 8: Configuration Precedence (Req 8.2)
For all configuration keys K: if K is specified both in `podcast_config.yaml` and as a CLI argument, the CLI value is used in the final resolved configuration.

### Property 9: Post-Processing Loudness (Req 5.1)
For all non-silent audio inputs A: the output of `normalize(A)` has integrated loudness within [-17, -15] LUFS.

### Property 10: Episode Frontmatter Completeness (Req 6.1)
For all episode configurations C: the generated Markdown frontmatter contains all required keys (`title`, `description`, `date`, `duration`, `authors`, `tags`, `image`) and the `duration` field matches the format `N min` where N is a positive integer.

## Error Handling Strategy

- **Fail-fast on environment issues**: All validation (Python version, CUDA, FFmpeg, packages) happens before any processing begins.
- **Graceful cleanup**: If synthesis fails mid-way, partial output files are removed.
- **Clear error messages**: Every error includes what went wrong, why, and what the user can do (e.g., install command for missing packages).
- **No silent data loss**: The chunker and parser are validated via round-trip properties to ensure no content is dropped.

## Performance Considerations

- **Chunk-level progress**: Each chunk synthesis reports progress (chunk N of M, elapsed time, ETA).
- **GPU memory management**: Engine is loaded once, chunks processed sequentially. `torch.cuda.empty_cache()` called between chunks if memory pressure detected.
- **Estimated throughput**: Chatterbox TTS on RTX 5070 synthesizes approximately 10-20x real-time (1 minute of audio in 3-6 seconds). A 20-minute podcast should complete in 1-2 minutes of synthesis time plus post-processing.
- **Disk I/O**: Intermediate chunk audio stored in a temp directory, cleaned up after concatenation.
