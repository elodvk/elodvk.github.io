---
title: 'Fingerprinting the Web Stack'
description: 'Identify the server-side language and framework behind an upload form so your web shell or reverse shell is written in a language the server will actually execute.'
tags:
  - CPTS
  - Web
  - File Upload
  - Recon
icon: material/fingerprint
---

# Fingerprinting the Web Stack

!!! abstract "Why this comes first"
    A web shell must be written in the **same language the server executes** — PHP, ASP/ASPX, JSP, and so on. These scripts call platform-specific functions, so they are not cross-platform. Upload a PHP shell to an ASP.NET server and nothing happens. Before you weaponize anything, answer one question: **what is running here?**

## Method 1 — Page Extensions & Index Probing

The URL extension often gives the stack away (`.php`, `.aspx`, `.jsp`). When the app hides extensions with clean routing, probe for the default index page by swapping extensions:

```
http://TARGET/index.php
http://TARGET/index.asp
http://TARGET/index.aspx
http://TARGET/index.jsp
```

If `index.php` returns the same page as `/`, you are almost certainly looking at a PHP application:

![Index page probe confirming PHP](../assets/file-upload-attacks/index-php-probe.png "http://SERVER_IP:PORT/index.php")

!!! tip "Read the response, not just the status"
    A `200 OK` with identical content is a strong signal. A `404` for `index.php` but `200` for `index.aspx` is just as telling. Compare body length and content, not only the status code.

## Method 2 — Fuzz the Extension

Don't probe by hand when a wordlist can do it in seconds. Use a fuzzer with a web-extensions list:

```shell
# ffuf
ffuf -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:EXT \
     -u http://TARGET/indexFUZZ -mc 200

# wfuzz equivalent
wfuzz -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt \
      --hc 404 http://TARGET/indexFUZZ
```

`Burp Intruder` works equally well here — set the payload position on the extension and load the same wordlist.

## Method 3 — Technology Fingerprinting Tools

Identify language, web server, OS, and frameworks at a glance:

- **Wappalyzer** (browser extension) — quick visual readout of the whole stack.
- **whatweb** — `whatweb http://TARGET` (CLI, scriptable, great in reports).
- **httpx** — `httpx -u http://TARGET -td` (fast, the `-td` flag enables tech detection).
- **nmap** — `nmap -p80,443 --script=http-enum,http-headers TARGET`.
- **BuiltWith** — web-based lookup for public-facing sites.
- **Burp** / **OWASP ZAP** passive scanners — surface the stack while you browse.

![Wappalyzer showing the server language and framework](../assets/file-upload-attacks/wappalyzer-fingerprint.png "http://SERVER_IP:PORT")

## Reading the Signals

Pull the stack together from multiple clues:

| Signal | Where to look | Example |
|--------|---------------|---------|
| File extension | URL, links, form `action` | `/upload.php` → PHP |
| `Server` header | HTTP response | `Apache`, `nginx`, `Microsoft-IIS/10.0` |
| `X-Powered-By` header | HTTP response | `PHP/8.1.2`, `ASP.NET` |
| Cookies | `Set-Cookie` | `PHPSESSID` → PHP, `ASP.NET_SessionId` → .NET, `JSESSIONID` → Java |
| Error pages | Force a 404/500 | Framework-branded error templates |

!!! note "IIS usually means ASP/ASPX"
    A `Microsoft-IIS` server header strongly implies `.asp`/`.aspx` execution. Apache/nginx more often front PHP, but can proxy anything — confirm with an index probe.

## Key Takeaways

!!! success "Revision recap"
    - A web shell only fires if it matches the server's language — **fingerprint first**.
    - Fastest manual check: swap the index extension (`index.php`, `.aspx`, `.jsp`).
    - Automate with `ffuf`/`wfuzz`/Burp; confirm with Wappalyzer/whatweb/httpx.
    - Cross-reference the `Server`, `X-Powered-By`, and session-cookie names.
    - Tools can be wrong or blocked — keep the manual `index.ext` trick in your back pocket.

➡️ Next: [Absent Validation](absent-validation.md) — the easiest path to code execution.
