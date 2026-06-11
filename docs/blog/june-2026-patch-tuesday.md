---
title: 'June 2026 Patch Tuesday: A Record-Breaking 206 CVEs, Three Zero-Days & Two BitLocker Bypasses'
date: 2026-06-11
authors:
  name: Bilash J. Shahi
  title: Cybersecurity enthusiast
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - Patch Tuesday
  - Microsoft
  - CVE
  - Windows
  - BitLocker
  - Vulnerability Management
  - Zero-Day
description: 'A deep-dive into June 2026 Patch Tuesday — the largest in Microsoft history, patching 206 CVEs including 3 zero-days, a wormable Windows Kernel RCE (CVSS 9.8), an actively exploited Defender EoP, and two separate BitLocker bypasses (YellowKey & Bitskrieg).'
---

June 9, 2026. Microsoft drops what will be remembered as the **most consequential Patch Tuesday in the program's history** — a staggering **206 CVEs** patched in a single release, shattering all previous monthly records. If that number doesn't raise the hairs on your arms, the contents will: three publicly known zero-days, a near-perfect CVSS 9.8 wormable Windows Kernel vulnerability, an actively exploited Microsoft Defender escalation of privilege, and not one but *two* distinct BitLocker bypass techniques courtesy of a very agitated security researcher.

Let's break it all down, vulnerability by vulnerability.

![June 2026 Patch Tuesday Security Dashboard](../assets/images/blog/patch_tuesday_hero.png)

## By The Numbers: A Historic Month

| Category | Count |
|---|---|
| **Total CVEs Addressed** | **206** |
| **Critical Severity** | **32** |
| **Important Severity** | ~170 |
| **Publicly Disclosed (Zero-Day)** | **3** |
| **Actively Exploited in the Wild** | **1** |
| **Additional Edge/Chromium CVEs** | ~360 |

This release is historic not just for its volume. It marks the first time Microsoft has patched over 200 vulnerabilities in a single month since Patch Tuesday began in **October 2003**. Security teams working patch cadences need to re-evaluate their SLAs — this isn't a normal month.

The breakdown by vulnerability type tells the story of a deeply systemic problem:

- **Elevation of Privilege**: The most common category, representing a large chunk of the total. Attackers love these — they pair with any existing foothold to go from low-privileged user to SYSTEM.
- **Remote Code Execution (RCE)**: Critical RCEs were found in Windows Kernel, SQL Server, Azure Kubernetes Service (AKS), Exchange Server, and Office.
- **Information Disclosure & Spoofing**: Numerous flaws exposing credentials, session tokens, and sensitive data paths.
- **Denial of Service**: Including the particularly nasty HTTP.sys "compression bomb" (more on that below).

---

## The Zero-Days: What You Need to Act On *Today*

Three vulnerabilities were publicly disclosed before patches were available, meaning proof-of-concept (PoC) code or technical details existed in the wild. These must be prioritized above everything else.

---

### 🔴 CVE-2026-41091 — Microsoft Defender EoP | **ACTIVELY EXPLOITED**

> **CVSS Score:** High | **Status:** Added to CISA KEV | **Remediation Deadline (Federal):** June 3, 2026

This is the one that should keep you up at night. An **Elevation of Privilege** flaw in the **Microsoft Malware Protection Engine** — the very component that is supposed to be defending you — was confirmed by CISA as **actively exploited in the wild**.

**How it works:** The flaw is an *improper link resolution before file access* vulnerability (CWE-59), commonly known as a "link following" bug. An authorized local attacker can plant a specially crafted symbolic link in a location that the Malware Protection Engine processes with elevated rights. When Defender scans that path — which it does automatically — it follows the attacker's link and performs a file operation with SYSTEM-level privileges. The attacker then inherits that privilege context, achieving full SYSTEM access.

**Why this is particularly scary:** Defender runs with SYSTEM privileges and performs automatic, periodic scans — you cannot easily predict *when* it will trigger. An attacker who has already obtained low-level code execution (even a standard user shell) can reliably escalate to SYSTEM silently and without any user interaction.

**Fix:** Unlike most Patch Tuesday updates, this one was delivered as an **automatic engine update** rather than a standard Windows Update rollout. Verify your Malware Protection Engine version immediately.

```powershell
# PowerShell — Check Defender Engine Version
Get-MpComputerStatus | Select-Object -Property AMEngineVersion, AMProductVersion
```

You need version **`1.1.26040.8` or later**. If you're seeing `1.1.26030.3008` or older, your endpoints are exposed **right now**. Ensure your managed endpoints are not blocking automatic Defender signature updates.

---

### 🟠 CVE-2026-45585 ("YellowKey") — BitLocker Security Feature Bypass | **PoC Public**

> **CVSS Score:** 6.8 (Medium) | **Status:** PoC Released | **Physical Access Required**

"YellowKey" was born from controversy. A researcher operating as **"Nightmare-Eclipse"** publicly released a fully working proof-of-concept exploit in May 2026, bypassing the standard coordinated disclosure process — a move Microsoft officially criticized. By the time the June patch dropped, the PoC had been widely circulated.

