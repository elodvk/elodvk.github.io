"""Configuration loading, merging, and validation for the podcast pipeline."""

from dataclasses import dataclass, replace
from pathlib import Path

import yaml


@dataclass
class PipelineConfig:
    """All pipeline settings with sensible defaults matching podcast_config.yaml."""

    engine: str = "chatterbox"
    voice: str = "default"
    output_dir: str = "docs/podcasts"
    crossfade_ms: int = 75
    target_lufs: int = -16
    bitrate: str = "128k"
    author_name: str = "Bilash J. Shahi"
    author_title: str = "Cybersecurity Professional"
    author_picture: str = "https://purplesec.org/assets/images/logo.png"
    author_url: str = "https://purplesec.org/about/"


def load_config(config_path: Path | None = None) -> PipelineConfig:
    """Load pipeline configuration from a YAML file.

    Args:
        config_path: Explicit path to the YAML config file. If None, looks for
            ``podcast_config.yaml`` in the project root (parent of the
            ``podcast_pipeline/`` package directory).

    Returns:
        A PipelineConfig instance populated from the file (with defaults for
        any missing keys). Falls back to pure defaults if the file is not found.
    """
    if config_path is None:
        # Project root is one level above this package directory
        project_root = Path(__file__).resolve().parent.parent
        config_path = project_root / "podcast_config.yaml"

    if not config_path.exists():
        print(f"[WARNING] Config file not found at {config_path}; using built-in defaults.")
        return PipelineConfig()

    with open(config_path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    if raw is None:
        # Empty YAML file
        return PipelineConfig()

    # Warn about unrecognized keys
    known_keys = {field.name for field in PipelineConfig.__dataclass_fields__.values()}
    for key in raw:
        if key not in known_keys:
            print(f"[WARNING] Unrecognized config key: '{key}'")

    # Build config from only recognized keys
    config_kwargs = {k: v for k, v in raw.items() if k in known_keys}
    return PipelineConfig(**config_kwargs)


def merge_cli_overrides(config: PipelineConfig, overrides: dict) -> PipelineConfig:
    """Return a new PipelineConfig with CLI overrides applied.

    Only keys present in *overrides* whose values are not None will replace
    the corresponding config field.

    Args:
        config: The base configuration (typically loaded from YAML).
        overrides: A dict of CLI-provided values. None values are ignored.

    Returns:
        A new PipelineConfig with the overrides merged in.
    """
    # Filter out None values — they indicate the CLI arg was not provided
    effective = {k: v for k, v in overrides.items() if v is not None}
    if not effective:
        return config
    return replace(config, **effective)
