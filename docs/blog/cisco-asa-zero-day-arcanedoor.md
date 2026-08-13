---
title: "Cisco ASA & FTD Zero-Days: ArcaneDoor Campaign Deep Dive (CVE-2025-20333, CVE-2025-20362)"
date: 2026-08-13
authors:
  - name: Bilash J. Shahi
    title: Cybersecurity Professional
    picture: https://avatars.githubusercontent.com/elodvk
    url: https://purplesec.org
tags:
  - Security Research
  - Zero-Day
  - Cisco
  - ASA
  - FTD
  - RCE
  - Authentication Bypass
  - State-Sponsored
  - ArcaneDoor
  - UAT4356
  - Storm-1849
description: 'In-depth analysis of actively exploited zero-day vulnerabilities in Cisco ASA and FTD devices (CVE-2025-20333, CVE-2025-20362) used by UAT4356/Storm-1849 in the ArcaneDoor campaign, including technical breakdown, PoC information, and critical mitigation strategies.'
---

## Executive Summary

A sophisticated, likely state-sponsored threat actor, tracked as **UAT4356** (also known as **Storm-1849**), has been actively exploiting multiple zero-day vulnerabilities in **Cisco Adaptive Security Appliance (ASA)** Software and **Cisco Secure Firewall Threat Defense (FTD)** Software. This campaign, part of the broader **ArcaneDoor** operation, leverages a critical chain of vulnerabilities to achieve unauthenticated remote code execution (RCE) and establish persistent access on internet-exposed perimeter devices.

CISA has issued an **Emergency Directive ED-25-03**, mandating immediate action for federal agencies to identify and mitigate potential compromises, underscoring the severe risk these vulnerabilities pose. The attacks involve advanced persistence mechanisms, including bootloader implants, that survive reboots and firmware upgrades, making detection and remediation exceptionally challenging.

## Vulnerability Breakdown

The core attack chain involves two primary vulnerabilities:

1.  **CVE-2025-20362: Authentication Bypass Vulnerability**
    *   **Description**: This vulnerability is an unauthenticated authorization bypass in the VPN web server component. It allows an attacker to gain access to restricted WebVPN endpoints without valid authentication. The flaw is due to improper validation of user-supplied input in HTTP(S) requests.
    *   **CWE**: CWE-287 (Improper Authentication)
    *   **Impact**: Allows an unauthenticated attacker to bypass authentication mechanisms, serving as the initial access vector for the exploit chain.

2.  **CVE-2025-20333: Remote Code Execution (RCE) Vulnerability**
    *   **Description**: A critical heap-based buffer overflow vulnerability residing in the WebVPN file upload handler. This flaw can lead to remote code execution (RCE) as root when successfully exploited, often chained with CVE-2025-20362. A new attack variant (discovered November 5, 2025) can also cause unpatched devices to unexpectedly reload, leading to denial of service (DoS) conditions.
    *   **CWE**: CWE-120 (Buffer Overflow)
    *   **Impact**: Unauthenticated remote code execution with root privileges, allowing for full compromise of the device, implant deployment, and configuration alteration.

A third related vulnerability, **CVE-2025-20363**, is also referenced in some analyses, often as an alternative RCE primitive to CVE-2025-20333, completing the root RCE chain.

## Threat Actor: UAT4356 / Storm-1849 (ArcaneDoor)

The exploitation of these zero-days is attributed to **UAT4356**, also tracked as **Storm-1849** by Microsoft Threat Intelligence. This is a well-resourced, likely China-aligned state-sponsored threat actor specializing in perimeter device exploitation. The campaign represents a significant evolution of the **ArcaneDoor** attack methodology, first observed in early 2024. This actor demonstrates advanced tradecraft, focusing on stealth, persistence, and evasion of detection mechanisms.

## Attack Flow and Capabilities

The typical attack flow observed in the ArcaneDoor campaign:

1.  **Initial Access**: Attackers leverage **CVE-2025-20362** (authentication bypass) to access restricted WebVPN endpoints on internet-exposed Cisco ASA/FTD devices.
2.  **Code Execution**: The authentication bypass is chained with **CVE-2025-20333** (heap-based buffer overflow) or CVE-2025-20363 to achieve **root-level remote code execution**.
3.  **Implant Deployment**: Upon gaining root access, the actor deploys sophisticated implants, such as the **RayInitiator** bootkit and the **LINE VIPER** C2 framework.
4.  **Persistence**:
    *   **Bootloader (Firmware) Implants**: **RayInitiator** is a bootkit that modifies the device's ROMMON/boot variables, allowing persistence across reboots and even firmware upgrades. This is a highly stealthy and resilient form of persistence.
    *   **Server Software Components**: Appliance-resident backdoors (e.g., **LINE VIPER**) sustain access, communicating over HTTPS/ICMP to blend with normal network traffic.
