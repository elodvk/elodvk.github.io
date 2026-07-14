---
title: "Page Fuzzing with Ffuf"
description: "Combine directory and extension knowledge to discover actual pages and files on the target web application."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Page Fuzzing

## The Full Pipeline

At this stage you already know:

1. **Directories** that exist (from directory fuzzing)
2. **File extensions** the application uses (from extension fuzzing)

Page fuzzing combines these two pieces of intelligence to find **actual files and pages** within the discovered directories. This is where you uncover login forms, admin panels, configuration pages, upload handlers, and other attack surfaces.

---

## Why Not Just Directory Fuzz with Extensions?

You could run one massive scan with `-e .php,.html` against the root — but that's inefficient and noisy. The targeted approach:

1. Fuzz directories on the root → find `/admin/`, `/blog/`, `/api/`
2. Identify extensions → confirm `.php`
3. Fuzz for pages **within each directory** → find `/admin/login.php`, `/admin/config.php`, `/blog/post.php`

This focused methodology gives you better results faster, with less noise to filter.

---

## Basic Page Fuzzing Command

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://SERVER_IP:PORT/blog/FUZZ.php -fc 404
```

This tests every word in the list as a PHP filename within the `/blog/` directory:

- `http://SERVER_IP:PORT/blog/index.php`
- `http://SERVER_IP:PORT/blog/admin.php`
- `http://SERVER_IP:PORT/blog/config.php`
- `http://SERVER_IP:PORT/blog/upload.php`
- ...

---

## Practical Walkthrough

### Step 1: Confirm What You Know

From previous fuzzing stages:

```shell
# Directory fuzzing found:
# /blog/      [Status: 301]
# /admin/     [Status: 403]
# /forum/     [Status: 200]

# Extension fuzzing confirmed:
# .php        [Status: 200] — PHP application
```

### Step 2: Fuzz Each Directory

```shell
# Fuzz pages in /blog/
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/blog/FUZZ.php -fc 404

________________________________________________

index                   [Status: 200, Size: 15842, Words: 3420, Lines: 312, Duration: 45ms]
post                    [Status: 200, Size: 4521, Words: 891, Lines: 85, Duration: 42ms]
archive                 [Status: 200, Size: 8932, Words: 1823, Lines: 156, Duration: 48ms]
config                  [Status: 403, Size: 289, Words: 21, Lines: 11, Duration: 38ms]
```

```shell
# Fuzz pages in /admin/
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/FUZZ.php -fc 404

________________________________________________

login                   [Status: 200, Size: 3245, Words: 432, Lines: 67, Duration: 41ms]
dashboard              [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 39ms]
users                   [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 40ms]
upload                  [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 38ms]
```

### Step 3: Interpret Results

| Finding | Meaning | Next Step |
|---|---|---|
| `login.php` (200) | Login page accessible | Test for default creds, SQLi |
| `dashboard.php` (302) | Redirects (needs auth) | Try after getting creds |
| `upload.php` (302) | File upload exists | High-value target post-auth |
| `config.php` (403) | Config file exists | Try backup extensions (`.php.bak`) |

---

## Handling False Positives on Page Fuzzing

Custom 404 pages that return 200 are common. Measure the baseline first:

```shell
# Check what a non-existent page returns
curl -s http://10.10.10.5:8080/blog/definitelynotarealpage12345.php | wc -c
# Output: 1987

# Filter that size
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/blog/FUZZ.php -fs 1987
```

---

## Using Targeted Wordlists

The general `directory-list` works, but purpose-built wordlists often yield better results for page fuzzing:

```shell
# Common filenames (smaller, faster)
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/FUZZ.php -fc 404

# Raft filenames (community-sourced)
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/FUZZ -fc 404
```

!!! tip "raft-medium-files.txt"
    This wordlist already includes extensions in the filenames (e.g., `index.php`, `login.html`), so you don't need to append `.php` manually. Use it WITHOUT adding the extension in the URL.

---

## Multi-Extension Page Fuzzing

When the application uses multiple technologies (e.g., PHP + static HTML):

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/blog/FUZZ -e .php,.html,.txt -fc 404
```

Or use multi-keyword mode for full control:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:PAGE \
     -w /tmp/extensions.txt:EXT \
     -u http://10.10.10.5:8080/blog/PAGE.EXT -fc 404
```

Where `/tmp/extensions.txt` contains only your confirmed extensions:

```
php
html
txt
```

---

## Building the Attack Surface Map

After page fuzzing all directories, compile your findings into a map:

```
http://10.10.10.5:8080/
├── blog/
│   ├── index.php       (200) — Public blog
│   ├── post.php        (200) — Individual posts
│   ├── archive.php     (200) — Archive listing
│   └── config.php      (403) — Configuration (blocked)
├── admin/
│   ├── login.php       (200) — Login form ← TEST THIS
│   ├── dashboard.php   (302) — Needs auth
│   ├── users.php       (302) — User management
│   └── upload.php      (302) — File upload ← HIGH VALUE
└── forum/
    ├── index.php       (200) — Forum home
    ├── thread.php      (200) — Thread viewer
    └── profile.php     (200) — User profiles
```

This map tells you exactly where to focus your exploitation efforts:

- `login.php` → try default creds, SQLi, brute-force
- `upload.php` → file upload attacks (once authenticated)
- `config.php` → try `.php.bak`, `.php.old`, `.php~`
- `post.php` / `thread.php` → likely take parameters (ID?) → parameter fuzzing

---

## Quick Wins: Common Interesting Pages

Always check for these pages regardless of directory fuzzing results:

```shell
# Quick check for common sensitive files at root
ffuf -w /usr/share/seclists/Discovery/Web-Content/quickhits.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fc 404
```

The `quickhits.txt` wordlist contains known-interesting paths like:

- `/.env`
- `/robots.txt`
- `/sitemap.xml`
- `/.git/HEAD`
- `/wp-config.php.bak`
- `/server-status`
- `/phpinfo.php`

---

!!! success "Revision Recap"
    - Page fuzzing combines **directory + extension** knowledge to find actual files
    - The command pattern: `ffuf -w wordlist:FUZZ -u http://target/directory/FUZZ.ext`
    - **Always filter** — check the baseline size of non-existent pages first
    - Fuzz each discovered directory **individually** for focused results
    - Status codes tell a story: 200 = accessible, 302 = auth-gated, 403 = exists but blocked
    - Build an **attack surface map** from your combined results
    - Don't forget `quickhits.txt` for common sensitive files at the root

---

➡️ **Next:** [Recursive Fuzzing](recursive-fuzzing.md) — automatically spider nested directories
