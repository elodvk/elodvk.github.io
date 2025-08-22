---
title: Finding Alive Domains with Httprobe
sidebar_position: 3
---

You've just run Amass or Assetfinder and you're feeling great. You have a text file with thousands of potential subdomains belonging to your target. But now what? Are they all web servers? Are any of them even online? A huge percentage of subdomains in a large list might be mail servers, SSH gateways, or simply dead DNS records from long-forgotten projects.

Your next challenge is to filter this massive list of names down to a much smaller, more valuable list: the domains that are actually running a live web server. For this job, you need a tool that's fast, simple, and built for the task. You need **Httprobe**.

Think of it like this: You've been given a phone book with every number in the city (your subdomain list). Your job is to find only the numbers that are fax machines. You could dial each one by one and listen, or you could use an automatic dialing machine that instantly tells you which ones made the fax machine handshake sound. Httprobe is that automatic dialing machine for web servers.

---

## What Is It and Why Use It?

Httprobe is another classic Go-based tool from Tom Hudson (tomnomnom). Its purpose is beautifully simple: it takes a list of domains as input, probes them to see if an HTTP (port 80) or HTTPS (port 443) server is listening, and then prints out the ones that are "alive."

**Why is it a core part of the pentesting toolkit?**

* **It's a Filter:** Its primary job is to dramatically reduce the noise from your initial enumeration, allowing you to focus your efforts on actual, running web applications.
* **It's Fast:** It's built to be highly concurrent, meaning it can test thousands of hosts in a very short amount of time.
* **It's Made for Toolchains:** Httprobe is designed to read from standard input and write to standard output. This makes it the perfect "middle-man" tool in a chain of commands.

---

## The Practical Part: The Recon Workflow

Httprobe is almost never used by itself. It's always used as part of a toolchain, typically right after subdomain enumeration.

### **Step 1: Installation**

You can install `Httprobe` with a single command:

```shell
sudo apt install httprobe
```

### Step 2: The Command Chain

The classic workflow is to pipe the output of `assetfinder` or `amass` directly into `httprobe`.

```shell
assetfinder --subs-only elodvk.xyz | httprobe
```

Let's break down this powerful one-liner:

1.  `assetfinder --subs-only example.com` runs and generates a clean list of subdomains, printing each one to standard output.

2. The `|` (pipe) character redirects the output of the first command and uses it as the standard input for the second command.

3. `httprobe` reads each subdomain from its standard input, probes it on ports 80 and 443, and if it finds a live web server, it prints the full URL (including `http://` or `https://`) to its own standard output.

The output will be a clean list of live web servers:

```
https://sso.elodvk.xyz
http://sso.elodvk.xyz
```

### Step 3: Saving Your Results

```shell
# First, save your subdomains to a file
amass enum -passive -d elodvk.xyz -o subs.txt

# Then, feed that file into httprobe and save the live hosts
cat subs.txt | httprobe > alive_hosts.txt
```

## A Note on Its Successor: httpx

While `Httprobe` is a fantastic and reliable tool, it's important to note that much of the community has moved towards its more powerful successor, `httpx` from ProjectDiscovery.

`httpx` does everything `Httprobe` does, but adds a ton of extra features, such as:

 - Extracting page titles, status codes, and content lengths.
 - Fingerprinting the web server's technology stack.
 - Taking screenshots of web pages.

For a simple check of what's alive, `Httprobe` is perfect. For a richer set of data in a single step, `httpx` is the modern choice.

## How It Fits into Your Recon Strategy

Httprobe is the critical validation and filtering step in your reconnaissance workflow.

1. **Discover (Amass/Assetfinder)**: Generate a huge list of potential subdomains.
2. **Validate (Httprobe/Httpx)**: Filter that huge list down to a smaller, confirmed list of live web servers.
3. **Analyze (Nmap, Nuclei, Gobuster)**: Take the list of live hosts from Httprobe and perform your in-depth analysis on them, such as port scanning, vulnerability scanning, and directory brute-forcing.

Without this filtering step, you would waste a massive amount of time running slow, intensive scans against thousands of dead hosts. Httprobe ensures your efforts are focused only on targets that matter.