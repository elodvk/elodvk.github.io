# Podcast Generation Pipeline

Generate audio versions of blog posts using local TTS with zero-shot voice cloning. Audio is embedded directly into blog posts as an inline player. Runs entirely on local hardware — no cloud APIs required.

## Overview

The pipeline takes a transcript (written from a blog post), clones your voice from a short reference sample, synthesizes speech locally using an NVIDIA GPU, applies broadcast-quality post-processing, and embeds the audio player directly into the source blog post.

Key capabilities:

- Zero-shot voice cloning from a 5–30 second reference sample
- Multiple voice profiles (your voice, character voices, etc.)
- Multiple TTS engines (Chatterbox TTS, F5-TTS)
- Broadcast-standard loudness normalization (-16 LUFS)
- Audio embedded directly in blog posts (no separate podcast section)

## Prerequisites

| Requirement | Details |
|---|---|
| Python | 3.12 (3.14 lacks PyTorch CUDA support) |
| GPU | NVIDIA CUDA-compatible GPU (RTX 5070 / 12 GB VRAM recommended) |
| FFmpeg | Shared build on system PATH ([gyan.dev](https://www.gyan.dev/ffmpeg/builds/)) |
| OS | Windows (tested), Linux, macOS |

## Setup

### 1. Create a dedicated venv

```bash
py -3.12 -m venv .venv-podcast
.venv-podcast\Scripts\activate
```

### 2. Install PyTorch with CUDA (for RTX 50-series / Blackwell)

```bash
pip install --pre torch torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128
```

### 3. Install pipeline dependencies

```bash
pip install -r requirements-podcast.txt
pip install f5-tts soundfile
```

### 4. Install FFmpeg (shared build)

Download **ffmpeg-release-full-shared** from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/). Extract and add the `bin/` folder to your system PATH.

### 5. Register a voice profile

```bash
python generate_podcast.py --register-voice default path/to/your_voice.wav
```

Accepts WAV, MP3, FLAC, M4A. Duration must be 5–30 seconds of clean speech.

## Usage

### Generate and embed audio into a blog post

```bash
python generate_podcast.py -t transcripts/my_post.md --blog-post docs/blog/my_post.md --voice bilash --title "My Post Title" --force
```

This will:
1. Synthesize the transcript using the specified voice
2. Save the `.m4a` file to `docs/blog/assets/`
3. Inject an `<audio>` player into the blog post (after the banner image)

### Generate standalone audio (without embedding)

```bash
python generate_podcast.py -t transcripts/my_post.md --title "My Post Title"
```

Outputs `.m4a` and `.md` to the configured `output_dir`.

### Use a different engine

```bash
python generate_podcast.py -t transcripts/my_post.md --engine f5tts --voice bilash --blog-post docs/blog/my_post.md --force
```

F5-TTS produces better quality (natural prosody, rhythm) but requires the shared FFmpeg DLLs.

### Dry run

```bash
python generate_podcast.py -t transcripts/my_post.md --blog-post docs/blog/my_post.md --dry-run
```

### CLI reference

| Flag | Short | Description | Default |
|---|---|---|---|
| `--transcript` | `-t` | Path to transcript file (.md or .txt) | *(required)* |
| `--blog-post` | `-b` | Blog post to embed audio into | None (standalone mode) |
| `--voice` | `-v` | Voice profile name | `default` |
| `--title` | | Episode title (for filename) | Derived from transcript filename |
| `--description` | `-d` | Episode description | Empty |
| `--tags` | | Comma-separated tag list | None |
| `--engine` | `-e` | TTS engine (`chatterbox` or `f5tts`) | From config |
| `--output-dir` | `-o` | Output directory (standalone mode) | `docs/blog/assets` |
| `--dry-run` | | Preview only, no files written | Off |
| `--force` | `-f` | Overwrite existing audio file | Off |
| `--register-voice` | | Register a voice: `--register-voice <name> <file>` | — |

## Configuration

Defaults in `podcast_config.yaml`:

```yaml
engine: f5tts
voice: default
output_dir: docs/blog/assets
crossfade_ms: 75
target_lufs: -16
bitrate: 128k
author_name: Bilash J. Shahi
author_title: Cybersecurity Professional
author_picture: https://purplesec.org/assets/images/logo.png
author_url: https://purplesec.org/about/
```

## Transcript Format

Transcripts are Markdown or plain text. Write them conversationally — they'll be spoken aloud.

```markdown
# Episode Title

[section:Introduction]

Hey everyone, welcome back. Today we're talking about...

[pause:2]

[section:Main Topic]

So here's what happened...

[pause:1.5]

That's it for today. Stay safe out there.
```

### Directives

| Marker | Effect |
|---|---|
| `[pause:Ns]` | Insert N seconds of silence |
| `[section:Title]` | Log a chapter marker (metadata only) |

## Voice Profiles

Stored in `voice_profiles/`. Register with:

```bash
python generate_podcast.py --register-voice bilash examples/bilash.m4a
python generate_podcast.py --register-voice trump examples/trump.mp3
python generate_podcast.py --register-voice freeman examples/freeman.wav
```

Requirements: 5–30 seconds, clean speech, minimal background noise.

## Workflow

1. Write a transcript in `transcripts/` (adapt the blog post into conversational style)
2. Generate and embed: `python generate_podcast.py -t transcripts/post.md --blog-post docs/blog/post.md --voice bilash --force`
3. The blog post now has an audio player in the sidebar
4. Commit the blog post changes (audio `.m4a` files are gitignored)

## Troubleshooting

| Error | Fix |
|---|---|
| FFmpeg not found | Add shared FFmpeg `bin/` to PATH |
| CUDA not available | Install nightly torch with cu128: `pip install --pre torch --index-url https://download.pytorch.org/whl/nightly/cu128` |
| torchcodec missing | Install shared FFmpeg build (needs DLLs), or `pip install torchcodec` |
| Voice too short | Provide 5+ second sample |
| Output already exists | Use `--force` to overwrite |
| sm_120 not compatible | Use nightly PyTorch (cu128), not stable release |
