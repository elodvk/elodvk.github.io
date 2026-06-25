---
title: 'Active Directory Pentesting — Getting Started'
description: 'An introduction to Active Directory penetration testing: fundamentals, lab setup, core tooling, and the attack lifecycle from reconnaissance to domain dominance.'
icon: material/file-document-outline
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Active Directory</h1>
<p class="ps-blog-masthead-sub">Microsoft's directory service runs the modern enterprise — which makes it the single highest-value target on the network. This is how it gets attacked, and defended.</p>
</div>

## What is Active Directory Pentesting?

Active Directory (AD) is Microsoft's directory service for managing authentication, authorization, and resource access across Windows networks. **AD pentesting** is the practice of assessing the security of those configurations — user accounts, permissions, trusts, group policy, and the supporting infrastructure — to uncover the weaknesses an attacker would exploit.

This section is built around practical techniques, real tooling, and a repeatable methodology: reconnaissance, credential access, privilege escalation, lateral movement, and full domain compromise.

## Why It Matters

AD is the backbone of most enterprise environments, so a single misconfiguration can cascade into domain compromise, data theft, or ransomware. Assessing it helps organizations:

- Identify weak passwords, stale accounts, and misconfigured trusts
- Detect excessive permissions and insecure Group Policy
- Harden domain controllers and certificate services
- Rehearse real-world attack chains — pass-the-hash, Kerberoasting, ADCS abuse, and more

## The Attack Lifecycle

The writeups in this section follow the path an engagement actually takes:

- **Initial Attack Vectors** — LLMNR poisoning, SMB relay, and mitm6 to capture and relay credentials.
- **Post-Compromise Enumeration** — BloodHound, ldapdomaindump, and PingCastle to map the domain and find the shortest path to Domain Admin.
- **Post-Compromise Attacks** — Kerberoasting, hash dumping and cracking, token impersonation, GPP, and Mimikatz.
- **ADCS Attacks** — the full ESC1–ESC15 catalogue plus the Golden Certificate.
- **Post-Domain Compromise** — dumping NTDS.dit and forging Golden Tickets for persistent control.

## Building a Lab

To practice safely, you'll want an isolated environment:

1. **A lab network** — domain controller + a couple of domain-joined workstations on VMware or VirtualBox, fully isolated from production.
2. **Tooling** — [Impacket](https://github.com/fortra/impacket) for protocol attacks, [BloodHound](https://github.com/SpecterOps/BloodHound) for relationship mapping, and [Mimikatz](https://github.com/gentilkiwi/mimikatz) for credential extraction.
3. **Foundations** — a working familiarity with Windows networking, LDAP, and Kerberos. Helpful, but you'll pick most of it up as you go.

!!! warning "Authorized testing only"

    Every technique here is documented for **authorized engagements and isolated lab environments**. Running these against systems you don't own or have explicit permission to test is illegal.

Use the navigation on the left to dive into any phase, or start with [Initial Attack Vectors](Initial%20Attack%20Vectors/llmnr-poisioning.md).
