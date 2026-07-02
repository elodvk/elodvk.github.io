# Requirements Document

## Introduction

A local podcast generation pipeline for PurpleSec that takes written transcripts as input, clones the author's voice using a reference audio sample, generates podcast-quality speech locally on an NVIDIA RTX 5070 (12 GB VRAM) system, and outputs web-compatible audio files ready for integration with the existing podcast section. The pipeline handles long-form content (15–30 minutes) through intelligent chunking, applies post-processing (normalization, silence trimming), and produces output compatible with the existing `docs/podcasts/` workflow (Markdown episode file + `.m4a` audio).

## Glossary

- **Pipeline**: The end-to-end Python tool that orchestrates transcript ingestion, TTS synthesis, post-processing, and output generation.
- **TTS_Engine**: The text-to-speech model responsible for converting text to audio using a cloned voice. Candidate engines include Chatterbox TTS, F5-TTS, and Orpheus TTS.
- **Voice_Profile**: A stored reference audio sample (5–15 seconds of clean speech) used by the TTS_Engine for zero-shot voice cloning.
- **Transcript**: A plain-text or Markdown file containing the podcast script to be synthesized.
- **Chunk**: A segment of the transcript sized appropriately for the TTS_Engine's context window, split at natural sentence or paragraph boundaries.
- **Post_Processor**: The audio processing stage that normalizes loudness, trims silence, applies crossfades between chunks, and exports to the target format.
- **Episode_Package**: The final output consisting of an audio file (`.m4a`) and a podcast Markdown file with correct frontmatter, ready to be placed in `docs/podcasts/`.

## Requirements

### Requirement 1: TTS Engine Selection and Integration

**User Story:** As a content creator, I want the pipeline to use a high-quality open-source TTS engine that fits within my 12 GB VRAM budget, so that I can generate realistic voice-cloned podcast audio locally without cloud dependencies.

#### Acceptance Criteria

1. THE Pipeline SHALL support at least one TTS_Engine capable of zero-shot voice cloning from a reference audio sample of 15 seconds or less.
2. THE TTS_Engine SHALL operate entirely locally without requiring network access during synthesis.
3. THE TTS_Engine SHALL consume no more than 12 GB of VRAM during inference.
4. WHEN the TTS_Engine is initialized, THE Pipeline SHALL validate that sufficient VRAM is available and report the model's memory footprint.
5. THE Pipeline SHALL provide a configuration option to select between supported TTS engines (Chatterbox TTS, F5-TTS, or Orpheus TTS).
6. WHEN an unsupported engine is specified in configuration, THE Pipeline SHALL exit with a descriptive error message listing available engines.

### Requirement 2: Voice Profile Management

**User Story:** As a content creator, I want to store and manage my voice reference samples, so that I can consistently clone my voice across multiple podcast episodes.

#### Acceptance Criteria

1. THE Pipeline SHALL store Voice_Profile files in a dedicated directory (`voice_profiles/`).
2. THE Pipeline SHALL accept voice reference audio in WAV, MP3, FLAC, or M4A format.
3. WHEN a Voice_Profile is registered, THE Pipeline SHALL validate that the audio is between 5 and 30 seconds in duration.
4. WHEN a Voice_Profile is shorter than 5 seconds, THE Pipeline SHALL reject it with a message indicating the minimum duration requirement.
5. WHEN a Voice_Profile is longer than 30 seconds, THE Pipeline SHALL truncate it to the first 30 seconds and emit a warning.
6. THE Pipeline SHALL support storing multiple named Voice_Profiles and selecting one by name at generation time.
7. WHEN no Voice_Profile name is specified, THE Pipeline SHALL use the profile named "default" if it exists.
8. IF no Voice_Profile named "default" exists and no profile name is specified, THEN THE Pipeline SHALL exit with an error listing available profiles.

### Requirement 3: Transcript Ingestion

**User Story:** As a content creator, I want to provide my podcast script as a text file, so that the pipeline can convert it to spoken audio.

#### Acceptance Criteria

