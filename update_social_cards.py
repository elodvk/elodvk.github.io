import os
import re
import glob

def process_file(filepath, base_dir):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter
    parts = content.split('---\n', 2)
    if len(parts) < 3:
        return
    
    frontmatter = parts[1]
    body = parts[2]

    # Skip if already has image in frontmatter
    if '\nimage:' in '\n' + frontmatter:
        return

    # Map of files needing new images
    new_images = {
        'anthropic-fable-mythos-export-control.md': ('anthropic_export_control.png', 'blog/assets/'),
        'when_ai_messes_up.md': ('ai_messes_up.png', 'blog/assets/'),
        'Meta_AI_Support_Hack_Blog.md': ('meta_ai_hack.png', 'blog/assets/'),
        'CVE-2026-45585_YellowKey_DeepDive.md': ('yellowkey_cve.png', 'blog/assets/'),
        'comprehensive_ai_guide.md': ('comprehensive_ai_guide.png', 'blog/assets/'),
        'nightmare_eclipse_zero_days.md': ('nightmare_eclipse.png', 'blog/assets/'),
        'connected.md': ('connected_walkthrough.png', 'walkthroughs/assets/'),
        'devhub.md': ('devhub_walkthrough.png', 'walkthroughs/assets/')
    }

    filename = os.path.basename(filepath)
    img_path_for_frontmatter = ""

    if filename in new_images:
        img_name, img_dir = new_images[filename]
        # Insert image into body
        body = f"![Banner image](assets/{img_name})\n\n{body}"
        # Path for frontmatter
        img_path_for_frontmatter = f"{img_dir}{img_name}"
    else:
        # Extract first image from body
        match = re.search(r'!\[.*?\]\((.*?)\)', body)
        if match:
            raw_path = match.group(1)
            # Resolve path relative to docs/
            # e.g. raw_path = "../assets/images/blog/quantum_pki_hero.png" in docs/blog/
            # raw_path = "checkpoint/checkpoint_banner.png" in docs/walkthroughs/
            
            # Simple resolution
            if raw_path.startswith('../'):
                img_path_for_frontmatter = raw_path[3:] # removes ../ (assumes it goes to docs/)
            else:
                img_path_for_frontmatter = f"{base_dir}/{raw_path}"
        else:
            print(f"Warning: No image found or generated for {filename}")
            return

    # Add image to frontmatter
    frontmatter = frontmatter.rstrip() + f"\nimage: {img_path_for_frontmatter}\n"
    
    # Reconstruct file
    new_content = f"--- \n{frontmatter}---\n{body}"
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filename} with image: {img_path_for_frontmatter}")

def main():
    blog_files = glob.glob('docs/blog/*.md')
    walkthrough_files = glob.glob('docs/walkthroughs/*.md')

    for f in blog_files:
        if os.path.basename(f) != 'index.md':
            process_file(f, 'blog')

    for f in walkthrough_files:
        if os.path.basename(f) != 'index.md':
            process_file(f, 'walkthroughs')

if __name__ == '__main__':
    main()
