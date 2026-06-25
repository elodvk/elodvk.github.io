---
title: "Web Archives"
description: "Leveraging the Wayback Machine and other web archive services to discover historical content, old endpoints, and leaked secrets."
tags:
  - wayback
  - web-archive
  - osint
  - passive-recon
  - information-gathering
icon: material/web
---

# 🕰️ Web Archives

Web archiving services like the **Wayback Machine** periodically snapshot and store copies of websites. These archives can reveal content that has since been removed — old pages, deprecated API endpoints, leaked credentials, source code comments, and forgotten subdomains. This is a purely passive reconnaissance technique.

---

## 1️⃣ The Wayback Machine

The **Wayback Machine** (https://web.archive.org/) is operated by the Internet Archive and contains billions of web pages archived since 1996.

### Browsing Manually
1. Navigate to https://web.archive.org/
2. Enter the target URL (e.g., `example.com`).
3. Browse the calendar to view snapshots from different dates.

### What to Look For

| Content | Why It Matters |
|---------|----------------|
| Old login pages | May reveal legacy authentication systems or forgotten admin panels. |
| Removed pages | Content removed for security reasons (e.g., exposed config files, debug pages). |
| Old JavaScript files | May contain hardcoded API keys, internal endpoints, or debug flags. |
| Previous site structure | Reveals how the application evolved — old paths may still work. |
| Staff pages / contact info | Employee names and emails useful for OSINT and social engineering. |
| Technology changes | Seeing that a site migrated from PHP to Node.js helps narrow your testing approach. |

---

## 2️⃣ Wayback Machine CLI Tools

### `waybackurls` (by tomnomnom)
Extracts all URLs that the Wayback Machine has indexed for a given domain:
```bash
# Install
go install github.com/tomnomnom/waybackurls@latest

# Usage
echo "example.com" | waybackurls > wayback_urls.txt
```

This can return thousands of URLs, including:
- Old API endpoints (`/api/v1/users`).
- Backup files (`/backup.zip`, `/db_dump.sql`).
- Admin panels (`/admin/`, `/dashboard/`).
- Files with interesting extensions (`.env`, `.bak`, `.conf`).

### Filtering Results
```bash
# Find only JavaScript files (may contain secrets)
cat wayback_urls.txt | grep "\.js$" | sort -u

# Find potential config/backup files
cat wayback_urls.txt | grep -iE "\.(env|bak|sql|conf|old|zip|tar|gz)$" | sort -u

# Find API endpoints
cat wayback_urls.txt | grep -i "/api/" | sort -u
```

---

## 3️⃣ Other Web Archive Services

| Service | URL | Notes |
|---------|-----|-------|
| **Wayback Machine** | https://web.archive.org/ | The largest and most well-known archive. |
| **Archive.today** | https://archive.ph/ | Focuses on preserving individual pages on demand. |
| **Google Cache** | `cache:example.com` in Google search | Shows Google's most recent cached version of a page. |
| **CachedView** | https://cachedview.nl/ | Aggregates cached versions from multiple sources. |
| **CommonCrawl** | https://commoncrawl.org/ | A massive open dataset of web crawl data (petabytes). |

---

## 4️⃣ Checking If Removed Content Still Exists

A URL found in the Wayback Machine might still be live on the target server, even if it's been removed from the site's navigation.

```bash
# Check each wayback URL against the live site
cat wayback_urls.txt | httpx -status-code -content-length -title -o live_urls.txt
```

!!! tip
    Many organizations "remove" pages by delinking them from navigation but forget to actually delete the files from the server. `waybackurls` + `httpx` is a powerful combo for finding these orphaned pages.

---

## 5️⃣ Wayback Machine Diffing

Compare two snapshots of the same page to see what changed:
1. Open two different snapshots of the same URL in the Wayback Machine.
2. Use the built-in "Changes" feature (calendar view → click on a date → compare).

This can reveal:
- Security patches that were applied (which imply a vulnerability existed before).
- Content that was removed for legal or security reasons.
- Changes to JavaScript files that may indicate new features or fixed bugs.

---

## 6️⃣ Defensive Recommendations

- **Request Removal:** If sensitive content appears in the Wayback Machine, submit an exclusion request at https://web.archive.org/web/removals.html
- **Use `robots.txt`:** Add `User-agent: ia_archiver Disallow: /` to prevent future archiving by the Internet Archive.
- **Rotate Secrets:** If API keys, credentials, or tokens were ever exposed publicly (even briefly), assume they are compromised and rotate them immediately.
- **Audit Before Removing:** When decommissioning pages, actually delete the files from the server — don't just remove the navigation links.

---

!!! warning
    **Viewing archived content is completely passive and legal. However, using discovered credentials, API keys, or endpoints to access live systems without authorization is illegal.**
