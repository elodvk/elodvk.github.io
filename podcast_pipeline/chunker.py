"""Text chunker for splitting transcripts into TTS-engine-sized pieces.

Provides sentence boundary detection using regex that handles common
abbreviations (Mr., Dr., U.S., etc.), decimal numbers, URLs, and
ellipsis — splitting only at true sentence endings (., !, ?) followed
by whitespace and an uppercase letter (or end of string).

Also defines ChunkItem, the unit of output from the chunking pipeline,
and split_into_chunks which groups sentences into chunks respecting
a maximum character length, splitting oversized sentences at clause
boundaries when needed.
"""

from dataclasses import dataclass
import re

from podcast_pipeline.transcript_parser import (
    ParsedTranscript,
    SpokenSegment,
    PauseDirective,
    SectionMarker,
)


@dataclass
class ChunkItem:
    """A single chunk to be processed by the TTS engine or handled as a directive.

    Attributes:
        text: The chunk text to be spoken.
        is_directive: True if this is a pause/section directive (not spoken text).
        directive: The actual PauseDirective or SectionMarker if is_directive is True.
        overlap_prefix: Trailing sentences from the previous chunk, prepended for
            prosodic continuity during TTS synthesis. The TTS loop should trim the
            corresponding audio duration from the beginning of this chunk's output.
    """

    text: str
    is_directive: bool = False
    directive: object = None
    overlap_prefix: str = ""


# --- Sentence boundary detection ---

# Common abbreviations that end with a period but do NOT end a sentence.
# These are used in a negative lookbehind, so they must be fixed-width
# alternatives (no variable-length quantifiers inside lookbehind).
# We handle multi-character abbreviations by protecting them before splitting.

_ABBREVIATIONS = [
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Jr", "Sr",
    "Inc", "Corp", "Ltd", "Co", "Gen", "Gov", "Sgt",
    "Rev", "Col", "Capt", "Maj", "Cmdr", "Adm",
    "St", "Ave", "Blvd", "Dept", "Univ",
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
    "Fig", "Eq", "Vol", "No", "Ref", "Ch", "Sec",
    "vs", "etc", "approx", "appt",
]

# Multi-part abbreviations with internal dots (e.g., U.S., U.K., i.e., e.g.)
_DOTTED_ABBREVIATIONS = [
    "U.S", "U.K", "U.N", "E.U",
    "i.e", "e.g", "a.m", "p.m",
    "Ph.D", "M.D", "B.A", "M.A", "B.S", "M.S",
]

# Build a placeholder mapping for dotted abbreviations to protect them
_PLACEHOLDER_PREFIX = "\x00ABBR"
_dotted_placeholder_map: list[tuple[str, str]] = []
for _i, _abbr in enumerate(_DOTTED_ABBREVIATIONS):
    # Match the abbreviation followed by a period (the final dot)
    _dotted_placeholder_map.append((_abbr + ".", f"{_PLACEHOLDER_PREFIX}{_i}\x00"))

# Build a regex pattern for simple abbreviations (lookbehind-safe, fixed width groups)
# We group them by length so the lookbehind has fixed-width alternatives.
_abbr_by_length: dict[int, list[str]] = {}
for _abbr in _ABBREVIATIONS:
    _abbr_by_length.setdefault(len(_abbr), []).append(_abbr)

# Build a combined lookbehind with alternatives of the same length
_lookbehind_parts: list[str] = []
for _length, _abbrs in sorted(_abbr_by_length.items()):
    _pattern = "|".join(re.escape(a) for a in _abbrs)
    _lookbehind_parts.append(f"(?<!(?:{_pattern}))")


