"""TTS Engine protocol and registry for the podcast generation pipeline."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

import numpy as np


class TTSEngine(Protocol):
    """Protocol defining the interface all TTS engines must implement."""

    def load(self, device: str = "cuda") -> None:
        """Load the model onto the specified device."""
        ...

    def synthesize(self, text: str, voice_path: Path) -> np.ndarray:
        """Synthesize speech from text using the voice reference.

        Returns a numpy audio array (float32, mono).
        """
        ...

    @property
    def max_input_length(self) -> int:
        """Maximum text input length in characters."""
        ...

    @property
    def sample_rate(self) -> int:
        """Audio sample rate in Hz."""
        ...

    def unload(self) -> None:
        """Release model from memory."""
        ...


# Engine registry — maps engine names to their implementing classes.
# Engines register themselves via the @register_engine decorator when imported.
ENGINE_REGISTRY: dict[str, type] = {}


def register_engine(name: str):
    """Decorator that registers a TTS engine class in the ENGINE_REGISTRY.

    Usage:
        @register_engine("chatterbox")
        class ChatterboxEngine:
            ...
    """

    def decorator(cls: type) -> type:
        ENGINE_REGISTRY[name] = cls
        return cls

    return decorator
