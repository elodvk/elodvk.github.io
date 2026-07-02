# Voice Profiles

This directory stores voice reference audio samples used by the podcast generation pipeline for TTS voice cloning. The TTS engine uses these samples to replicate your voice when generating podcast audio.

## Voice Sample Requirements

- **Format**: WAV preferred (MP3, FLAC, and M4A also accepted)
- **Duration**: 5–30 seconds of audio
  - Samples shorter than 5 seconds will be rejected
  - Samples longer than 30 seconds will be automatically truncated to 30 seconds
- **Content**: Clean speech without background noise, music, or other speakers
- **Quality**: Record at 16-bit/44.1 kHz or higher for best results

## How to Register a Voice Profile

### Option 1: Via CLI

```bash
python generate_podcast.py --register-voice <name> <audio_file>
```

For example:

```bash
python generate_podcast.py --register-voice default my_sample.wav
```

### Option 2: Manual

1. Place your WAV file in this directory
2. Update `profiles.json` in this directory with an entry mapping your profile name to the filename

## Default Profile

When no `--voice` argument is provided to the pipeline, it uses the profile named **"default"**. Make sure you have a profile registered with that name for the simplest workflow.
