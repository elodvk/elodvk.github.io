"""Voice profile management for the podcast generation pipeline.

Discovers, loads, and manages voice reference audio samples used for
zero-shot voice cloning by the TTS engine.
"""

import json
import logging
import shutil
from pathlib import Path

from pydub import AudioSegment

logger = logging.getLogger(__name__)

# Supported audio file extensions for voice profiles
SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".flac", ".m4a"}


class VoiceProfileManager:
    """Manages voice reference profiles stored in a dedicated directory.

    Profiles are audio files (WAV, MP3, FLAC, M4A) stored in a profiles
    directory. A `profiles.json` metadata file maps friendly names to
    filenames; auto-discovery also finds profiles by scanning for audio files.

    Args:
        profiles_dir: Path to the voice profiles directory.
            Defaults to `voice_profiles/` relative to the project root.
    """

    def __init__(self, profiles_dir: Path | None = None) -> None:
        if profiles_dir is None:
            profiles_dir = Path("voice_profiles")
        self.profiles_dir = profiles_dir

        # Ensure the directory exists
        self.profiles_dir.mkdir(parents=True, exist_ok=True)

        # Load profiles.json metadata
        self._metadata: dict[str, str] = self._load_metadata()

        # Cached discovered profiles (populated on first access)
        self._discovered: dict[str, Path] | None = None

    def _load_metadata(self) -> dict[str, str]:
        """Load profiles.json from the profiles directory.

        Returns:
            Dict mapping profile names to filenames.
            Empty dict if file doesn't exist or contains invalid JSON.
        """
        metadata_path = self.profiles_dir / "profiles.json"

        if not metadata_path.exists():
            return {}

        try:
            text = metadata_path.read_text(encoding="utf-8")
            data = json.loads(text)
            if not isinstance(data, dict):
                logger.warning(
                    "profiles.json does not contain a JSON object — starting empty"
                )
                return {}
            return data
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(
                "Invalid JSON in profiles.json (%s) — starting empty", e
            )
            return {}

    def discover_profiles(self) -> dict[str, Path]:
        """Scan the profiles directory for audio files and merge with metadata.

        Auto-discovers profiles by scanning for supported audio files
        (stem name becomes the profile name). Merges with profiles.json
        entries, where JSON takes priority for naming.

        Returns:
            Dict mapping profile names to resolved file paths.
        """
        profiles: dict[str, Path] = {}

        # Auto-discover audio files in the directory
        for file_path in self.profiles_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                # Use the stem (filename without extension) as the profile name
                profiles[file_path.stem] = file_path

        # Merge with profiles.json entries (JSON takes priority for naming)
        for name, filename in self._metadata.items():
            file_path = self.profiles_dir / filename
            if file_path.exists():
                profiles[name] = file_path
            else:
                logger.warning(
                    "Voice profile '%s' references file '%s' which was not found — skipping",
                    name,
                    filename,
                )

        self._discovered = profiles
        return profiles

    @property
    def profiles(self) -> dict[str, Path]:
        """Return the discovered profiles dict (cached, discovers on first access)."""
        if self._discovered is None:
            self.discover_profiles()
        return self._discovered  # type: ignore[return-value]

    def save_metadata(self) -> None:
        """Write the current profiles dict to profiles.json."""
        metadata: dict[str, str] = {}
        for name, path in self.profiles.items():
            metadata[name] = path.name

        metadata_path = self.profiles_dir / "profiles.json"
        metadata_path.write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        # Keep internal metadata in sync
        self._metadata = metadata

    def list_profiles(self) -> list[str]:
        """Return a sorted list of available profile names."""
        return sorted(self.profiles.keys())

    def get_profile(self, name: str | None = None) -> Path:
        """Look up a voice profile by name and return the path to its audio file.

        Args:
            name: Profile name to look up. If None or empty string,
                falls back to "default".

        Returns:
            Path to the voice profile audio file.

        Raises:
            FileNotFoundError: If the requested profile is not found.
                The error message lists available profiles and a hint
                on how to register one.
        """
        if not name:
            name = "default"

        if name in self.profiles:
            return self.profiles[name]

        available = self.list_profiles()
        available_str = ", ".join(available) if available else "(none)"
        raise FileNotFoundError(
            f"Voice profile '{name}' not found. "
            f"Available profiles: {available_str}. "
            f"Register one with: python generate_podcast.py --register-voice <name> <audio_file>"
        )

    def _validate_duration(self, audio: AudioSegment) -> AudioSegment:
        """Validate and potentially truncate audio duration.

        Args:
            audio: The audio segment to validate.

        Returns:
            The audio segment, truncated to 30s if it was longer.

        Raises:
            ValueError: If the audio is shorter than 5 seconds.
        """
        duration_seconds = len(audio) / 1000.0

        if duration_seconds < 5:
            raise ValueError(
                f"Voice profile audio is too short ({duration_seconds:.1f}s). "
                f"Minimum duration is 5 seconds."
            )

        if duration_seconds > 30:
            logger.warning(
                "Voice profile audio is %.1fs, truncating to 30 seconds.",
                duration_seconds,
            )
            audio = audio[:30000]  # Truncate to first 30 seconds

        return audio

    def register_profile(self, name: str, audio_path: Path) -> Path:
        """Register a new voice profile from an audio file.

        Validates the audio duration (5-30s), converts to WAV if needed,
        stores in the profiles directory, and updates metadata.

        Args:
            name: Friendly name for the profile.
            audio_path: Path to the source audio file.

        Returns:
            Path to the stored WAV file in the profiles directory.

        Raises:
            FileNotFoundError: If audio_path does not exist.
            ValueError: If the audio is shorter than 5 seconds.
        """
        audio_path = Path(audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(
                f"Voice profile audio file not found: {audio_path}"
            )

        # Load and validate duration
        audio = AudioSegment.from_file(str(audio_path))
        original_duration = len(audio) / 1000.0
        audio = self._validate_duration(audio)

        # Determine output path
        output_path = self.profiles_dir / f"{name}.wav"

        # If already WAV and duration was acceptable (no truncation needed),
        # just copy. Otherwise export as WAV (16-bit, 44.1kHz mono).
        is_wav = audio_path.suffix.lower() == ".wav"
        was_truncated = original_duration > 30

        if is_wav and not was_truncated:
            shutil.copy2(str(audio_path), str(output_path))
        else:
            # Export as WAV: 16-bit, 44.1kHz, mono
            audio = audio.set_frame_rate(44100).set_channels(1).set_sample_width(2)
            audio.export(str(output_path), format="wav")

        # Update metadata and save
        self._metadata[name] = output_path.name
        self.save_metadata()

        # Invalidate discovery cache
        self._discovered = None

        logger.info("Registered voice profile '%s' at %s", name, output_path)
        return output_path
