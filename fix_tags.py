import os
import re

directory = 'd:/projects/elodvk.github.io/docs'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.md'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                print(f"Failed to read {filepath}: {e}")
                continue
                
            # Find the tags array like tags: ["foo", "bar"] or tags: ['foo', 'bar']
            match = re.search(r'^tags:\s*\[(.*?)\]', content, flags=re.MULTILINE)
            if match:
                tags_str = match.group(1)
                # Split by comma and strip quotes/spaces
                tags = [t.strip().strip('"').strip("'") for t in tags_str.split(',')]
                
                # Format as YAML list
                yaml_tags = "tags:\n" + "\n".join([f"  - {t}" for t in tags if t])
                
                # Replace in content
                new_content = content[:match.start()] + yaml_tags + content[match.end():]
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filepath}")
