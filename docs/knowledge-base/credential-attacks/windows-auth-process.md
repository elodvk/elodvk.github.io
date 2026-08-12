---
title: "Windows Authentication Process"
description: "Understanding how Windows authenticates users — NTLM, Kerberos, the SAM database, LSA, and credential storage mechanisms."
tags:
  - windows
  - authentication
  - ntlm
  - kerberos
  - sam
  - lsass
---

# 🖥️ Windows Authentication Process

To successfully extract credentials from a Windows system or move laterally across an Active Directory network, you must first understand how Windows handles authentication, stores passwords, and caches credentials in memory.

---

## 1️⃣ Plaintext Passwords vs. Hashes

Windows **does not** store passwords in plaintext on disk. When a user creates or changes a password, Windows hashes it before storing it.

The primary hash format used in modern Windows is the **NT hash** (often colloquially called the NTLM hash).

### The NT Hash
- Generated using the MD4 hashing algorithm.
- Hashes the Unicode (UTF-16LE) representation of the password.
- No salting is used. This means the password `Password123` will **always** result in the exact same NT hash, regardless of the user or computer.
- **Example NT Hash:** `8846f7eaee8fb117ad06bdd830b7586c` (for "password")

!!! concept
    Because NT hashes are not salted and are used directly in network authentication protocols, an attacker who obtains an NT hash can often use it to authenticate *without ever cracking it*. This is the basis of the **Pass the Hash (PtH)** attack.

---

## 2️⃣ Local vs. Domain Authentication

Windows authentication fundamentally differs depending on whether the account is a local machine account or an Active Directory domain account.

### Local Authentication (The SAM Database)
When you log in with a local account (e.g., `DESKTOP-ABC\Administrator`), the authentication is handled entirely by the local machine.

1. You type your password.
2. The Local Security Authority (LSA) hashes the password.
3. The LSA compares the generated hash against the hash stored in the **Security Account Manager (SAM)** database located at `C:\Windows\System32\config\SAM`.

### Domain Authentication (Kerberos & Active Directory)
When you log in with a domain account (e.g., `CORP\jsmith`), the local machine cannot verify the password itself because it doesn't store domain hashes.

1. You type your password.
2. The LSA sends an authentication request to the **Domain Controller (DC)**.
3. In modern environments, this is done using the **Kerberos** protocol. (Older or misconfigured networks may fall back to the NTLM authentication protocol).
4. The Domain Controller verifies the credentials against its master database, located at `C:\Windows\NTDS\ntds.dit`.
5. The DC issues a Ticket Granting Ticket (TGT) to the user, proving they successfully authenticated.

---

## 3️⃣ The Role of LSASS

The **Local Security Authority Subsystem Service (LSASS)** (`lsass.exe`) is the heart of Windows security. It enforces security policy, verifies users logging on, handles password changes, and creates access tokens.

### Memory Caching
To provide a seamless "Single Sign-On" (SSO) experience (so you don't have to type your password every time you access a network share or open Outlook), LSASS caches credentials in its memory.

Depending on the OS version and configuration, LSASS may cache:
- Plaintext passwords (in older OS versions or if WDigest is enabled).
- NT hashes.
- Kerberos tickets (TGTs and TGSs).

!!! tip
    Because LSASS stores these highly sensitive authentication materials in RAM, **dumping LSASS memory** is one of the most common and lucrative post-exploitation techniques for an attacker with local administrator privileges.

---

## 4️⃣ Key Storage Locations for Attackers

As a penetration tester, you will target the following locations to extract credentials:

| Location | Contains | Required Privilege |
|----------|----------|--------------------|
| **SAM Registry Hive** | Local user NT hashes | Local Administrator / SYSTEM |
| **LSASS Memory** | Cached domain hashes, Kerberos tickets, sometimes plaintext | Local Administrator / SYSTEM |
| **NTDS.dit** (Domain Controllers only) | ALL domain user NT hashes | Domain Admin / SYSTEM on the DC |
| **Windows Credential Manager** | Saved web/network passwords | Standard User (for their own vault) |
| **LSA Secrets** | Service account passwords, computer account passwords, VPN passwords | Local Administrator / SYSTEM |

---

## 5️⃣ Defensive Considerations

Microsoft has introduced several features to protect credentials from extraction:

- **Credential Guard:** Uses virtualization-based security (VBS) to isolate LSASS in a protected container, preventing even a SYSTEM-level attacker from dumping hashes or tickets from memory.
- **Protected Process Light (PPL):** A flag that can be set on `lsass.exe` preventing non-PPL processes (even those running as Administrator) from reading its memory.
- **Disabling WDigest:** Modern Windows versions disable the caching of plaintext passwords in LSASS by default.

Understanding these protections is critical, as you will frequently encounter them during modern engagements and must employ bypass techniques (which are covered in the following sections).
