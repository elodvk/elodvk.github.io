"""Transcript parser data classes and internal representation.

Defines the typed elements that make up a parsed transcript:
- SpokenSegment: a block of text to be spoken
- PauseDirective: a [pause:Ns] silence marker
- SectionMarker: a [section:Title] chapter marker
- ParsedTranscript: the complete parsed result with helper properties

Also provides the main `parse_transcript` function that reads a file,
detects format, strips Markdown if needed, extracts directives, and
returns a structured ParsedTranscript.
"""

from dataclasses import dataclass, field
from pathlib import Path
import re


@dataclass
class SpokenSegment:
    """Represents a block of text to be spoken by the TTS engine."""

    text: str
    original_text: str = ""


@dataclass
class PauseDirective:
    """Represents a [pause:Ns] marker -- inserts N seconds of silence."""

    duration_seconds: float


@dataclass
class SectionMarker:
    """Represents a [section:Title] marker -- logs a chapter timestamp."""

    title: str


TranscriptElement = SpokenSegment | PauseDirective | SectionMarker


@dataclass
class ParsedTranscript:
    """The complete parsed result of a transcript file.

    Contains an ordered list of transcript elements (spoken segments,
    pause directives, and section markers) along with source metadata.
    """

    elements: list[TranscriptElement] = field(default_factory=list)
    source_path: Path | None = None
    source_format: str = "txt"

    @property
    def spoken_segments(self) -> list[SpokenSegment]:
        """Filter and return only spoken segments."""
        return [el for el in self.elements if isinstance(el, SpokenSegment)]

    @property
    def total_text(self) -> str:
        """Concatenation of all spoken segment texts, space-joined."""
        return " ".join(seg.text for seg in self.spoken_segments)

    @property
    def section_count(self) -> int:
        """Number of section markers in the transcript."""
        return sum(1 for el in self.elements if isinstance(el, SectionMarker))


# ---------------------------------------------------------------------------
# Regex patterns for directive detection
# ---------------------------------------------------------------------------

_PAUSE_RE = re.compile(r"\[pause:(\d+(?:\.\d+)?)\s*s?\]", re.IGNORECASE)
_SECTION_RE = re.compile(r"\[section:([^\]]+)\]", re.IGNORECASE)
# Combined pattern to split lines around directives (captures the directive)
_DIRECTIVE_RE = re.compile(
    r"(\[pause:\d+(?:\.\d+)?\s*s?\]|\[section:[^\]]+\])", re.IGNORECASE
)


# ---------------------------------------------------------------------------
# Markdown stripping helper
# ---------------------------------------------------------------------------



def strip_markdown(text: str) -> str:
    """Strip Markdown formatting from text, preserving paragraph structure.

    Applies regex-based transformations to remove Markdown syntax while
    keeping the underlying text content intact. Pipeline-specific directives
    ([pause:Ns] and [section:Title]) are preserved.

    Transformation order:
      1. Remove fenced code blocks entirely (not speakable)
      2. Remove inline code backticks (keep the text inside)
      3. Remove heading markers (# , ## , etc.)
      4. Remove horizontal rules (---, ***, ___)
      5. Remove emphasis markers (* ** _ __)
      6. Convert links [text](url) to just the text
      7. Remove images ![alt](url) entirely
      8. Remove blockquote markers (> )
      9. Remove list markers (- , * , + , 1. )
      10. Strip leading/trailing whitespace per line
      11. Collapse multiple blank lines into one

    Args:
        text: Raw Markdown-formatted transcript text.

    Returns:
        Plain text with Markdown syntax removed, paragraph structure preserved.
    """
    # Preserve pipeline directives by temporarily replacing them with placeholders.
    # This prevents them from being mangled by emphasis/link stripping.
    directives: list[str] = []
    directive_pattern = re.compile(r"\[(pause|section):[^\]]*\]", re.IGNORECASE)

    def _stash_directive(match: re.Match) -> str:
        directives.append(match.group(0))
        return f"\x00DIRECTIVE_{len(directives) - 1}\x00"

    text = directive_pattern.sub(_stash_directive, text)

    # 1. Remove fenced code blocks (``` ... ```) entirely
    text = re.sub(
        r"^```[^\n]*\n.*?^```[ \t]*$", "", text, flags=re.MULTILINE | re.DOTALL
    )

    # 2. Remove inline code backticks but keep the text inside
    text = re.sub(r"`([^`]*)`", r"\1", text)

    # 3. Remove heading markers (# , ## , ### , etc.)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)

    # 4. Remove horizontal rules (lines that are only ---, ***, ___)
    # Must come before emphasis/list stripping so `***` on its own line
    # is not consumed as emphasis or a list marker.
    text = re.sub(r"^[ \t]*[-*_]{3,}[ \t]*$", "", text, flags=re.MULTILINE)

    # 5. Remove emphasis markers (bold/italic: **, *, __, _)
    # Bold first (** or __), then italic (* or _)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"\1", text)

    # 6. Convert links [text](url) to just the text (not images, handled next)
    text = re.sub(r"(?<!!)\[([^\]]*)\]\([^\)]*\)", r"\1", text)

    # 7. Remove images ![alt](url) entirely (not speakable)
    text = re.sub(r"!\[[^\]]*\]\([^\)]*\)", "", text)

    # 8. Remove blockquote markers (> ) from line starts
    text = re.sub(r"^(?:>\s?)+", "", text, flags=re.MULTILINE)

    # 9. Remove list markers from line starts
    # Unordered: - , * , +  (with space after)
    # Ordered: 1. , 2. , etc.
    text = re.sub(r"^[ \t]*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^[ \t]*\d+\.\s+", "", text, flags=re.MULTILINE)

    # 10. Strip leading/trailing whitespace from each line
    lines = text.splitlines()
    lines = [line.strip() for line in lines]
    text = "\n".join(lines)

    # 11. Collapse multiple blank lines into one (preserves paragraph structure)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Strip leading/trailing whitespace from the entire result
    text = text.strip()

    # Restore pipeline directives
    def _restore_directive(match: re.Match) -> str:
        idx = int(match.group(1))
        return directives[idx]

    text = re.sub(r"\x00DIRECTIVE_(\d+)\x00", _restore_directive, text)

    return text


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------


