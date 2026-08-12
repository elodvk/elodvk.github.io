---
title: "Fingerprinting"
description: "Identifying web technologies, frameworks, server software, and CMS platforms used by a target."
tags:
  - fingerprinting
  - wappalyzer
  - whatweb
  - nmap
  - information-gathering
---

# 🖐️ Fingerprinting

**Fingerprinting** is the process of identifying the specific technologies, software versions, frameworks, and configurations running on a target web server. Knowing that a site runs WordPress 5.8, PHP 7.4, and Apache 2.4.49 immediately narrows the attack surface and allows you to search for known vulnerabilities.

---

## 1️⃣ What Can Be Fingerprinted?

| Layer | Examples |
|-------|----------|
| **Web Server** | Apache, Nginx, IIS, LiteSpeed |
| **Programming Language** | PHP, Python, Java, ASP.NET, Node.js |
| **CMS / Framework** | WordPress, Joomla, Drupal, Django, Laravel, Next.js |
| **JavaScript Libraries** | jQuery, React, Angular, Vue.js |
| **Operating System** | Linux, Windows Server (often inferred from headers or behavior) |
| **WAF (Web Application Firewall)** | Cloudflare, AWS WAF, Akamai, ModSecurity |

---

## 2️⃣ Passive Fingerprinting (No Direct Interaction)

### Wappalyzer (Browser Extension)
Install the [Wappalyzer](https://www.wappalyzer.com/) browser extension. Simply visiting a website will reveal its tech stack in the extension popup.

### BuiltWith
Navigate to https://builtwith.com/ and enter the target URL. It provides a comprehensive technology profile.

### Netcraft
https://sitereport.netcraft.com/ reveals the web server, hosting provider, and site history.

---

## 3️⃣ Active Fingerprinting

### `whatweb`
`whatweb` is a command-line tool that identifies web technologies by analyzing HTTP responses, HTML content, cookies, and headers.
```bash
# Basic scan
whatweb http://example.com

# Aggressive scan (makes additional requests for deeper identification)
whatweb -a 3 http://example.com

# Scan multiple targets
whatweb -i targets.txt
```

### `httpx` (from ProjectDiscovery)
A fast HTTP toolkit that probes and extracts metadata from web servers:
```bash
echo "example.com" | httpx -title -tech-detect -status-code -follow-redirects
```

### Nmap HTTP Scripts
```bash
# Identify web server and application
nmap -p 80,443 -sV --script http-headers,http-server-header,http-title <target>
```

---

## 4️⃣ Banner Grabbing (HTTP Headers)

HTTP response headers often leak valuable information about the server.

```bash
# Using curl to inspect response headers
curl -I http://example.com
```

**Headers to look for:**

| Header | Example Value | What It Reveals |
|--------|--------------|-----------------|
| `Server` | `Apache/2.4.49 (Ubuntu)` | Web server software and version. |
| `X-Powered-By` | `PHP/7.4.3` | Backend language and version. |
| `X-AspNet-Version` | `4.0.30319` | ASP.NET runtime version. |
| `X-Generator` | `WordPress 5.8` | CMS and version. |
| `Set-Cookie` | `PHPSESSID=...` | Indicates PHP is used. `JSESSIONID` indicates Java. `ASP.NET_SessionId` indicates .NET. |

!!! tip
    Even if the `Server` header is hidden or generic (e.g., `Server: cloudflare`), other headers, cookies, and HTML content can still reveal the underlying stack.

---

## 5️⃣ CMS-Specific Fingerprinting

### WordPress
```bash
# WPScan — the standard tool for WordPress enumeration
wpscan --url http://example.com --enumerate vp,vt,u
```
- `vp`: Vulnerable plugins.
- `vt`: Vulnerable themes.
- `u`: Usernames.

Also check:
- `/wp-login.php`, `/wp-admin/`, `/wp-content/`, `/wp-includes/` — WordPress default paths.
- `/readme.html` or `/license.txt` — Often contain the WordPress version.

### Joomla
```bash
# JoomScan
joomscan --url http://example.com
```
Check: `/administrator/`, `/configuration.php~`, `/README.txt`.

### Drupal
```bash
# Droopescan
droopescan scan drupal -u http://example.com
```
Check: `/CHANGELOG.txt`, `/core/CHANGELOG.txt`, `/user/login`.

---

## 6️⃣ WAF Detection

Identifying a WAF (Web Application Firewall) is important because it affects your testing approach.

### `wafw00f`
```bash
wafw00f http://example.com
```

### Manual Indicators
- Responses contain headers like `cf-ray` (Cloudflare), `x-sucuri-id` (Sucuri), or `x-cdn` (generic CDN).
- Sending a malicious payload (e.g., `<script>alert(1)</script>`) results in a block page instead of a normal error.
- The server IP resolves to a CDN range rather than the origin server.

---

## 7️⃣ Defensive Recommendations

- **Remove Version Information:** Configure your web server to suppress version numbers from headers (e.g., `ServerTokens Prod` in Apache, `server_tokens off;` in Nginx).
- **Remove `X-Powered-By`:** Strip this header in your application or web server config.
- **Use a WAF/CDN:** Services like Cloudflare hide your origin server's IP and headers.
- **Remove Default Files:** Delete `readme.html`, `CHANGELOG.txt`, `license.txt`, and similar files that reveal CMS versions.

---

!!! warning
    **Active fingerprinting generates HTTP requests to the target and will appear in web server logs. Ensure you have authorization.**
