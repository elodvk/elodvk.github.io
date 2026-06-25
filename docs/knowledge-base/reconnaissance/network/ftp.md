---
title: "FTP Deep Dive"
description: "Techniques and tools to discover, enumerate, and assess File Transfer Protocol (FTP) services."
tags:
  - enumeration
  - ftp
  - footprinting
  - reconnaissance
  - nmap
  - anonymous access
icon: material/folder-network
---

# 📥 FTP Footprinting

**FTP (File Transfer Protocol)** is a standard network protocol used for the transfer of computer files between a client and server. Due to its age, it transmits data in cleartext (unless FTPS is used). Misconfigurations, such as allowing anonymous access or using outdated, vulnerable daemon versions, make it a common target during reconnaissance.

---

## 1️⃣ Service Discovery & Port Identification

FTP typically uses two ports:
- **TCP 21:** Command/Control port (where authentication and commands are sent).
- **TCP 20:** Active data transfer port (passive mode uses dynamically assigned high ports).

### Nmap Discovery
```bash
# Basic version scan to identify the FTP daemon (e.g., vsftpd, ProFTPD, FileZilla)
nmap -p 21 -sV -sC <target>
```

!!! tip
    Identifying the exact version of the FTP server is crucial, as many older versions (like vsftpd 2.3.4 or ProFTPD 1.3.5) have known exploits or backdoors.

---

## 2️⃣ Anonymous Access

The most common misconfiguration in FTP is leaving **Anonymous login** enabled. This allows any user to log in and potentially download or upload files without needing valid credentials.

### Connecting Manually
You can connect using the standard `ftp` client or `nc` (Netcat).

```bash
ftp <target>
# When prompted for Name, use: anonymous
# When prompted for Password, use: anonymous (or any email format, e.g., guest@target.com)
```

### Automating with Nmap
Nmap can quickly check if anonymous login is permitted:
```bash
nmap -p 21 --script ftp-anon <target>
```

### Automating with Wget
If anonymous access is allowed, you can recursively download the entire directory structure:
```bash
wget -m ftp://anonymous:anonymous@<target>
```

---

## 3️⃣ FTP Interaction Commands

Once connected via the `ftp` command-line client, you can use the following commands to navigate and transfer files:

- `ls` or `dir`: List directory contents.
- `cd <directory>`: Change directory.
- `pwd`: Print working directory.
- `get <file>`: Download a single file to your local machine.
- `mget *`: Download multiple files (use `prompt` to disable interactive confirmations).
- `put <file>`: Upload a file (if write permissions are enabled).
- `binary`: Switch to binary transfer mode (crucial for downloading executables, images, or archives without corruption).

!!! concept
    **Active vs. Passive Mode:** In Active mode, the client opens a port and waits for the server to connect back to transfer data. In Passive mode, the server opens a port and waits for the client. If firewalls are blocking your data transfers (e.g., `ls` hangs), try typing `passive` in the FTP prompt to switch modes.

---

## 4️⃣ Credential Brute-Forcing

If anonymous access is disabled, and you have a list of potential usernames, you can attempt to brute-force the FTP login.

### Using Hydra
```bash
# Brute-force using a specific user list and password list
hydra -L users.txt -P passwords.txt ftp://<target>

# Brute-force a single known user
hydra -l admin -P passwords.txt ftp://<target>
```

### Using Ncrack
```bash
ncrack -p 21 <target> -U users.txt -P passwords.txt
```

---

## 5️⃣ Vulnerability Scanning & Exploitation

Always check the version of the FTP server obtained during the Nmap scan against Exploit-DB or SearchSploit.

```bash
searchsploit proftpd
searchsploit vsftpd
```

### Common Vulnerable Versions:
- **vsftpd 2.3.4:** Contains a malicious backdoor. If a username ends with `:)`, the server spawns a shell on port 6200. (Metasploit: `exploit/unix/ftp/vsftpd_234_backdoor`).
- **ProFTPD 1.3.5:** Vulnerable to `mod_copy` arbitrary file execution. It allows unauthenticated users to copy files around the server (e.g., copying a web shell into `/var/www/html`).

---

## 6️⃣ Defensive Recommendations (Quick Checklist)

- **Disable Anonymous Access:** Unless absolutely necessary for a public repository, disable anonymous logins in the FTP daemon configuration (e.g., `anonymous_enable=NO` in vsftpd).
- **Use Secure Alternatives:** FTP transmits credentials in plaintext. Deprecate FTP in favor of SFTP (SSH File Transfer Protocol) or FTPS (FTP over TLS).
- **Restrict Uploads:** If anonymous access is required, strictly prohibit anonymous write/upload permissions to prevent attackers from hosting malware or dropping shells.
- **Keep Software Updated:** Regularly patch the FTP server software to fix known remote code execution vulnerabilities.
- **Chroot Jail:** Ensure FTP users are restricted (chrooted) to their home directories and cannot traverse up into the system root (`/`).

---

## 7️⃣ References & Further Reading

- HackTricks - FTP Pentesting: https://book.hacktricks.xyz/network-services-pentesting/pentesting-ftp
- Nmap FTP Scripts: https://nmap.org/nsedoc/scripts/ftp-anon.html
- SearchSploit / Exploit-DB: https://www.exploit-db.com/

!!! warning
    **All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of FTP services is illegal and may trigger security alerts.**
