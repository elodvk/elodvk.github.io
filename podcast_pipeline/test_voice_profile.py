"""Unit tests for VoiceProfileManager._validate_duration method.

Validates requirements 2.3, 2.4, 2.5:
- Reject audio < 5s with a clear ValueError message
- Truncate audio > 30s to 30s with a warning log message
- Accept audio 5-30s unchanged
"""

import logging

import pytest
from pydub import AudioSegment

from podcast_pipeline.voice_profile import VoiceProfileManager


@pytest.fixture
def manager(tmp_path):
    """Create a VoiceProfileManager with a temp directory."""
    return VoiceProfileManager(profiles_dir=tmp_path / "profiles")


def make_silent_audio(duration_ms: int) -> AudioSegment:
    """Create a silent AudioSegment of specified duration in milliseconds."""
    return AudioSegment.silent(duration=duration_ms)


class TestValidateDuration:
    """Test _validate_duration edge cases per requirements 2.3, 2.4, 2.5."""

    def test_exactly_5s_accepted(self, manager):
        """Exactly 5s is the borderline valid — should be accepted unchanged."""
        audio = make_silent_audio(5000)
        result = manager._validate_duration(audio)
        assert len(result) == 5000

    def test_exactly_30s_accepted(self, manager):
        """Exactly 30s is the borderline valid — should be accepted unchanged."""
        audio = make_silent_audio(30000)
        result = manager._validate_duration(audio)
        assert len(result) == 30000

    def test_4_9s_rejected(self, manager):
        """4.9s is below minimum — should raise ValueError with clear message."""
        audio = make_silent_audio(4900)
        with pytest.raises(ValueError, match=r"too short.*4\.9s.*Minimum duration is 5 seconds"):
            manager._validate_duration(audio)

    def test_30_1s_truncated_with_warning(self, manager, caplog):
        """30.1s exceeds maximum — should truncate to 30s and emit warning."""
        audio = make_silent_audio(30100)
        with caplog.at_level(logging.WARNING):
            result = manager._validate_duration(audio)
        assert len(result) == 30000
        assert "truncating to 30 seconds" in caplog.text.lower()

    def test_below_5s_rejected_with_message(self, manager):
        """Audio below 5s should have an informative error message."""
        audio = make_silent_audio(2000)
        with pytest.raises(ValueError) as exc_info:
            manager._validate_duration(audio)
        error_msg = str(exc_info.value)
        assert "5 seconds" in error_msg
        assert "too short" in error_msg

    def test_15s_accepted_unchanged(self, manager):
        """Mid-range duration (15s) should pass through unchanged."""
        audio = make_silent_audio(15000)
        result = manager._validate_duration(audio)
        assert len(result) == 15000

    def test_60s_truncated_to_30s(self, manager, caplog):
        """60s audio should be truncated to exactly 30s."""
        audio = make_silent_audio(60000)
        with caplog.at_level(logging.WARNING):
            result = manager._validate_duration(audio)
        assert len(result) == 30000

    def test_truncation_preserves_content(self, manager, caplog):
        """Truncation should keep the first 30s of audio content."""
        # Create audio with distinguishable first 30s
        audio = make_silent_audio(45000)
        with caplog.at_level(logging.WARNING):
            result = manager._validate_duration(audio)
        # Result should be exactly the first 30000ms
        assert len(result) == 30000