def split_sentences(text: str) -> list[str]:
    """Split text into sentences at natural sentence boundaries.

    Handles:
      - Common abbreviations: Mr., Mrs., Dr., Prof., Jr., Sr., Inc., etc.
      - Dotted abbreviations: U.S., U.K., i.e., e.g., Ph.D., etc.
      - Decimal numbers: 3.14, 192.168.1.1 (dots between digits)
      - URLs: http://... or https://... (don't split mid-URL)
      - Ellipsis: ... (treated as a single unit, not split on each dot)
      - Standard endings: . ! ? followed by space + uppercase or end of string
      - Multiple punctuation: ?! !! ... treated as a single boundary

    Args:
        text: The input text to split into sentences.

    Returns:
        A list of sentence strings (whitespace-trimmed, non-empty).
    """
    if not text or not text.strip():
        return []

    # Phase 1: Protect special patterns from being split

    working = text

    # Protect URLs (http:// and https://)
    url_pattern = re.compile(r'https?://\S+')
    url_placeholders: list[tuple[str, str]] = []
    for i, match in enumerate(url_pattern.finditer(working)):
        placeholder = f"\x01URL{i}\x01"
        url_placeholders.append((placeholder, match.group()))
    for placeholder, url in url_placeholders:
        working = working.replace(url, placeholder, 1)

    # Protect ellipsis (three or more dots)
    ellipsis_pattern = re.compile(r'\.{3,}')
    ellipsis_placeholders: list[tuple[str, str]] = []
    for i, match in enumerate(ellipsis_pattern.finditer(working)):
        placeholder = f"\x01ELL{i}\x01"
        ellipsis_placeholders.append((placeholder, match.group()))
    for placeholder, ell in ellipsis_placeholders:
        working = working.replace(ell, placeholder, 1)

    # Protect dotted abbreviations (U.S., i.e., etc.)
    for abbr, placeholder in _dotted_placeholder_map:
        working = working.replace(abbr, placeholder)

    # Protect decimal numbers and IP addresses (digit.digit patterns)
    _DECIMAL_PLACEHOLDER = "\x02"
    decimal_pattern = re.compile(r'(\d)\.(\d)')
    working = decimal_pattern.sub(lambda m: m.group(1) + _DECIMAL_PLACEHOLDER + m.group(2), working)

    # Phase 2: Split at sentence boundaries
    # A sentence ends with one or more terminal punctuation marks (. ! ?)
    # followed by at least one space and an uppercase letter, OR end of string.
    # We use a negative lookbehind for single-letter abbreviations (common titles).

    # Build the split regex:
    # Match: [.!?]+ followed by whitespace+uppercase or end-of-string
    # But NOT when preceded by a known abbreviation.
    sentence_boundary = re.compile(
        r'(?<![A-Z])'       # Not preceded by a single uppercase letter (like U. S. A.)
        r'(?<!\b[A-Z][a-z])'  # Not preceded by a two-char abbreviation start
        r'([.!?]+)'         # One or more terminal punctuation marks (captured)
        r'(?=\s+[A-Z]|\s*$)'  # Followed by space+uppercase or optional-space+end
    )

    # For simple abbreviations, we do a second-pass filter
    # First, let's do a naive split and then merge back false positives.
    parts = sentence_boundary.split(working)

    # Reconstruct sentences: parts alternates between text and punctuation
    # [text0, punct0, text1, punct1, ..., textN]
    sentences: list[str] = []
    i = 0
    while i < len(parts):
        if i + 1 < len(parts):
            # text + punctuation
            sentence = parts[i] + parts[i + 1]
            i += 2
        else:
            # final text without trailing punctuation
            sentence = parts[i]
            i += 1
        sentences.append(sentence)

    # Phase 3: Merge back false splits from simple abbreviations
    # If a sentence ends with a known abbreviation + period, merge with next
    abbr_end_pattern = re.compile(
        r'\b(' + '|'.join(re.escape(a) for a in _ABBREVIATIONS) + r')\.\s*$'
    )

    merged: list[str] = []
    for sentence in sentences:
        if merged and abbr_end_pattern.search(merged[-1]):
            # Previous sentence ended with an abbreviation — merge
            merged[-1] = merged[-1] + sentence
        else:
            merged.append(sentence)

    # Phase 4: Restore protected patterns
    result: list[str] = []
    for sentence in merged:
        s = sentence

        # Restore decimals
        s = s.replace(_DECIMAL_PLACEHOLDER, '.')

        # Restore dotted abbreviations
        for abbr, placeholder in _dotted_placeholder_map:
            s = s.replace(placeholder, abbr)

        # Restore ellipsis
        for placeholder, ell in ellipsis_placeholders:
            s = s.replace(placeholder, ell)

        # Restore URLs
        for placeholder, url in url_placeholders:
            s = s.replace(placeholder, url)

        # Trim and skip empty
        s = s.strip()
        if s:
            result.append(s)

    return result


