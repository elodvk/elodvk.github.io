---
title: "Parameter Fuzzing — GET"
description: "Discover hidden GET parameters on web applications using ffuf — finding debug flags, admin controls, and undocumented functionality."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Parameter Fuzzing — GET

## Why Fuzz for Parameters?

Web applications often have hidden or undocumented GET parameters that expose sensitive functionality:

- **Debug parameters** (`?debug=true`, `?verbose=1`) → leak stack traces, SQL queries, internal paths
- **Admin controls** (`?admin=1`, `?role=admin`) → privilege escalation via IDOR
- **Hidden functionality** (`?source=1`, `?download=file`) → source code disclosure, arbitrary file access
- **Filter bypasses** (`?waf=off`, `?test=1`) → disable security controls
- **Alternative output** (`?format=json`, `?output=xml`) → expose data in parseable formats

These parameters aren't linked anywhere in the application — you can only find them by fuzzing.

---

## How It Works

Place the `FUZZ` keyword in the **parameter name** position of the query string:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://SERVER_IP:PORT/admin/admin.php?FUZZ=key -fs 0
```

This tests each word as a GET parameter name:

- `http://SERVER_IP:PORT/admin/admin.php?id=key`
- `http://SERVER_IP:PORT/admin/admin.php?user=key`
- `http://SERVER_IP:PORT/admin/admin.php?debug=key`
- `http://SERVER_IP:PORT/admin/admin.php?admin=key`
- ...

The value (`key`) is a placeholder — you're looking for parameters that change the response regardless of what value you send.

---

## Wordlists for Parameter Names

| Wordlist | Entries | Use Case |
|---|---|---|
| `burp-parameter-names.txt` | ~6,453 | Best general-purpose list |
| `raft-medium-words.txt` | ~63k | Broader coverage |
| `/usr/share/seclists/Discovery/Web-Content/api/objects.txt` | ~3k | API-specific |

Located under `/usr/share/seclists/Discovery/Web-Content/`.

!!! tip "burp-parameter-names.txt"
    This list is compiled from real-world web applications and contains the most commonly used parameter names. It's the best starting point for GET parameter discovery.

---

## Practical Walkthrough

### Step 1: Identify the Target Page

From previous page fuzzing, you discovered `/admin/admin.php`. It returns a page but you can't interact with it — no visible forms or links suggest what parameters it accepts.

### Step 2: Check the Baseline

```shell
# Request with no parameters
curl -s http://10.10.10.5:8080/admin/admin.php | wc -c
# Output: 2453

# Request with a random parameter (baseline for "parameter ignored")
curl -s "http://10.10.10.5:8080/admin/admin.php?fakeparam123=test" | wc -c
# Output: 2453
```

The page returns the same size regardless of unknown parameters. We need to find one that **changes** the response.

### Step 3: Fuzz for Parameters

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php?FUZZ=key -fs 2453

________________________________________________

 :: Method           : GET
 :: URL              : http://10.10.10.5:8080/admin/admin.php?FUZZ=key
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt
 :: Filter           : Response size: 2453
 :: Threads          : 40
________________________________________________

id                      [Status: 200, Size: 3841, Words: 712, Lines: 98, Duration: 52ms]
debug                   [Status: 200, Size: 8923, Words: 1843, Lines: 245, Duration: 55ms]
user                    [Status: 200, Size: 3102, Words: 623, Lines: 78, Duration: 48ms]
```

### Step 4: Investigate Each Finding

```shell
# The 'id' parameter — likely an IDOR
curl -s "http://10.10.10.5:8080/admin/admin.php?id=key"
# Different content means it's trying to look up a record

# The 'debug' parameter — significantly larger response
curl -s "http://10.10.10.5:8080/admin/admin.php?debug=key"
# Might leak debug information, SQL queries, file paths

# The 'user' parameter — user lookup
curl -s "http://10.10.10.5:8080/admin/admin.php?user=key"
# Could allow user enumeration
```

---

## Filtering Strategy

The most important aspect of parameter fuzzing is filtering. The server's response to an unknown parameter is your noise baseline.

### Filter by Size (`-fs`)

Most applications return the same page unchanged when given an unknown parameter:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/page.php?FUZZ=value -fs 2453
```

### Filter Empty Responses (`-fs 0`)

Some applications return a blank response (0 bytes) for invalid requests, and content only for valid parameters:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/endpoint?FUZZ=test -fs 0
```

### Filter by Word/Line Count

If the response size fluctuates slightly (dynamic tokens, timestamps):

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/page.php?FUZZ=value -fw 423
```

---

## Real-World Scenarios

### Scenario 1: Hidden Admin Flag

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/dashboard.php?FUZZ=1 -fs 4521

# Found: role [Status: 200, Size: 8934]
# Visiting: http://10.10.10.5:8080/dashboard.php?role=admin → admin panel!
```

### Scenario 2: Debug/Source Disclosure

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/index.php?FUZZ=true -fs 15842

# Found: debug [Status: 200, Size: 48923]
# The page now leaks SQL queries, file paths, and PHP errors
```

### Scenario 3: File Inclusion via Parameter

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/page.php?FUZZ=/etc/passwd -fs 2453

# Found: file [Status: 200, Size: 3891]
# → Local File Inclusion (LFI) vulnerability!
```

---

## Fuzzing Multiple Parameters

If a page takes one parameter and you want to find additional ones:

```shell
# Already know ?id=1 works. Find additional parameters.
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u "http://10.10.10.5:8080/admin/admin.php?id=1&FUZZ=test" -fs 3841
```

---

## Tips for GET Parameter Fuzzing

!!! tip "Value Matters"
    Some parameters only trigger different behavior with specific values. If fuzzing with `?FUZZ=key` finds nothing, try:
    - `?FUZZ=1` (numeric/boolean triggers)
    - `?FUZZ=true` (boolean flags)
    - `?FUZZ=admin` (role-based)
    - `?FUZZ=../../../etc/passwd` (path traversal)

!!! warning "URL Encoding"
    Special characters in parameter values need URL encoding. Ffuf handles basic encoding, but for payloads with `&`, `=`, or `#`, encode them manually or use `-enc` options.

!!! info "Rate Your Results"
    After finding parameters, prioritize by response-size delta:
    - **Large delta** (page doubled in size) → debug output, additional content loaded
    - **Small delta** (few bytes different) → might be reflected input (XSS potential) or a minor state change
    - **Status code change** (200→302, 200→500) → authentication/authorization bypass or error trigger

---

!!! success "Revision Recap"
    - GET parameter fuzzing discovers **hidden functionality** not visible in the UI
    - Pattern: `ffuf -w param-wordlist:FUZZ -u http://target/page?FUZZ=value`
    - **Filter the baseline** — pages return the same content for unknown parameters
    - Use `burp-parameter-names.txt` as your primary wordlist
    - Interesting findings: debug flags, admin controls, file include vectors, IDOR parameters
    - Try different placeholder values (`key`, `1`, `true`, `admin`) for better coverage
    - Prioritize results by **response size delta** — bigger changes = more interesting

---

➡️ **Next:** [Parameter Fuzzing — POST](parameter-fuzzing-post.md) — discover POST parameters with curl equivalents
