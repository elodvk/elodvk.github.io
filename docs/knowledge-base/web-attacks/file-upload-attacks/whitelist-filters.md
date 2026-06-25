---
title: 'Bypassing Whitelist Filters'
description: 'Whitelists are stronger than blacklists, but weak regex opens the door to double extensions, reverse double extensions, and character-injection tricks.'
tags:
  - CPTS
  - Web
  - File Upload
  - Bypass
icon: material/check-decagram
---

# Bypassing Whitelist Filters

!!! abstract "Stronger, not bulletproof"
    A **whitelist** only allows a specific set of extensions, so the list never has to be exhaustive — generally more secure than a [blacklist](blacklist-filters.md). But whitelists are usually implemented with a regular expression, and weak regex is where it all falls apart.

## When to Expect a Whitelist

Whitelists suit upload features that allow only a few file types (e.g. an avatar uploader), while blacklists suit features that must accept many types (e.g. a File Manager). The two are sometimes used together.

Try uploading an uncommon PHP extension like `.phtml` (which slipped past the blacklist earlier):

![Only images are allowed message](../assets/file-upload-attacks/whitelist-only-images-allowed.png "browser:SERVER_IP:PORT")

This time we get **"Only images are allowed"**. Error messages don't always reveal *which* validation is in play, so fuzz for allowed extensions the same way as before:

![Fuzzing results — all PHP variants blocked](../assets/file-upload-attacks/whitelist-fuzzing-blocked.png)

All PHP variants (`php5`, `php7`, `phtml`, …) are blocked. The whitelist is doing its job on the extension — so we attack the **regex** instead.

## The Vulnerable Whitelist

```php
$fileName = basename($_FILES["uploadFile"]["name"]);

if (!preg_match('^.*\.(jpg|jpeg|png|gif)', $fileName)) {
    echo "Only images are allowed";
    die();
}
```

The regex tests whether the filename **contains** a whitelisted image extension — not whether it **ends** with one. That single missing anchor (`$`) is the whole vulnerability. Developers make this mistake from a weak understanding of regex.

## Bypass 1 — Double Extensions

Because the check only looks for an image extension *somewhere* in the name, append it but keep a real executable extension at the end. If `.jpg` is allowed, name your file `shell.jpg.php`:

```
shell.jpg.php   → contains ".jpg", but ends in ".php" and executes as PHP
```

Intercept a normal upload, change the filename to `shell.php.jpg`/`shell.jpg.php` (depending on which the server executes), and set the body to a web shell:

![Uploading a double-extension PHP shell](../assets/file-upload-attacks/whitelist-double-extension-upload.png)

Visit the file and run a command — it executes as a full PHP script:

![Web shell executing id via the double extension](../assets/file-upload-attacks/whitelist-double-extension-rce.png "http://SERVER_IP:PORT/profile_images/shell.phar.jpg?cmd=id")

!!! tip "Order depends on the server"
    On Apache with certain `AddHandler`/`AddType` misconfigurations, `shell.php.jpg` executes because Apache runs the first recognised handler extension. On a strict last-extension parser, you need `shell.jpg.php`. Try both.

## Bypass 2 — Reverse Double Extension

Sometimes the *application* regex is strict, but the **web server config** is not. An Apache config like:

```apache
<FilesMatch ".+\.ph(ar|p|tml)">
    SetHandler application/x-httpd-php
</FilesMatch>
```

…executes **any** file whose name *contains* `.php` (etc.), regardless of the final extension. So `shell.php.jpg` passes the app's "ends in .jpg" whitelist **and** is executed by Apache because the name contains `.php`. The two weaknesses point in opposite directions — hence "reverse double extension."

## Bypass 3 — Character Injection

You can inject characters before or after the final extension to confuse parsers while keeping an executable extension. Characters worth trying (URL-encoded in the request):

| Char | Encoded | Idea |
|------|---------|------|
| Null byte | `%00` | `shell.php%00.jpg` — legacy PHP (< 5.3.4) truncates at the null → saved as `shell.php`. |
| Newline | `%0a` | Breaks naive regex line matching. |
| Semicolon | `;` | `shell.php;.jpg` on some IIS configs executes as PHP. |
| Colon (NTFS ADS) | `:` | `shell.aspx:.jpg` creates an alternate data stream on IIS. |
| Slash/dot tricks | `%20`, `.`, `/` | `shell.php.` or `shell.php%20` may be stripped to `shell.php` on save. |

A quick way to generate every permutation is to build a wordlist combining each technique with each extension, then fuzz with Burp Intruder.

!!! note "When the regex is correct"
    A properly anchored pattern only considers the **final** extension:
    ```php
    if (!preg_match('/^.*\.(jpg|jpeg|png|gif)$/', $fileName)) { ...SNIP... }
    ```
    The `^.*\.` matches everything up to the last `.`, and `$` forces the extension to **end** the name. Against this, double-extension tricks fail — you'd need a [type/content bypass](type-filters.md) or a server/library misconfiguration instead.

## Key Takeaways

!!! success "Revision recap"
    - Whitelists fail mostly through **weak regex** — a missing `$` anchor checks *contains*, not *ends with*.
    - **Double extension:** `shell.jpg.php` (or `shell.php.jpg`, server-dependent).
    - **Reverse double extension:** abuse `FilesMatch`/`AddHandler` that executes any name *containing* `.php`.
    - **Character injection:** `%00`, `;`, `:`, `%20`, trailing `.` to truncate/confuse the parser.
    - A correctly anchored regex (`...$`) defeats these — move to type/content bypasses.

➡️ Next: [Type & MIME Filters](type-filters.md) — when the server inspects content, not just the name.