# --- Clause boundary splitting for oversized sentences ---

# Pattern matching clause boundaries: commas, semicolons, em-dashes, double
# hyphens, and coordinating conjunctions (and, or, but) preceded by a space.
_CLAUSE_BOUNDARY = re.compile(
    r'(?<=[,;])\s+'          # after comma or semicolon
    r'|(?<=\u2014)\s*'       # after em-dash (—)
    r'|\s*\u2014'            # before em-dash (—)
    r'|\s+--\s+'             # around double-hyphen (--)
    r'|\s+(?=\b(?:and|or|but)\b)'  # before coordinating conjunction
)


def _split_at_clause_boundaries(sentence: str, max_length: int) -> list[str]:
    """Split an oversized sentence at clause boundaries.

    If no clause boundary yields sub-chunks within max_length,
    falls back to hard-splitting at word boundaries.

    Args:
        sentence: The sentence text that exceeds max_length.
        max_length: Maximum allowed character length per chunk.

    Returns:
        A list of sub-chunks, each ≤ max_length.
    """
    # Split sentence into clause fragments
    parts = _CLAUSE_BOUNDARY.split(sentence)
    parts = [p for p in parts if p]  # Remove empty strings

    # Group clause fragments into sub-chunks that fit within max_length
    chunks: list[str] = []
    current = ""

    for part in parts:
        candidate = (current + " " + part).strip() if current else part.strip()
        if len(candidate) <= max_length:
            current = candidate
        else:
            # Flush current if non-empty
            if current:
                chunks.append(current)
            # If this single part is still too long, it needs hard-splitting
            if len(part.strip()) > max_length:
                chunks.extend(_hard_split(part.strip(), max_length))
                current = ""
            else:
                current = part.strip()

    if current:
        chunks.append(current)

    # If clause splitting produced no results (single clause > max_length),
    # fall back to hard split of original
    if not chunks:
        chunks = _hard_split(sentence, max_length)

    return chunks


def _hard_split(text: str, max_length: int) -> list[str]:
    """Hard-split text at word boundaries to respect max_length.

    Args:
        text: Text to split.
        max_length: Maximum allowed character length per chunk.

    Returns:
        A list of sub-chunks, each ≤ max_length.
    """
    words = text.split()
    chunks: list[str] = []
    current = ""

    for word in words:
        if not current:
            # If a single word exceeds max_length, we must include it anyway
            # (can't split mid-word reasonably for TTS)
            if len(word) > max_length:
                chunks.append(word)
            else:
                current = word
        else:
            candidate = current + " " + word
            if len(candidate) <= max_length:
                current = candidate
            else:
                chunks.append(current)
                if len(word) > max_length:
                    chunks.append(word)
                    current = ""
                else:
                    current = word

    if current:
        chunks.append(current)

    return chunks if chunks else [text]


# --- Main chunking function ---


