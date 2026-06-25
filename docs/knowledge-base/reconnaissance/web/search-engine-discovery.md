---
title: "Search Engine Discovery"
description: "Using Google Dorks and other search engines to passively discover exposed sensitive data, files, and misconfigurations."
tags:
  - google-dorks
  - osint
  - passive-recon
  - search-engine
  - information-gathering
icon: material/google
---

# 🔍 Search Engine Discovery

Search engines like Google, Bing, and DuckDuckGo continuously crawl and index the web. By crafting specific search queries (known as **Google Dorks**), you can leverage their massive indexes to find exposed files, login pages, configuration files, and other sensitive data belonging to a target — all without sending a single request to the target's server.

---

## 1️⃣ Google Dorking Fundamentals

Google supports advanced search operators that refine results. Combining these operators creates **dorks** — precise queries that surface specific types of content.

### Key Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `site:` | Restrict results to a specific domain. | `site:example.com` |
| `inurl:` | Find pages with a specific string in the URL. | `inurl:admin site:example.com` |
| `intitle:` | Find pages with a specific string in the title. | `intitle:"index of" site:example.com` |
| `filetype:` | Find specific file types. | `filetype:pdf site:example.com` |
| `ext:` | Same as `filetype:`. | `ext:sql site:example.com` |
| `intext:` | Find pages containing a specific string in the body. | `intext:"password" site:example.com` |
| `cache:` | View Google's cached version of a page. | `cache:example.com` |
| `-` (minus) | Exclude results. | `site:example.com -www` |

---

## 2️⃣ Useful Dorks for Pentesting

### Finding Login Pages
```
site:example.com inurl:login
site:example.com inurl:admin
site:example.com intitle:"login" OR intitle:"sign in"
```

### Finding Exposed Files
```
site:example.com filetype:pdf
site:example.com filetype:xlsx OR filetype:csv
site:example.com filetype:doc OR filetype:docx
site:example.com filetype:sql
site:example.com filetype:log
site:example.com filetype:env
```

### Finding Configuration Files
```
site:example.com ext:xml OR ext:conf OR ext:cnf OR ext:ini
site:example.com ext:yml OR ext:yaml
site:example.com inurl:".env" OR inurl:"wp-config"
```

### Finding Directory Listings
```
site:example.com intitle:"index of"
site:example.com intitle:"index of" "parent directory"
```

### Finding Exposed Backup Files
```
site:example.com ext:bak OR ext:old OR ext:backup
site:example.com inurl:backup
```

### Finding Error Messages (Information Leakage)
```
site:example.com intext:"sql syntax" OR intext:"mysql_fetch" OR intext:"Warning: "
site:example.com intext:"stack trace" OR intext:"Exception in thread"
```

### Finding Subdomains via Google
```
site:*.example.com -www
```

---

## 3️⃣ Google Hacking Database (GHDB)

The **Google Hacking Database** maintained by Exploit-DB is a curated collection of thousands of dorks organized by category:

🔗 https://www.exploit-db.com/google-hacking-database

Categories include:
- Files containing passwords.
- Sensitive directories.
- Web server detection.
- Vulnerable servers.
- Error messages.

---

## 4️⃣ Beyond Google

### Bing
Bing supports similar operators (`site:`, `inurl:`, `filetype:`, etc.) and sometimes indexes pages that Google doesn't.
```
site:example.com filetype:pdf
```

### DuckDuckGo
DuckDuckGo supports basic operators and is useful for privacy-conscious searches.

### Shodan
Shodan indexes internet-connected devices and services. It's not a traditional search engine but is invaluable for finding exposed web servers, databases, and IoT devices.
```bash
# CLI
shodan search hostname:example.com

# Web: https://www.shodan.io/
```

### Censys
Similar to Shodan, Censys scans the internet and provides detailed information about hosts and certificates.
```
https://search.censys.io/
```

---

## 5️⃣ Automating Google Dorking

### `dorks` (various scripts)
Several tools automate running multiple dorks against a target:

```bash
# Example using a simple bash loop
while read dork; do
  echo "[*] Searching: $dork"
  curl -s "https://www.google.com/search?q=$dork+site:example.com" | grep -oP 'https?://[^\s"<]+'
  sleep 5  # Respect rate limits
done < dorks.txt
```

!!! tip
    Be cautious with automated Google queries. Google will rate-limit or block your IP if you send too many requests. Use delays between queries and consider using the Google Custom Search API for programmatic access.

---

## 6️⃣ Defensive Recommendations

- **Review What's Indexed:** Periodically Google your own domain (`site:yourdomain.com`) to see what's exposed.
- **Use `robots.txt` and `noindex` Tags:** Prevent sensitive pages from being indexed. Use `<meta name="robots" content="noindex, nofollow">` on internal pages.
- **Remove Sensitive Files:** Don't leave `.env`, `.sql`, `.bak`, or configuration files on production servers.
- **Use Google Search Console:** Monitor and manage how Google crawls and indexes your site. Request removal of sensitive cached pages.

---

!!! warning
    **Google Dorking is entirely passive — you never touch the target's servers. However, acting on the information found (e.g., accessing an exposed admin panel) without authorization is illegal.**
