---
title: "Web Extension Fuzzing with Ffuf"
description: "Identify the web application's technology stack by fuzzing for file extensions — a critical step before page discovery."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Extension Fuzzing

## Why Extension Fuzzing Matters

Before you can find specific pages on a web server, you need to know **what file types the application serves**. A PHP app serves `.php` files. A Java app might serve `.jsp` or use extensionless routing. An ASP.NET app uses `.aspx`. If you fuzz for pages without knowing the correct extension, you'll miss everything.

Extension fuzzing tells you the **technology stack** in seconds — and that knowledge drives every subsequent fuzzing step.

---

## The Two Approaches

### Approach 1: Using the `-e` Flag

The `-e` flag appends extensions to every word in the wordlist:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://SERVER_IP:PORT/blog/FUZZ -e .php,.html,.txt,.asp,.aspx,.jsp
```

This tests each word with every extension appended. For a word like `index`, it would try:

- `http://SERVER_IP:PORT/blog/index`
- `http://SERVER_IP:PORT/blog/index.php`
- `http://SERVER_IP:PORT/blog/index.html`
- `http://SERVER_IP:PORT/blog/index.txt`
- `http://SERVER_IP:PORT/blog/index.asp`
- `http://SERVER_IP:PORT/blog/index.aspx`
- `http://SERVER_IP:PORT/blog/index.jsp`

!!! warning "Multiplicative Effect"
    Adding 6 extensions to an 87k wordlist means 87k × 7 = **609k requests**. This is fine for a targeted directory, but don't use this approach on the entire site at once. Use Approach 2 first to identify which extensions exist, then fuzz specific directories with only the relevant ones.

### Approach 2: FUZZ in the Extension Position (Recommended First)

Use a dedicated extensions wordlist with `FUZZ` placed where the extension goes:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:FUZZ \
     -u http://SERVER_IP:PORT/blog/indexFUZZ
```

This is a fast, targeted probe. The `web-extensions.txt` wordlist contains entries like:

```
.php
.html
.htm
.asp
.aspx
.jsp
.do
.action
.cgi
.pl
.txt
.xml
.json
.js
.css
```

!!! tip "Why `indexFUZZ`?"
    Most web applications have an `index` file at their root or in each directory. By fuzzing extensions against `index`, you quickly determine what tech stack is in use without needing a large wordlist.

---

## Practical Walkthrough

### Step 1: Identify Extensions on a Known Directory

Suppose from directory fuzzing you discovered `/blog/`. Now determine what files it serves:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:FUZZ \
     -u http://10.10.10.5:8080/blog/indexFUZZ

________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.10.5:8080/blog/indexFUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/web-extensions.txt
 :: Threads          : 40
________________________________________________

.php                    [Status: 200, Size: 15842, Words: 3420, Lines: 312, Duration: 45ms]
.phps                   [Status: 403, Size: 289, Words: 21, Lines: 11, Duration: 39ms]
```

**Interpretation:**

- `.php` returned **200** with substantial content → the application is **PHP-based**
- `.phps` returned **403** → PHP source files exist but are forbidden (still useful info — `phps` can leak source code if misconfigured)
- No `.html`, `.asp`, `.jsp` → confirms this is not an ASP/Java stack

### Step 2: Verify Against Multiple Directories

Don't assume the entire site uses one technology. Test against other discovered directories:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/indexFUZZ
```

---

## Interpreting Results

| Extension Found | Technology Stack |
|---|---|
| `.php` | PHP (Apache/Nginx + PHP-FPM) |
| `.asp` / `.aspx` | ASP.NET (IIS) |
| `.jsp` / `.do` / `.action` | Java (Tomcat, JBoss, Struts) |
| `.html` / `.htm` | Static HTML or templated SSR |
| `.cgi` / `.pl` | Perl CGI (legacy) |
| `.py` | Python (rare, usually frameworked) |
| `.rb` | Ruby (rare, usually Rails) |
| `.txt` | Often README, robots, config leaks |
| `.xml` | Configuration files, sitemaps |
| `.json` | API endpoints, configuration |
| `.js` | Client-side (or Node.js if server-routed) |
| `.env` | Environment config (sensitive!) |
| `.bak` / `.old` / `.swp` | Backup files (source code leaks) |

!!! danger "High-Value Extensions"
    Always check for backup/config extensions: `.bak`, `.old`, `.swp`, `.conf`, `.config`, `.env`, `.sql`, `.zip`, `.tar.gz`. These often contain credentials or source code that developers forgot to clean up.

---

## Chaining with Directory Results

Once you know the extension, feed that knowledge back into your directory fuzzing:

```shell
# You know it's PHP — now find PHP files across the site
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ.php -fc 404
```

Or use the `-e` flag efficiently (only relevant extensions):

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -e .php -fc 404
```

---

## Fuzzing for Backup Files

A common quick-win is combining known page names with backup extensions:

```shell
# Create a custom list of backup extensions
cat << 'EOF' > /tmp/backup-ext.txt
.bak
.old
.orig
.save
.swp
.swo
~
.copy
.tmp
.zip
.tar.gz
.gz
EOF

# Fuzz against known files
ffuf -w /tmp/backup-ext.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/config.phpFUZZ
```

---

## Multiple Extension Probing in One Shot

If you want to test a broader set of filenames × extensions in one command:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FILE \
     -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:EXT \
     -u http://10.10.10.5:8080/FILE.EXT -fc 404 -t 100
```

!!! info "Multi-Keyword Mode"
    When using multiple keywords (`FILE`, `EXT`), ffuf operates in **clusterbomb** mode by default — it tests every combination. With 4,700 filenames × 40 extensions = 188,000 requests. Plan accordingly.

---

!!! success "Revision Recap"
    - Extension fuzzing reveals the **technology stack** and tells you what file types to target
    - **Approach 1** (`-e` flag): Appends extensions to every wordlist entry — broad but slow
    - **Approach 2** (FUZZ as extension): Test extensions against a known filename like `index` — fast and targeted
    - Use `web-extensions.txt` from SecLists for comprehensive extension coverage
    - **Chain your findings**: once you know it's `.php`, add `-e .php` to all subsequent fuzzing
    - Don't forget backup extensions (`.bak`, `.old`, `.swp`) — common source code leaks
    - Test multiple directories separately — different parts of an app can use different stacks

---

➡️ **Next:** [Page Fuzzing](page-fuzzing.md) — discover actual files within directories
