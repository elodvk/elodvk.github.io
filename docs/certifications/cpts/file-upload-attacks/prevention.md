---
title: 'Prevention & Hardening'
description: 'The defender''s view — how to build an upload feature that resists every attack in this series, from whitelist validation and content checks to storage and serving controls.'
tags:
  - CPTS
  - Web
  - File Upload
  - Defense
  - Blue Team
---

# Prevention & Hardening

!!! abstract "Offense informs defense"
    Knowing how to break uploads makes you better at securing them. A robust upload feature layers controls so that defeating one doesn't grant code execution. Here's how to close every gap this series opened — useful for the exam's remediation write-ups and for real engagements.

## 1. Validate the Extension with a Whitelist

- Use an **allow-list**, never a block-list. Enumerate the few extensions you truly need.
- Anchor the regex to the **final** extension: `/^[\w-]+\.(jpg|jpeg|png|gif)$/i` — note the `$`.
- Reject filenames containing more than one dot, null bytes, or path separators.

```php
if (!preg_match('/^[\w-]+\.(jpg|jpeg|png|gif)$/i', $fileName)) {
    deny();
}
```

## 2. Validate the Real Content

Never trust the client-supplied `Content-Type`. Inspect the actual bytes **and** parse the image:

```php
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $tmp);
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif'];
if (!isset($allowed[$mime]) || getimagesize($tmp) === false) {
    deny();
}
```

- `finfo`/`mime_content_type()` checks magic bytes (beats header spoofing).
- `getimagesize()` confirms it parses as a real image (beats the `GIF8` four-byte trick).
- **Re-encode** the image (e.g. resize/convert with GD or ImageMagick) to destroy embedded payloads in metadata.

## 3. Rename Files Server-Side

- Discard the user's filename entirely. Generate a random name: `bin2hex(random_bytes(16))`.
- Append the extension **you** derived from the validated MIME type, not the upload.
- This neutralises path traversal, double extensions, and filename injection in one move.

```php
$safe = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
```

## 4. Store & Serve Safely

| Control | Why |
|---------|-----|
| Store **outside the web root** | Uploaded files can't be requested/executed directly. |
| Serve via a **download script** with `Content-Disposition: attachment` | Files download instead of rendering/executing. |
| Disable script execution in the upload dir | `php_admin_flag engine off`, or strip handlers; remove `AddHandler`/`FilesMatch` that map extensions to PHP. |
| Block `.htaccess`/`web.config` uploads | Prevents attackers re-mapping execution. |
| Use a separate **storage domain/CDN** | Even stored XSS runs off-origin, away from session cookies. |
| Set `Content-Security-Policy` and `X-Content-Type-Options: nosniff` | Stops MIME sniffing and limits XSS impact. |

## 5. Operational Controls

- **Size & rate limits** plus quotas to prevent DoS / disk exhaustion.
- **Antivirus / YARA** scanning on stored files for known shells.
- Keep **image/PDF libraries patched** (ImageMagick, Ghostscript, libvips) — "safe" formats become RCE through old parsers.
- For XML-based formats (SVG, DOCX), **disable external entities** in the parser to kill XXE:
  ```php
  libxml_disable_entity_loader(true); // legacy; or use LIBXML_NOENT-free parsing
  ```
- **Log** uploads (who, what, where) for detection and incident response.

## Defence-in-Depth Checklist

!!! success "Secure upload checklist"
    - [ ] Allow-list extensions, regex anchored with `$`.
    - [ ] Validate MIME via content (`finfo`) **and** `getimagesize()`.
    - [ ] Re-encode images to strip metadata payloads.
    - [ ] Randomise the server-side filename; derive the extension yourself.
    - [ ] Store outside the web root; serve via a download handler.
    - [ ] Disable script execution in the upload directory.
    - [ ] Block `.htaccess`/`web.config` uploads.
    - [ ] Enforce size/rate limits and quotas.
    - [ ] Disable XML external entities for SVG/Office parsing.
    - [ ] Patch image/document processing libraries; AV-scan stored files.

!!! quote "The golden rule"
    Validate on the **server**, trust **nothing** from the client, and assume any file you store may be requested directly. Design as if the attacker controls the filename, the extension, the header, and the bytes — because they do.

➡️ Finish with the [Cheatsheet](cheatsheet.md) for rapid revision.
