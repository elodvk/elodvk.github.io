"""Audio post-processing for the podcast generation pipeline.

Handles chunk concatenation, loudness normalization, silence trimming,
fade effects, and M4A export.
"""

import logging
import shutil
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from pydub import AudioSegment

logger = logging.getLogger(__name__)


class PostProcessor:
    """Post-processes synthesized audio chunks into a polished podcast episode.

    Processing chain: concatenate → normalize → trim silence → apply fades → export.

    Parameters
    ----------
    crossfade_ms : int
        Crossfade duration in milliseconds between consecutive chunks.
    target_lufs : float
        Target integrated loudness in LUFS (podcast standard is -16).
    bitrate : str
        Output bitrate for AAC encoding (e.g. "128k").
    sample_rate : int
        Audio sample rate in Hz (must match TTS engine output).
    """

    def __init__(
        self,
        crossfade_ms: int = 75,
        target_lufs: float = -16.0,
        bitrate: str = "128k",
        sample_rate: int = 24000,
    ) -> None:
        self.crossfade_ms = crossfade_ms
        self.target_lufs = target_lufs
        self.bitrate = bitrate
        self.sample_rate = sample_rate

    def concatenate_chunks(self, chunks: list) -> AudioSegment:
        """Concatenate audio chunks with crossfade and insert silence for pause directives.

        Each item in *chunks* is either a numpy array (float32, mono, values in
        [-1, 1]) representing a spoken audio chunk, or a ``PauseDirective`` object
        (has ``duration_seconds``) representing a silence gap to insert.

        Crossfade (``self.crossfade_ms``) is applied only between two consecutive
        audio segments. Silence segments are concatenated without crossfade.

        Parameters
        ----------
        chunks : list
            List where each item is either a ``np.ndarray`` (float32 audio) or a
            ``PauseDirective`` instance.

        Returns
        -------
        AudioSegment
            The concatenated audio.
        """
        from podcast_pipeline.transcript_parser import PauseDirective

        # Convert each chunk item to a pydub AudioSegment and track whether it
        # originated from audio (True) or silence/pause (False).
        segments: list[tuple[AudioSegment, bool]] = []

        for item in chunks:
            if isinstance(item, np.ndarray):
                # numpy float32 [-1, 1] → 16-bit PCM bytes → AudioSegment
                pcm = (item * 32767).astype(np.int16).tobytes()
                segment = AudioSegment(
                    data=pcm,
                    sample_width=2,
                    frame_rate=self.sample_rate,
                    channels=1,
                )
                segments.append((segment, True))
            elif isinstance(item, PauseDirective):
                silence = AudioSegment.silent(
                    duration=int(item.duration_seconds * 1000),
                    frame_rate=self.sample_rate,
                )
                segments.append((silence, False))
            # Skip any unrecognized items (e.g. SectionMarkers passed through)

        if not segments:
            # Return empty audio at the configured sample rate
            return AudioSegment.silent(duration=0, frame_rate=self.sample_rate)

        result = segments[0][0]
        prev_is_audio = segments[0][1]

        for seg, is_audio in segments[1:]:
            # Apply crossfade only between two consecutive audio segments
            if prev_is_audio and is_audio and self.crossfade_ms > 0:
                # Ensure crossfade doesn't exceed either segment's length
                max_cf = min(self.crossfade_ms, len(result), len(seg))
                if max_cf > 0:
                    result = result.append(seg, crossfade=max_cf)
                else:
                    result = result + seg
            else:
                result = result + seg
            prev_is_audio = is_audio

        return result

    def normalize_loudness(self, audio: AudioSegment) -> AudioSegment:
        """Normalize audio to the target LUFS loudness level.

        Uses pyloudnorm to measure integrated loudness (LUFS) and applies
        gain via pydub to reach the target. Handles edge cases: silent audio
        (LUFS = -inf) and very short audio (<400ms) are returned unchanged.

        Parameters
        ----------
        audio : AudioSegment
            Input audio to normalize.

        Returns
        -------
        AudioSegment
            Loudness-normalized audio within ±1 LUFS of target.
        """
        # Skip normalization for very short audio — pyloudnorm needs
        # sufficient length (at least 400ms) for accurate measurement.
        if len(audio) < 400:
            logger.warning(
                "Audio too short for loudness normalization (%d ms < 400 ms), "
                "returning unchanged.",
                len(audio),
            )
            return audio

        # Convert AudioSegment samples to float32 numpy array normalized to [-1, 1].
        samples = np.array(audio.get_array_of_samples(), dtype=np.float32) / 32768.0

        # If stereo, reshape to (n_samples, n_channels) for pyloudnorm.
        if audio.channels > 1:
            samples = samples.reshape(-1, audio.channels)

        # Create a pyloudnorm meter at the audio's sample rate.
        meter = pyln.Meter(audio.frame_rate)

        # Measure current integrated loudness.
        current_lufs = meter.integrated_loudness(samples)

        # Handle silent audio (LUFS = -inf).
        if current_lufs == float("-inf"):
            logger.warning(
                "Audio is silent (LUFS = -inf), skipping normalization."
            )
            return audio

        # If already within ±1 LUFS of target, return unchanged.
        if abs(current_lufs - self.target_lufs) <= 1.0:
            return audio

        # Calculate required gain and apply via pydub.
        gain_db = self.target_lufs - current_lufs
        normalized = audio.apply_gain(gain_db)

        return normalized

    def trim_silence(self, audio: AudioSegment) -> AudioSegment:
        """Trim leading/trailing silence and reduce internal gaps.

        Trims leading/trailing silence exceeding 500ms and reduces internal
        silence gaps longer than 2 seconds to exactly 1 second.

        Parameters
        ----------
        audio : AudioSegment
            Input audio to trim.

        Returns
        -------
        AudioSegment
            Audio with silence trimmed.
        """
        from pydub.silence import detect_nonsilent

        silence_thresh = -40  # dBFS
        min_silence_len = 100  # ms

        # Detect non-silent ranges
        nonsilent_ranges = detect_nonsilent(
            audio,
            min_silence_len=min_silence_len,
            silence_thresh=silence_thresh,
        )

        # Edge case: entirely silent audio
        if not nonsilent_ranges:
            return AudioSegment.silent(duration=100, frame_rate=audio.frame_rate)

        # Determine trim boundaries for leading silence
        first_start = nonsilent_ranges[0][0]
        if first_start > 500:
            # Keep only 200ms of leading silence
            trim_start = first_start - 200
        else:
            trim_start = 0

        # Determine trim boundaries for trailing silence
        last_end = nonsilent_ranges[-1][1]
        trailing_silence = len(audio) - last_end
        if trailing_silence > 500:
            # Keep only 300ms of trailing silence
            trim_end = last_end + 300
        else:
            trim_end = len(audio)

        # If only one non-silent segment, no internal gaps to process
        if len(nonsilent_ranges) == 1:
            return audio[trim_start:trim_end]

        # Reassemble with reduced internal gaps
        # Build output from non-silent segments and gaps between them
        result = AudioSegment.empty()

        # Add leading silence (from trim_start to first non-silent segment)
        if trim_start < nonsilent_ranges[0][0]:
            result += AudioSegment.silent(
                duration=nonsilent_ranges[0][0] - trim_start,
                frame_rate=audio.frame_rate,
            )

        for i, (seg_start, seg_end) in enumerate(nonsilent_ranges):
            # Add the non-silent segment
            result += audio[seg_start:seg_end]

            # Add the gap to the next segment (if not the last)
            if i < len(nonsilent_ranges) - 1:
                next_start = nonsilent_ranges[i + 1][0]
                gap_duration = next_start - seg_end

                if gap_duration > 2000:
                    # Reduce gaps longer than 2s to 1s
                    result += AudioSegment.silent(
                        duration=1000, frame_rate=audio.frame_rate
                    )
                else:
                    # Keep the original gap
                    result += audio[seg_end:next_start]

        # Add trailing silence (from last non-silent segment end to trim_end)
        trailing_to_add = trim_end - nonsilent_ranges[-1][1]
        if trailing_to_add > 0:
            result += AudioSegment.silent(
                duration=trailing_to_add, frame_rate=audio.frame_rate
            )

        return result

    def apply_fades(self, audio: AudioSegment) -> AudioSegment:
        """Apply fade-in and fade-out to the audio.

        Applies a 100ms fade-in at the beginning and a 500ms fade-out at the end.
        If the audio is shorter than 600ms, fade durations are scaled proportionally.
        If the audio is shorter than 100ms, fades are skipped entirely.

        Parameters
        ----------
        audio : AudioSegment
            Input audio.

        Returns
        -------
        AudioSegment
            Audio with fades applied.
        """
        duration_ms = len(audio)

        # Skip fades entirely for very short audio
        if duration_ms < 100:
            return audio

        fade_in_ms = 100
        fade_out_ms = 500
        total_fade = fade_in_ms + fade_out_ms

        # Scale fades proportionally if audio is shorter than combined fade duration
        if duration_ms < total_fade:
            ratio = duration_ms / total_fade
            fade_in_ms = int(fade_in_ms * ratio)
            fade_out_ms = int(fade_out_ms * ratio)
            # Ensure at least 1ms for each fade to avoid zero-length fades
            fade_in_ms = max(1, fade_in_ms)
            fade_out_ms = max(1, fade_out_ms)

        audio = audio.fade_in(fade_in_ms)
        audio = audio.fade_out(fade_out_ms)

        return audio

    def export_m4a(self, audio: AudioSegment, output_path: Path) -> Path:
        """Export audio as AAC-encoded M4A file.

        Parameters
        ----------
        audio : AudioSegment
            Final processed audio to export.
        output_path : Path
            Destination file path for the .m4a file.

        Returns
        -------
        Path
            The path to the exported file.

        Raises
        ------
        RuntimeError
            If FFmpeg is not available on PATH or if the export fails.
        """
        if not shutil.which("ffmpeg"):
            raise RuntimeError(
                "FFmpeg not found on PATH — install FFmpeg to export M4A audio"
            )

        # Ensure the output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Exporting M4A to %s (bitrate=%s, sample_rate=%d)",
                    output_path, self.bitrate, self.sample_rate)

        audio.export(
            str(output_path),
            format="ipod",  # pydub's format name for M4A/AAC
            codec="aac",
            bitrate=self.bitrate,
            parameters=["-ar", str(self.sample_rate)],
        )

        # Verify the output file exists and has non-zero size
        if not output_path.exists():
            raise RuntimeError(
                f"M4A export failed — output file was not created: {output_path}"
            )
        if output_path.stat().st_size == 0:
            raise RuntimeError(
                f"M4A export failed — output file is empty: {output_path}"
            )

        logger.info("M4A export complete: %s (%d bytes)",
                    output_path, output_path.stat().st_size)
        return output_path

    def process(self, chunks: list, output_path: Path) -> Path:
        """Run the full post-processing pipeline.

        Pipeline: concatenate → normalize → trim silence → apply fades → export.

        Parameters
        ----------
        chunks : list
            List of audio chunks from synthesis.
        output_path : Path
            Destination path for the final .m4a file.

        Returns
        -------
        Path
            The path to the exported episode file.
        """
        audio = self.concatenate_chunks(chunks)
        audio = self.normalize_loudness(audio)
        audio = self.trim_silence(audio)
        audio = self.apply_fades(audio)
        return self.export_m4a(audio, output_path)
