---
title: Screenshotting Websites with GoWitness 📸
sidebar_position: 4
---

You've run your enumeration tools like Amass and filtered for live web servers with Httpx. You're now staring at a text file with hundreds, maybe even thousands, of URLs. The problem is, you have no idea what these sites are. Which ones are important login portals for corporate apps? Which are default Apache "It works!" pages? And which are forgotten, vulnerable applications from 2012?

Manually visiting every single URL would take days. You need a way to quickly triage this massive list to find the interesting targets. This is where you bring in a visual reconnaissance tool like **GoWitness**.

GoWitness automates the tedious process of visiting each URL and taking a screenshot. It then presents you with a clean HTML report, allowing you to visually scan hundreds of websites in minutes to find the ones that deserve a closer look. Think of it as sending up a fleet of drones to take a picture of every building in a city. Instead of reading boring address lists, you can just look at the pictures to find the banks, military bases, and power stations.

---

## What Is It and Why Use It?

GoWitness is a Go-based tool designed to capture screenshots of web pages from a provided list of URLs. It's a simple concept with a powerful impact on the reconnaissance phase.

**Why is it an essential tool?**

* **Visual Triage:** Its entire purpose is to help you prioritize targets. A screenshot of a custom login portal for "CorpVPN" is infinitely more interesting than a default IIS landing page.
* **Speed and Concurrency:** It's written in Go and is designed to process a large number of URLs in parallel, saving you an enormous amount of time.
* **Accurate Rendering:** GoWitness uses a headless Chrome browser in the background. This means it renders pages just as a real user would, including executing JavaScript. This is crucial for modern, single-page applications where the content is loaded dynamically.
* **Simple Reporting:** It generates a straightforward HTML report that puts all the visual information in one place for easy review.

---

## The Practical Part: Installation & Commands

### **Step 1: Installation**

If you have Go installed and configured, you can install GoWitness with a single command:

```go
go install github.com/sensepost/gowitness@latest
```

### Step 2: The Core Workflow

GoWitness fits perfectly into the reconnaissance toolchain we've been building. The best way to use it is to pipe the list of live URLs from a tool like Httpx directly into it.

```shell
# This command chain finds subdomains, filters for live web servers, and then screenshots them.
amass enum -passive -d example.com | httpx -silent | gowitness file -f - --destination gowitness_report
```

### Step 2: The Core Workflow

GoWitness fits perfectly into the reconnaissance toolchain we've been building. The best way to use it is to pipe the list of live URLs from a tool like Httpx directly into it.

```shell
# This command chain finds subdomains, filters for live web servers, and then screenshots them.
amass enum -passive -d example.com | httpx -silent | gowitness file -f - --destination gowitness_report
```

Let's break down that powerful one-liner:

1. `amass enum -passive -d example.com` finds the subdomains.
2. `httpx -silent` probes them for live web servers and outputs only the URLs (e.g.,`https://www.example.com`).
3. The `|` (pipe) sends this list of live URLs to GoWitness's standard input.
4. `gowitness file -f -` tells GoWitness to get its list of URLs from a file (-f), and the special dash (-) tells it to read from standard input instead of a physical file.
5. `--destination gowitness_report` tells GoWitness where to save the report and screenshots.


### Step 3: Reviewing the Report

After the command finishes, you will have a new directory named `gowitness_report`. Inside, you'll find:

 - `report.html`: The main report file.
 - A `screenshots` folder containing all the captured PNG images.

Open `report.html` in your browser. You'll see a table with the URL, the server's response headers, and a screenshot of the page. Scroll through this report and look for anything that stands out:

 - Login portals (for webmail, VPNs, custom apps)
 - Outdated software pages (old Jenkins, Tomcat, JBoss)
 - Directory listings
 - Error messages that leak technology versions or file paths
 - Internal dashboards or wikis

 ---

## How It Fits into Your Recon Strategy

GoWitness is the target prioritization step of your reconnaissance workflow.

1. **Discover (Amass/Assetfinder)**: Generate a huge list of potential subdomains.
2. **Validate (Httprobe/Httpx)**: Filter that list down to a confirmed list of live web servers.
3. **Prioritize (GoWitness)**: Take screenshots of the live web servers to visually identify the most promising targets.
4. **Analyze (Nmap, Nuclei, Gobuster)**: Take the small list of interesting targets you identified with GoWitness and perform deep, time-consuming vulnerability analysis on them.

Without GoWitness, you'd be flying blind, wasting hours scanning uninteresting or low-value websites. It ensures that your more intensive efforts are focused where they'll have the most impact.