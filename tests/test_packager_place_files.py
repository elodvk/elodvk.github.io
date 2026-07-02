"""Unit tests for EpisodePackager.place_files (Task 8.5)."""

import tempfile
from pathlib import Path

import pytest

from podcast_pipeline.config import PipelineConfig
from podcast_pipeline.packager import EpisodePackager


@pytest.fixture
def config():
    """Create a minimal PipelineConfig for testing."""
    return PipelineConfig(
        engine="chatterbox",
        voice="default",
        output_dir="docs/podcasts/",
        crossfade_ms=50,
        target_lufs=-16,
        bitrate="128k",
        author_name="Test Author",
        author_title="Tester",
        author_picture="https://example.com/pic.png",
        author_url="https://example.com",
    )


@pytest.fixture
def packager(config):
    """Create an EpisodePackager instance."""
    return EpisodePackager(config)


@pytest.fixture
def temp_audio(tmp_path):
    """Create a temporary fake audio file to use as source."""
    audio_file = tmp_path / "source_audio.m4a"
    audio_file.write_bytes(b"\x00" * 1024)  # Fake audio content
    return audio_file


class TestPlaceFilesDryRun:
    """Tests for place_files with dry_run=True."""

    def test_dry_run_prints_plan_and_returns_paths(
        self, packager, temp_audio, tmp_path, capsys
    ):
        output_dir = tmp_path / "output"
        md_path, audio_path = packager.place_files(
            audio_source=temp_audio,
            markdown_content="# Test",
            output_dir=output_dir,
            dry_run=True,
            force=False,
            markdown_filename="test_episode.md",
            audio_filename="Test_Episode.m4a",
        )

        # Should return the expected paths
        assert md_path == output_dir / "test_episode.md"
        assert audio_path == output_dir / "Test_Episode.m4a"

        # Should NOT create the output directory or files
        assert not output_dir.exists()

        # Should print the plan
        captured = capsys.readouterr()
        assert "Would write:" in captured.out
        assert "test_episode.md" in captured.out
        assert "Would copy:" in captured.out
        assert "Test_Episode.m4a" in captured.out


class TestPlaceFilesNormal:
    """Tests for place_files with dry_run=False, force=False."""

    def test_writes_markdown_and_copies_audio(self, packager, temp_audio, tmp_path):
        output_dir = tmp_path / "output"
        markdown_content = "---\ntitle: Test\n---\nHello world"

        md_path, audio_path = packager.place_files(
            audio_source=temp_audio,
            markdown_content=markdown_content,
            output_dir=output_dir,
            dry_run=False,
            force=False,
            markdown_filename="test_episode.md",
            audio_filename="Test_Episode.m4a",
        )

        # Files should exist
        assert md_path.exists()
        assert audio_path.exists()

        # Markdown content should match
        assert md_path.read_text(encoding="utf-8") == markdown_content

        # Audio content should match source
        assert audio_path.read_bytes() == temp_audio.read_bytes()

    def test_creates_output_directory_if_missing(self, packager, temp_audio, tmp_path):
        output_dir = tmp_path / "nested" / "deep" / "output"
        assert not output_dir.exists()

        packager.place_files(
            audio_source=temp_audio,
            markdown_content="content",
            output_dir=output_dir,
            dry_run=False,
            force=False,
            markdown_filename="ep.md",
            audio_filename="Ep.m4a",
        )

        assert output_dir.exists()

    def test_raises_file_exists_error_without_force(
        self, packager, temp_audio, tmp_path
    ):
        output_dir = tmp_path / "output"
        output_dir.mkdir()
        # Pre-create the markdown file
        (output_dir / "test.md").write_text("existing")

        with pytest.raises(FileExistsError, match="already exist"):
            packager.place_files(
                audio_source=temp_audio,
                markdown_content="new content",
                output_dir=output_dir,
                dry_run=False,
                force=False,
                markdown_filename="test.md",
                audio_filename="Test.m4a",
            )


class TestPlaceFilesForce:
    """Tests for place_files with force=True."""

    def test_force_overwrites_existing_files(self, packager, temp_audio, tmp_path):
        output_dir = tmp_path / "output"
        output_dir.mkdir()

        # Pre-create existing files
        (output_dir / "test.md").write_text("old markdown")
        (output_dir / "Test.m4a").write_bytes(b"old audio")

        md_path, audio_path = packager.place_files(
            audio_source=temp_audio,
            markdown_content="new markdown",
            output_dir=output_dir,
            dry_run=False,
            force=True,
            markdown_filename="test.md",
            audio_filename="Test.m4a",
        )

        # Files should be overwritten
        assert md_path.read_text(encoding="utf-8") == "new markdown"
        assert audio_path.read_bytes() == temp_audio.read_bytes()