![BitLocker Bypass Visualization](../assets/images/blog/bitlocker_breach.png)

**What it targets:** Windows Recovery Environment (WinRE), specifically a utility called `autofstx.exe`, which processes NTFS transaction logs during recovery operations.

**How it works:** By placing a specially crafted **"FsTx" folder** on a USB drive or in the EFI partition, an attacker can trigger abnormal recovery behavior in WinRE. The crafted structure induces `autofstx.exe` to interpret an injected command sequence, effectively spawning an **unrestricted command shell** with access to the fully decrypted BitLocker volume — entirely bypassing the BitLocker authentication UI.

**Affected systems:**
- Windows 11 (24H2, 25H2, 26H1)
- Windows Server 2025

**Key mitigations (beyond patching):**
1. **Enable TPM + PIN**: A TPM-only configuration provides *no additional protection* against this attack class. A **TPM + PIN** or **TPM + startup key** configuration forces the attacker to know the PIN to complete the boot sequence, significantly raising the bar.
2. **Registry hardening of WinRE**: Remove the `autofstx.exe` entry from the `BootExecute` registry value inside the WinRE image to prevent the vulnerable utility from ever running.
3. **Physical security**: All BitLocker bypass vulnerabilities require physical access. Ensure servers, laptops, and workstations are physically secured.

---

### 🟠 CVE-2026-50507 ("Bitskrieg") — BitLocker Security Feature Bypass | **PoC Public**

> **CVSS Score:** 6.8 (Medium) | **Status:** PoC Released | **Physical Access Required**

Also from "Nightmare-Eclipse" — *yes, the same researcher* — "Bitskrieg" is a companion vulnerability to YellowKey that targets a **different code path** within the BitLocker protection mechanism. The researcher claims to have released both vulnerabilities publicly in response to what they characterized as Microsoft's inadequate handling of prior disclosure attempts.

While both Bitskrieg and YellowKey require physical access and share the same CVSS score, they exploit **distinct protection mechanism failures**, meaning patching one does not protect against the other. Both were addressed in the June 2026 update.

> **Takeaway:** The emergence of two separate, named BitLocker bypass techniques from the same researcher — both with working PoC code — should prompt organizations to audit their BitLocker deployment model comprehensively. TPM-only mode is no longer an acceptable security baseline for high-value endpoints.

---

## Critical Highlights: The Non-Zero-Day Disasters

The three zero-days grab headlines, but some of the most dangerous vulnerabilities this month weren't publicly known before the patch.

---

### 🔴 CVE-2026-45657 — Windows Kernel RCE | CVSS 9.8 | "Potentially Wormable"

> **CVSS Score:** 9.8 (Critical) | **Attack Vector:** Network | **Authentication:** None | **User Interaction:** None

This is as bad as it gets on paper. A **Use-After-Free (UAF)** vulnerability in the Windows Kernel, reachable via the network TCP/IP stack, allows an **unauthenticated, remote attacker** to execute arbitrary code with **SYSTEM-level privileges** — no credentials, no user interaction, no physical proximity needed.

![Windows Kernel Remote Code Execution](../assets/images/blog/windows_kernel_rce.png)

**Why CVSS 9.8 matters:** A score of 9.8 is assigned when an attack is:
- **Network-reachable** (no local access required)
- **No authentication required**
- **No user interaction needed**
- **Confidentiality, Integrity, and Availability all fully compromised**

The only reason it doesn't score a perfect 10.0 is a minor complexity caveat in the attack vector.

**The "wormable" concern:** Security researchers noted that the vulnerability's attack surface — specially crafted TCP/IP network packets — could theoretically allow a self-propagating worm that automatically moves from vulnerable system to vulnerable system with zero human involvement. This echoes the EternalBlue/WannaCry scenario from 2017. Microsoft assessed exploitation as "less likely" at the time of release, but the potential attack surface warrants immediate action.

**Prioritization guidance:** Any Windows system exposed to untrusted networks (including internal networks where lateral movement is a concern) should receive this patch on an **emergency basis**, ahead of your normal patch window.

---

### 🔴 CVE-2026-49160 — Windows HTTP.sys DoS ("HTTP/2 Bomb")

> **CVSS Score:** 7.5 (High) | **Attack Vector:** Network | **Authentication:** None | **Zero-Day:** Yes (public prior to patch)

An **uncontrolled resource consumption** vulnerability in `http.sys` — the kernel-mode HTTP handler at the core of IIS and many other Windows HTTP services — allows an unauthenticated remote attacker to crash or make a server entirely unresponsive within seconds.

**The "HTTP/2 Bomb" technique:** This attack chains two known protocol weaknesses:

1. **HPACK Compression Bomb:** Tiny HTTP/2 packets that expand to enormous memory allocations when decompressed. Like a zip bomb, but for web requests.
2. **Flow-Control Stall:** Manipulating HTTP/2 flow-control settings (specifically, setting a zero-byte flow-control window) to prevent the server from releasing the memory it has already allocated.

