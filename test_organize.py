import os
import shutil

def organize_blog_posts():
    blog_dir = os.path.abspath('docs/blog')
    if not os.path.exists(blog_dir):
        return

    # First, undo the URL change in get_blog_posts to match the new physical paths
    # Wait, the get_blog_posts macro scans `docs/blog` for files. If we move them, 
    # it won't find them!
