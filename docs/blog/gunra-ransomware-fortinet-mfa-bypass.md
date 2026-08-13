---
title: "Gunra Ransomware Exploits Fortinet Flaws and Bypasses MFA"
date: 2026-08-13
authors:
  - name: Bilash J. Shahi
    title: Cybersecurity Professional
    picture: https://avatars.githubusercontent.com/elodvk
    url: https://purplesec.org
tags:
  - Security Research
  - Ransomware
  - Fortinet
  - MFA Bypass
  - Threat Intel
description: 'The Gunra ransomware gang is actively exploiting known Fortinet vulnerabilities (CVE-2024-55591, CVE-2025-24472) to gain initial access and bypass multi-factor authentication in attacks targeting critical infrastructure and government organizations.'
---

## Executive Overview

The Gunra ransomware-as-a-service (RaaS) operation has emerged as a significant threat, leveraging known vulnerabilities in Fortinet firewall and VPN appliances to achieve initial access and circumvent multi-factor authentication (MFA). Jointly warned by US and South Korean government agencies, Gunra campaigns are actively targeting critical infrastructure and government entities globally. This report details Gunra's tactics, techniques, and procedures (TTPs), focusing on their exploitation of N-day vulnerabilities and sophisticated MFA bypass mechanisms.

## Technical Vulnerability Analysis / Root Cause

Gunra actors are primarily weaponizing two critical Fortinet vulnerabilities:

1.  **CVE-2024-55591**: A critical authentication bypass flaw in FortiOS and FortiProxy. This vulnerability allows an attacker to gain "super admin" privileges on affected Fortinet appliances. It was initially disclosed as a zero-day under active exploitation in January 2025.
2.  **CVE-2025-24472**: A high-severity authentication bypass flaw impacting FortiOS and FortiProxy software. Disclosed in February 2025 and subsequently added to CISA's Known Exploited Vulnerabilities (KEV) catalog, this flaw has also been widely exploited in ransomware attacks.

These vulnerabilities represent fundamental authentication weaknesses, allowing unauthorized access to internet-facing devices, which serve as a critical entry point for adversaries. The root cause lies in improper authentication enforcement within the Fortinet operating systems, enabling attackers to bypass normal login procedures.

## Exploit Mechanics / Attack Vector

Gunra’s attack chain typically involves:

1.  **Initial Access**: Exploiting CVE-2024-55591 and CVE-2025-24472 on vulnerable Fortinet firewall and VPN appliances to establish a foothold.
2.  **Credential Access & Session Hijacking**: Following initial access, Gunra affiliates take control of SSL-VPN appliances. They utilize traffic control functionalities to collect credentials and session information, often targeting employees authenticating to corporate Virtual Desktop Infrastructure (VDI) portals. Stolen cookies are then used for session hijacking.
3.  **MFA Bypass**: Beyond session hijacking, Gunra employs a more sophisticated MFA bypass. In observed attacks, they modified authentication processing files on corporate VDI authentication portal servers. This allowed successful authentication when a specific, Gunra-designated one-time password (OTP) value was entered, effectively enabling continuous bypass of MFA.
4.  **Post-Exploitation**: The gang, whose ransomware variant is based on leaked Conti source code, also focuses on deleting backups and archived data from primary and disaster recovery centers before and after deploying ransomware, maximizing impact and hindering recovery efforts. They actively dump OS credentials and compromise access control servers to steal encryption keys and decrypt stored passwords, demonstrating a focus on reusable authentication material.

## Detection & Mitigation

Organizations must adopt a multi-layered defense strategy to counter Gunra ransomware:

### Detection
*   **Monitor Fortinet Logs**: Look for unusual authentication attempts, unexplained super-admin access, or traffic control modifications on Fortinet devices.
*   **VDI and Authentication Logs**: Scrutinize VDI authentication logs for anomalous access patterns, unusual OTP entries, or modifications to authentication processing files.
*   **Network Traffic Analysis**: Monitor for suspicious data exfiltration, C2 beaconing, or unexpected internal network movements originating from compromised Fortinet devices or VDI sessions.
*   **Endpoint Detection and Response (EDR)**: Implement EDR solutions to detect credential dumping (e.g., LSASS memory access), unauthorized file modifications, and ransomware deployment activities.
*   **Identity and Access Management (IAM) Monitoring**: Closely monitor all identity and access management infrastructure for suspicious activities, especially around password decryption attempts or compromised access control servers.

### Mitigation
*   **Patching**: **Immediately patch all Fortinet FortiOS and FortiProxy products** to remediate CVE-2024-55591 and CVE-2025-24472, along with all other known exploited vulnerabilities in internet-facing appliances. Prioritize patching based on CISA’s KEV catalog.
*   **MFA Hardening**: Implement robust MFA across all services, especially for remote access and VDI. Regularly audit MFA configurations to ensure they are not susceptible to bypass techniques. Consider hardware tokens or FIDO2 keys for critical accounts.
*   **Network Segmentation**: Implement strong network segmentation to limit lateral movement. Isolate critical infrastructure and VDI environments from less secure networks.
*   **Immutable Backups**: Maintain offline, immutable backups of all critical data. Regularly test backup and recovery procedures to ensure resilience against data deletion attacks.
*   **Privileged Access Management (PAM)**: Enforce strict PAM principles, including least privilege and just-in-time access for administrative accounts. Rotate credentials frequently.
*   **Security Awareness Training**: Educate users on phishing, social engineering, and the importance of strong, unique passwords.
*   **Threat Intelligence Integration**: Integrate threat intelligence feeds (like CISA KEV) into security operations to proactively identify and address emerging threats.

## Proper Citations & External References

*   **Dark Reading Article**: [Gunra Ransomware Gang Exploits Fortinet Flaws, Bypasses MFA](https://www.darkreading.com/cyberattacks-data-breaches/gunra-ransomware-gang-fortinet-flaws-bypasses-mfa)
*   **CISA KEV Catalog**: [Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) (for CVE-2025-24472)
*   **Picus Security Blog**: [Gunra Ransomware: Multithreaded ChaCha20 Encryption Explained](https://www.picussecurity.com/resource/blog/gunra-ransomware-multithreaded-chacha20-encryption-explained)
*   **CloudSEK Report**: [Inside Gunra RaaS: From Affiliate Recruitment on the Dark Web to Full Technical Dissection of Their Locker](https://www.cloudsek.com/blog/inside-gunra-raas-from-affiliate-recruitment-on-the-dark-web-to-full-technical-dissection-of-their-locker)
*   **AhnLab Report**: [Operation Double Barrel (ENG)](https://image.ahnlab.com/atip/content/file/20260730/%5bAhnLab%5dOperation%20Double%20Barrel(ENG)(2026.07.30).pdf)
