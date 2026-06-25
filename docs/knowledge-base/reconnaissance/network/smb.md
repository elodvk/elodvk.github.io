---
title: "SMB Shares"
description: "Techniques and tools to discover, enumerate, and extract information from Server Message Block (SMB) services."
tags:
  - enumeration
  - smb
  - footprinting
  - reconnaissance
  - smbclient
  - enum4linux
  - crackmapexec
  - netexec
icon: material/folder-account
---

# 📂 SMB Footprinting

**SMB (Server Message Block)** is a network file sharing protocol heavily used in Windows environments (and in Linux via Samba). Because it integrates deeply with Active Directory and local authentication, enumerating SMB is one of the most critical steps in internal network penetration testing.

---

## 1️⃣ Service Discovery & Port Identification

SMB primarily runs on two ports:

- **TCP 139:** NetBIOS Session Service (older implementations).
- **TCP 445:** Direct Hosted SMB over TCP/IP (modern implementations).

### Nmap Discovery
```bash
# Basic scan to confirm open ports and get OS/service version
nmap -p 139,445 -sV -sC <target>

# Run comprehensive SMB enumeration scripts
nmap -p 139,445 --script smb-os-discovery,smb-enum-shares,smb-enum-users <target>
```

---

## 2️⃣ Null Sessions & Anonymous Access

A **Null Session** (or anonymous login) occurs when the server allows connections without a valid username or password. This is a common misconfiguration that allows attackers to enumerate users, groups, and shares.

### Using `smbclient`
```bash
# List available shares (-L) using a null session (-N means no password)
smbclient -L //<target>/ -N

# Connect to a specific share (e.g., IPC$ or a public share)
smbclient //<target>/share_name -N
```

### Using `smbmap`
`smbmap` is excellent for quickly assessing share permissions across a host or network.
```bash
# Enumerate shares with null session
smbmap -H <target> -u null -p ''
```

### Using `CrackMapExec` / `NetExec`
```bash
# Check for null session access and list shares
netexec smb <target> -u '' -p '' --shares
```

---

## 3️⃣ Comprehensive Enumeration Tools

If you identify an open SMB service or have valid (or anonymous) credentials, automated tools can extract a wealth of information including users, groups, password policies, and domain info.

### `enum4linux`
A classic tool for extracting information from Windows and Samba hosts.
```bash
# Run all enumeration checks (users, shares, password policy, etc.)
enum4linux -a <target>
```

### `enum4linux-ng`
A modern, Python-based rewrite of `enum4linux`.
```bash
enum4linux-ng -A <target>
```

### `NetExec` (formerly CrackMapExec)
`NetExec` is the standard tool for assessing SMB in Active Directory environments.
```bash
# Enumerate users
netexec smb <target> -u 'username' -p 'password' --users

# Enumerate password policy
netexec smb <target> -u 'username' -p 'password' --pass-pol

# Check if the user has local administrator privileges on the target (Pwn3d!)
netexec smb <target> -u 'username' -p 'password'
```

---

## 4️⃣ Connecting to and Interacting with Shares

Once you find a share you can access, you can connect to it to read or write files.

### `smbclient` Interactive Prompt
```bash
smbclient //<target>/<share> -U <username>
```
Common commands inside the prompt:
- `ls` / `dir`: List files.
- `get <file>`: Download a file.
- `put <file>`: Upload a file.
- `recurse ON` followed by `prompt OFF` and `mget *`: Download all files recursively.

### Mounting SMB Shares Locally
Sometimes it's easier to mount the share to your local filesystem.
```bash
# Mount using CIFS
sudo mount -t cifs -o username=<user>,password=<pass> //<target>/<share> /mnt/smb_share
```

---

## 5️⃣ Vulnerability Scanning

Several high-profile vulnerabilities exist in older SMB implementations. Nmap provides built-in scripts to check for these.

```bash
# Scan for common SMB vulnerabilities (e.g., MS17-010 EternalBlue, MS08-067)
nmap -p 139,445 --script smb-vuln* <target>
```

---

## 6️⃣ Defensive Recommendations (Quick Checklist)

- **Disable SMBv1:** SMBv1 is highly insecure and vulnerable to exploits like EternalBlue. Ensure it is disabled across the entire domain.
- **Restrict Null Sessions:** Configure Windows policies or Samba (`restrict anonymous = 2`) to prevent anonymous users from enumerating shares or users.
- **SMB Signing:** Require SMB signing to prevent NTLM Relay attacks.
- **Network Segmentation:** Do not expose SMB (port 445) to the internet. Restrict access internally to only those subnets that require it.
- **Principle of Least Privilege:** Ensure shares like `C$` or `ADMIN$` are only accessible by Domain Admins, and general file shares have strict ACLs.

---

## 7️⃣ References & Further Reading

- HackTricks - SMB Pentesting: https://book.hacktricks.xyz/network-services-pentesting/pentesting-smb
- NetExec Documentation: https://www.netexec.wiki/
- Nmap SMB Scripts: https://nmap.org/nsedoc/scripts/smb-enum-shares.html

!!! warning
    **All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of SMB infrastructure is illegal and may trigger security alerts.**
