import os
import yaml
from datetime import datetime, date

def define_env(env):
    """
    This is the hook for defining variables, macros and filters
    """

    @env.macro
    def get_blog_posts():
        blog_dir = os.path.abspath('docs/blog')
        posts = []

        if not os.path.exists(blog_dir):
            return posts

        for filename in os.listdir(blog_dir):
            if filename.endswith('.md') and filename != 'index.md':
                filepath = os.path.join(blog_dir, filename)
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
                        except Exception:
                            pass
                
                # Extract a simple text summary from the first valid paragraph
                lines = markdown_content.split('\n')
                summary = ""
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith(('#', '<', '![', '>')):
                        summary += line + " "
                        if len(summary) > 200:
                            break
                        
                summary = summary.replace('**', '').replace('*', '').replace('__', '').replace('_', '').strip()
                if len(summary) > 200:
                    summary = summary[:197] + "..."

                # Parse Date robustly
                date_val = meta.get('date', '1970-01-01')
                if isinstance(date_val, datetime):
                    date_obj = date_val
                elif isinstance(date_val, date):
                    date_obj = datetime(date_val.year, date_val.month, date_val.day)
                elif isinstance(date_val, str):
                    try:
                        date_obj = datetime.strptime(date_val, '%Y-%m-%d')
                    except ValueError:
                        date_obj = datetime.min
                else:
                    date_obj = datetime.min

                meta['date_obj'] = date_obj
                meta['date_str'] = date_obj.strftime('%b %d, %Y')
                meta['year'] = date_obj.strftime('%Y')
                
                # Standardize Authors
                authors = meta.get('authors', {})
                if isinstance(authors, dict):
                    meta['authors'] = [authors]
                elif isinstance(authors, list):
                    pass
                else:
                    meta['authors'] = [{'name': str(authors)}]

                # URL logic for MkDocs Material (creates directory and index.html)
                meta['url'] = f"{filename[:-3]}/"
                meta['summary'] = summary
                
                # Fallback title
                if 'title' not in meta:
                    meta['title'] = filename[:-3].replace('-', ' ').title()

                posts.append(meta)

        # Sort by newest first
        posts.sort(key=lambda x: x['date_obj'], reverse=True)
        return posts
