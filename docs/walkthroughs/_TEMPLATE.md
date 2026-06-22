<!--
=============================================================================
  HTB WALKTHROUGH TEMPLATE
=============================================================================
  INSTRUCTIONS:
  1. Copy this file and rename it to <machine_name>.md (e.g., soccer.md).
  2. Replace ALL HTML comments (<!-- ... -->) with your actual content.
  3. Generate a hero banner and save it to:
       assets/<machine_name>/<machine_name>_banner.png
  4. Place ALL screenshots/assets for this machine in:
       assets/<machine_name>/
     Use descriptive filenames (e.g., soccer_nmap_scan.png, soccer_burp_intercept.png).
     NEVER use generic names like image.png, image-1.png, etc.
  5. Write in third-person, objective, professional tone throughout.
  6. Over-explain every step — assume the reader is encountering each tool
     and technique for the first time.
  7. Use tables to present structured data (Nmap results, credentials, etc.).
  8. Pair every major command with its output and, where possible, a screenshot.
     Web browser screenshots MUST include the URL in the title to be automatically framed:
     ![Alt text](assets/<machine>/image.png "http://URL/")
  9. CRITICAL: NEVER fabricate or generate technical data. All command outputs,
     scan results, credentials, hashes, IP addresses, hostnames, and version
     numbers MUST come directly from the user's actual engagement. Only use
     data the user explicitly provides. If data is missing, leave a placeholder
     comment and ask the user.
  10. The 'title' and 'description' frontmatter fields MUST be optimized for
      SEO. Include high-value keywords (machine name, OS, key techniques,
      CVEs) naturally. The description should be 150-160 characters and read
      as a compelling search result snippet.
  11. Delete this instruction block before publishing.
=============================================================================
-->
---
title: 'HTB YOURBOXNAME Walkthrough' # SEO: Include machine name, "HTB", and "Walkthrough" in the title
description: 'A comprehensive, step-by-step walkthrough for the Hack The Box machine YOURBOXNAME.' # SEO: 150-160 chars, include key techniques, CVEs, and OS for search visibility
date: YYYY-MM-DD
difficulty: DIFFICULTY
os: YOUROS
authors:
- name: Bilash J. Shahi
  title: Cybersecurity Professional
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
- Hack The Box
- HTB
- DIFFICULTY
- YOUROS
- Walkthrough
image: assets/YOURBOXNAME/YOURBOXNAME_banner.png
---

# 🛡️ HTB YOURBOXNAME Walkthrough

## Machine Overview

<!-- Write a 2-4 sentence high-level summary of the entire attack chain: how the initial foothold was obtained, how lateral movement occurred (if applicable), and how root/Administrator was achieved. This paragraph should let the reader decide at a glance whether this box covers techniques relevant to them. -->

| Attribute | Details |
| :--- | :--- |
| **Machine Name** | YOURBOXNAME |
| **Operating System** | YOUROS |
| **Difficulty** | DIFFICULTY |
| **IP Address** | 10.129.x.x |

---

## Reconnaissance & Enumeration

<!-- Open with a brief paragraph explaining the goal of this phase: to identify all exposed services, understand the technology stack, and pinpoint potential entry vectors. -->

### Port Scanning

<!-- Explain the Nmap flags used and why (e.g., -sC for default scripts, -sV for version detection, -T4 for speed). -->

```shell title="Nmap Service Scan"
nmap -sC -sV -T4 -oA reports/YOURBOXNAME 10.129.x.x
```

<!-- Paste the raw Nmap output below. Excessive content can be trimmed with ...snip... -->

```text title="Nmap Output"
PORT     STATE SERVICE         VERSION
xx/tcp   open  ssh             OpenSSH x.x
xx/tcp   open  http            nginx x.x
...snip...
```

<!-- Summarize the most notable ports in a table for quick reference. -->

| Port | State | Service | Version | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **xx/tcp** | Open | SSH | OpenSSH x.x | Standard secure shell access. |
| **xx/tcp** | Open | HTTP | nginx/Apache x.x | Web server hosting the primary application. |

### Service Identification & Web Footprinting

<!-- For each notable service discovered above, explain what was found upon manual interaction. If the HTTP server redirects to a hostname, document the /etc/hosts update. If SMB shares are accessible, list them. -->

```shell title="Updating Local DNS"
echo "10.129.x.x  YOURBOXNAME.htb" | sudo tee -a /etc/hosts
```

