---
title: Finding Subdomains with Assetfinder
sidebar_position: 1
---

Every penetration test or bug bounty hunt begins with one crucial phase: **Reconnaissance**. Before you can attack a target, you have to know what the target *is*. You might be given a single domain, like `example.com`, but the true attack surface is almost always much larger. The organization could have dozens or hundreds of subdomains: `dev.example.com`, `api.example.com`, `vpn.example.com`, `old-portal.example.com`. Finding these is the first step to finding vulnerabilities.

There are many tools for this, but one of the fastest and most popular starting points is **Assetfinder**. It's a simple, lightning-fast Go tool that does one thing and does it well: it finds subdomains by querying public data sources.

Think of it like this: You're a pirate planning to attack a kingdom on an island. You know the main port (`www.example.com`), but Assetfinder is the spyglass you use to scan the entire coastline from a safe distance, revealing all the hidden coves, forgotten docks, and unguarded beaches where you might be able to land.

---

## What Is It and Why Use It?

Assetfinder, written by the legendary Tom Hudson (tomnomnom), is a tool that grabs subdomains associated with a given domain. It finds both subdomains (like `sub.example.com`) and domains that are subdomains of the target (like `example.com.anotherdomain.com`).

**Why is it a pentester's first choice?**

* **It's Passive:** Assetfinder sends **zero packets** to the target's infrastructure. It doesn't perform DNS lookups against their servers or scan their IPs. It gets all of its information from publicly available third-party sources. This makes it completely invisible to the target.
* **It's Blazing Fast:** Because it's only querying external APIs, it can return a huge list of potential subdomains in seconds.
* **It's Simple and Chainable:** It's designed to produce a clean, simple list of domains that can be piped directly into other tools, forming the foundation of a powerful reconnaissance toolchain.

---

## How It Works: Scouring Public Records

Assetfinder works by querying various public data sources where domain information is aggregated. The primary source is **Certificate Transparency (CT) Logs**.

Whenever a company wants an SSL/TLS certificate for a subdomain (e.g., `portal.example.com`), the Certificate Authority (CA) that issues the certificate must log this issuance in a public, auditable log. Assetfinder scours these massive logs for any certificate ever issued to a subdomain of your target. It's like finding a list of all the official addresses the king has ever sent a letter to.

---

## The Practical Part: Installation & Commands

### **Step 1: Installation**

Since Assetfinder is written in Go, installation is simple if you have Go installed and configured.

```bash
go install [github.com/tomnomnom/assetfinder@latest](https://github.com/tomnomnom/assetfinder@latest)
```

This will download, compile, and place the `assetfinder` binary in your Go bin directory.

### Step 2: Basic Usage

The simplest way to run it is to just give it a domain.


```shell
assetfinder elodvk.xyz
```

This will spit out a list of all related domains it finds. However, for a cleaner output that's perfect for building a target list, you should use the `--subs-only` flag.

```shell
assetfinder -subs-only elodvk.xyz
```

The output will be a clean, alphabetized list of unique subdomains, one per line:

```
elodvk.xyz
elodvk.xyz
sso.elodvk.xyz
elodvk.xyz
www.elodvk.xyz
```

### Step 3: Chaining with Other Tools

The real power comes from using Assetfinder as the first link in a chain. A common workflow is to pipe its output directly into a tool like `httpx` to see which of the found subdomains are running live web servers.

```shell
assetfinder --subs-only example.com | httpx -title -tech-detect -status-code
```

 - `assetfinder` finds the subdomains.
 - The `|` (pipe) sends that list as input to the next command.
 - `httpx` takes each subdomain, probes it for HTTP/S services, and then reports back the web page title, the technologies it detected, and the HTTP status code.

This simple one-liner turns a raw list of names into an actionable list of live web applications to investigate further.

## How It Fits into Your Recon Strategy

Assetfinder is the first-pass, broad-stroke tool in your reconnaissance toolkit.

 - **Dover**: Use Assetfinder to quickly generate a large, initial list of potential assets.

 - **Filter & Probe**: Pipe the results into tools like httpx to identify live web servers or dnsx to resolve the domains.

 - **Deep Scan**: Take the list of live hosts and perform deeper analysis, such as port scanning with nmap, vulnerability scanning, or directory brute-forcing.

It's the tool that builds the foundation of your entire attack plan, providing the initial list of doors to knock on.