1. THE Pipeline SHALL accept Transcript files in plain text (`.txt`) or Markdown (`.md`) format.
2. WHEN a Markdown Transcript is provided, THE Pipeline SHALL strip all Markdown formatting (headings, links, images, code blocks, emphasis) before synthesis, retaining only the spoken text content.
3. THE Pipeline SHALL support transcripts of any length, including content requiring 15 to 30 minutes of audio output.
4. WHEN a Transcript contains SSML-style pause markers (`[pause:Ns]` where N is a number), THE Pipeline SHALL insert N seconds of silence at that position in the output audio.
5. WHEN a Transcript contains section markers (`[section:Title]`), THE Pipeline SHALL log the timestamp of each section start for chapter metadata.
6. IF a Transcript file does not exist at the specified path, THEN THE Pipeline SHALL exit with a descriptive file-not-found error.

### Requirement 4: Long-Form Audio Chunking

**User Story:** As a content creator, I want the pipeline to handle long scripts gracefully, so that I can generate 15–30 minute podcast episodes without hitting TTS model context limits.

#### Acceptance Criteria

1. THE Pipeline SHALL split Transcripts into Chunks that respect the TTS_Engine's maximum input length.
2. THE Pipeline SHALL split Chunks at sentence boundaries, preserving complete sentences within each Chunk.
3. WHEN a single sentence exceeds the TTS_Engine's maximum input length, THE Pipeline SHALL split that sentence at clause boundaries (commas, semicolons, em-dashes).
4. THE Pipeline SHALL maintain a configurable overlap of 0 to 2 sentences between consecutive Chunks to preserve prosodic continuity.
5. WHEN all Chunks have been synthesized, THE Pipeline SHALL concatenate the resulting audio segments in order.
6. THE Pipeline SHALL apply configurable crossfade (default: 50 milliseconds) between consecutive audio Chunks to eliminate audible seams.

### Requirement 5: Audio Post-Processing

**User Story:** As a content creator, I want the generated audio to sound polished and broadcast-ready, so that listeners have a professional experience.

#### Acceptance Criteria

1. THE Post_Processor SHALL normalize the output audio to a target loudness of -16 LUFS (podcast standard) with a tolerance of ±1 LUFS.
2. THE Post_Processor SHALL trim leading and trailing silence exceeding 500 milliseconds from the final output.
3. THE Post_Processor SHALL reduce internal silence gaps longer than 2 seconds to exactly 1 second.
4. THE Post_Processor SHALL apply a fade-in of 100 milliseconds to the beginning of the audio.
5. THE Post_Processor SHALL apply a fade-out of 500 milliseconds to the end of the audio.
6. THE Post_Processor SHALL export the final audio in AAC-encoded M4A format at a bitrate of 128 kbps or higher.
7. WHEN the `ffmpeg` binary is not found on the system PATH, THE Post_Processor SHALL exit with an error message instructing the user to install FFmpeg.

### Requirement 6: Episode Package Generation

**User Story:** As a content creator, I want the pipeline to produce a complete episode package that integrates directly with the existing PurpleSec podcast section, so that I can publish new episodes by simply committing the output files.

#### Acceptance Criteria

1. THE Pipeline SHALL generate a Markdown episode file with frontmatter compatible with the `get_podcast_posts()` macro (fields: title, description, date, duration, authors, tags, image).
2. THE Pipeline SHALL compute the `duration` frontmatter field from the actual length of the generated audio file, formatted as `N min`.
3. THE Pipeline SHALL place the generated audio file in `docs/podcasts/` with a filename derived from the episode title (spaces replaced with underscores, title case).
4. THE Pipeline SHALL place the generated Markdown file in `docs/podcasts/` with a filename derived from the episode title (spaces replaced with underscores, lowercase).
5. THE Pipeline SHALL include an HTML audio player block in the Markdown episode file matching the existing episode format (an `<audio>` element with an M4A `<source>`).
6. WHEN the `--dry-run` flag is provided, THE Pipeline SHALL display the planned output paths and frontmatter without writing any files.
7. WHEN an output file already exists at the target path, THE Pipeline SHALL refuse to overwrite it and exit with an error, unless the `--force` flag is provided.

