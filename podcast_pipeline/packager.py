"""Episode packager — generates Markdown episode files and places audio output."""

import re
import shutil
from datetime import date
from pathlib import Path

from pydub import AudioSegment

from podcast_pipeline.config import PipelineConfig

# HTML audio player template to embed in blog posts
_AUDIO_PLAYER_TEMPLATE = """\

<audio controls preload="metadata" style="width: 100%; margin: 1rem 0;">
  <source src="assets/{audio_filename}" type="audio/mp4">
  Your browser does not support the audio element.
</audio>
"""


class EpisodePackager:
    """Generates the Markdown episode file and places audio for a podcast episode.

    The packager derives filenames from the episode title, computes duration from
    the audio file, generates a Markdown file with frontmatter and an HTML audio
    player block, and copies/moves the audio file to the output directory.
    """

    def __init__(self, config: PipelineConfig) -> None:
        """Initialize the packager with pipeline configuration.

        Args:
            config: The pipeline configuration containing author info and defaults.
        """
        self.config = config

    def derive_audio_filename(self, title: str) -> str:
        """Derive the audio filename from the episode title.

        Converts title to title case with spaces replaced by underscores.
        Returns the filename without extension (caller appends .m4a).

        Args:
            title: The episode title.

        Returns:
            A filesystem-safe filename string in Title_Case format.
        """
        # Strip leading/trailing whitespace
        name = title.strip()
        # Replace spaces (including multiple) with a single underscore
        name = re.sub(r"\s+", "_", name)
        # Strip non-filesystem-safe characters (keep alphanumeric, underscores, hyphens)
        name = re.sub(r"[^A-Za-z0-9_\-]", "", name)
        # Apply title case: capitalize first letter of each word, preserve rest
        # (preserves acronyms like "AI" while ensuring title case)
        name = "_".join(
            word[0].upper() + word[1:] if word else word
            for word in name.split("_")
        )
        return name

    def derive_markdown_filename(self, title: str) -> str:
        """Derive the Markdown filename from the episode title.

        Converts title to lowercase with spaces replaced by underscores.
        Returns the filename without extension (caller appends .md).

        Args:
            title: The episode title.

        Returns:
            A filesystem-safe filename string in lowercase format.
        """
        # Strip leading/trailing whitespace
        name = title.strip()
        # Convert to lowercase
        name = name.lower()
        # Replace spaces (including multiple) with a single underscore
        name = re.sub(r"\s+", "_", name)
        # Strip non-filesystem-safe characters (keep alphanumeric, underscores, hyphens)
        name = re.sub(r"[^a-z0-9_\-]", "", name)
        return name

    def generate_markdown(
        self,
        title: str,
        description: str,
        duration: str,
        tags: list[str],
        audio_filename: str,
    ) -> str:
        """Generate the full Markdown episode file content.

        Produces YAML frontmatter (title, description, date, duration, authors,
        tags, image) and an HTML audio player block matching the existing
        PurpleSec podcast format.

        Args:
            title: Episode title.
            description: Episode description.
            duration: Formatted duration string (e.g. "22 min").
            tags: List of tag strings.
            audio_filename: The audio filename (with .m4a extension).

        Returns:
            Complete Markdown file content as a string.
        """
        # Ensure "Podcast" is always in tags
        all_tags = list(tags)
        if "Podcast" not in all_tags:
            all_tags.append("Podcast")

        # Build YAML frontmatter manually for clean formatting
        lines: list[str] = []
        lines.append("---")
        lines.append(f'title: "{title}"')
        lines.append(f'description: "{description}"')
        lines.append(f"date: {date.today().isoformat()}")
        lines.append(f"duration: {duration}")
        lines.append("authors:")
        lines.append(f"  name: {self.config.author_name}")
        lines.append(f"  title: {self.config.author_title}")
        lines.append(f"  picture: {self.config.author_picture}")
        lines.append(f"  url: {self.config.author_url}")
        lines.append("tags:")
        for tag in all_tags:
            lines.append(f"  - {tag}")
        lines.append("image: assets/images/podcast_cover.png")
        lines.append("---")
        lines.append("")

        # HTML5 audio player block
        lines.append("<audio controls preload=\"metadata\" style=\"width: 100%;\">")
        lines.append(f"  <source src=\"{audio_filename}\" type=\"audio/mp4\">")
        lines.append("  Your browser does not support the audio element.")
        lines.append("</audio>")
        lines.append("")

        return "\n".join(lines)

    def compute_duration(self, audio_path: Path) -> str:
        """Compute the duration of an audio file, formatted as 'N min'.

        Args:
            audio_path: Path to the audio file (.m4a).

        Returns:
            Duration string formatted as "N min" (rounded to nearest minute,
            minimum 1).

        Raises:
            FileNotFoundError: If the audio file does not exist.
            Exception: If pydub cannot read the file (e.g., unsupported format,
                corrupt data).
        """
        if not audio_path.exists():
            raise FileNotFoundError(
                f"Audio file not found: {audio_path}"
            )

        try:
            audio = AudioSegment.from_file(str(audio_path))
        except Exception as e:
            raise type(e)(
                f"Could not read audio file '{audio_path}': {e}"
            ) from e

        duration_ms = len(audio)
        minutes = duration_ms / 1000 / 60
        rounded_minutes = max(1, round(minutes))
        return f"{rounded_minutes} min"

    def place_files(
        self,
        audio_source: Path,
        markdown_content: str,
        output_dir: Path,
        dry_run: bool,
        force: bool,
        markdown_filename: str,
        audio_filename: str,
    ) -> tuple[Path, Path]:
        """Write the Markdown file and copy the audio file to the output directory.

        Respects --dry-run (prints plan without writing) and --force (overwrites
        existing files).

        Args:
            audio_source: Path to the source audio file.
            markdown_content: The generated Markdown content string.
            output_dir: Target directory for output files.
            dry_run: If True, print planned actions without writing.
            force: If True, overwrite existing files.
            markdown_filename: The target filename for the Markdown file (e.g. "my_episode.md").
            audio_filename: The target filename for the audio file (e.g. "My_Episode.m4a").

        Returns:
            A tuple of (markdown_path, audio_path) in the output directory.

        Raises:
            FileExistsError: If output files exist and force is False.
        """
        markdown_path = output_dir / markdown_filename
        audio_path = output_dir / audio_filename

        if dry_run:
            print(f"Would write: {markdown_path}")
            print(f"Would copy: {audio_source} \u2192 {audio_path}")
            return markdown_path, audio_path

        # Check for existing files when force is not set
        if not force:
            existing = []
            if markdown_path.exists():
                existing.append(str(markdown_path))
            if audio_path.exists():
                existing.append(str(audio_path))
            if existing:
                raise FileExistsError(
                    f"Output file(s) already exist (use --force to overwrite): "
                    f"{', '.join(existing)}"
                )

        # Create output directory if it doesn't exist
        output_dir.mkdir(parents=True, exist_ok=True)

        # Write the Markdown file
        markdown_path.write_text(markdown_content, encoding="utf-8")

        # Copy the audio file
        shutil.copy2(audio_source, audio_path)

        return markdown_path, audio_path

    def package(
        self,
        title: str,
        description: str,
        tags: list[str],
        audio_source: Path,
        output_dir: Path | None = None,
        dry_run: bool = False,
        force: bool = False,
    ) -> tuple[Path, Path]:
        """Package an episode: derive filenames, compute duration, generate markdown, place files.

        This is the main orchestration method that calls the other methods in order:
        1. Derive filenames from title
        2. Compute duration from the audio file
        3. Generate markdown content
        4. Place files (write .md and copy .m4a to output)
        5. Return (markdown_path, audio_path) tuple

        Args:
            title: Episode title.
            description: Episode description.
            tags: List of tag strings for frontmatter.
            audio_source: Path to the generated audio file (.m4a).
            output_dir: Target output directory. If None, uses config.output_dir.
            dry_run: If True, print plan without writing files.
            force: If True, overwrite existing output files.

        Returns:
            A tuple of (markdown_path, audio_path) pointing to the placed files.
        """
        # Resolve output directory
        resolved_output_dir = Path(output_dir) if output_dir else Path(self.config.output_dir)

        # 1. Derive filenames from title
        audio_filename = self.derive_audio_filename(title) + ".m4a"
        markdown_filename = self.derive_markdown_filename(title) + ".md"

        # 2. Compute duration from audio file
        duration = self.compute_duration(audio_source)

        # 3. Generate markdown content
        markdown_content = self.generate_markdown(
            title=title,
            description=description,
            duration=duration,
            tags=tags,
            audio_filename=audio_filename,
        )

        # 4. Place files (write .md and copy .m4a to output)
        markdown_path, audio_path = self.place_files(
            audio_source=audio_source,
            markdown_content=markdown_content,
            output_dir=resolved_output_dir,
            dry_run=dry_run,
            force=force,
            markdown_filename=markdown_filename,
            audio_filename=audio_filename,
        )

        # 5. Return (markdown_path, audio_path) tuple
        return markdown_path, audio_path

    def embed_in_blog_post(
        self,
        blog_post_path: Path,
        audio_source: Path,
        title: str,
        dry_run: bool = False,
        force: bool = False,
    ) -> Path:
        """Embed an audio player in an existing blog post and copy audio to assets.

        Places the .m4a file in docs/blog/assets/ and injects an HTML audio
        player element into the blog post markdown (after the banner image or
        after the frontmatter if no banner).

        Args:
            blog_post_path: Path to the blog post markdown file.
            audio_source: Path to the generated .m4a audio file.
            title: Episode title (used for audio filename derivation).
            dry_run: If True, print plan without modifying files.
            force: If True, overwrite existing audio file.

        Returns:
            Path to the placed audio file in docs/blog/assets/.

        Raises:
            FileNotFoundError: If blog_post_path doesn't exist.
            FileExistsError: If audio file exists and force is False.
        """
        if not blog_post_path.exists():
            raise FileNotFoundError(f"Blog post not found: {blog_post_path}")

        # Derive audio filename
        audio_filename = self.derive_audio_filename(title) + ".m4a"
        assets_dir = blog_post_path.parent / "assets"
        audio_dest = assets_dir / audio_filename

        if dry_run:
            print(f"  Would copy audio: {audio_source} → {audio_dest}")
            print(f"  Would embed player in: {blog_post_path}")
            return audio_dest

        # Check existing audio
        if audio_dest.exists() and not force:
            raise FileExistsError(
                f"Audio file already exists (use --force to overwrite): {audio_dest}"
            )

        # Copy audio to assets
        assets_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(audio_source, audio_dest)

        # Read existing blog post
        content = blog_post_path.read_text(encoding="utf-8")

        # Check if audio player already exists
        if "<audio" in content and audio_filename in content:
            print(f"  Audio player already embedded in {blog_post_path.name}")
            return audio_dest

        # Remove any existing audio player (for --force re-runs)
        content = re.sub(
            r'\n*<audio[^>]*>.*?</audio>\s*',
            '',
            content,
            flags=re.DOTALL,
        )

        # Build the player HTML
        player_html = _AUDIO_PLAYER_TEMPLATE.format(audio_filename=audio_filename)

        # Insert after the banner image (first ![...] line after frontmatter)
        # or after frontmatter if no banner
        lines = content.split('\n')
        insert_idx = None

        # Find end of frontmatter
        fm_count = 0
        fm_end = 0
        for i, line in enumerate(lines):
            if line.strip() == '---':
                fm_count += 1
                if fm_count == 2:
                    fm_end = i
                    break

        # Look for banner image right after frontmatter
        for i in range(fm_end + 1, min(fm_end + 5, len(lines))):
            if i < len(lines) and lines[i].strip().startswith('!['):
                insert_idx = i + 1
                break

        if insert_idx is None:
            insert_idx = fm_end + 1

        # Insert player
        lines.insert(insert_idx, player_html)
        content = '\n'.join(lines)

        # Write back
        blog_post_path.write_text(content, encoding="utf-8")
        print(f"  ✓ Audio player embedded in {blog_post_path.name}")
        print(f"  ✓ Audio saved to {audio_dest}")

        return audio_dest
