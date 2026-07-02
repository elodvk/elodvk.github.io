#!/usr/bin/env python3
"""Generate a podcast episode from a transcript using local TTS.

Main entry point for the podcast generation pipeline. Wires together all
modules: CLI → Config → Environment → Engine → Transcript → Chunks →
Synthesize (with progress) → Post-process → Package → Summary.

Usage:
    python generate_podcast.py --transcript path/to/script.md --title "My Episode"
"""

import sys
import time
import tempfile
from pathlib import Path

from podcast_pipeline.cli import parse_args, get_cli_overrides, print_summary, handle_error
from podcast_pipeline.config import load_config, merge_cli_overrides
from podcast_pipeline.environment import validate_environment
from podcast_pipeline.engines import get_engine
from podcast_pipeline.transcript_parser import parse_transcript, PauseDirective, SectionMarker
from podcast_pipeline.chunker import split_into_chunks
from podcast_pipeline.post_processor import PostProcessor
from podcast_pipeline.packager import EpisodePackager
from podcast_pipeline.voice_profile import VoiceProfileManager
from podcast_pipeline.progress import ProgressTracker


def _maybe_clear_gpu_cache(chunk_idx: int, interval: int = 10) -> None:
    """Clear GPU cache periodically if VRAM usage is high."""
    if chunk_idx % interval != 0 or chunk_idx == 0:
        return
    try:
        import torch
        if not torch.cuda.is_available():
            return
        allocated = torch.cuda.memory_allocated()
        props = torch.cuda.get_device_properties(0)
        total = getattr(props, 'total_memory', None) or getattr(props, 'total_mem', 0)
        if total == 0:
            return
        usage_pct = allocated / total
        if usage_pct > 0.8:
            torch.cuda.empty_cache()
    except (ImportError, RuntimeError):
        pass


def register_voice(name: str, audio_file: str) -> None:
    """Register a voice profile from an audio file."""
    audio_path = Path(audio_file)
    voice_mgr = VoiceProfileManager()

    print(f"Registering voice profile '{name}' from {audio_path}...")
    stored_path = voice_mgr.register_profile(name, audio_path)
    print(f"  ✓ Voice profile '{name}' registered at {stored_path}")
    print()
    print(f"  Use it with: python generate_podcast.py -t script.md --voice {name}")


