import os
import yaml
import html
from email.utils import format_datetime
from datetime import datetime, date

def define_env(env):
    """
    This is the hook for defining variables, macros and filters
    """


    @env.macro
    def get_walkthroughs():
        blog_dir = os.path.abspath('docs/walkthroughs')
        posts = []

        if not os.path.exists(blog_dir):
            return posts

        for root, dirs, files in os.walk(blog_dir):
            for filename in files:
                if filename.endswith('.md') and filename != 'index.md':
                    filepath = os.path.join(root, filename)
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
                    
                    if meta.get('draft') is True:
                        continue

                    # URL relative to docs
                    rel_path = os.path.relpath(filepath, os.path.abspath('docs'))
                    url = f"{rel_path[:-3]}/"
                    
                    # Extract Summary
                    explicit_summary = meta.get('description') or meta.get('summary')
                    if explicit_summary:
                        summary = str(explicit_summary)
                    else:
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

                    # Parse Date
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
                    meta['date_str'] = date_obj.strftime('%B %d, %Y')
                    meta['year'] = date_obj.strftime('%Y')
                    meta['summary'] = summary
                    meta['url'] = url
                    if 'title' not in meta:
                        meta['title'] = filename[:-3].replace('-', ' ').title()

                    # Machine tags/details
                    meta['difficulty'] = meta.get('difficulty', 'Unknown')
                    meta['os'] = meta.get('os', 'Unknown')

                    posts.append(meta)

        posts.sort(key=lambda x: x['date_obj'], reverse=True)
        return posts

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
                
                # Skip draft posts
                if meta.get('draft') is True:
                    continue

                # Prioritize explicit description or summary from frontmatter
                explicit_summary = meta.get('description') or meta.get('summary')
                
                if explicit_summary:
                    summary = str(explicit_summary)
                else:
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
                meta['date_str'] = date_obj.strftime('%B %d, %Y')
                meta['year'] = date_obj.strftime('%Y')
                
                # Standardize Authors
                authors = meta.get('authors', {})
                if isinstance(authors, dict):
                    meta['authors'] = [authors]
                elif isinstance(authors, list):
                    pass
                else:
                    meta['authors'] = [{'name': str(authors)}]

                # Tags
                tags = meta.get('tags', [])
                if isinstance(tags, str):
                    tags = [tags]
                meta['tags'] = [str(t) for t in tags]

                # Reading time
                word_count = len(markdown_content.split())
                meta['read_time'] = max(1, round(word_count / 200))

                # URL logic for MkDocs Material (creates directory and index.html)
                meta['url'] = f"{filename[:-3]}/"
                meta['summary'] = summary
                
                # Fallback title
                if 'title' not in meta:
                    meta['title'] = filename[:-3].replace('-', ' ').title()

                posts.append(meta)

        # Sort by newest first
        posts.sort(key=lambda x: x['date_obj'], reverse=True)
        # Generate RSS Feed
        try:
            site_url = 'https://purplesec.org/'
            site_name = 'PurpleSec'
            site_desc = 'Offensive and defensive cybersecurity writeups, vulnerability research, and security blog by Bilash J. Shahi.'
            feed_url = site_url + 'feed.xml'
            
            now = datetime.utcnow()
            pub_date = format_datetime(now)
            
            xml = [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
                '<channel>',
                f'<title>{html.escape(site_name)}</title>',
                f'<link>{site_url}</link>',
                f'<description>{html.escape(site_desc)}</description>',
                f'<lastBuildDate>{pub_date}</lastBuildDate>',
                f'<atom:link href="{feed_url}" rel="self" type="application/rss+xml"/>',
                '<language>en-us</language>',
                '<generator>PurpleSec Custom RSS</generator>',
                f'<managingEditor>bilash@purplesec.org (Bilash J. Shahi)</managingEditor>',
            ]
            
            for post in posts[:50]:
                title = html.escape(post.get('title', ''))
                url = site_url + 'blog/' + post.get('url', '')
                desc = html.escape(post.get('summary', ''))
                date_str = format_datetime(post['date_obj'])
                tags = post.get('tags', [])
                
                xml.append('<item>')
                xml.append(f'<title>{title}</title>')
                xml.append(f'<link>{url}</link>')
                xml.append(f'<description>{desc}</description>')
                xml.append(f'<pubDate>{date_str}</pubDate>')
                xml.append(f'<guid isPermaLink="true">{url}</guid>')
                xml.append(f'<author>bilash@purplesec.org (Bilash J. Shahi)</author>')
                for tag in tags[:5]:
                    xml.append(f'<category>{html.escape(str(tag))}</category>')
                xml.append('</item>')
                
            xml.append('</channel>')
            xml.append('</rss>')
            
            feed_content = '\n'.join(xml)
            
            # Write to site/ for production build
            site_path = os.path.abspath('site/feed.xml')
            os.makedirs(os.path.dirname(site_path), exist_ok=True)
            with open(site_path, 'w', encoding='utf-8') as f:
                f.write(feed_content)
            
            # Also write to docs/ so it gets picked up during build
            docs_path = os.path.abspath('docs/feed.xml')
            with open(docs_path, 'w', encoding='utf-8') as f:
                f.write(feed_content)
        except Exception as e:
            print("Failed to generate RSS:", e)

        return posts

