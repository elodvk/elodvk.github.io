---
title: 'HTB [Machine Name] Walkthrough'
description: 'A comprehensive guide to compromising the [Machine Name] machine on Hack The Box.'
date: YYYY-MM-DD
difficulty: [Easy/Medium/Hard/Insane]
os: [Linux/Windows/FreeBSD]
authors:
  name: Bilash J. Shahi
  title: Cybersecurity Professional
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - Hack The Box
  - HTB
  - [Difficulty]
  - [OS]
  - Walkthrough
image: assets/[MachineName]/[MachineName]_banner.png
---

# 🛡️ HTB [Machine Name] Walkthrough

## 1. Machine Overview

**Attack Chain Summary:** [1-2 sentence high-level view of how you broke in and escalated privileges.]

| Attribute | Details |
| :--- | :--- |
| **Machine Name** | [Name] |
| **Operating System** | [OS] |
| **Difficulty** | [Difficulty] |
| **IP Address** | 10.129.x.x |

---

## 2. Reconnaissance & Enumeration
[Document all information gathering so the reader understands what services are active and why they are vulnerable.]

### Port Scanning
[Show your exact nmap commands and output (e.g., -sC -sV)]

### Service Identification
[Detail what is running on the open ports (e.g., HTTP on port 80, SMB on port 445)]

### Web Footprinting
[Note any directories, hidden files, or virtual hosts discovered using tools like Gobuster or Feroxbuster.]

---

## 3. Initial Foothold
[Walk through the specific vulnerability that got you your first user shell.]

### The Vulnerability
[Explain why the attack vector works (e.g., LFI, Insecure File Upload, SQLi)]

### Exploitation
[Provide the exact payload, script, or command used to gain access. Pair every major command with a screenshot of the output to prove that the steps work.]

### Stabilization
[Briefly mention upgrading your shell (e.g., using a Python TTY trick)]

### User Flag
[Document the command used to read the user.txt flag]

---

## 4. Privilege Escalation
[Detail how you went from a standard user to the root or Administrator user.]

### Enumeration for PrivEsc
[Mention tools used to inspect the system, such as LinPEAS or WinPEAS]

### The Misconfiguration
[Identify the vulnerability (e.g., misconfigured sudo rights, vulnerable service binaries, weak registry permissions)]

### Exploitation
[Show the commands executed to escalate privileges]

### Root Flag
[Note the exact command used to read the root.txt flag]

---

## 5. Conclusion & Takeaways

### Vulnerability Remediation
[Provide a brief explanation of how to patch or fix the vulnerabilities you exploited]

### Key Lessons
[What did you learn? What new tools or techniques were added to your toolkit?]
