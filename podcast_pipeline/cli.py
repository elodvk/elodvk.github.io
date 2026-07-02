"""Command-line argument parsing for the podcast generation pipeline."""

import argparse
import sys
from pathlib import Path
from typing import Sequence

from podcast_pipeline import __version__


def derive_title_from_filename(transcript_path: str) -> str:
    """Derive an episode title from the transcript filename.

    Extracts the filename stem (without extension), replaces underscores and
    hyphens with spaces, and applies title case.

    Args:
        transcript_path: Path to the transcript file
            (e.g. "transcripts/ai_phishing_epidemic.md").

    Returns:
        A title-cased string derived from the filename
        (e.g. "Ai Phishing Epidemic").
    """
    stem = Path(transcript_path).stem
    title = stem.replace("_", " ").replace("-", " ")
    return title.title()


def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser for the podcast pipeline.

    Returns:
        A configured ArgumentParser instance with all supported arguments.
    """
    parser = argparse.ArgumentParser(
        prog="generate_podcast",
        description="Generate a podcast episode from a transcript using local TTS",
    )

    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )

    # Voice registration (standalone mode — skips transcript requirement)
    parser.add_argument(
        "--register-voice",
        nargs=2,
        metavar=("NAME", "AUDIO_FILE"),
        help="Register a voice profile: --register-voice <name> <audio_file>",
    )

    # Required arguments (only when not registering a voice)
    parser.add_argument(
        "--transcript",
        "-t",
        default=None,
        help="Path to transcript file (.md or .txt)",
    )

    # Optional arguments
    parser.add_argument(
        "--voice",
        "-v",
        default=None,
        help="Voice profile name (default from config)",
    )

    parser.add_argument(
        "--title",
        default=None,
        help="Episode title (derived from filename if not provided)",
    )

    parser.add_argument(
        "--description",
        "-d",
        default=None,
        help="Episode description (default: empty)",
    )

    parser.add_argument(
        "--tags",
        default=None,
        help="Comma-separated list of tags",
    )

    parser.add_argument(
        "--engine",
        "-e",
        default=None,
        help="TTS engine name (default from config)",
    )

    parser.add_argument(
        "--blog-post",
        "-b",
        default=None,
        help="Path to blog post to embed audio into (instead of creating separate episode file)",
    )

    parser.add_argument(
        "--output-dir",
        "-o",
        default=None,
        help="Output directory (default from config)",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Print plan without generating",
    )

    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        default=False,
        help="Overwrite existing output files",
    )

    return parser


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments and post-process tag values.

    Args:
        argv: Optional argument list (defaults to sys.argv[1:] if None).

    Returns:
        Parsed namespace with --tags converted from comma-separated string
        to a list of stripped strings (or None if not provided).
    """
    args = create_parser().parse_args(argv)

    # If registering a voice, skip transcript requirement
    if args.register_voice:
        return args

    # Transcript is required for generation mode
    if args.transcript is None:
        create_parser().error("the following arguments are required: --transcript/-t")

    # Auto-derive title from transcript filename if not provided
    if args.title is None:
        args.title = derive_title_from_filename(args.transcript)

    # Convert --tags from comma-separated string to list
    if args.tags is not None:
        args.tags = [tag.strip() for tag in args.tags.split(",") if tag.strip()]

    return args


def get_cli_overrides(args: argparse.Namespace) -> dict:
    """Extract config-overrideable fields from parsed CLI arguments.

    Returns a dict suitable for passing to ``merge_cli_overrides()``.
    Only includes voice, engine, and output_dir — the fields that correspond
    to configuration file settings.

    Args:
        args: Parsed argument namespace from ``parse_args()``.

    Returns:
        Dict with keys 'voice', 'engine', 'output_dir'. Values are None
        if the user did not provide the corresponding CLI argument.
    """
    return {
        "voice": args.voice,
        "engine": args.engine,
        "output_dir": getattr(args, "output_dir", None),
    }


def _format_processing_time(seconds: float) -> str:
    """Format processing time in seconds to a human-readable string.

    Args:
        seconds: Total processing time in seconds.

    Returns:
        Formatted string as "N min SS sec" if >= 60s, or "SS sec" if < 60s.
    """
    if seconds < 60:
        return f"{int(seconds)} sec"
    minutes = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{minutes} min {secs:02d} sec"


def print_summary(
    duration: str, markdown_path: Path, audio_path: Path, processing_time: float
) -> None:
    """Print a completion summary after successful podcast generation.

    Displays the episode duration, output file paths, and total processing
    time in a formatted block.

    Args:
        duration: Episode duration string (e.g. "22 min").
        markdown_path: Path to the generated Markdown episode file.
        audio_path: Path to the generated audio file.
        processing_time: Total processing time in seconds.
    """
    time_str = _format_processing_time(processing_time)
    print()
    print("\u2713 Podcast episode generated successfully!")
    print()
    print(f"  Duration: {duration}")
    print(f"  Markdown: {markdown_path}")
    print(f"  Audio:    {audio_path}")
    print(f"  Time:     {time_str}")
    print()


def format_error(e: Exception) -> str:
    """Format an exception into a user-friendly error message.

    Maps common exception types to descriptive prefixes so the user
    gets actionable feedback rather than raw tracebacks.

    Args:
        e: The exception to format.

    Returns:
        A formatted error string with a type-specific prefix.
    """
    if isinstance(e, FileNotFoundError):
        return f"File not found: {e}"
    elif isinstance(e, EnvironmentError):
        return f"Environment issue: {e}"
    elif isinstance(e, ImportError):
        return f"Missing dependency: {e}"
    elif isinstance(e, RuntimeError):
        return f"Runtime error: {e}"
    else:
        return f"Unexpected error: {type(e).__name__}: {e}"


def cleanup_partial_output(paths: list[Path]) -> None:
    """Attempt to delete partial output files after a failure.

    Iterates over the given paths and removes each file if it exists.
    Errors during deletion (e.g. file already gone, permission issues)
    are silently ignored.

    Args:
        paths: List of file paths to clean up.
    """
    for path in paths:
        try:
            path.unlink()
            print(f"  Cleaned up partial file: {path}")
        except OSError:
            pass


def handle_error(error: Exception, partial_files: list[Path] | None = None) -> None:
    """Handle an unrecoverable pipeline error.

    Prints a formatted error message to stderr, cleans up any partial
    output files, and exits the process with a non-zero exit code.

    Args:
        error: The exception that caused the failure.
        partial_files: Optional list of partial output files to remove.
    """
    print(f"\n\u2717 Error: {format_error(error)}", file=sys.stderr)
    if partial_files:
        cleanup_partial_output(partial_files)
    sys.exit(1)
