"""F5-TTS engine adapter for the podcast pipeline.

Implements the TTSEngine protocol using F5-TTS (Flow Matching + Diffusion
Transformer) for high-quality zero-shot voice cloning. Produces more natural
prosody, better rhythm, and more accurate voice matching than Chatterbox.

Install: pip install f5-tts
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

from podcast_pipeline.engines.base import register_engine

logger = logging.getLogger(__name__)


@register_engine("f5tts")
class F5TTSEngine:
    """TTS engine adapter for F5-TTS (SWivid).

    Features:
    - Superior voice cloning quality via flow matching
    - Natural prosody and rhythm
    - 24kHz output sample rate
    - Supports longer input (~500 chars)
    - ~4-6 GB VRAM
    """

    def __init__(self) -> None:
        self.model = None
        self._device: str = "cuda"

    def load(self, device: str = "cuda") -> None:
        """Load the F5-TTS model.

        Args:
            device: Torch device string (e.g. "cuda", "cpu").

        Raises:
            ImportError: If f5-tts package is not installed.
        """
        # Force torchaudio to use soundfile backend (avoids torchcodec dependency)
        try:
            import torchaudio
            torchaudio.set_audio_backend("soundfile")
        except Exception:
            pass

        try:
            from f5_tts.api import F5TTS
        except ImportError as e:
            raise ImportError(
                "F5-TTS is not installed. "
                "Install it with: pip install f5-tts"
            ) from e

        self._device = device
        logger.info("Loading F5-TTS model on device '%s'...", device)

        self.model = F5TTS(device=device)

        logger.info("F5-TTS loaded successfully.")

    def synthesize(self, text: str, voice_path: Path) -> np.ndarray:
        """Synthesize speech from text using a voice reference sample.

        Args:
            text: The text to synthesize.
            voice_path: Path to the voice reference audio file.

        Returns:
            A float32 numpy array of audio samples at 24kHz.

        Raises:
            RuntimeError: If the model has not been loaded yet.
        """
        if self.model is None:
            raise RuntimeError(
                "F5TTSEngine model is not loaded. Call load() first."
            )

        # F5-TTS infer returns (sample_rate, audio_array)
        wav, sr, _ = self.model.infer(
            ref_file=str(voice_path),
            ref_text="",  # empty = auto-transcribe reference
            gen_text=text,
        )

        # Ensure float32 numpy array
        if not isinstance(wav, np.ndarray):
            wav = np.array(wav, dtype=np.float32)

        return wav.squeeze()

    @property
    def max_input_length(self) -> int:
        """Maximum text input length in characters for F5-TTS."""
        return 500

    @property
    def sample_rate(self) -> int:
        """F5-TTS output sample rate in Hz."""
        return 24000

    def unload(self) -> None:
        """Release the model from memory."""
        import torch

        if self.model is not None:
            del self.model
            self.model = None
            logger.info("F5-TTS model unloaded.")

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
