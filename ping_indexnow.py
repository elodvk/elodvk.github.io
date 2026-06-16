import os
import xml.etree.ElementTree as ET
import urllib.request
import urllib.error
import json

def main():
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