def main() -> None:
    """Run the full podcast generation pipeline."""
    start_time = time.time()

    # 1. Parse CLI args
    args = parse_args()

    # Handle voice registration mode
    if args.register_voice:
        name, audio_file = args.register_voice
        register_voice(name, audio_file)
        return

    # 2. Load config and merge CLI overrides
    config = load_config()
    overrides = get_cli_overrides(args)
    config = merge_cli_overrides(config, overrides)

    # 3. Validate environment (skip heavy checks in dry-run mode)
    print("Validating environment...")
    if not args.dry_run:
        validate_environment()
    else:
        print("  (skipping full validation in dry-run mode)")
    print()

    # 4. Load TTS engine (skip in dry-run mode)
    engine = None
    if not args.dry_run:
        print(f"Loading TTS engine: {config.engine}...")
        engine = get_engine(config.engine)
        # Detect device: prefer CUDA, fall back to CPU
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cpu":
            print("  ⚠ CUDA not available, loading on CPU (slower)")
        engine.load(device=device)
        print()

    # 5. Load voice profile (skip in dry-run)
    voice_path = None
    if not args.dry_run:
        voice_mgr = VoiceProfileManager()
        voice_path = voice_mgr.get_profile(config.voice)
        print(f"Voice profile: {config.voice} ({voice_path})")
        print()

    # 6. Parse transcript
    transcript_path = Path(args.transcript)
    print(f"Parsing transcript: {transcript_path}...")
    transcript = parse_transcript(transcript_path)
    print(f"  {len(transcript.spoken_segments)} segments, {transcript.section_count} sections")
    print()

    # 7. Chunk transcript
    max_input = engine.max_input_length if engine else 300
    chunks = split_into_chunks(transcript, max_length=max_input, overlap=0)
    text_chunks = [c for c in chunks if not c.is_directive]
    print(f"Split into {len(text_chunks)} text chunks (max {max_input} chars)")
    print()

    # 8. Synthesize with progress, post-process, and package
    # Wrap in try/finally to ensure engine is unloaded and temp files cleaned up
    tmp_path: Path | None = None
    try:
        # --- DRY RUN MODE: skip synthesis, just show the plan ---
        if args.dry_run:
            print("Dry run — skipping synthesis and post-processing.")
            print()
            print("Packaging episode (dry run)...")
            packager = EpisodePackager(config)
            description = args.description or ""
            tags = args.tags or []

            # Show what would be generated
            audio_filename = packager.derive_audio_filename(args.title) + ".m4a"
            markdown_filename = packager.derive_markdown_filename(args.title) + ".md"
            output_dir = Path(config.output_dir)
            print(f"  Would write: {output_dir / markdown_filename}")
            print(f"  Would write: {output_dir / audio_filename}")
            print()

            processing_time = time.time() - start_time
            print_summary("? min", output_dir / markdown_filename, output_dir / audio_filename, processing_time)
            return

        # --- FULL GENERATION MODE ---
        print("Synthesizing audio...")
        progress = ProgressTracker(total_chunks=len(text_chunks))
        progress.start()

        audio_pieces: list = []  # numpy arrays and PauseDirectives
        chunk_idx = 0
        for chunk in chunks:
            if chunk.is_directive:
                if isinstance(chunk.directive, PauseDirective):
                    audio_pieces.append(chunk.directive)
                elif isinstance(chunk.directive, SectionMarker):
                    print(f"  [section] '{chunk.directive.title}' at chunk {chunk_idx}")
            else:
                # Synthesize: prepend overlap_prefix if present for prosodic continuity
                synth_text = (
                    chunk.overlap_prefix + " " + chunk.text
                    if chunk.overlap_prefix
                    else chunk.text
                )
                audio_array = engine.synthesize(synth_text.strip(), voice_path)
                audio_pieces.append(audio_array)
                _maybe_clear_gpu_cache(chunk_idx)
                progress.update(chunk_idx)
                chunk_idx += 1

        progress.finish()
        print()

        # 9. Post-process
        print("Post-processing audio...")
        processor = PostProcessor(
            crossfade_ms=config.crossfade_ms,
            target_lufs=config.target_lufs,
            bitrate=config.bitrate,
            sample_rate=engine.sample_rate,
        )

        # Export to temp file first, then package
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        processor.process(audio_pieces, tmp_path)
        print()

        # 10. Package episode
        print("Packaging...")
        packager = EpisodePackager(config)
        description = args.description or ""
        tags = args.tags or []

        blog_post = getattr(args, 'blog_post', None)
        if blog_post:
            # Embed mode: inject audio player into existing blog post
            blog_post_path = Path(blog_post)
            audio_path = packager.embed_in_blog_post(
                blog_post_path=blog_post_path,
                audio_source=tmp_path,
                title=args.title,
                dry_run=False,
                force=args.force,
            )
            markdown_path = blog_post_path
        else:
            # Standalone mode: create separate episode file
            markdown_path, audio_path = packager.package(
                title=args.title,
                description=description,
                tags=tags,
                audio_source=tmp_path,
                dry_run=args.dry_run,
                force=args.force,
            )

        # Clean up temp file after successful packaging
        try:
            tmp_path.unlink()
        except OSError:
            pass

        # 11. Print summary
        processing_time = time.time() - start_time
        if not args.dry_run:
            duration = packager.compute_duration(audio_path)
        else:
            duration = "? min"
        print_summary(duration, markdown_path, audio_path, processing_time)

    except Exception:
        # Clean up partial temp file on failure
        if tmp_path is not None:
            try:
                tmp_path.unlink(missing_ok=True)
            except OSError:
                pass
        raise  # Re-raise so the outer handler catches it
    finally:
        # Always unload the engine to free GPU memory
        if engine is not None:
            engine.unload()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(130)
    except SystemExit:
        raise
    except Exception as e:
        handle_error(e)
