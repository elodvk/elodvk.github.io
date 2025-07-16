---
title: Finding Subdomains with Amass
sidebar_position: 2
---

You've run a quick scan with Assetfinder and have a decent list of subdomains. But you have that nagging feeling... what if there's more? What if there's a forgotten development server, an old UAT portal, or a misconfigured API gateway that the simple tools missed? When you need to be absolutely certain you've mapped an organization's entire external footprint, you bring out the heavy artillery: **OWASP Amass**.

Amass is the undisputed king of subdomain enumeration and external asset discovery. It's a deeply complex and powerful tool that queries an enormous number of data sources to build the most comprehensive picture possible of your target's presence on the internet.

Think of it this way: If Assetfinder is a spyglass for scanning the coastline, Amass is a full-blown satellite reconnaissance network, combined with on-the-ground spies, historical map analysis, and active drone surveillance. It's slower, but the intelligence it gathers is second to none.

---

## What Is It and Why Use It?

The OWASP Amass Project is a Go-based tool designed for in-depth network mapping. Its primary function is to discover subdomains, but it also uncovers ASNs, IP addresses, and other related infrastructure.

**Why is Amass the industry standard?**

* **Massive Data Sources:** Its single greatest strength is the sheer number of places it looks for information. It queries dozens of sources, including public DNS records, Certificate Transparency logs, numerous third-party APIs (like Shodan, VirusTotal, SecurityTrails), web archives, and much more.
* **Passive and Active Modes:** Amass can operate in two distinct modes:
    1.  **Passive (`-passive`):** Like Assetfinder, this mode only queries third-party data sources. It sends zero packets to the target's infrastructure, making it completely stealthy.
    2.  **Active (Default):** This mode goes further. After the passive scan, it will actively try to resolve found domains, perform DNS zone transfers, scrape SSL/TLS certificates, and even brute-force subdomains using a wordlist. This is far more thorough but also "noisy" and visible to the target.
* **The Graph Database:** Amass can store its findings in its own graph database, allowing you to visually explore the relationships between different assets (domains, IPs, etc.), much like BloodHound does for Active Directory.

---

## The Practical Part: Installation & Commands

### **Step 1: Installation**

Amass is written in Go, so installation is straightforward if you have Go configured.

```bash
go install -v [github.com/owasp-amass/amass/v4/...@master](https://github.com/owasp-amass/amass/v4/...@master)
```

### Step 2: The Passive Scan (The Stealthy Start)

You should always start with a passive scan. It's fast (relative to active scans) and gives you a huge amount of information without alerting the target.

```shell
amass enum -passive -d elodvk.xyz -o found_subdomains.txt
```

 - `enum`: The subcommand for performing an enumeration.
 - `-passive`: Puts Amass in passive mode.
 - `-d elodvk.xyz`: Specifies the target domain.
 - `-o found_subdomains.txt`: Saves the output to a file.

### Step 3: The Active Scan (The Deep Dive)

Once your passive scan is complete, and if the rules of engagement permit, you can perform an active scan to find even more.

```shell
amass enum -active -d elodvk.xyz -brute -w /path/to/deepmagic.com-prefixes-top50000.txt -o found_subdomains_active.txt
```

 - `-active`: Enables active methods like DNS lookups and certificate scraping.
 - `-brute`: Enables DNS brute-forcing.
 - `-w ...:` Specifies a wordlist to use for the brute-force attack. A good wordlist is key to finding non-public subdomains.

 ## The Pro Move: API Keys

To unlock the full power of Amass's passive enumeration, you need to provide it with API keys for the dozens of services it can query. You do this by creating a configuration file (`~/.config/amass/config.ini`) and adding your keys.

```
[api_keys]
virustotal = your_virustotal_api_key_here
securitytrails = your_securitytrails_api_key_here
...
```

With API keys configured, a passive Amass scan becomes exponentially more powerful.

---

## How It Fits into Your Recon Strategy

 - **Amass is for deep, thorough reconnaissance**. It's the tool you use when you want to be as certain as possible that you haven't missed any external assets.

**Passive First, Active Later**: The standard workflow is to run a full passive scan with API keys first. Analyze those results, and then, if necessary, launch a more targeted active scan to probe for more elusive targets.

**The Source of Truth**: The output from a comprehensive Amass scan becomes the definitive scope for the rest of your external penetration test. This list of subdomains is what you will feed into your port scanners, web scanners, and vulnerability analysis tools.

While simpler tools can give you a quick glimpse, Amass is what you use when you want to see everything.