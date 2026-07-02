"""Environment validation for the podcast generation pipeline.

Checks Python version, required packages, FFmpeg availability, and CUDA GPU status.
"""

import importlib
import shutil
import sys
import logging

logger = logging.getLogger(__name__)

REQUIRED_PACKAGES = ["torch", "torchaudio", "pydub", "pyloudnorm", "yaml"]


def check_environment() -> dict:
    """Run all environment checks and return a summary dict.

    Returns:
        dict with keys:
            python_ok (bool): True if Python >= 3.10
            packages (dict[str, bool]): importability of each required package
            ffmpeg (bool): True if ffmpeg is found on PATH
            cuda (bool): True if CUDA GPU is available
            gpu_name (str | None): GPU device name if CUDA available
            vram_gb (float | None): Total VRAM in GB if CUDA available
    """
    result: dict = {
        "python_ok": False,
        "packages": {},
        "ffmpeg": False,
        "cuda": False,
        "gpu_name": None,
        "vram_gb": None,
    }

    # 1. Python version check
    result["python_ok"] = sys.version_info >= (3, 10)

    # 2. Required packages importability
    for package in REQUIRED_PACKAGES:
        try:
            importlib.import_module(package)
            result["packages"][package] = True
        except ImportError:
            result["packages"][package] = False

    # 3. FFmpeg on PATH
    result["ffmpeg"] = shutil.which("ffmpeg") is not None

    # 4. CUDA GPU availability
    try:
        import torch

        if torch.cuda.is_available():
            result["cuda"] = True
            result["gpu_name"] = torch.cuda.get_device_name(0)
            props = torch.cuda.get_device_properties(0)
            total_bytes = getattr(props, 'total_memory', None) or getattr(props, 'total_mem', 0)
            result["vram_gb"] = round(total_bytes / (1024**3), 2)
    except (ImportError, RuntimeError, AttributeError):
        # torch not installed or CUDA not functional
        result["cuda"] = False

    return result


def validate_environment() -> None:
    """Validate the environment and print a status report.

    Prints a formatted report with ✓/✗ for each check.
    Raises EnvironmentError if any critical check fails.
    Logs a warning (does not fail) if CUDA is unavailable.
    """
    env = check_environment()
    errors: list[str] = []

    # Python version
    version_str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if env["python_ok"]:
        print(f"  ✓ Python {version_str} (>= 3.10 required)")
    else:
        msg = f"Python {version_str} detected — Python 3.10 or higher is required"
        print(f"  ✗ {msg}")
        errors.append(msg)

    # Packages
    print()
    print("  Packages:")
    install_hints = {
        "torch": "pip install torch",
        "torchaudio": "pip install torchaudio",
        "pydub": "pip install pydub",
        "pyloudnorm": "pip install pyloudnorm",
        "yaml": "pip install pyyaml",
    }
    for pkg, available in env["packages"].items():
        if available:
            print(f"    ✓ {pkg}")
        else:
            hint = install_hints.get(pkg, f"pip install {pkg}")
            msg = f"Package '{pkg}' is not installed — install with: {hint}"
            print(f"    ✗ {pkg} (install: {hint})")
            errors.append(msg)

    # FFmpeg
    print()
    if env["ffmpeg"]:
        print(f"  ✓ FFmpeg found on PATH ({shutil.which('ffmpeg')})")
    else:
        msg = "FFmpeg not found on PATH — install FFmpeg and ensure it is in your system PATH"
        print(f"  ✗ FFmpeg not found on PATH")
        errors.append(msg)

    # CUDA GPU
    print()
    if env["cuda"]:
        print(f"  ✓ CUDA GPU: {env['gpu_name']} ({env['vram_gb']} GB VRAM)")
    else:
        print("  ⚠ CUDA GPU not available — pipeline will fall back to CPU (slower)")
        logger.warning(
            "CUDA GPU not available. The pipeline will use CPU fallback, "
            "which may be significantly slower for TTS synthesis."
        )

    # Raise if critical checks failed
    if errors:
        summary = "\n".join(f"  - {e}" for e in errors)
        raise EnvironmentError(
            f"Environment validation failed:\n{summary}\n\n"
            "Please resolve the above issues before running the pipeline."
        )
