import os
import glob
import re
import base64
from bs4 import BeautifulSoup
from Crypto.Cipher import AES
from Crypto.Hash import MD5
from Crypto import Random

# CryptoJS compatible encryption
def encrypt(data: str, passphrase: str) -> str:
    salt = Random.get_random_bytes(8)
    key_iv = b''
    while len(key_iv) < 48:
        key_iv += MD5.new(key_iv[-16:] + passphrase.encode('utf-8') + salt).digest()
    key = key_iv[:32]
    iv = key_iv[32:48]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    data_bytes = data.encode('utf-8')
    pad = 16 - len(data_bytes) % 16
    padded_data = data_bytes + bytes([pad] * pad)
    encrypted = cipher.encrypt(padded_data)
    return base64.b64encode(b"Salted__" + salt + encrypted).decode()

def get_html_path(md_path: str) -> str:
    # Convert docs/walkthroughs/checkpoint.md to site/walkthroughs/checkpoint/index.html
    rel_path = os.path.relpath(md_path, 'docs')
    if rel_path.endswith('index.md'):
        html_rel = rel_path.replace('index.md', 'index.html')
    else:
        html_rel = rel_path.replace('.md', '/index.html')
    return os.path.join('site', html_rel)

def process_file(md_path: str):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract password from frontmatter
    match = re.search(r'^password:\s*["\']?(.*?)["\']?$', content, re.MULTILINE)
    if not match:
        return
    password = match.group(1).strip()
    
    html_path = get_html_path(md_path)
    if not os.path.exists(html_path):
        print(f"[!] HTML file not found for {md_path}: {html_path}")
        return
    
    print(f"[*] Encrypting {html_path}...")
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    
    article = soup.find('article', class_='md-content__inner')
    if not article:
        print(f"[!] Could not find article content in {html_path}")
        return
    
    # Extract inner HTML of article
    article_html = "".join(str(c) for c in article.contents)
    
    # Encrypt the content
    encrypted_html = encrypt(article_html, password)
    
    # Create decryptor UI
    decryptor_ui = f"""
    <div id="decrypt-container" style="text-align: center; padding: 4rem 1rem;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" style="fill: var(--md-primary-fg-color); margin-bottom: 1rem;"><path d="M12 17a2 2 0 0 0 2-2c0-.82-.5-1.54-1.2-1.84V11h-1.6v2.16c-.7.3-1.2 1.02-1.2 1.84a2 2 0 0 0 2 2m6-8h-1V7A5 5 0 0 0 7 7v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2m-9-2a3 3 0 0 1 6 0v2H9z"/></svg>
        <h1 style="margin-bottom: 1rem;">This Walkthrough is Password Protected</h1>
        <p style="margin-bottom: 2rem; color: var(--md-default-fg-color--light);">Enter the HTB Root Flag to decrypt and view the content.</p>
        
        <form id="decrypt-form" style="max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
            <input type="password" id="root-flag" placeholder="HTB{{...}}" style="padding: 0.75rem 1rem; border: 1px solid var(--md-default-fg-color--lightest); border-radius: 4px; background: var(--md-default-bg-color); color: var(--md-default-fg-color); font-family: monospace;">
            <button type="submit" style="padding: 0.75rem 1rem; background: var(--md-primary-fg-color); color: var(--md-primary-bg-color); border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;">Decrypt Content</button>
            <p id="decrypt-error" style="color: #ef5350; display: none; margin-top: 0.5rem; font-size: 0.9em;">Incorrect password or decryption failed.</p>
        </form>
    </div>
    
    <div id="decrypted-content" style="display: none;"></div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <script>
        document.getElementById('decrypt-form').addEventListener('submit', function(e) {{
            e.preventDefault();
            var password = document.getElementById('root-flag').value.trim();
            var ciphertext = "{encrypted_html}";
            
            try {{
                var decrypted = CryptoJS.AES.decrypt(ciphertext, password);
                var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
                
                if (plaintext) {{
                    document.getElementById('decrypt-container').style.display = 'none';
                    var contentDiv = document.getElementById('decrypted-content');
                    contentDiv.innerHTML = plaintext;
                    contentDiv.style.display = 'block';
                    
                    // Re-run prism/highlight.js if needed
                    if (window.hljs) hljs.highlightAll();
                }} else {{
                    document.getElementById('decrypt-error').style.display = 'block';
                }}
            }} catch (err) {{
                document.getElementById('decrypt-error').style.display = 'block';
            }}
        }});
    </script>
    """
    
    article.clear()
    article.append(BeautifulSoup(decryptor_ui, 'html.parser'))
    
    # Remove the Table of Contents to prevent leaking headers
    toc = soup.find('nav', class_='md-nav--secondary')
    if toc:
        toc.clear()
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    print(f"[+] Successfully encrypted {html_path}")

def main():
    md_files = glob.glob('docs/**/*.md', recursive=True)
    for md_path in md_files:
        process_file(md_path)

if __name__ == "__main__":
    main()
