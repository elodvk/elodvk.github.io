---
title: "Directory Fuzzing with Ffuf"
description: "Discover hidden directories on web servers using ffuf — understanding output, filtering noise, and rate control."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Directory Fuzzing

## Why Directory Fuzzing?

Web applications expose more than what's linked on the front page. Admin panels, backup directories, API endpoints, and development artifacts often exist at predictable paths — but they're not advertised. Directory fuzzing systematically tests path names from a wordlist against the server to find these hidden resources.

This is always your **first fuzzing step** because it gives you the broadest picture of the application's structure before you dive deeper into specific pages or parameters.

---

## Basic Command

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ -u http://SERVER_IP:PORT/FUZZ
```

This sends a GET request for each word in the list, replacing `FUZZ` in the URL path:

- `http://SERVER_IP:PORT/admin`
- `http://SERVER_IP:PORT/login`
- `http://SERVER_IP:PORT/uploads`
- `http://SERVER_IP:PORT/backup`
- ... (87,650 entries in the small list)

---

## Understanding the Output

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ -u http://10.10.10.5:8080/FUZZ

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.10.5:8080/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405,500
________________________________________________

forum                   [Status: 301, Size: 326, Words: 20, Lines: 10, Duration: 45ms]
blog                    [Status: 200, Size: 15842, Words: 3420, Lines: 312, Duration: 52ms]
admin                   [Status: 403, Size: 289, Words: 21, Lines: 11, Duration: 38ms]
```

Each result line contains:

| Column | Meaning |
|---|---|
| **Word** | The wordlist entry that produced a hit |
| **Status** | HTTP response code (200, 301, 403, etc.) |
| **Size** | Response body size in bytes |
| **Words** | Word count in the response body |
| **Lines** | Line count in the response body |
| **Duration** | Round-trip time for the request |

!!! info "Default Matchers"
    By default, ffuf shows any response that does NOT return a 404. The full default match list is: `200, 204, 301, 302, 307, 401, 403, 405, 500`. This means you'll also see 403 Forbidden directories — which are still valuable (confirms the path exists).

---

## Filtering False Positives

Many applications return a custom "not found" page with a 200 status code instead of a proper 404. This floods your results with junk. Filtering is the most important skill in ffuf.

### Filter by Status Code (`-fc`)

Remove responses with specific status codes:

```shell
# Filter out 403 Forbidden (you know they exist but can't access them yet)
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fc 403

# Filter out multiple codes
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fc 403,401,500
```

### Filter by Response Size (`-fs`)

When the "not found" page always returns the same size, filter it out:

```shell
# First, send a request for a path that doesn't exist to get the baseline:
curl -s http://10.10.10.5:8080/thisdoesnotexist | wc -c
# Output: 4242

# Now filter that exact size:
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fs 4242
```

### Filter by Word Count (`-fw`)

When the "not found" page has a consistent word count:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fw 12
```

### Filter by Line Count (`-fl`)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fl 10
```

!!! tip "Auto-Calibration"
    Use `-ac` to let ffuf auto-detect and filter the "noise" response. It sends random payloads before fuzzing, measures the baseline, and filters matching responses automatically:
    ```shell
    ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
         -u http://10.10.10.5:8080/FUZZ -ac
    ```

### Match-Only Mode (`-mc`)

Instead of filtering OUT what you don't want, specify ONLY the codes you want:

```shell
# Only show 200 OK responses
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -mc 200
```

!!! warning "Don't Over-Filter"
    Don't filter 301/302 redirects — they often point to valid directories that redirect to `directory/` (with trailing slash). Status 403 also confirms existence. Filter aggressively only when you're drowning in false positives.

---

## Rate Limiting and Threads

### Threads (`-t`)

Ffuf defaults to 40 concurrent threads. Increase for faster results on stable targets, decrease to avoid detection or when the server is slow:

```shell
# Fast (100 threads) — use on exam labs
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -t 100

# Slow (5 threads) — for fragile/rate-limited servers
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -t 5
```

### Rate Limiting (`-rate`)

Set a maximum number of requests per second (more precise than thread count):

```shell
# Max 100 requests/second
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -rate 100
```

---

## Practical Examples

### Example 1: Standard Engagement

```shell
# Step 1: Quick baseline check
curl -s -o /dev/null -w "%{http_code} %{size_download}" http://10.10.10.5:8080/nonexistentpath1234
# Output: 200 4242

# Step 2: Fuzz with size filter
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fs 4242 -t 100
```

### Example 2: Save Results for Later

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fc 404 -o results.json -of json
```

### Example 3: Verbose Mode with Redirects

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://10.10.10.5:8080/FUZZ -fc 404 -v
```

Verbose mode shows the full URL and the redirect target (for 301/302), which helps you understand the application's routing.

---

## Wordlist Selection

| Wordlist | Entries | Use Case |
|---|---|---|
| `directory-list-2.3-small.txt` | ~87k | Quick initial scan |
| `directory-list-2.3-medium.txt` | ~220k | Standard engagement |
| `directory-list-2.3-big.txt` | ~1.3M | Thorough (slow) |
| `raft-medium-directories.txt` | ~30k | Good alternative |
| `common.txt` | ~4.7k | Ultra-fast first pass |

All located under `/usr/share/seclists/Discovery/Web-Content/`.

---

!!! success "Revision Recap"
    - Directory fuzzing is your **first step** — it maps the application's top-level structure
    - The basic pattern is `ffuf -w wordlist:FUZZ -u http://target/FUZZ`
    - **Always check for false positives** — custom 200 pages that aren't real content
    - Use `-fs` (size), `-fw` (words), `-fl` (lines), or `-fc` (code) to filter noise
    - `-ac` auto-calibrates filtering for you
    - Adjust `-t` (threads) and `-rate` to balance speed vs. stealth/stability
    - Save results with `-o results.json -of json` for later analysis

---

➡️ **Next:** [Extension Fuzzing](extension-fuzzing.md) — determine the web technology stack