def parse_transcript(path: Path) -> ParsedTranscript:
    """Parse a transcript file into a structured ParsedTranscript.

    Reads the file at *path*, detects format from the extension (.md vs .txt),
    strips Markdown formatting if applicable, then splits the content into
    typed elements: SpokenSegment, PauseDirective, and SectionMarker.

    Directives may appear inline within text -- they are split out so the
    surrounding text becomes separate SpokenSegments.

    Raises:
        FileNotFoundError: If *path* does not exist.
    """
    if not path.exists():
        raise FileNotFoundError(f"Transcript file not found: {path}")

    raw_text = path.read_text(encoding="utf-8")
    source_format = "md" if path.suffix.lower() == ".md" else "txt"

    # Strip markdown formatting if needed
    if source_format == "md":
        text = strip_markdown(raw_text)
    else:
        text = raw_text

    # Split into lines and process
    elements: list[TranscriptElement] = []
    accumulated_text: list[str] = []

    def _flush_spoken() -> None:
        """Flush accumulated spoken text as a SpokenSegment."""
        if accumulated_text:
            joined = " ".join(accumulated_text)
            # Collapse multiple spaces
            joined = re.sub(r"\s+", " ", joined).strip()
            if joined:
                elements.append(SpokenSegment(text=joined, original_text=joined))
            accumulated_text.clear()

    for line in text.split("\n"):
        # Skip completely blank lines -- they act as paragraph separators
        # and flush any accumulated text
        if not line.strip():
            _flush_spoken()
            continue

        # Check if this line contains any directives
        parts = _DIRECTIVE_RE.split(line)

        for part in parts:
            part_stripped = part.strip()
            if not part_stripped:
                continue

            # Check if this part is a pause directive
            pause_match = _PAUSE_RE.fullmatch(part_stripped)
            if pause_match:
                _flush_spoken()
                duration = float(pause_match.group(1))
                elements.append(PauseDirective(duration_seconds=duration))
                continue

            # Check if this part is a section directive
            section_match = _SECTION_RE.fullmatch(part_stripped)
            if section_match:
                _flush_spoken()
                title = section_match.group(1).strip()
                elements.append(SectionMarker(title=title))
                continue

            # Otherwise it's spoken text -- accumulate it
            if part_stripped:
                accumulated_text.append(part_stripped)

    # Flush any remaining text
    _flush_spoken()

    return ParsedTranscript(
        elements=elements,
        source_path=path,
        source_format=source_format,
    )


def _format_duration(seconds: float) -> str:
    """Format a duration as a compact string (e.g., 2.0 -> '2s', 1.5 -> '1.5s')."""
    if seconds == int(seconds):
        return f"{int(seconds)}s"
    return f"{seconds}s"


def pretty_print(transcript: ParsedTranscript) -> str:
    """Convert a ParsedTranscript back into valid transcript text with markers.

    This is the inverse of parse_transcript -- it produces a canonical text
    representation from the parsed elements.

    Elements are separated by blank lines (double newline). Each element type
    maps to its text form:
      - SpokenSegment: the segment text as-is
      - PauseDirective: [pause:Ns]
      - SectionMarker: [section:Title]
    """
    parts: list[str] = []
    for element in transcript.elements:
        if isinstance(element, SpokenSegment):
            parts.append(element.text)
        elif isinstance(element, PauseDirective):
            parts.append(f"[pause:{_format_duration(element.duration_seconds)}]")
        elif isinstance(element, SectionMarker):
            parts.append(f"[section:{element.title}]")
    return "\n\n".join(parts)
