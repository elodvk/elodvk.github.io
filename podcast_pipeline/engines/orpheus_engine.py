"""Orpheus TTS engine adapter stub for the podcast pipeline.

This is a placeholder for future Orpheus TTS support via Ollama/llama.cpp.
Orpheus TTS uses GGUF-quantized language models to generate speech tokens,
which are then decoded into audio. It supports emotion tags ([laugh], [sigh])
and runs efficiently on consumer hardware (~4 GB VRAM with quantization).

Full implementation will require:
- Ollama server or llama.cpp for model inference
- Audio token decoding (SNAC or similar codec)
- Voice cloning via prompt conditioning

All methods currently raise NotImplementedError.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from podcast_pipeline.engines.base import register_engine


@register_engine("orpheus")
class OrpheusEngine:
    """TTS engine adapter stub for Orpheus TTS (Ollama/llama.cpp based).

    This is a placeholder implementation. Orpheus TTS generates speech via
    a language model that produces audio tokens, decoded by a codec (SNAC).
    Full integration requires Ollama or llama.cpp setup for inference.

    Planned features:
    - ~4 GB VRAM via GGUF quantization
    - Emotion/expression tags ([laugh], [sigh], [gasp])
    - 24kHz output sample rate
    - Voice cloning via audio prompt conditioning
    """

    def __init__(self) -> None:
        self._device: str = "cuda"

    def load(self, device: str = "cuda") -> None:
        """Load the Orpheus model (not yet implemented).

        Raises:
            NotImplementedError: Always — Orpheus engine is not yet implemented.
        """
        raise NotImplementedError(
            "Orpheus engine is not yet implemented — requires Ollama/llama.cpp setup"
        )

    def synthesize(self, text: str, voice_path: Path) -> np.ndarray:
        """Synthesize speech from text (not yet implemented).

        Raises:
            NotImplementedError: Always — Orpheus engine is not yet implemented.
        """
        raise NotImplementedError(
            "Orpheus engine is not yet implemented — requires Ollama/llama.cpp setup"
        )

    @property
    def max_input_length(self) -> int:
        """Maximum text input length in characters for Orpheus."""
        return 400

    @property
    def sample_rate(self) -> int:
        """Orpheus TTS output sample rate in Hz."""
        return 24000

    def unload(self) -> None:
        """Release model resources (not yet implemented).

        Raises:
            NotImplementedError: Always — Orpheus engine is not yet implemented.
        """
        raise NotImplementedError(
            "Orpheus engine is not yet implemented — requires Ollama/llama.cpp setup"
        )
