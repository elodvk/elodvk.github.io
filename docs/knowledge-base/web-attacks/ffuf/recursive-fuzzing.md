---
title: "Recursive Fuzzing with Ffuf"
description: "Automatically discover nested directories and files using ffuf's recursive mode — when to use it and how to control depth."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Recursive Fuzzing

## What Is Recursive Fuzzing?

So far, you've been fuzzing directories one level at a time — find `/blog/`, then manually fuzz inside `/blog/`. Recursive fuzzing automates this process: when ffuf discovers a directory, it **automatically starts a new fuzzing scan inside that directory**, repeating until it reaches a specified depth.

Think of it as a depth-first crawl powered by your wordlist, without you having to chain commands manually.

---

## The Flags

| Flag | Purpose |
|---|---|
| `-recursion` | Enable recursive mode |
| `-recursion-depth` | Maximum depth to recurse (default: 0 = infinite) |
| `-e` | Extensions to test at each level (important for page discovery) |

---

## Basic Recursive Command

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://SERVER_IP:PORT/FUZZ -recursion -recursion-depth 2 -e .php -fc 404 -v
```

This will:

1. Fuzz the root for directories and `.php` files
2. When it finds a directory (301/302), start a new scan inside it
3. Repeat up to 2 levels deep
4. Show full URLs (`-v`) so you can see the nested paths

---

## How Ffuf Detects "Directories"

Ffuf considers a result a directory (and thus worthy of recursion) when it receives a **redirect** (301/302) to the same path with a trailing slash. For example:

```
/admin → 301 → /admin/
```

This triggers a new scan at `http://target/admin/FUZZ`. Responses that return 200, 403, or other codes without redirecting are treated as endpoints (files), not directories.

!!! info "Extension Interaction"
    When using `-e .php` with `-recursion`, ffuf tests both `FUZZ` (bare — catches directories) and `FUZZ.php` (with extension — catches files) at each level. This is exactly what you want.

---

## Understanding the Output

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 -e .php -fc 404

________________________________________________

[Status: 301, Size: 326, Words: 20, Lines: 10, Duration: 41ms]
| URL | http://10.10.10.5:8080/admin
| --> | http://10.10.10.5:8080/admin/
[INFO] Adding a new job to the queue: http://10.10.10.5:8080/admin/FUZZ

[Status: 200, Size: 3245, Words: 432, Lines: 67, Duration: 43ms]
| URL | http://10.10.10.5:8080/admin/login.php

[Status: 301, Size: 334, Words: 20, Lines: 10, Duration: 38ms]
| URL | http://10.10.10.5:8080/admin/assets
| --> | http://10.10.10.5:8080/admin/assets/
[INFO] Adding a new job to the queue: http://10.10.10.5:8080/admin/assets/FUZZ

[Status: 200, Size: 8921, Words: 23, Lines: 5, Duration: 44ms]
| URL | http://10.10.10.5:8080/admin/assets/style.css

[Status: 301, Size: 328, Words: 20, Lines: 10, Duration: 40ms]
| URL | http://10.10.10.5:8080/forum
| --> | http://10.10.10.5:8080/forum/
[INFO] Adding a new job to the queue: http://10.10.10.5:8080/forum/FUZZ

[Status: 200, Size: 12543, Words: 2341, Lines: 234, Duration: 52ms]
| URL | http://10.10.10.5:8080/forum/index.php
```

Key observations:

- `[INFO] Adding a new job to the queue` — ffuf discovered a directory and is scheduling recursive scans
- The `-->` shows the redirect target (confirms it's a directory)
- Files (200 responses) are listed but don't trigger recursion

---

## Controlling Depth

### Depth 1: Only One Level Below Root

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 1 -e .php -fc 404
```

Finds: `/admin/`, `/admin/login.php`, `/forum/`, `/forum/index.php`
Does NOT recurse into: `/admin/assets/`, `/admin/includes/`

### Depth 2: Two Levels (Recommended Default)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 -e .php -fc 404
```

Finds nested structures like `/admin/includes/config.php`

### No Limit (Caution)

```shell
# Omit -recursion-depth or set to 0
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -fc 404
```

!!! danger "Infinite Recursion Risk"
    Without a depth limit, ffuf will follow every directory it finds as deep as it goes. On applications with many nested directories (WordPress `wp-content/plugins/...`, or symlink loops), this can run for hours. **Always set `-recursion-depth`** in practice.

---

## Performance Considerations

Recursive fuzzing is exponentially more expensive than single-level fuzzing:

| Depth | Directories Found | Total Requests (87k wordlist) |
|---|---|---|
| 0 (root only) | — | 87,000 |
| 1 | 5 dirs | 87,000 × 6 = 522,000 |
| 2 | 5 dirs × 3 subdirs each | 87,000 × 21 = 1,827,000 |

**Recommendations:**

- Use a **smaller wordlist** (`common.txt` ~4.7k) for recursive scans
- Set a **reasonable depth** (1-2 for exam scenarios)
- Increase **threads** if the server can handle it
- Add **extensions wisely** — each extension multiplies requests

```shell
# Balanced recursive scan: fast wordlist, limited depth, one extension
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 \
     -e .php -fc 404 -t 100
```

---

## When to Use Recursive vs. Manual

| Scenario | Approach |
|---|---|
| Initial recon, unknown structure | Recursive (small wordlist, depth 2) |
| Known directory, need deep enumeration | Manual fuzzing inside that dir |
| Time-constrained (exam) | Recursive with `common.txt` |
| Large application, many dirs | Manual — recursive would take too long |
| Looking for specific nested files | Manual targeted scan |

!!! tip "Exam Strategy"
    On OSCP/CPTS exams, start with a quick recursive scan using `common.txt` (depth 2) to map the application structure fast. Then switch to manual, targeted fuzzing on interesting directories using larger wordlists. This gives you breadth first, then depth where it matters.

---

## Combining Recursive with Filtering

The same filtering flags work during recursive scans:

```shell
# Recursive with auto-calibration
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 \
     -e .php -ac -t 100

# Recursive with size filter
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 \
     -e .php -fs 4242 -t 100
```

!!! warning "Filtering Applies Globally"
    The `-fs`/`-fc`/`-fw`/`-fl` filters apply to ALL recursive levels. If different directories have different "not found" page sizes, auto-calibration (`-ac`) is more reliable than a hardcoded `-fs` value.

---

## Saving Recursive Results

Always save recursive scan results — they contain the full discovered site structure:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/common.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -recursion -recursion-depth 2 \
     -e .php -fc 404 -o recursive-results.json -of json -v
```

The JSON output preserves the full URL for each finding, making it easy to parse later.

---

!!! success "Revision Recap"
    - `-recursion` tells ffuf to automatically fuzz inside discovered directories
    - `-recursion-depth N` prevents runaway scans (always set this)
    - Ffuf triggers recursion on **301/302 redirects** (directory indicators)
    - Use a **smaller wordlist** for recursive scans (exponential growth)
    - **Depth 2** with `common.txt` is a solid exam starting point
    - Combine with `-e .php` to catch both directories and files at each level
    - Use `-ac` for filtering during recursive scans (adapts to each directory)
    - Save results with `-o` — the nested structure is valuable intelligence

---

➡️ **Next:** [Subdomain Fuzzing](subdomain-fuzzing.md) — DNS-based subdomain discovery
