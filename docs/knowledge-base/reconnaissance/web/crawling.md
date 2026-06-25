---
title: "Crawling"
description: "Methodically traversing a website to map out its structure, endpoints, parameters, robots.txt, and .well-known URIs."
tags:
  - crawling
  - spidering
  - robots.txt
  - well-known
  - scrapy
  - information-gathering
icon: material/spider
---

# 🕷️ Crawling

**Web crawling** (or spidering) is the process of systematically browsing a website by following links, submitting forms, and extracting resources to build a comprehensive map of the application's structure. This reveals hidden pages, API endpoints, parameters, and files that aren't visible from the homepage alone.

---

## 1️⃣ `robots.txt`

The `robots.txt` file is placed at the root of a website (e.g., `http://example.com/robots.txt`) to instruct search engine crawlers which paths they should or should not index.

### Why Pentesters Love `robots.txt`
Ironically, the paths listed under `Disallow` are often the **most interesting** from a security perspective. Site administrators use `robots.txt` to hide sensitive directories from search engines — but anyone can read the file directly.

### Checking `robots.txt`
```bash
curl http://example.com/robots.txt
```

**Example Output:**
```text
User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /config/
Disallow: /private/
Disallow: /api/v1/internal/
Sitemap: http://example.com/sitemap.xml
```

!!! tip
    Always check `robots.txt` first. It's a free roadmap to potentially sensitive areas. Also check the `Sitemap` directive — it provides a structured list of all pages the site wants indexed.

---

## 2️⃣ `.well-known` URIs

The `.well-known` directory is a standardized location (defined by RFC 8615) for hosting metadata about a website or domain.

### Common `.well-known` Paths

| Path | Description |
|------|-------------|
| `/.well-known/security.txt` | Security contact information and vulnerability disclosure policy. |
| `/.well-known/openid-configuration` | OpenID Connect discovery endpoint (reveals auth server details). |
| `/.well-known/apple-app-site-association` | iOS app linking configuration. |
| `/.well-known/assetlinks.json` | Android app linking configuration. |
| `/.well-known/change-password` | Redirect to the password change page (used by password managers). |
| `/.well-known/jwks.json` | JSON Web Key Set for JWT verification. |

### Checking `.well-known`
```bash
curl http://example.com/.well-known/security.txt
curl http://example.com/.well-known/openid-configuration
```

!!! concept
    The `security.txt` file (proposed by https://securitytxt.org/) is particularly useful. It may contain a PGP key, preferred contact method, and a vulnerability disclosure policy — important context before reporting findings.

---

## 3️⃣ Sitemaps

A `sitemap.xml` (or `sitemap_index.xml`) provides a structured list of all URLs a website wants indexed by search engines.

```bash
curl http://example.com/sitemap.xml
```

Sitemaps can reveal:
- Pages not linked from the main navigation.
- API endpoints or documentation pages.
- Content in multiple languages or regions.

---

## 4️⃣ Automated Crawling Tools

### `Scrapy` (Python Framework)
Scrapy is a powerful, extensible web crawling framework.
```bash
# Install scrapy
pip install scrapy

# Quick crawl with the built-in shell
scrapy shell http://example.com
```

### `hakrawler`
A fast, lightweight web crawler designed for security researchers:
```bash
echo "http://example.com" | hakrawler -d 3 -subs
```
- `-d 3`: Crawl depth of 3 levels.
- `-subs`: Include subdomains found during crawling.

### `katana` (by ProjectDiscovery)
A next-generation web crawling and spidering framework:
```bash
katana -u http://example.com -d 5 -jc -kf -o crawl_results.txt
```
- `-d 5`: Crawl depth.
- `-jc`: Enable JavaScript crawling (headless browser).
- `-kf`: Display form fields found.

### `gospider`
```bash
gospider -s http://example.com -d 3 -o output_dir
```

### Burp Suite Spider
If you're already using Burp Suite, the built-in spider (now called "Crawler" in Burp Suite Professional) is highly effective:
1. Set the target scope.
2. Right-click the target → **Scan** → choose **Crawl**.
3. Review discovered content in the **Site map** tab.

---

## 5️⃣ What to Extract During Crawling

| Data | Why It Matters |
|------|----------------|
| **URLs and Endpoints** | Full list of accessible pages and API routes. |
| **Forms and Parameters** | Input fields are potential injection points (SQLi, XSS, etc.). |
| **JavaScript Files** | Often contain API keys, internal endpoints, or hardcoded secrets. |
| **Comments in HTML** | Developers sometimes leave TODO notes, credentials, or debug info in HTML comments. |
| **Email Addresses** | Found in contact pages, metadata, or JavaScript — useful for phishing or OSINT. |
| **File Extensions** | `.php`, `.asp`, `.jsp`, `.bak`, `.old`, `.swp` — reveal the tech stack and potentially backup files. |

### Extracting JavaScript Endpoints
```bash
# Use a tool like LinkFinder to extract endpoints from JS files
python3 linkfinder.py -i http://example.com/static/app.js -o cli
```

---

## 6️⃣ Defensive Recommendations

- **Review `robots.txt`:** Don't rely on `robots.txt` for security. It's publicly readable. Use proper access controls (authentication, authorization) instead.
- **Rate Limit Crawlers:** Implement rate limiting to slow down automated crawlers.
- **Monitor for Automated Traffic:** Detect and block known crawler user agents and rapid request patterns.
- **Minimize Information Leakage:** Remove HTML comments, debug endpoints, and unnecessary files from production servers.

---

!!! warning
    **Aggressive crawling can overload a target's web server and may trigger WAF rules or rate limiting. Always configure a reasonable crawl speed and depth, and ensure you have authorization.**
