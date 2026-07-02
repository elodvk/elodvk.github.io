# Implementation Plan: Local Podcast Generation Pipeline

## Overview

This implementation plan converts the local podcast generation pipeline design into discrete coding tasks. The pipeline takes written transcripts, clones the author's voice using a reference audio sample, generates podcast-quality speech locally on an NVIDIA RTX 5070 (12 GB VRAM), and outputs web-compatible audio files ready for integration with the existing PurpleSec podcast section. The implementation uses Python with Chatterbox TTS as the primary engine and follows an adapter pattern for engine flexibility.

## Tasks

- [x] 1. Project Structure and Configuration
  - [x] 1.1 Create the `podcast_pipeline/` package directory with `__init__.py`
    - Set up the Python package structure for the pipeline
    - _Requirements: 9.1, 9.2_

  - [x] 1.2 Create `podcast_pipeline/config.py` — implement `PipelineConfig` dataclass with all config keys (engine, voice, output_dir, crossfade_ms, target_lufs, bitrate, author_name, author_title, author_picture, author_url), YAML loading from `podcast_config.yaml`, and CLI override merging
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 1.3 Create `podcast_config.yaml` with sensible defaults for PurpleSec (Chatterbox engine, default voice, docs/podcasts/ output, -16 LUFS, 128k bitrate, Bilash's author info)
    - _Requirements: 8.1, 8.3_

  - [x] 1.4 Create `podcast_pipeline/environment.py` — implement startup checks: Python ≥3.10, required packages importable (torch, torchaudio, pydub, pyloudnorm, yaml), FFmpeg on PATH, CUDA GPU available with device name and VRAM reporting
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 1.5 Create `requirements-podcast.txt` listing all pip dependencies (torch, torchaudio, chatterbox-tts, pydub, pyloudnorm, numpy, pyyaml, ffmpeg-python)
    - _Requirements: 9.2, 9.3_

- [x] 2. Transcript Parser
  - [x] 2.1 Create `podcast_pipeline/transcript_parser.py` — define data classes: `SpokenSegment`, `PauseDirective`, `SectionMarker`, `ParsedTranscript`
    - _Requirements: 10.1_

  - [x] 2.2 Implement `parse_transcript(path: Path) -> ParsedTranscript` — detect .md/.txt format, strip Markdown formatting (headings, emphasis, links, images, code blocks, lists), extract `[pause:Ns]` and `[section:Title]` directives, split into typed elements
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 10.1, 10.4, 10.5_

  - [x] 2.3 Implement `pretty_print(transcript: ParsedTranscript) -> str` — convert internal representation back to valid transcript text with markers
    - _Requirements: 10.2, 10.3_

  - [x] 2.4 Implement Markdown stripping helper using regex-based approach (strip `#`, `*/_`, `` ` ``/``` ```, `[]()`, `![]()`, `>`, `- ` list markers) preserving paragraph structure
    - _Requirements: 3.2, 10.4_

  - [x]* 2.5 Write property test: round-trip — for generated transcripts with mixed text, pause markers, and section markers, `parse(pretty_print(parse(T))) == parse(T)`
    - **Property 1: Transcript Parser Round-Trip**
    - **Validates: Requirements 10.3**

  - [x]* 2.6 Write property test: Markdown stripping completeness — for generated Markdown text, stripped output contains no Markdown structural syntax in structural positions
    - **Property 5: Markdown Stripping Completeness**
    - **Validates: Requirements 3.2, 10.4**

- [x] 3. Text Chunker
  - [x] 3.1 Create `podcast_pipeline/chunker.py` — implement sentence boundary detection using regex (handle abbreviations like Mr./Dr./U.S., decimal numbers, URLs)
    - _Requirements: 4.2_

  - [x] 3.2 Implement `split_into_chunks(transcript: ParsedTranscript, max_length: int, overlap: int) -> list[ChunkItem]` — group sentences into chunks respecting max_length, split oversized sentences at clause boundaries, preserve directives in-order
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.3 Implement overlap logic — prepend 0-2 trailing sentences from previous chunk to next chunk for prosodic continuity
    - _Requirements: 4.4_

  - [x]* 3.4 Write property test: chunk size invariant — for all generated texts and max_lengths, every chunk has `len(chunk.text) <= max_length`
    - **Property 2: Chunk Size Invariant**
    - **Validates: Requirements 4.1, 4.2**

  - [x]* 3.5 Write property test: content preservation — concatenation of all chunks (minus overlap) equals original spoken text, no content lost
    - **Property 4: Chunker Content Preservation**
    - **Validates: Requirements 4.1**

- [x] 4. TTS Engine Adapter Layer
  - [x] 4.1 Create `podcast_pipeline/engines/base.py` — define `TTSEngine` Protocol (load, synthesize, max_input_length, sample_rate, unload) and engine registry dict
    - _Requirements: 1.1, 1.5_

  - [x] 4.2 Create `podcast_pipeline/engines/__init__.py` — implement `get_engine(name: str) -> TTSEngine` factory with error handling for unknown engines
    - _Requirements: 1.5, 1.6_

  - [x] 4.3 Create `podcast_pipeline/engines/chatterbox_engine.py` — implement `ChatterboxEngine` adapter: lazy model loading, synthesis with voice reference path, 24kHz output, VRAM reporting
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.4 Create `podcast_pipeline/engines/f5tts_engine.py` — implement `F5TTSEngine` adapter stub with same interface (load, synthesize, sample_rate, max_input_length)
    - _Requirements: 1.5_

  - [x] 4.5 Create `podcast_pipeline/engines/orpheus_engine.py` — implement `OrpheusEngine` adapter stub for Ollama/llama.cpp integration
    - _Requirements: 1.5_

- [x] 5. Voice Profile Management
  - [x] 5.1 Create `podcast_pipeline/voice_profile.py` — implement `VoiceProfileManager` class: discover profiles in `voice_profiles/` directory, load `profiles.json` metadata
    - _Requirements: 2.1, 2.6_

  - [x] 5.2 Implement `register_profile(name: str, audio_path: Path)` — validate duration (5-30s), convert to WAV if needed (via pydub), store in voice_profiles/, update profiles.json
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 5.3 Implement `get_profile(name: str | None) -> Path` — lookup by name, fallback to "default", error if not found with available profile list
    - _Requirements: 2.6, 2.7, 2.8_

  - [x] 5.4 Implement duration validation: reject <5s with message, truncate >30s with warning, accept 5-30s
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 5.5 Create `voice_profiles/` directory with a `.gitkeep` and README explaining how to add voice samples
    - _Requirements: 2.1_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Audio Post-Processor
  - [x] 7.1 Create `podcast_pipeline/post_processor.py` — implement `PostProcessor` class with configurable parameters (crossfade_ms, target_lufs, bitrate)
    - _Requirements: 5.1, 5.6_

  - [x] 7.2 Implement chunk concatenation with crossfade — convert numpy arrays to pydub AudioSegments, apply crossfade between consecutive chunks, insert silence for PauseDirectives
    - _Requirements: 4.5, 4.6_

  - [x] 7.3 Implement loudness normalization using pyloudnorm — measure integrated LUFS, apply gain to reach -16 LUFS target (±1 tolerance)
    - _Requirements: 5.1_

  - [x] 7.4 Implement silence trimming — trim leading/trailing silence >500ms, reduce internal gaps >2s to 1s
    - _Requirements: 5.2, 5.3_

  - [x] 7.5 Implement fade-in (100ms) and fade-out (500ms) using pydub
    - _Requirements: 5.4, 5.5_

  - [x] 7.6 Implement M4A export — call FFmpeg subprocess to encode final audio as AAC at configured bitrate, validate FFmpeg availability first
    - _Requirements: 5.6, 5.7_

- [x] 8. Episode Packager
  - [x] 8.1 Create `podcast_pipeline/packager.py` — implement `EpisodePackager` class that generates the markdown episode file and places audio
    - _Requirements: 6.1, 6.5_

  - [x] 8.2 Implement filename derivation — `derive_audio_filename(title)` (title case, underscores) and `derive_markdown_filename(title)` (lowercase, underscores)
    - _Requirements: 6.3, 6.4_

  - [x] 8.3 Implement Markdown generation — produce frontmatter (title, description, date, duration, authors, tags, image) + HTML audio player block matching existing episode format
    - _Requirements: 6.1, 6.5_

  - [x] 8.4 Implement duration computation from actual audio file length (using pydub/ffprobe), format as `N min`
    - _Requirements: 6.2_

  - [x] 8.5 Implement file placement — write .md and .m4a to output_dir, respect --dry-run (print plan only) and --force (overwrite) flags
    - _Requirements: 6.6, 6.7_

  - [x]* 8.6 Write property test: filename derivation determinism — for generated titles, filenames are deterministic, filesystem-safe, and follow case conventions
    - **Property 6: Filename Derivation Determinism**
    - **Validates: Requirements 6.3, 6.4**

  - [x]* 8.7 Write property test: frontmatter completeness — for generated episode configs, YAML frontmatter contains all required keys with correct types
    - **Property 10: Episode Frontmatter Completeness**
    - **Validates: Requirements 6.1**

- [x] 9. CLI Interface
  - [x] 9.1 Create `podcast_pipeline/cli.py` — implement argument parser with required (--transcript) and optional (--voice, --title, --description, --tags, --engine, --output-dir, --dry-run, --force) arguments
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Implement title derivation from filename when --title not provided (strip extension, replace underscores/hyphens with spaces, title case)
    - _Requirements: 7.4_

  - [x] 9.3 Implement progress display — show current chunk (N/M), elapsed time, ETA based on average chunk processing time
    - _Requirements: 7.5_

  - [x] 9.4 Implement completion summary — print total duration, output file paths, total processing time
    - _Requirements: 7.6_

  - [x] 9.5 Implement error handling — catch exceptions, clean up partial output files, exit with non-zero code and descriptive message
    - _Requirements: 7.7_

- [x] 10. Main Orchestrator and Entry Point
  - [x] 10.1 Create `generate_podcast.py` — wire together: parse CLI args → load config → validate environment → load engine → parse transcript → chunk → synthesize (with progress) → post-process → package → summary
    - _Requirements: 7.1, 7.5, 7.6_

  - [x] 10.2 Implement the main synthesis loop — iterate over chunks, call engine.synthesize for each, collect audio arrays, handle directives (pause → silence array, section → log timestamp)
    - _Requirements: 3.4, 3.5, 4.5_

  - [x] 10.3 Implement cleanup on failure — wrap synthesis in try/finally, delete partial output files on exception
    - _Requirements: 7.7_

  - [x] 10.4 Add GPU memory management — call `torch.cuda.empty_cache()` periodically if VRAM usage exceeds 80% of available
    - _Requirements: 1.3, 1.4_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integration Testing and Documentation
  - [x] 12.1 Create a sample transcript (`examples/sample_transcript.md`) demonstrating all features: Markdown formatting, [pause:2] markers, [section:Title] markers, 2-3 paragraphs of cybersecurity content
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 12.2 Create a README section or `PODCAST_PIPELINE.md` documenting: setup instructions (install deps, FFmpeg, add voice sample), usage examples, configuration reference, troubleshooting
    - _Requirements: 7.1, 9.1, 9.2, 9.3_

  - [x] 12.3 Add `--version` flag and pipeline version constant
    - _Requirements: 7.3_

  - [x] 12.4 Verify end-to-end: transcript → audio → episode files placed correctly in docs/podcasts/ with valid frontmatter that `get_podcast_posts()` macro picks up
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The primary TTS engine is Chatterbox TTS; F5-TTS and Orpheus adapters are stubs for future expansion
- FFmpeg must be installed separately (system dependency, not pip)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5", "5.5"] },
    { "id": 1, "tasks": ["1.2", "1.4", "2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.2", "5.1"] },
    { "id": 3, "tasks": ["2.5", "2.6", "3.2", "4.3", "4.4", "4.5", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["3.3", "3.4", "3.5", "7.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "9.1"] },
    { "id": 7, "tasks": ["8.6", "8.7", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "10.4"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 11, "tasks": ["12.4"] }
  ]
}
```
