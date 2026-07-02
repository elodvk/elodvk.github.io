"""Chatterbox TTS engine adapter for the podcast pipeline.

Implements the TTSEngine protocol using Resemble AI's Chatterbox TTS model
for zero-shot voice cloning. The model is loaded lazily to avoid importing
heavy dependencies at module level.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np

from podcast_pipeline.engines.base import register_engine

logger = logging.getLogger(__name__)


@register_engine("chatterbox")
class ChatterboxEngine:
    """TTS engine adapter for Chatterbox TTS (Resemble AI).

    Features:
    - Zero-shot voice cloning from ~5-10s reference audio
    - ~0.5B parameters, 3-6 GB VRAM
    - 24kHz output sample rate
    - MIT license
    """

    def __init__(self) -> None:
        self.model = None
        self._device: str = "cuda"

    def load(self, device: str = "cuda") -> None:
        """Load the Chatterbox TTS model onto the specified device.

        Imports chatterbox lazily so that the module can be defined even
        when chatterbox-tts is not installed — the ImportError only
        surfaces here at load time.

        Args:
            device: Torch device string (e.g. "cuda", "cpu").

        Raises:
            ImportError: If chatterbox-tts package is not installed.
        """
        try:
            from chatterbox.tts import ChatterboxTTS
        except ImportError as e:
            raise ImportError(
                "Chatterbox TTS is not installed. "
                "Install it with: pip install chatterbox-tts"
            ) from e

        import torch

        self._device = device
        logger.info("Loading Chatterbox TTS model on device '%s'...", device)

        self.model = ChatterboxTTS.from_pretrained(device=device)

        # Report VRAM usage after loading
        if device.startswith("cuda") and torch.cuda.is_available():
            vram_bytes = torch.cuda.memory_allocated()
            vram_mb = vram_bytes / (1024 * 1024)
            logger.info(
                "Chatterbox TTS loaded. VRAM usage: %.1f MB (%.2f GB)",
                vram_mb,
                vram_mb / 1024,
            )
        else:
            logger.info("Chatterbox TTS loaded on '%s' (no VRAM reporting).", device)

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
                "ChatterboxEngine model is not loaded. Call load() first."
            )

        audio_tensor = self.model.generate(
            text, audio_prompt_path=str(voice_path)
        )

        # Convert torch tensor to numpy float32 array
        return audio_tensor.cpu().numpy().squeeze()

    @property
    def max_input_length(self) -> int:
        """Maximum recommended text input length in characters for Chatterbox."""
        return 300

    @property
    def sample_rate(self) -> int:
        """Chatterbox TTS output sample rate in Hz."""
        return 24000

    def unload(self) -> None:
        """Release the model from GPU memory."""
        import torch

        if self.model is not None:
            del self.model
            self.model = None
            logger.info("Chatterbox TTS model unloaded.")

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info("CUDA cache cleared.")
