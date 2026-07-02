"""TTS Engine factory for the podcast pipeline."""

from podcast_pipeline.engines.base import TTSEngine, ENGINE_REGISTRY, register_engine

# Import engine modules to trigger their @register_engine decorators
# These are lazy-imported to avoid loading heavy dependencies (torch etc.) at module level
_ENGINE_MODULES = {
    "chatterbox": "podcast_pipeline.engines.chatterbox_engine",
    "f5tts": "podcast_pipeline.engines.f5tts_engine",
    "orpheus": "podcast_pipeline.engines.orpheus_engine",
}


def get_engine(name: str) -> TTSEngine:
    """Get a TTS engine instance by name.

    Args:
        name: Engine identifier (e.g., "chatterbox", "f5tts", "orpheus")

    Returns:
        An instance of the requested TTSEngine.

    Raises:
        ValueError: If engine name is unknown.
        ImportError: If engine dependencies are not installed.
    """
    # Lazy-import the engine module if not already registered
    if name not in ENGINE_REGISTRY and name in _ENGINE_MODULES:
        import importlib
        try:
            importlib.import_module(_ENGINE_MODULES[name])
        except ImportError as e:
            raise ImportError(
                f"Engine '{name}' requires additional dependencies: {e}. "
                f"Install them with: pip install -r requirements-podcast.txt"
            ) from e

    if name not in ENGINE_REGISTRY:
        available = ", ".join(sorted(ENGINE_REGISTRY.keys())) or "(none registered)"
        all_known = ", ".join(sorted(_ENGINE_MODULES.keys()))
        raise ValueError(
            f"Unknown TTS engine: '{name}'. "
            f"Available: {available}. Known engines: {all_known}"
        )

    engine_cls = ENGINE_REGISTRY[name]
    return engine_cls()


__all__ = ["get_engine", "TTSEngine", "ENGINE_REGISTRY", "register_engine"]