def split_into_chunks(
    transcript: ParsedTranscript,
    max_length: int = 300,
    overlap: int = 1,
) -> list[ChunkItem]:
    """Split a parsed transcript into chunks suitable for TTS synthesis.

    Iterates over transcript elements:
    - PauseDirective / SectionMarker → emitted as ChunkItem with is_directive=True
    - SpokenSegment → text is split into sentences, then grouped into chunks
      where each chunk's total text length ≤ max_length

    If a single sentence exceeds max_length, it is split at clause boundaries
    (commas, semicolons, dashes, conjunctions). If still too long, it is
    hard-split at word boundaries.

    After building the initial chunk list, a second pass applies overlap: the
    trailing `overlap` sentences from each text chunk are prepended to the next
    text chunk's `overlap_prefix` for prosodic continuity during TTS synthesis.
    Directive chunks (PauseDirective/SectionMarker) break the overlap chain.

    Args:
        transcript: The parsed transcript to chunk.
        max_length: Maximum character length per text chunk (default 300).
        overlap: Number of trailing sentences to prepend to the next chunk
                 for prosodic continuity (default 1, range 0-2).

    Returns:
        An ordered list of ChunkItems.
    """
    result: list[ChunkItem] = []

    for element in transcript.elements:
        if isinstance(element, (PauseDirective, SectionMarker)):
            result.append(ChunkItem(text="", is_directive=True, directive=element))
        elif isinstance(element, SpokenSegment):
            sentences = split_sentences(element.text)
            if not sentences:
                continue

            # Group sentences into chunks respecting max_length
            current_chunk_sentences: list[str] = []
            current_length = 0

            for sentence in sentences:
                sentence_len = len(sentence)

                # If a single sentence exceeds max_length, split it
                if sentence_len > max_length:
                    # Flush any accumulated sentences first
                    if current_chunk_sentences:
                        result.append(ChunkItem(
                            text=" ".join(current_chunk_sentences)
                        ))
                        current_chunk_sentences = []
                        current_length = 0

                    # Split oversized sentence at clause boundaries
                    sub_chunks = _split_at_clause_boundaries(sentence, max_length)
                    for sub in sub_chunks:
                        result.append(ChunkItem(text=sub))
                else:
                    # Check if adding this sentence would exceed max_length
                    # Account for the space separator between sentences
                    separator_len = 1 if current_chunk_sentences else 0
                    new_length = current_length + separator_len + sentence_len

                    if new_length <= max_length:
                        current_chunk_sentences.append(sentence)
                        current_length = new_length
                    else:
                        # Flush current chunk and start a new one
                        if current_chunk_sentences:
                            result.append(ChunkItem(
                                text=" ".join(current_chunk_sentences)
                            ))
                        current_chunk_sentences = [sentence]
                        current_length = sentence_len

            # Flush remaining sentences
            if current_chunk_sentences:
                result.append(ChunkItem(
                    text=" ".join(current_chunk_sentences)
                ))

    # --- Second pass: apply overlap ---
    if overlap > 0:
        _apply_overlap(result, overlap)

    return result


def _apply_overlap(chunks: list[ChunkItem], overlap: int) -> None:
    """Apply overlap to a list of chunks in-place.

    For each consecutive pair of text chunks (not separated by a directive),
    the trailing `overlap` sentences from the previous text chunk are prepended
    to the next text chunk's `overlap_prefix` field.

    Directive chunks break the overlap chain — overlap is not carried across
    PauseDirective or SectionMarker items.

    Args:
        chunks: The list of ChunkItems to modify in-place.
        overlap: Number of trailing sentences to carry over (1 or 2).
    """
    # Track the trailing sentences from the last text chunk we saw.
    # A directive resets this to None (breaks the chain).
    prev_trailing_sentences: list[str] | None = None

    for chunk in chunks:
        if chunk.is_directive:
            # Directives break the overlap chain
            prev_trailing_sentences = None
        else:
            # This is a text chunk — apply overlap from previous if available
            if prev_trailing_sentences is not None:
                overlap_text = " ".join(prev_trailing_sentences)
                chunk.overlap_prefix = overlap_text

            # Compute trailing sentences for the next text chunk
            # Split the chunk's text back into sentences to get the trailing ones
            sentences = split_sentences(chunk.text)
            if sentences:
                prev_trailing_sentences = sentences[-overlap:]
            else:
                prev_trailing_sentences = None
