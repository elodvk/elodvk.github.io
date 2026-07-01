import os
import yaml
from datetime import datetime, date

podcast_dir = os.path.abspath('docs/podcasts')
posts = []

if not os.path.exists(podcast_dir):
    print("NO DIR")

for filename in os.listdir(podcast_dir):
    if filename.endswith('.md') and filename != 'index.md':
        filepath = os.path.join(podcast_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        meta = {}
        markdown_content = content
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                try:
                    meta = yaml.safe_load(parts[1]) or {}
                    markdown_content = parts[2]
                except Exception as e:
                    print(f"YAML parse error in {filename}: {e}")
                    pass
        print(f"Meta for {filename}: {meta}")
        posts.append(meta)

print(f"Total posts: {len(posts)}")
