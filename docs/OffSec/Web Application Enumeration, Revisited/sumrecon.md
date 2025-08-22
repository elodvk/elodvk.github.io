---
title: Automating Recon with sumrecon 🤖
sidebar_position: 5
---

You've learned the reconnaissance workflow: you run `assetfinder`, pipe it to `httpx`, save the output, then feed that into `gowitness` and `nmap`. While this toolchain is powerful, running each step manually is repetitive and time-consuming. On a real engagement, you want to spend your brainpower on finding vulnerabilities, not on babysitting your terminal.

This is where automation comes in. Tools like **`sumrecon`** are designed to act as a wrapper, or a "master script," that automates this entire reconnaissance chain for you. You give it a single domain, and it runs a whole suite of best-in-class tools in the correct sequence, saving all the results in a neat, organized folder.

Think of it like this: You can build a car by hand using a wrench, then a welder, then a screwdriver (the manual toolchain). Or, you can press a button that starts a factory assembly line that does all those steps for you in the right order. `sumrecon` is that assembly line for reconnaissance.

---

### ## What Is It and Why Use It?

`sumrecon` is a Bash script created by "Gr1mmie" that automates the process of subdomain enumeration and initial vulnerability scanning. It's not a standalone tool but rather an orchestrator that calls upon many of the tools we've already discussed.

**Why use an automation script like this?**

* **Efficiency:** It turns a multi-hour, multi-step manual process into a single command. You can kick off a scan, go grab a coffee, and come back to a folder full of results.
* **Comprehensiveness:** It ensures you don't forget a step. By running a standardized workflow, it combines the power of tools like Amass, Httpx, Nmap, and GoWitness to build a rich picture of the target.
* **Organization:** One of its best features is that it creates a structured directory for your target, with subdirectories for the output of each tool (`nmap_scans`, `screenshots`, `subdomains`, etc.). This keeps your engagement data clean and easy to navigate.

---

### ## The Practical Part: Installation & Usage

#### **Step 1: Installation**

The installation process involves cloning the GitHub repository and running the installer script, which will check for and help you install all the necessary dependencies.

```bash
# 1. Clone the repository
git clone [https://github.com/Gr1mmie/sumrecon.git](https://github.com/Gr1mmie/sumrecon.git)

# 2. Navigate into the directory
cd sumrecon

# 3. Run the installer to check for dependencies
./installer.sh
```

The installer will tell you which tools you're missing (like amass, gowitness, httpx, etc.) and you'll need to install them.

### Step 2: Running the Scan

Once everything is installed, running sumrecon is incredibly simple. You just need to provide it with a target domain.

```shell
./sumrecon.sh -d example.com
```
The script will then kick off its automated process, showing you the output of each tool as it runs.

## What It Does Under the Hood: The Assembly Line

When you run sumrecon, it performs a classic reconnaissance workflow automatically:

1. **Subdomain Enumeration**: It starts by finding as many subdomains as possible using tools like Assetfinder and Amass.

2. **Filtering for Live Hosts**: It takes the massive list of subdomains and pipes it into Httpx (or a similar tool) to find out which ones are running live web servers.

3. **Port Scanning**: It then uses `Nmap` on the list of live hosts to perform a thorough port scan, identifying all open ports and running services.

4. **Visual Reconnaissance**: It feeds the list of live web applications into GoWitness to take screenshots of their homepages, allowing for quick visual triage.

5. **Vulnerability Scanning**: It often includes a step to run Nuclei, a fast vulnerability scanner, against the live web hosts using a community-curated set of templates to find low-hanging fruit.

6. **Directory Discovery**: It may use a tool like Gobuster or Feroxbuster to search for hidden files and directories on the discovered web servers.

## How It Fits into Your Strategy

Automation scripts like sumrecon are a massive force multiplier for a penetration tester.

 - **It's for Broad-Stroke Recon**: You use it at the very beginning of an engagement to perform a wide, comprehensive scan of your target's external perimeter.

 - **It Frees Up Your Time**: While the script is running, you can focus on other aspects of the engagement, like background research on the company or manual testing of the main web application.

 - **It Provides a Starting Point for Manual Testing**: The goal of the script is not to find every single vulnerability. Its goal is to produce a rich set of data (open ports, live websites, potential vulnerabilities) that you, the human pentester, can then analyze to decide where to focus your manual exploitation efforts.

While it's crucial to know how to use each tool individually, mastering an automation script like `sumrecon` is what allows you to work efficiently and scale your reconnaissance efforts.