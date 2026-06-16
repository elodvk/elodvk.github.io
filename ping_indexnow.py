import os
import glob
import urllib.parse
import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
import json

def regenerate_sitemap():
    site_dir = 'site'
    if not os.path.exists(site_dir):
        print(f"[!] Site directory {site_dir} not found. Cannot regenerate sitemap.")
        return

    base_url = "https://purplesec.org/"
    urls = []

    # Find all index.html files
    index_files = glob.glob(os.path.join(site_dir, '**', 'index.html'), recursive=True)
    
    for file_path in index_files:
        # Convert path to relative path
        rel_path = os.path.relpath(file_path, site_dir)
        
        # Normalize slashes
        rel_path = rel_path.replace('\\', '/')
        
        # Turn index.html into a folder-style path
        if rel_path == 'index.html':
            url_path = ''
        else:
            url_path = rel_path[:-10] # remove 'index.html'
            
        # URL-encode the path components (e.g., spaces to %20)
        encoded_path = urllib.parse.quote(url_path)
        
        full_url = base_url + encoded_path
        urls.append(full_url)

    # Sort URLs for consistency
    urls.sort()

    # Generate XML content
    xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for url in urls:
        xml.append('  <url>')
        xml.append(f'    <loc>{url}</loc>')
        xml.append('  </url>')
    xml.append('</urlset>')
    
    sitemap_content = '\n'.join(xml)
    
    # Write to site/sitemap.xml
    sitemap_path = os.path.join(site_dir, 'sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sitemap_content)
    print(f"[+] Regenerated sitemap at {sitemap_path} with {len(urls)} URLs.")

def main():
    # Automatically regenerate sitemap first so it contains all pages
    regenerate_sitemap()

    sitemap_path = os.path.join('site', 'sitemap.xml')
    if not os.path.exists(sitemap_path):
        print(f"[!] Sitemap not found at {sitemap_path}")
        return

    # Parse sitemap
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
    except Exception as e:
        print(f"[!] Failed to parse sitemap: {e}")
        return

    # Extract all loc URLs
    urls = []
    # sitemaps can use namespaces, typically {http://www.sitemaps.org/schemas/sitemap/0.9}
    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    
    # Try with namespace first, then fall back to no namespace
    loc_elements = root.findall('.//ns:loc', namespace)
    if not loc_elements:
        loc_elements = root.findall('.//loc')

    for loc in loc_elements:
        if loc.text:
            urls.append(loc.text.strip())

    if not urls:
        print("[!] No URLs found in sitemap.")
        return

    print(f"[*] Found {len(urls)} URLs in sitemap.")

    # Prepare IndexNow Payload
    host = "purplesec.org"
    key = "9d8a3cf1e97d4b0d874c98038b30f5a2"
    key_location = f"https://{host}/{key}.txt"

    payload = {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls
    }

    # API Endpoint (IndexNow shared endpoint, which submits to Bing, Yandex, etc.)
    api_url = "https://api.indexnow.org/indexnow"

    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST'
    )

    try:
        print(f"[*] Sending IndexNow request to {api_url}...")
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            print(f"[+] IndexNow submission successful. Status code: {status}")
    except urllib.error.HTTPError as e:
        print(f"[!] IndexNow submission failed. HTTP Error {e.code}: {e.reason}")
        try:
            print(f"[!] Error details: {e.read().decode('utf-8')}")
        except Exception:
            pass
    except Exception as e:
        print(f"[!] IndexNow submission encountered an error: {e}")

if __name__ == "__main__":
    main()
