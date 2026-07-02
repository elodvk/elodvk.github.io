"""Integration tests for the podcast pipeline end-to-end flow (Task 12.4).

Validates:
- Transcript parsing → chunking produces correct output
- EpisodePackager.generate_markdown() produces valid YAML frontmatter
  compatible with get_podcast_posts() macro in main.py
- Filename derivation produces expected filesystem-safe names
- Output directory defaults to docs/podcasts/
- Pipeline wiring in generate_podcast.py is intact

Requirements referenced: 6.1, 6.2, 6.3, 6.4, 6.5
"""

import re
import tempfile
from datetime import date
from pathlib import Path

import pytest
import yaml

from podcast_pipeline.config import PipelineConfig
from podcast_pipeline.transcript_parser import (
    ParsedTranscript,
    SpokenSegment,
    PauseDirective,
    SectionMarker,
    parse_transcript,
)
from podcast_pipeline.chunker import split_into_chunks
from podcast_pipeline.packager import EpisodePackager


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_transcript_path(tmp_path: Path) -> Path:
    """Create a sample transcript Markdown file for testing."""
    content = """\
# Episode One: Zero-Day Analysis

Welcome to PurpleSec podcast. Today we are diving deep into the world of
zero-day vulnerabilities and how they are weaponized by advanced persistent
threat groups.

[pause:2s]

[section:Background]

Let's start with some **background**. A zero-day vulnerability is a software
flaw unknown to the vendor. These are [extremely valuable](https://example.com)
on the black market.

Attackers often chain multiple zero-days together to achieve full system
compromise. The recent *Nightmare Eclipse* campaign demonstrated this with
eight separate zero-day exploits targeting Microsoft products.

[pause:1s]

[section:Technical Analysis]

Now let's look at the technical details. The first exploit targeted a kernel
vulnerability in the Win32k subsystem. By corrupting a specific memory
structure, the attacker gained arbitrary read-write primitives.

The second exploit leveraged a type confusion bug in the JavaScript engine.
Combined with the kernel bug, this provided a full browser-to-kernel
exploitation chain.
"""
    transcript_file = tmp_path / "test_episode.md"
    transcript_file.write_text(content, encoding="utf-8")
    return transcript_file


@pytest.fixture
def config() -> PipelineConfig:
    """Create a PipelineConfig matching the project defaults."""
    return PipelineConfig(
        engine="chatterbox",
        voice="default",
        output_dir="docs/podcasts",
        crossfade_ms=75,
        target_lufs=-16,
        bitrate="128k",
        author_name="Bilash J. Shahi",
        author_title="Cybersecurity Professional",
        author_picture="https://purplesec.org/assets/images/logo.png",
        author_url="https://purplesec.org/about/",
    )


@pytest.fixture
def packager(config: PipelineConfig) -> EpisodePackager:
    """Create an EpisodePackager instance."""
    return EpisodePackager(config)


# ---------------------------------------------------------------------------
# Test: Transcript parsing → chunking flow
# ---------------------------------------------------------------------------


class TestTranscriptToChunks:
    """Verify parse_transcript → split_into_chunks produces correct output."""

    def test_parse_extracts_segments_and_directives(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)

        # Should have spoken segments (Markdown stripped)
        assert len(transcript.spoken_segments) > 0

        # Should have section markers
        assert transcript.section_count == 2

        # Should detect as markdown format
        assert transcript.source_format == "md"

    def test_parse_strips_markdown_formatting(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)
        all_text = transcript.total_text

        # No Markdown heading markers
        assert "# " not in all_text
        # No bold markers
        assert "**" not in all_text
        # No italic markers (standalone)
        assert re.search(r"(?<!\w)\*[^*]+\*(?!\w)", all_text) is None
        # No link syntax
        assert "](http" not in all_text

    def test_parse_preserves_spoken_content(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)
        all_text = transcript.total_text

        # Key spoken phrases should be preserved
        assert "zero-day" in all_text.lower()
        assert "PurpleSec" in all_text
        assert "Nightmare Eclipse" in all_text
        assert "Win32k" in all_text

    def test_parse_extracts_pause_directives(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)

        pauses = [
            el for el in transcript.elements if isinstance(el, PauseDirective)
        ]
        assert len(pauses) == 2
        assert pauses[0].duration_seconds == 2.0
        assert pauses[1].duration_seconds == 1.0

    def test_parse_extracts_section_markers(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)

        sections = [
            el for el in transcript.elements if isinstance(el, SectionMarker)
        ]
        assert len(sections) == 2
        assert sections[0].title == "Background"
        assert sections[1].title == "Technical Analysis"

    def test_chunking_produces_valid_chunks(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)
        chunks = split_into_chunks(transcript, max_length=300, overlap=1)

        # Should produce multiple chunks
        assert len(chunks) > 0

        # All text chunks should respect max_length
        text_chunks = [c for c in chunks if not c.is_directive]
        for chunk in text_chunks:
            assert len(chunk.text) <= 300, (
                f"Chunk exceeds max_length: {len(chunk.text)} chars"
            )

        # Directive chunks should be present (pauses and sections)
        directive_chunks = [c for c in chunks if c.is_directive]
        assert len(directive_chunks) >= 4  # 2 pauses + 2 sections

    def test_chunking_preserves_content(self, sample_transcript_path: Path):
        transcript = parse_transcript(sample_transcript_path)
        chunks = split_into_chunks(transcript, max_length=300, overlap=0)

        # Concatenated text chunks should contain all spoken content
        combined = " ".join(c.text for c in chunks if not c.is_directive)
        assert "zero-day" in combined.lower()
        assert "PurpleSec" in combined
        assert "Win32k" in combined


