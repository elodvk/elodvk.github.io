"""Progress tracking and display for the podcast generation pipeline."""

import sys
import time


def _format_time(seconds: float) -> str:
    """Format seconds as M:SS string.

    Args:
        seconds: Number of seconds to format.

    Returns:
        Time formatted as M:SS (e.g., 1:05, 0:45, 12:30).
    """
    minutes = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{minutes}:{secs:02d}"


class ProgressTracker:
    """Track and display synthesis progress with elapsed time and ETA.

    Shows current chunk (N/M), elapsed time, and estimated time remaining
    based on average chunk processing time. Uses in-place terminal updates
    to avoid newline spam.

    Example output:
        [3/10] Elapsed: 0:45 | ETA: 2:15 | Chunk 3/10
    """

    def __init__(self, total_chunks: int) -> None:
        """Initialize the progress tracker.

        Args:
            total_chunks: Total number of chunks to process.
        """
        self.total_chunks = total_chunks
        self.processed = 0
        self._start_time: float = 0.0

    def start(self) -> None:
        """Record the start time. Call this before processing begins."""
        self._start_time = time.time()

    def update(self, chunk_index: int) -> None:
        """Update progress after a chunk has been synthesized.

        Prints an in-place progress line showing current chunk, elapsed time,
        and estimated time remaining.

        Args:
            chunk_index: The index of the chunk that was just completed
                (0-based; display will show 1-based numbering).
        """
        self.processed += 1
        elapsed = time.time() - self._start_time
        avg_per_chunk = elapsed / self.processed
        remaining = avg_per_chunk * (self.total_chunks - self.processed)

        elapsed_str = _format_time(elapsed)
        eta_str = _format_time(remaining)

        line = (
            f"\r  [{self.processed}/{self.total_chunks}] "
            f"Elapsed: {elapsed_str} | ETA: {eta_str} | "
            f"Chunk {self.processed}/{self.total_chunks}"
        )
        sys.stdout.write(line)
        sys.stdout.flush()

    def finish(self) -> None:
        """Print final newline and total time summary."""
        total_time = time.time() - self._start_time
        sys.stdout.write("\n")
        sys.stdout.write(f"  Synthesis complete in {_format_time(total_time)}\n")
        sys.stdout.flush()