<!-- If directory brute-forcing was performed, document the tool, wordlist, and results. -->

```shell title="Directory Enumeration"
gobuster dir --url http://YOURBOXNAME.htb/ --wordlist /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -t 40
```

| Discovered Path | HTTP Status | Description |
| :--- | :--- | :--- |
| `/admin/` | 200 | Administrative panel. Warrants further investigation. |

<!-- Include a screenshot of the web application's landing page or login portal. -->

<!-- ![Landing Page](assets/YOURBOXNAME/YOURBOXNAME_landing_page.png "http://YOURBOXNAME.htb/") -->

---

## Initial Foothold

<!-- Open with a brief paragraph summarizing how the reconnaissance findings led to identifying the initial attack vector. Explain why this particular service or application was targeted. -->

### The Vulnerability

<!-- Provide the name and classification of the vulnerability (e.g., CVE-YYYY-XXXXX, Default Credentials, Insecure File Upload, SQL Injection). Explain why the vulnerability exists and what makes it exploitable in this context. Link to external references or advisories where applicable. -->

### Exploitation

<!-- Walk through the exact exploitation steps. Show every command, payload, or script used. Explain what each command does and why it is necessary. Use titled code blocks. -->

```shell title="Executing the Exploit"
# Your exploit command here
```

```text title="Exploit Output"
# Paste the terminal output confirming successful exploitation
```

<!-- Include a screenshot of the successful exploitation output. -->

<!-- ![Exploitation Success](assets/YOURBOXNAME/YOURBOXNAME_exploit_success.png "Confirmed Remote Code Execution") -->

### Reverse Shell & Stabilization

<!-- Document how the initial access was upgraded to a stable, interactive reverse shell. Show the listener setup, the payload, and the connection confirmation. -->

```shell title="Starting Listener"
sudo nc -lvnp 443
```

```shell title="Triggering Reverse Shell"
# Your reverse shell payload here
```

<!-- Recommend shell stabilization techniques (Python PTY, stty raw -echo, rlwrap) and explain why they are important for reliability. -->

### User Flag

<!-- Document the exact command used to retrieve the user flag. If lateral movement to a different user is required before obtaining the flag, document that process in a dedicated subsection before this one. -->

```shell title="Capturing User Flag"
cat /home/USERNAME/user.txt
```

---

## Privilege Escalation

<!-- Open with a brief paragraph explaining the objective: escalating from the current user context to root or Administrator. -->

### Enumeration for PrivEsc

<!-- Document the enumeration methodology used to identify privilege escalation vectors. Mention specific tools (LinPEAS, WinPEAS, sudo -l, find / -perm -4000, etc.) and explain what each one checks for. -->

```shell title="Enumerating Privileges"
sudo -l
# or
find / -perm -4000 -type f 2>/dev/null
```

<!-- Summarize the key findings that point toward an exploitable misconfiguration or vulnerability. -->

### The Misconfiguration

<!-- Clearly identify and explain the vulnerability or misconfiguration that enables privilege escalation. Examples: writable cron jobs, SUID binaries, kernel exploits, misconfigured sudo/doas rules, token impersonation, weak service permissions. Explain WHY this is dangerous, not just that it exists. -->

### Exploitation

<!-- Walk through the exact privilege escalation steps. Show every command and its output. Explain the logic behind each step. -->

```shell title="Escalating Privileges"
# Your privilege escalation commands here
```

```text title="Confirming Root Access"
whoami
root
```

### Root Flag

<!-- Document the exact command used to retrieve the root flag. -->

```shell title="Capturing Root Flag"
cat /root/root.txt
```

---

## Conclusion & Takeaways

### Vulnerability Remediation

<!-- For each vulnerability exploited during the engagement, provide a concrete, actionable remediation recommendation. Structure these as a numbered list. Explain not just what to fix, but why the fix works. -->

1. **Vulnerability Name:** Explanation of how to remediate the issue and why the fix is effective.
2. **Vulnerability Name:** Explanation of how to remediate the issue and why the fix is effective.

### Key Lessons

<!-- Summarize the most important takeaways from this engagement. Focus on transferable skills, novel techniques, or commonly overlooked attack surfaces. These should be written as concise, standalone insights. -->

*   **Lesson Title:** Detailed explanation of the lesson and its broader applicability.
*   **Lesson Title:** Detailed explanation of the lesson and its broader applicability.