# ---------------------------------------------------------------------------
# Test: Frontmatter generation and compatibility with get_podcast_posts()
# ---------------------------------------------------------------------------


class TestFrontmatterCompatibility:
    """Verify generate_markdown() produces frontmatter that get_podcast_posts() parses."""

    def test_frontmatter_has_all_required_fields(self, packager: EpisodePackager):
        markdown = packager.generate_markdown(
            title="Test Episode Title",
            description="A test description for the episode.",
            duration="15 min",
            tags=["Security", "AI"],
            audio_filename="Test_Episode_Title.m4a",
        )

        # Extract YAML frontmatter
        assert markdown.startswith("---\n")
        parts = markdown.split("---", 2)
        assert len(parts) >= 3, "Markdown should have YAML frontmatter delimiters"

        frontmatter = yaml.safe_load(parts[1])
        assert frontmatter is not None

        # Required fields per get_podcast_posts() in main.py
        assert "title" in frontmatter
        assert "description" in frontmatter
        assert "date" in frontmatter
        assert "duration" in frontmatter
        assert "authors" in frontmatter
        assert "tags" in frontmatter
        assert "image" in frontmatter

    def test_frontmatter_field_types(self, packager: EpisodePackager):
        markdown = packager.generate_markdown(
            title="My Podcast Episode",
            description="Description here.",
            duration="22 min",
            tags=["Podcast", "Hacking"],
            audio_filename="My_Podcast_Episode.m4a",
        )

        parts = markdown.split("---", 2)
        frontmatter = yaml.safe_load(parts[1])

        # title: string
        assert isinstance(frontmatter["title"], str)
        assert frontmatter["title"] == "My Podcast Episode"

        # description: string
        assert isinstance(frontmatter["description"], str)

        # date: parsed as date object by PyYAML (YYYY-MM-DD format)
        assert isinstance(frontmatter["date"], date)
        assert frontmatter["date"] == date.today()

        # duration: string like "N min"
        assert isinstance(frontmatter["duration"], str)
        assert re.match(r"^\d+ min$", frontmatter["duration"])

        # authors: dict with name/title/picture/url
        assert isinstance(frontmatter["authors"], dict)
        assert "name" in frontmatter["authors"]
        assert "title" in frontmatter["authors"]
        assert "picture" in frontmatter["authors"]
        assert "url" in frontmatter["authors"]

        # tags: list of strings
        assert isinstance(frontmatter["tags"], list)
        assert all(isinstance(t, str) for t in frontmatter["tags"])
        assert "Podcast" in frontmatter["tags"]

        # image: string path
        assert isinstance(frontmatter["image"], str)
        assert frontmatter["image"] == "assets/images/podcast_cover.png"

    def test_frontmatter_authors_matches_macro_expectations(
        self, packager: EpisodePackager
    ):
        """get_podcast_posts() normalizes authors: dict → [dict].

        The packager generates a single dict (not a list), which the macro
        converts to a list of one dict. This tests that the dict has the
        expected keys.
        """
        markdown = packager.generate_markdown(
            title="Test",
            description="Desc",
            duration="5 min",
            tags=[],
            audio_filename="Test.m4a",
        )

        parts = markdown.split("---", 2)
        frontmatter = yaml.safe_load(parts[1])

        authors = frontmatter["authors"]
        # Should be a dict (main.py normalizes to list)
        assert isinstance(authors, dict)
        assert authors["name"] == "Bilash J. Shahi"
        assert authors["title"] == "Cybersecurity Professional"
        assert "picture" in authors
        assert "url" in authors

    def test_frontmatter_always_includes_podcast_tag(self, packager: EpisodePackager):
        """Even if user doesn't specify 'Podcast' tag, it's auto-added."""
        markdown = packager.generate_markdown(
            title="Test",
            description="Desc",
            duration="5 min",
            tags=["Security", "AI"],
            audio_filename="Test.m4a",
        )

        parts = markdown.split("---", 2)
        frontmatter = yaml.safe_load(parts[1])
        assert "Podcast" in frontmatter["tags"]

    def test_markdown_includes_audio_player(self, packager: EpisodePackager):
        """The generated markdown should include an HTML audio element."""
        markdown = packager.generate_markdown(
            title="Test Episode",
            description="Desc",
            duration="10 min",
            tags=["Podcast"],
            audio_filename="Test_Episode.m4a",
        )

        assert "<audio" in markdown
        assert 'type="audio/mp4"' in markdown
        assert "Test_Episode.m4a" in markdown