5.  **Defense Evasion & Anti-Forensics**:
    *   **Log Suppression**: Actors actively suppress logs, intercept CLI commands, and induce crashes to blind monitoring and hinder incident response efforts.
    *   **Indicator Removal**: Artifacts on appliance storage are removed or altered.
6.  **Command & Control (C2)**: LINE VIPER modules facilitate C2 over application-layer protocols like HTTPS and ICMP, further aiding in evasion.
7.  **Data Exfiltration**: Data is exfiltrated over the established C2 channels.

## Proof-of-Concept (PoC) & Detection Information

While full weaponized exploits are not publicly available due to the zero-day nature and active exploitation, research has led to diagnostic tools and detection rules.

### PoC / Diagnostic Tools:

*   **CVE-2025-20333 Scanner (Python)**:
    A Python-based diagnostic scanner for CVE-2025-20333 exists. This scanner can help identify vulnerable Cisco ASA/FTD VPN Web Servers by checking for the presence of the buffer overflow vulnerability.
    **Reference:** `https://github.com/curtishoughton/Cisco-ASA-CVE-2025-20333-Scanner`
    ```python
    # Example (simplified) of a Python scanner approach for CVE-2025-20333
    # This is a conceptual example and not the full exploit.
    import requests
    import sys

    def check_vulnerability(target_url):
        print(f"[*] Checking {target_url} for CVE-2025-20333...")
        try:
            # This is a placeholder for a real vulnerability check.
            # A real check would involve sending a malformed request
            # to the WebVPN file upload handler and observing the response
            # or device behavior (e.g., crash, specific error message).
            # The actual PoC from the GitHub repository would contain the specific payload.
            response = requests.post(f"{target_url}/+CSCOE+/webvpn_upload.html", data={'file': 'A' * 20000}, timeout=10)

            # In a real scenario, we might look for specific error codes,
            # crash indicators, or differentiate between the buffer overflow
            # causing a crash versus an RCE indicator.
            if response.status_code == 500 or "buffer overflow" in response.text.lower():
                print(f"[!] Target {target_url} might be vulnerable to CVE-2025-20333 (DoS/RCE potential).")
                print(f"    Status Code: {response.status_code}")
                # Further checks for actual RCE would be more complex and involve
                # specific payload crafting and command execution verification.
            else:
                print(f"[-] Target {target_url} does not appear vulnerable (Status: {response.status_code}).")

        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Could not connect to {target_url}: {e}")
        except Exception as e:
            print(f"[ERROR] An unexpected error occurred: {e}")

    if __name__ == "__main__":
        if len(sys.argv) != 2:
            print("Usage: python cve_2025_20333_scanner.py <target_url>")
            sys.exit(1)
        target = sys.argv[1]
        check_vulnerability(target)
    ```

*   **Nuclei Template for CVE-2025-20362**:
    A Nuclei template is available for detecting CVE-2025-20362, the authentication bypass vulnerability. This can be used by security teams for network-wide scanning.
    **Reference:** `https://github.com/projectdiscovery/nuclei-templates/blob/main/http/cves/2025/CVE-2025-20362.yaml`
    ```yaml
    # Example (simplified) Nuclei Template for CVE-2025-20362
    id: cisco-asa-2025-20362

    info:
      name: Cisco ASA VPN Web Server - Authentication Bypass
      author: projectdiscovery
      severity: critical
      description: |
        Cisco Secure Firewall Adaptive Security Appliance Software and Secure Firewall Threat Defense Software VPN Web Server contains an unauthenticated authorization bypass vulnerability (CVE-2025-20362) due to improper input validation.
      reference:
        - https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-asaftd-webvpn-z5xP8EUB
        - https://www.tenable.com/blog/cve-2025-20333-cve-2025-20362-faq-cisco-asa-ftd-zero-days-uat4356
      metadata:
        verified: true
        max-request: 1
        shodan-query: 'http.title:"Cisco ASA" "webvpn"'
      tags: cisco,asa,ftd,vpn,auth-bypass,zero-day,kev,uat4356

    http:
      - method: GET
        path:
          - "{{BaseURL}}/restricted_webvpn_endpoint" # Placeholder, actual endpoint will be specific

        matchers-condition: and
        matchers:
          - type: status
            status:
              - 200
          - type: word
            words:
              - "Restricted Access Granted" # Placeholder, actual response will be specific
            part: body

    ```

