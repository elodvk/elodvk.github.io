---
title: "Linux Authentication Process"
description: "How Linux authenticates users — understanding /etc/passwd, /etc/shadow, PAM, and modern hash formats."
tags:
  - password-attacks
  - linux
  - authentication
  - shadow
  - pam
icon: material/shield-account
---

# 🐧 Linux Authentication Process

To successfully extract and crack passwords from a Linux system, you must understand the files that store user information and the hashing algorithms used by the operating system.

---

## 1️⃣ /etc/passwd

Historically, Linux stored both user information and the encrypted password in a single file: `/etc/passwd`. Because this file must be readable by all users (so programs can resolve UIDs to usernames), this posed a massive security risk. Any user could read the file and crack the passwords offline.

Today, `/etc/passwd` still exists and is world-readable, but the password field is replaced with an `x`.

**Viewing the file:**
```bash
cat /etc/passwd
```

**Example Entry:**
```text
root:x:0:0:root:/root:/bin/bash
john:x:1000:1000:John Doe,,,:/home/john:/bin/bash
```

**Format:**
`username:password_placeholder:UID:GID:GECOS(Comment):Home_Directory:Default_Shell`

!!! concept
    While `/etc/passwd` no longer contains hashes, it is still incredibly valuable during reconnaissance. It gives you a complete list of valid usernames on the system, which you can use for brute-forcing or password spraying.

---

## 2️⃣ /etc/shadow

To solve the security issue of world-readable hashes, Linux introduced the shadow password suite. The actual hashes are now stored in `/etc/shadow`.

This file is heavily restricted and is **only readable by the root user** (or users in the `shadow` group).

**Viewing the file (requires root):**
```bash
sudo cat /etc/shadow
```

**Example Entry:**
```text
root:$6$vY3O...$J9XkP...:18654:0:99999:7:::
john:$y$j9T...$aB8Xz...:18654:0:99999:7:::
```

**Format:**
`username:hash:last_password_change:min_days_between_changes:max_days:warn_days:inactive_days:expire_date:reserved`

---

## 3️⃣ Understanding Linux Hashes

The second field in `/etc/shadow` contains the password hash. Unlike Windows NT hashes, Linux hashes are **salted**. A salt is a random string added to the password before hashing, meaning that if two users have the password `Password123`, their hashes will look completely different.

You can determine the hashing algorithm by looking at the characters between the first and second `$` sign in the hash string.

### Common Hash Identifiers

| Identifier | Algorithm | Hashcat Mode (`-m`) | Notes |
|------------|-----------|----------------------|-------|
| `$1$` | MD5 | 500 | Deprecated, insecure. Very fast to crack. |
| `$2a$` / `$2y$` | bcrypt | 3200 | Blowfish-based. Very slow to crack (designed to resist GPU cracking). |
| `$5$` | SHA-256 | 7400 | Modern, strong. |
| `$6$` | SHA-512 | 1800 | The default on most modern Linux distributions (e.g., Ubuntu). |
| `$y$` | yescrypt | 28100 | The newest standard (default in Debian 11+ / Kali). Extremely resistant to GPU cracking. |

**Example Breakdown of a SHA-512 Hash:**
`$6$vY3OAbCd$J9XkPqRw...`
- `$6$` = SHA-512 Algorithm
- `vY3OAbCd` = The Salt
- `J9XkPqRw...` = The Hash

---

## 4️⃣ Pluggable Authentication Modules (PAM)

Linux authentication is modular, handled by **PAM (Pluggable Authentication Modules)**. PAM allows administrators to define exactly how authentication works without rewriting core utilities (like `login` or `sshd`).

The configuration files are located in `/etc/pam.d/`.

While you won't typically attack PAM directly to crack passwords, understanding it is useful if you are trying to install a backdoor or if you notice strange authentication behavior (e.g., a system configured to check passwords against a remote LDAP server or require Duo MFA).

---

## 5️⃣ Unshadowing for Cracking

If you gain root access and want to crack the hashes (perhaps to pivot to other systems where users reuse passwords), you need to combine `/etc/passwd` and `/etc/shadow` into a single file that password crackers understand.

1. **Copy the files to your attacker machine.**
2. **Use the `unshadow` utility (part of John the Ripper):**
   ```bash
   unshadow passwd.txt shadow.txt > unshadowed.txt
   ```
3. **Crack the resulting file:**
   ```bash
   john --wordlist=rockyou.txt unshadowed.txt
   # OR
   hashcat -m 1800 -a 0 unshadowed.txt rockyou.txt
   ```

!!! warning
    **If you see a `$y$` (yescrypt) hash, prepare for a very long wait.** Yescrypt is memory-hard and explicitly designed to thwart ASIC and GPU cracking. Dictionary attacks with small, targeted wordlists are your only realistic option.
