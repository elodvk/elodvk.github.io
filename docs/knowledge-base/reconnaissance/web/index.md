---
title: "Information Gathering - Web Edition"
description: "Overview of web-focused information gathering techniques including WHOIS, DNS, fingerprinting, crawling, and automated reconnaissance."
tags:
  - information-gathering
  - web
  - recon
  - osint
  - enumeration
icon: material/web-search
---

# 🌍 Information Gathering - Web Edition

Information gathering is the first and most critical phase of any web application penetration test. Unlike network-level footprinting (which targets ports and services), web-focused reconnaissance aims to map out the **attack surface** of web applications — their domains, subdomains, technologies, hidden directories, and historical content.

This section is broken down into the following areas:

---

## Scope & Objectives

Before gathering any information, it's important to understand the **two types** of reconnaissance:

### Passive Reconnaissance
Gathering information **without directly interacting** with the target system. Examples include WHOIS lookups, search engine queries, and reviewing cached web pages. The target has no way of knowing you are collecting data.

### Active Reconnaissance
Gathering information by **directly interacting** with the target. Examples include port scanning, subdomain brute-forcing, and web crawling. The target's logs will record your IP address and requests.

!!! tip
    Always start with passive recon. It's stealthier, and you might find everything you need without ever touching the target directly.

---

## Topics Covered

| Topic | Description |
|-------|-------------|
| [WHOIS](whois.md) | Querying domain registration data to uncover ownership, registrar, name servers, and contact details. |
| [Digging DNS](digging-dns.md) | Manual and automated DNS record enumeration using `dig`, `nslookup`, and `host`. |
| [Subdomain Bruteforcing](subdomain-bruteforcing.md) | Discovering hidden subdomains using wordlists and tools like `gobuster`, `ffuf`, and `subfinder`. |
| [DNS Zone Transfers](dns-zone-transfers.md) | Exploiting misconfigured DNS servers to dump entire zone files via AXFR. |
| [Virtual Hosts](virtual-hosts.md) | Discovering additional websites hosted on the same IP address using virtual host enumeration. |
| [Fingerprinting](fingerprinting.md) | Identifying web technologies, frameworks, server versions, and CMS platforms. |
| [Crawling](crawling.md) | Methodically traversing a website to map out its structure, endpoints, and parameters. |
| [Search Engine Discovery](search-engine-discovery.md) | Using Google Dorks and other search engines to find exposed sensitive data. |
| [Web Archives](web-archives.md) | Leveraging the Wayback Machine and other archives to find old content, endpoints, and secrets. |
| [Automating Recon](automating-recon.md) | Chaining tools together with frameworks like `Amass`, `recon-ng`, and custom scripts. |

---

!!! warning
    **All techniques described in this section should only be performed against systems you own or have explicit written authorization to test. Unauthorized reconnaissance may violate laws and regulations.**