### MITRE ATT&CK Mapping:

*   **Initial Access**: T1190 (Exploit Public-Facing Application) - CVE-2025-20362
*   **Execution / Privilege Escalation**: T1068 (Exploitation for Privilege Escalation - RCE to root) - CVE-2025-20333 / CVE-2025-20363
*   **Persistence**: T1542.003 (Bootloader - Firmware), T1505 (Server Software Component - On-device backdoor)
*   **Defense Evasion**: T1562 (Impair Defenses - logging/visibility), T1070 (Indicator Removal on Host)
*   **Command & Control**: T1071.001 (Application Layer Protocol: Web - HTTPS)
*   **Exfiltration**: T1041 (Exfiltration Over C2 Channel)

## Detection & Hunting Playbook

*   **Unusual Service Restarts/Uptime Resets**: Monitor for unexpected reboots or service restarts on ASA/FTD devices.
*   **Configuration Diffs**: Regularly compare running configurations against known-good baselines. Alert on unauthorized changes.
*   **Module/Process Loads**: Where telemetry permits, detect unusual module or process loads on the appliance.
*   **ROMMON/Boot Variable Checks**: Verify ROMMON settings and boot variables for unauthorized modifications.
*   **Image Integrity Verification**: Implement regular integrity checks for the ASA/FTD operating system images.
*   **`disk0:/firmware_update.log`**: Monitor for the creation or modification of this file, especially after patches and reboots, as it can be an indicator of bootloader implant activity.
*   **Unexpected WebVPN Files/Resources**: Enumerate WebVPN packages and custom files; alert on unexpected additions.
*   **Log Suppression Patterns**: Detect gaps in syslog data, changes to logging configurations, or unusual bursts of crashes/reboots.
*   **CLI Interception Anomalies**: Monitor for CLI access from unusual source IPs or commands that don't appear in logs.
*   **Beacon Interval Clustering**: Analyze network traffic for C2 beaconing (HTTPS/ICMP) from the firewall IP to rare ASNs or with unusual JA3/JA4 fingerprints.
*   **Volume/Ratio Anomalies on Egress**: Detect unusual data exfiltration volumes or long-lived sessions with atypical byte counts.
*   **Targeted Devices**: Prioritize hunting on older ASA/FTD trains (e.g., 9.12/9.14) and internet-exposed WebVPN portals.

## Mitigation & Remediation (Priority-Ordered)

1.  **Immediate Patching**: Upgrade Cisco ASA Software and Cisco Secure Firewall Threat Defense Software to the fixed releases that address CVE-2025-20333, CVE-2025-20362, and CVE-2025-20363. **Verify the patch installation and ensure a device reboot is performed.**
2.  **Harden While Patching**:
    *   **Temporarily Disable Clientless SSL VPN/WebVPN**: If not strictly necessary, disable these features to reduce the attack surface.
    *   **Restrict Management Access**: Enforce strict access control lists (ACLs) for management interfaces and prioritize out-of-band management.
    *   **Certificate-Based VPN**: Prefer certificate-based authentication for VPN connections over password-based methods.
    *   **Rotate AnyConnect Packages and Regenerate Certificates/Keys**: If compromise is suspected, assume all credentials and cryptographic material are compromised and initiate a full rotation.
3.  **If Persistence Suspected (Re-Image & Restore)**:
    *   **Disconnect and Image**: Immediately disconnect the affected device from the network. Create a full forensic image of the device for analysis.
    *   **Re-Image from Known-Good**: Perform a full re-image of the device from a known-good, trusted firmware image.
    *   **Restore from Pre-Incident Backups**: Restore configurations and data from backups taken *before* the suspected compromise date. Thoroughly scrub configurations for any malicious changes before re-applying.
    *   **Replace End-of-Life (EoL) Devices**: Replace older ASA 5500-X series devices that may lack modern boot protections, as these are frequently targeted.
4.  **Forensic Investigation**: Conduct a thorough forensic investigation to understand the full scope of compromise, identify any lingering threats, and collect indicators of compromise (IOCs).
5.  **Network Segmentation**: Implement strong network segmentation to limit lateral movement in case of a perimeter device compromise.

## Conclusion

The active exploitation of these Cisco ASA/FTD zero-days by a sophisticated, state-sponsored actor represents a severe threat to organizations globally. The advanced persistence mechanisms make this campaign particularly dangerous. Immediate patching and a proactive approach to detection and hardening are critical to protecting against the ArcaneDoor campaign.