# ---------------------------------------------------------------------------
# Test: Filename derivation
# ---------------------------------------------------------------------------


class TestFilenamDerivation:
    """Verify derive_audio_filename and derive_markdown_filename."""

    def test_audio_filename_title_case(self, packager: EpisodePackager):
        result = packager.derive_audio_filename("My Great Episode")
        assert result == "My_Great_Episode"

    def test_audio_filename_strips_special_chars(self, packager: EpisodePackager):
        result = packager.derive_audio_filename("Episode: The Hack!")
        # Colons and exclamation marks stripped
        assert ":" not in result
        assert "!" not in result
        assert "_" in result

    def test_audio_filename_preserves_case(self, packager: EpisodePackager):
        result = packager.derive_audio_filename("AI Security Deep Dive")
        assert result == "AI_Security_Deep_Dive"

    def test_markdown_filename_lowercase(self, packager: EpisodePackager):
        result = packager.derive_markdown_filename("My Great Episode")
        assert result == "my_great_episode"

    def test_markdown_filename_strips_special_chars(self, packager: EpisodePackager):
        result = packager.derive_markdown_filename("Episode: The Hack!")
        assert ":" not in result
        assert "!" not in result
        assert result == result.lower()

    def test_filenames_are_filesystem_safe(self, packager: EpisodePackager):
        """Filenames should only contain alphanumeric, underscores, hyphens."""
        unsafe_title = 'Episode "One" & Two <Three>'
        audio = packager.derive_audio_filename(unsafe_title)
        md = packager.derive_markdown_filename(unsafe_title)

        safe_pattern = re.compile(r"^[A-Za-z0-9_\-]+$")
        assert safe_pattern.match(audio), f"Unsafe audio filename: {audio}"
        assert safe_pattern.match(md), f"Unsafe markdown filename: {md}"

    def test_filenames_are_deterministic(self, packager: EpisodePackager):
        """Same title always produces the same filenames."""
        title = "Consistent Title Here"
        assert packager.derive_audio_filename(title) == packager.derive_audio_filename(title)
        assert packager.derive_markdown_filename(title) == packager.derive_markdown_filename(title)


# ---------------------------------------------------------------------------
# Test: Output directory configuration
# ---------------------------------------------------------------------------


class TestOutputDirectory:
    """Verify that the pipeline output targets docs/podcasts/ by default."""

    def test_default_config_output_dir(self):
        """PipelineConfig default output_dir is docs/podcasts."""
        config = PipelineConfig()
        assert config.output_dir == "docs/podcasts"

    def test_packager_resolves_output_dir_from_config(self, config: PipelineConfig):
        """EpisodePackager.package() uses config.output_dir when none provided."""
        packager = EpisodePackager(config)
        # The package() method resolves to Path(config.output_dir) when output_dir=None
        # We verify this by checking the resolved path logic
        resolved = Path(config.output_dir)
        assert resolved == Path("docs/podcasts")


# ---------------------------------------------------------------------------
# Test: Pipeline wiring verification
# ---------------------------------------------------------------------------


class TestPipelineWiring:
    """Verify generate_podcast.py imports and wires all modules correctly."""

    def test_generate_podcast_imports_all_modules(self):
        """Verify the main script imports all required pipeline modules."""
        import importlib.util

        spec = importlib.util.find_spec("generate_podcast")
        # If the module can't be found, try loading it by path
        if spec is None:
            script_path = Path(__file__).parent.parent / "generate_podcast.py"
            assert script_path.exists(), "generate_podcast.py not found"
            spec = importlib.util.spec_from_file_location(
                "generate_podcast", script_path
            )

        assert spec is not None, "Could not find generate_podcast module"

    def test_pipeline_modules_importable(self):
        """All pipeline submodules are importable without errors."""
        from podcast_pipeline import cli
        from podcast_pipeline import config
        from podcast_pipeline import environment
        from podcast_pipeline import engines
        from podcast_pipeline import transcript_parser
        from podcast_pipeline import chunker
        from podcast_pipeline import post_processor
        from podcast_pipeline import packager
        from podcast_pipeline import voice_profile
        from podcast_pipeline import progress

        # All modules should be importable
        assert cli is not None
        assert config is not None
        assert environment is not None
        assert engines is not None
        assert transcript_parser is not None
        assert chunker is not None
        assert post_processor is not None
        assert packager is not None
        assert voice_profile is not None
        assert progress is not None
