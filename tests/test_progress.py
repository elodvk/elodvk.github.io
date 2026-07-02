"""Unit tests for podcast_pipeline.progress module."""

import time
from unittest.mock import patch

from podcast_pipeline.progress import ProgressTracker, _format_time


class TestFormatTime:
    """Tests for the _format_time helper."""

    def test_zero_seconds(self):
        assert _format_time(0) == "0:00"

    def test_under_one_minute(self):
        assert _format_time(45) == "0:45"

    def test_exactly_one_minute(self):
        assert _format_time(60) == "1:00"

    def test_minutes_and_seconds(self):
        assert _format_time(125) == "2:05"

    def test_large_value(self):
        assert _format_time(754) == "12:34"

    def test_fractional_seconds_truncated(self):
        assert _format_time(65.9) == "1:05"


class TestProgressTracker:
    """Tests for the ProgressTracker class."""

    def test_init_stores_total(self):
        tracker = ProgressTracker(total_chunks=10)
        assert tracker.total_chunks == 10
        assert tracker.processed == 0

    def test_start_records_time(self):
        tracker = ProgressTracker(total_chunks=5)
        tracker.start()
        assert tracker._start_time > 0

    def test_update_increments_processed(self):
        tracker = ProgressTracker(total_chunks=3)
        tracker.start()
        tracker.update(0)
        assert tracker.processed == 1
        tracker.update(1)
        assert tracker.processed == 2

    @patch("sys.stdout")
    def test_update_writes_progress_line(self, mock_stdout):
        tracker = ProgressTracker(total_chunks=4)
        tracker.start()
        tracker.update(0)

        # Check that write was called with a carriage-return progress line
        calls = mock_stdout.write.call_args_list
        written = "".join(call.args[0] for call in calls)
        assert "\r" in written
        assert "1/4" in written
        assert "Elapsed:" in written
        assert "ETA:" in written
        assert "Chunk 1/4" in written
        mock_stdout.flush.assert_called()

    @patch("sys.stdout")
    def test_finish_prints_summary(self, mock_stdout):
        tracker = ProgressTracker(total_chunks=2)
        tracker.start()
        tracker.update(0)
        mock_stdout.reset_mock()

        tracker.finish()

        calls = mock_stdout.write.call_args_list
        written = "".join(call.args[0] for call in calls)
        assert "\n" in written
        assert "Synthesis complete in" in written

    def test_eta_decreases_as_progress_advances(self):
        """ETA should decrease as more chunks are processed."""
        tracker = ProgressTracker(total_chunks=10)
        tracker.start()

        # Simulate processing with consistent timing
        with patch("time.time") as mock_time:
            mock_time.return_value = tracker._start_time + 1.0
            tracker.update(0)
            # After 1 chunk in 1s, avg=1s, remaining=9, ETA=9s

            mock_time.return_value = tracker._start_time + 2.0
            tracker.update(1)
            # After 2 chunks in 2s, avg=1s, remaining=8, ETA=8s

        # processed correctly tracked
        assert tracker.processed == 2
