---
title: Pass-the-Hash (PtH) attack
description: Pass-the-Hash (PtH) attack
---

In the world of Windows network security, one of the most powerful and dangerous lateral
movement techniques is the Pass-the-Hash (PtH) attack. Unlike traditional password-based
attacks that require cracking or guessing credentials, PtH allows an attacker to authenticate
as a user using only the captured NTLM hash of their password — without ever knowing the
actual plaintext password.

This article provides a comprehensive technical walkthrough of Pass-the-Hash attacks
against a Windows Active Directory (AD) environment. We demonstrate the attack using
multiple popular offensive security tools including NetExec (nxc), Impacket, Metasploit, EvilWinRM, and pth-winexe. All techniques shown are for educational and authorized
penetration testing purposes only.

## Lab Environment

 - **Target**: Windows Server 2022 Domain Controller (DC) 172.17.1.100
 - **Domain**: marvel.corp
 - **Attacker Machine**: Kali Linux — 192.168.1.17


## What is a Pass-the-Hash Attack?

When a user logs in on a Windows system, their password is never stored in plaintext. Instead, Windows computes an NTLM hash (an MD4 hash of the Unicode password) and stores it in the SAM database or, in domain environments, in the `NTDS.DIT` file on the
Domain Controller.

The core vulnerability that PtH exploits is the NTLM authentication protocol itself. During NTLM authentication, the client proves knowledge of the password by computing a response using the hash — not the plaintext. This means that if an attacker can obtain the hash, they can impersonate any user without cracking the password.

### Key Concepts

 - NTLM Hash: MD4 hash of the Unicode password (stored in SAM/NTDS.DIT)
 - LM Hash: Legacy, weak predecessor to NTLM (usually empty/zeroed out in modern
systems)
- Hash Format: <username>:<RID>:<LM hash>:<NTLM hash>:::
- Pass-the-Hash works because NTLM auth uses the hash directly as a credential

## SMB (Pass the Hash)

### NXC

The `nxc smb -x` command allows attackers to execute commands remotely on a Windows system using NTLM hash authentication. While powerful and reliable, it is less stealthy due to service creation and logging, making it more detectable compared to WMI-based
techniques.

```shell
nxc smb 172.17.1.100 -u administrator -H 32196B56FFE6F45E294117B91A83BF38 -x ipconfig
```

