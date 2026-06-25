---
title: 'File Upload Attacks'
description: 'A complete, exam-focused study series on abusing insecure file upload functionality — methodology, fingerprinting, web/reverse shells, client-side and server-side filter bypasses, limited uploads, and defense.'
tags:
  - CPTS
  - Web
  - File Upload
  - RCE
icon: material/file-upload
---

# File Upload Attacks

!!! abstract "Mentor's Note"
    File upload is one of the highest-value attack surfaces on the web. If you can write a file the server will *execute*, you usually own the box. Treat every upload form as a potential remote code execution (RCE) primitive until you prove otherwise.

    This series breaks the topic into focused, bite-sized lessons so you can revise **one idea at a time**. Read it top to bottom the first time, then use the [cheatsheet](cheatsheet.md) for last-minute review before the exam.

## The Core Idea

Almost every modern app lets users upload *something* — profile pictures, PDFs, attachments, avatars. The moment an app accepts user-controlled files, it accepts the risk of storing **attacker-controlled data on its own server**. If the file type and contents aren't strictly validated, you can often upload a script the server will run for you.

These bugs are consistently rated **High/Critical** for one reason: a successful arbitrary file upload is one short step from full server compromise. The worst case is an **unauthenticated arbitrary file upload** — anyone, no login required, drops a payload and gets code execution.

## What File Uploads Get You

The headline outcome is **RCE via a web shell or reverse shell**. But even when you *can't* upload arbitrary code, a weak upload feature is still dangerous:

| Outcome | How |
|---------|-----|
| **Remote Code Execution** | Upload a server-side script (`.php`, `.aspx`, `.jsp`) the server executes. |
| **Stored XSS** | Upload an HTML or SVG file containing JavaScript. |
| **XXE / SSRF** | Upload a malicious SVG or XML-based document (DOCX is XML under the hood). |
| **Denial of Service** | Decompression bombs (zip bombs), pixel-flood images, or filling the disk. |
| **Overwrite critical files** | Path traversal in the filename (`../../`) to clobber config or app files. |
| **Second-order attacks** | Upload a file later processed by a vulnerable back-end library. |

!!! warning "Vulnerable libraries count too"
    File upload bugs aren't only about sloppy validation code. Outdated image/PDF/parsing libraries (ImageMagick "ImageTragick", `libvips`, Ghostscript, etc.) are routinely exploitable through an otherwise "safe" upload.

## The Methodology

A repeatable workflow keeps you efficient under exam pressure:

1. **Test for absent validation** — can you just upload a script?
2. **Fingerprint the stack** — what language/framework runs the app? Your payload must match it.
3. **Prove code execution** — upload a harmless "Hello World" script first.
4. **Weaponize** — drop a web shell or reverse shell.
5. **If blocked, bypass** — start with client-side validation (the weakest), then server-side filters (extension blacklists → whitelists → Content-Type/MIME → magic bytes).
6. **If RCE is impossible** — pivot to limited-upload attacks (XSS, XXE, SSRF, DoS) and filename injections.

!!! quote "Decision flow"
    Can I upload any file? → **[Absent validation](absent-validation.md): upload a shell.**
    Blocked in the browser only? → **[Client-side bypass](client-side-validation.md).**
    Server rejects the extension? → **[Blacklist](blacklist-filters.md) / [Whitelist](whitelist-filters.md) bypasses.**
    Server checks the file *type*? → **[Content-Type / MIME / magic bytes](type-filters.md).**
    Can't get RCE at all? → **[Limited file uploads](limited-uploads.md).**

## How to Use This Series

Work through the lessons in order — each builds on the last:

<div class="grid cards" markdown>

-   :material-magnify:{ .lg .middle } **[Fingerprinting the Stack](fingerprinting.md)**

    ---
    Identify the server language so your payload actually executes.

-   :material-folder-open:{ .lg .middle } **[Absent Validation](absent-validation.md)**

    ---
    The simplest case — no checks at all — plus proving code execution.

-   :material-bomb:{ .lg .middle } **[Weaponization](weaponization.md)**

    ---
    Web shells and reverse shells: ready-made, custom, and `msfvenom`.

-   :material-language-javascript:{ .lg .middle } **[Client-Side Validation](client-side-validation.md)**

    ---
    Defeat browser-only checks with a proxy or the DevTools console.

-   :material-format-list-bulleted:{ .lg .middle } **[Blacklist Filters](blacklist-filters.md)**

    ---
    Fuzz for forgotten extensions a blacklist never thought to block.

-   :material-check-decagram:{ .lg .middle } **[Whitelist Filters](whitelist-filters.md)**

    ---
    Double extensions, character injection, and weak regex.

-   :material-file-search:{ .lg .middle } **[Type & MIME Filters](type-filters.md)**

    ---
    Spoof Content-Type and forge magic bytes to fool content checks.

-   :material-alert-circle:{ .lg .middle } **[Limited File Uploads](limited-uploads.md)**

    ---
    XSS, XXE, SSRF, DoS, and filename injection when RCE is off the table.

-   :material-shield-check:{ .lg .middle } **[Prevention & Hardening](prevention.md)**

    ---
    How to actually secure an upload feature (the defender's view).

-   :material-clipboard-text:{ .lg .middle } **[Cheatsheet](cheatsheet.md)**

    ---
    One-page quick reference for exam day.

</div>

## Master Tooling Reference

| Job | Primary | Alternatives |
|-----|---------|--------------|
| Tech fingerprinting | Wappalyzer | whatweb, httpx, nmap `http-enum`, BuiltWith |
| Extension fuzzing | Burp Intruder | ffuf, wfuzz |
| Intercept/modify upload | Burp Suite | Caido, OWASP ZAP, mitmproxy |
| PHP web shell | `<?php system($_REQUEST['cmd']); ?>` | phpbash, weevely, p0wny-shell, b374k, WSO |
| .NET/ASP shell | `<% eval request("cmd") %>` | China Chopper, Antak (Nishang) |
| Reverse shell payload | pentestmonkey | revshells.com, msfvenom, SecLists |
| Listener | `nc -lvnp` | rlwrap nc, pwncat-cs, socat |
| Magic bytes / file type | `file`, `xxd` | hexedit, Burp hex view |
| Shell wordlists/payloads | SecLists `/Web-Shells/` | PayloadsAllTheThings (Upload Insecure Files) |

---

!!! tip "The one rule that matters"
    Client-side validation is a UX feature, never a security control. **Every** upload restriction must be enforced server-side. The bypasses in this series exist because that rule is broken so often.