### Requirement 7: CLI Interface

**User Story:** As a content creator, I want a straightforward command-line interface, so that I can generate podcast episodes with a single command.

#### Acceptance Criteria

1. THE Pipeline SHALL provide a CLI entry point invokable as `python generate_podcast.py` or via a configured script name.
2. THE Pipeline SHALL accept the following required argument: `--transcript` (path to the Transcript file).
3. THE Pipeline SHALL accept the following optional arguments: `--voice` (Voice_Profile name, default: "default"), `--title` (episode title), `--description` (episode description), `--tags` (comma-separated list), `--engine` (TTS engine name), `--output-dir` (output directory, default: `docs/podcasts/`), `--dry-run`, and `--force`.
4. WHEN the `--title` argument is not provided, THE Pipeline SHALL derive the title from the Transcript filename (stripping extension, replacing underscores/hyphens with spaces, applying title case).
5. THE Pipeline SHALL display a progress indicator showing the current Chunk being processed and estimated time remaining.
6. WHEN synthesis completes successfully, THE Pipeline SHALL print a summary including: total duration, output file paths, and processing time.
7. IF an unrecoverable error occurs during synthesis, THEN THE Pipeline SHALL clean up any partial output files and exit with a non-zero exit code.

### Requirement 8: Configuration File

**User Story:** As a content creator, I want to store my default settings in a configuration file, so that I do not need to specify common options on every invocation.

#### Acceptance Criteria

1. THE Pipeline SHALL read default settings from a YAML configuration file at `podcast_config.yaml` in the project root.
2. THE Pipeline SHALL allow CLI arguments to override any setting defined in the configuration file.
3. THE Pipeline SHALL support the following configuration keys: `engine`, `voice`, `output_dir`, `crossfade_ms`, `target_lufs`, `bitrate`, `author_name`, `author_title`, `author_picture`, and `author_url`.
4. WHEN the configuration file does not exist, THE Pipeline SHALL use built-in defaults and proceed without error.
5. WHEN the configuration file contains an unrecognized key, THE Pipeline SHALL emit a warning naming the unrecognized key and continue.

### Requirement 9: Dependency and Environment Validation

**User Story:** As a content creator, I want the pipeline to verify its environment on startup, so that I get clear error messages instead of cryptic failures mid-generation.

#### Acceptance Criteria

1. WHEN the Pipeline starts, THE Pipeline SHALL verify that Python 3.10 or higher is running.
2. WHEN the Pipeline starts, THE Pipeline SHALL verify that required Python packages (torch, torchaudio, the selected TTS engine package, pydub, ffmpeg-python) are importable.
3. WHEN a required package is missing, THE Pipeline SHALL exit with an error message specifying the missing package and the install command (e.g., `pip install chatterbox-tts`).
4. WHEN the Pipeline starts, THE Pipeline SHALL verify that FFmpeg is available on the system PATH.
5. WHEN the selected TTS_Engine requires CUDA, THE Pipeline SHALL verify that a CUDA-compatible GPU is available and report the detected device name and available VRAM.
6. IF CUDA is not available and the selected engine requires it, THEN THE Pipeline SHALL exit with an error explaining that a CUDA GPU is required.

### Requirement 10: Transcript Parsing — Pretty Printer and Round-Trip

**User Story:** As a developer, I want to ensure the transcript parser correctly handles all markup conventions, so that no spoken content is lost or corrupted during ingestion.

#### Acceptance Criteria

1. THE Pipeline SHALL implement a Transcript parser that converts raw Transcript text into an internal representation (list of spoken segments and directives).
2. THE Pipeline SHALL implement a pretty printer that converts the internal representation back into valid Transcript format.
3. FOR ALL valid Transcripts, parsing then pretty-printing then parsing SHALL produce an equivalent internal representation (round-trip property).
4. WHEN a Transcript contains nested Markdown formatting (e.g., bold inside a list item), THE Parser SHALL correctly strip all formatting layers and retain only plain text.
5. WHEN a Transcript contains consecutive pause markers, THE Parser SHALL treat each as a separate silence insertion.