Together, an attacker can continuously request new headers that the server allocates memory for but cannot free, rapidly exhausting available RAM and causing the HTTP service to crash or the system to become unresponsive.

**The AI angle:** Notably, this vulnerability was discovered by researchers at Calif using **OpenAI's Codex** AI model to identify and chain existing protocol-level weaknesses — a sign that AI-assisted vulnerability research is maturing rapidly.

**Fix:** Beyond the standard security patch, Microsoft introduced a new registry key: **`MaxHeadersCount`** (documented in KB5102602), which allows administrators to explicitly cap the number of headers accepted in HTTP/2 requests — a useful defense-in-depth measure even after patching.

---

## Product-Level Impact Summary

### Microsoft Office (54 Patches)
Office received the single largest block of patches this month — 54 updates — covering Outlook, Word, Excel, and SharePoint. Multiple RCE vulnerabilities exist in Office components that could be triggered by opening a malicious document or email. Ensure auto-updates are enabled for Microsoft 365 clients and that on-premises Office installations are patched.

### Exchange Server
Exchange Server patches are included with notes from Microsoft that applying the June 2026 Security Update (SU) has **implications for Office Online Server (OOS) integration**. Organizations running OAS should review the Exchange team's deployment guidance before applying and maintain existing mitigations if deferring.

### SQL Server
SQL Server contains critical RCE vulnerabilities in this cycle. Database servers are often trusted internal systems that receive delayed patching — this month that assumption is dangerous.

### Azure Kubernetes Service (AKS)
Critical RCE vulnerabilities were identified in AKS. Microsoft Cloud customers: check your AKS cluster versions against the advisory. Many AKS security updates are applied automatically by Azure, but verify your clusters are running updated node image versions.

---

## Patching Strategy: How to Approach 206 CVEs

Facing 206 patches is an operational challenge. Here's a sensible triage framework:

**Tier 1 — Patch within 24–48 hours:**
- [x] CVE-2026-41091 (Defender EoP, actively exploited) — *check engine version NOW*
- [x] CVE-2026-45657 (Windows Kernel RCE, CVSS 9.8, wormable potential)
- [x] CVE-2026-49160 (HTTP.sys DoS zero-day, public PoC)

**Tier 2 — Patch within 7 days:**
- [ ] CVE-2026-45585 "YellowKey" (BitLocker bypass, PoC public)
- [ ] CVE-2026-50507 "Bitskrieg" (BitLocker bypass, PoC public)
- [ ] All remaining Critical-rated CVEs (32 total)
- [ ] SQL Server, Exchange Server, AKS patches

**Tier 3 — Standard patch cycle:**
- [ ] All remaining Important and Moderate CVEs

**Operational tips:**
- Don't forget the **360+ Chromium/Edge** vulnerabilities — browsers are a primary initial access vector and should be updated alongside the OS.
- Validate your Defender engine update delivery mechanism separately from standard Windows Update — this operates on a different update channel and can be blocked by misconfigurations.
- For Exchange, test in a staging environment before broad deployment given the OOS integration caveat.

---

## The "Nightmare-Eclipse" Situation: A Lesson in Disclosure Ethics

Both YellowKey and Bitskrieg were released publicly by researcher "Nightmare-Eclipse" without following coordinated disclosure — reportedly as a protest against what they perceived as Microsoft's inadequate response to prior vulnerability reports. This is a pattern we've seen before in the security community.

The security community remains split: some argue that forced full disclosure is the only way to compel vendors to act with urgency. Others argue that public PoC releases for unpatched vulnerabilities put millions of end users at risk.

Regardless of where you land on that debate, the operational reality for defenders is clear: once a PoC is public, exploitation is no longer theoretical. The disclosure model debate doesn't change your patch SLA.

---

## Key Takeaways

> **TL;DR for security teams:**
> 
> - Verify your Defender Malware Protection Engine is at `1.1.26040.8+` **immediately** (CVE-2026-41091 is being actively exploited).
> - Treat CVE-2026-45657 (CVSS 9.8 Kernel RCE) as a P0 emergency patch for all internet-facing and network-accessible Windows systems.
> - Audit your BitLocker deployment model — TPM-only is inadequate. Enable TPM + PIN for sensitive devices.
> - Apply HTTP.sys patch and configure the new `MaxHeadersCount` registry key on all IIS/Windows web servers.
> - This is not a month where you negotiate patch windows. 206 CVEs, three zero-days, and a wormable critical demands urgent action.

---

## References & Further Reading

- [Microsoft Security Update Guide — June 2026](https://msrc.microsoft.com/update-guide)
- [CISA KEV Catalog — CVE-2026-41091](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Talos Intelligence: June 2026 Patch Tuesday](https://talosintelligence.com)
- [Bleeping Computer: June 2026 Patch Tuesday Coverage](https://bleepingcomputer.com)
- [Tenable: June 2026 Vulnerability Analysis](https://tenable.com)
- [SANS Internet Storm Center: June 2026 Overview](https://isc.sans.edu)
