---
title: "VHost Fuzzing with Ffuf"
description: "Discover virtual hosts that don't have DNS entries by fuzzing the Host header — technique, filtering, and practical lab scenarios."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# VHost Fuzzing

## Subdomain vs. VHost — The Critical Difference

Subdomain fuzzing relies on **DNS resolution** — the hostname must resolve to an IP before you get a response. But many web applications serve different content based on the `Host:` header without requiring separate DNS entries. These are **virtual hosts (vhosts)**.

A single web server at `10.10.10.5` might be configured to serve:

- `academy.htb` → main application
- `dev.academy.htb` → development version
- `internal.academy.htb` → admin panel
- `api.academy.htb` → REST API

If `internal.academy.htb` has no DNS record, subdomain fuzzing **will never find it**. VHost fuzzing bypasses DNS entirely by sending requests to the server's IP while manipulating the `Host` header.

---

## How VHost Fuzzing Works

Instead of changing the URL hostname (which requires DNS), vhost fuzzing:

1. Sends requests directly to the **target IP** (or a known hostname)
2. Sets the `Host:` header to each candidate subdomain
3. Compares responses to identify unique vhosts

```shell
# What the request looks like:
GET / HTTP/1.1
Host: internal.academy.htb    ← This changes with each FUZZ entry
```

The web server reads the `Host` header and routes to the appropriate virtual host configuration. If the hostname matches a configured vhost, you get that site's content. If not, you get the default/fallback site.

---

## Basic VHost Fuzzing Command

```shell
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://academy.htb -H "Host: FUZZ.academy.htb"
```

Or directly against the IP:

```shell
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://10.10.10.5 -H "Host: FUZZ.academy.htb"
```

!!! info "Why `-H` Instead of the URL?"
    The URL determines where the TCP connection goes (IP resolution). The `Host` header tells the web server *which site* to serve. By keeping the URL static and fuzzing only the header, we ensure all requests reach the same server regardless of DNS.

---

## Practical Walkthrough

### Step 1: Establish the Baseline

First, see what the default vhost returns (using a hostname that definitely doesn't exist):

```shell
curl -s http://10.10.10.5 -H "Host: notarealhost12345.academy.htb" | wc -c
# Output: 986

curl -s http://10.10.10.5 -H "Host: notarealhost12345.academy.htb" | wc -w
# Output: 423
```

The default/catchall vhost returns 986 bytes. Any response with a **different size** is a real vhost.

### Step 2: Fuzz with Filter

```shell
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://academy.htb -H "Host: FUZZ.academy.htb" -fs 986

________________________________________________

 :: Method           : GET
 :: URL              : http://academy.htb
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
 :: Header           : Host: FUZZ.academy.htb
 :: Filter           : Response size: 986
 :: Threads          : 40
________________________________________________

admin                   [Status: 200, Size: 4521, Words: 891, Lines: 85, Duration: 45ms]
test                    [Status: 200, Size: 7632, Words: 1543, Lines: 134, Duration: 48ms]
```

### Step 3: Access the Discovered VHosts

Add them to `/etc/hosts` so your browser and tools can reach them:

```shell
echo "10.10.10.5 admin.academy.htb test.academy.htb" | sudo tee -a /etc/hosts
```

Then browse to `http://admin.academy.htb`.

---

## Why Filtering Is Essential

Without filtering, vhost fuzzing is useless — the server returns a response for every single request (the default vhost). You'll see thousands of "200 OK" results. The key insight:

- **Default vhost** → always the same response (size/words/lines)
- **Real vhost** → unique content, different response metrics

```shell
# Filter by size (most common)
ffuf ... -fs 986

# Filter by word count (more stable if default page has dynamic elements)
ffuf ... -fw 423

# Filter by line count
ffuf ... -fl 32

# Auto-calibrate
ffuf ... -ac
```

!!! tip "Word Count Is King for VHost Fuzzing"
    Default pages sometimes include timestamps or session tokens that change the byte size slightly between requests. Word count (`-fw`) is usually more consistent. Run 2-3 baseline requests and compare.

---

## VHost Fuzzing with HTTPS

For HTTPS targets, the approach is identical but you may need to handle TLS:

```shell
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u https://10.10.10.5 -H "Host: FUZZ.target.com" -fs 0
```

!!! warning "SNI (Server Name Indication)"
    Modern TLS uses SNI — the client sends the hostname during the TLS handshake. If the server checks SNI (not just the Host header), you may need the hostname in the URL too:
    ```shell
    ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
         -u https://target.com -H "Host: FUZZ.target.com" -fs 986
    ```
    This requires `target.com` to resolve (via DNS or `/etc/hosts`).

---

## When VHosts Exist but Have No DNS

This is the exact scenario vhost fuzzing is designed for:

| Situation | Tool |
|---|---|
| Subdomain has a public DNS record | Subdomain fuzzing (or passive recon) |
| Subdomain resolves only internally | VHost fuzzing from inside the network |
| App serves different content per Host header, no DNS at all | VHost fuzzing |
| Staging/dev environments on the same server | VHost fuzzing |
| IP-only targets (no domain known) | VHost fuzzing with common names |

### Common Real-World Scenarios

1. **Shared hosting** — one IP serves hundreds of domains/vhosts
2. **Microservices** — different services behind one reverse proxy, routed by Host header
3. **Dev/staging environments** — `staging.app.com` exists on the server but has no DNS
4. **Admin panels** — `admin.internal.app.com` served from the same box

---

## Advanced: Fuzzing When You Don't Know the Domain

If you only have an IP and no known domain, try common patterns:

```shell
# Try common internal hostnames
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://10.10.10.5 -H "Host: FUZZ" -fs 612

# Try common TLD patterns
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://10.10.10.5 -H "Host: FUZZ.htb" -fs 612

ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://10.10.10.5 -H "Host: FUZZ.local" -fs 612
```

!!! tip "Clues from the Server"
    Check the server's default page, SSL certificate (`openssl s_client`), response headers (`Server`, `X-Powered-By`), and error pages for domain/hostname hints. Then use that as your base domain for vhost fuzzing.

---

## Complete VHost Enumeration Workflow

```shell
# 1. Identify the target and baseline
curl -s -o /dev/null -w "Size: %{size_download}, Code: %{http_code}" http://10.10.10.5

# 2. Get default vhost size
curl -s http://10.10.10.5 -H "Host: doesnotexist.academy.htb" | wc -c

# 3. Fuzz vhosts with size filter
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ \
     -u http://10.10.10.5 -H "Host: FUZZ.academy.htb" -fs 986 -t 100

# 4. Add discovered vhosts to /etc/hosts
echo "10.10.10.5 admin.academy.htb internal.academy.htb" | sudo tee -a /etc/hosts

# 5. Now fuzz directories/pages on each vhost
ffuf -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ \
     -u http://admin.academy.htb/FUZZ -fc 404
```

---

!!! success "Revision Recap"
    - VHost fuzzing discovers virtual hosts by manipulating the `Host:` header — no DNS needed
    - Pattern: `ffuf -w wordlist:FUZZ -u http://target -H "Host: FUZZ.domain.com"`
    - **Filtering is mandatory** — every request gets a response (the default vhost)
    - Filter the default vhost response size with `-fs` (or `-fw`/`-ac`)
    - After discovery, add vhosts to `/etc/hosts` to access them
    - Use VHost fuzzing when: no DNS entries exist, shared hosting, internal apps, dev/staging environments
    - Always do **both** subdomain AND vhost fuzzing for complete coverage

---

➡️ **Next:** [Parameter Fuzzing — GET](parameter-fuzzing-get.md) — discover hidden query parameters
