---
title: "Introduction to John The Ripper"
description: "A guide to using John the Ripper for password cracking, covering modes, formats, and practical examples."
tags:
  - password-cracking
  - john-the-ripper
  - jtr
  - hashes
---

# 🕵️ Introduction to John The Ripper

**John the Ripper (JTR)** is one of the most famous and versatile password cracking tools. While it may not be as fast as GPU-accelerated tools like Hashcat for raw hash cracking, it excels at supporting a massive variety of formats, automatically detecting hash types, and running efficiently on CPUs.

We will focus on **John the Ripper Jumbo**, a community-enhanced version that supports hundreds of additional hash and cipher types.

---

## 1️⃣ Basic Syntax & Usage

The most basic usage of John is providing it with a file containing hashes.

```bash
# Basic usage (John tries to auto-detect the format and uses its default rules/wordlist)
john hashes.txt

# Show cracked passwords
john --show hashes.txt
```

### Specifying a Wordlist
Using a good wordlist like `rockyou.txt` significantly speeds up the process:
```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
```

### Specifying the Hash Format
While John attempts to auto-detect the hash type, it's always faster and more reliable to specify it manually if you know it:
```bash
# List all supported formats
john --list=formats

# Crack MD5 hashes
john --format=raw-md5 --wordlist=rockyou.txt hashes.txt

# Crack NTLM hashes
john --format=nt --wordlist=rockyou.txt hashes.txt

# Crack Linux SHA512 hashes
john --format=sha512crypt --wordlist=rockyou.txt hashes.txt
```

---

## 2️⃣ Cracking Modes

John operates in several different modes, each with a different approach to guessing passwords.

### 1. Single Crack Mode (Default fallback)
Uses information from the hash file itself (e.g., usernames, GECOS fields) to generate guesses. It tries variations like `username123`, `Username`, etc.
```bash
john --single hashes.txt
```

### 2. Wordlist Mode (Dictionary Attack)
Tries every word in a specified wordlist.
```bash
john --wordlist=rockyou.txt hashes.txt
```

### 3. Incremental Mode (Brute Force)
Tries every possible character combination up to a certain length. This is very slow and should only be used as a last resort.
```bash
john --incremental hashes.txt

# Use a specific character set (e.g., only lowercase letters and numbers)
john --incremental=Alnum hashes.txt
```

---

## 3️⃣ Rules & Mangling

A pure dictionary attack only works if the exact password is in the wordlist. People often modify dictionary words (e.g., `Password123!`). John's **Rules** engine applies transformations to the wordlist (appending numbers, capitalizing, leetspeak, etc.).

```bash
# Apply standard wordlist rules
john --wordlist=rockyou.txt --rules hashes.txt

# Apply the KoreLogic ruleset (excellent for complex passwords)
john --wordlist=rockyou.txt --rules=KoreLogic hashes.txt

# Apply the Jumbo ruleset
john --wordlist=rockyou.txt --rules=Jumbo hashes.txt
```

!!! tip
    Using a medium-sized wordlist with a good ruleset is often more effective than using a massive wordlist without rules.

---

## 4️⃣ Working with Shadow Files (Linux)

Linux stores passwords in `/etc/shadow`. To crack them, you need to combine `/etc/passwd` (which has the usernames) and `/etc/shadow` (which has the hashes) using the `unshadow` utility.

### Step-by-Step
1. **Combine the files:**
   ```bash
   unshadow passwd.txt shadow.txt > unshadowed.txt
   ```
2. **Crack the hashes:**
   ```bash
   john --wordlist=rockyou.txt unshadowed.txt
   ```

---

## 5️⃣ Advanced Features

### Sessions and Resuming
Password cracking can take days. John automatically saves its progress to a session file (default name `john.rec`).
```bash
# Stop a running session safely
# Press Ctrl+C once

# Resume the default session
john --restore

# Name a session
john --session=my_crack_job --wordlist=rockyou.txt hashes.txt
# Resume the named session
john --restore=my_crack_job
```

### Managing the Potfile
John stores cracked passwords in `~/.john/john.pot`. If a hash is already in the potfile, John won't try to crack it again.
```bash
# View contents of the potfile
cat ~/.john/john.pot

# Clear the potfile (useful for testing)
rm ~/.john/john.pot
```

---

!!! warning
    **Password cracking is resource-intensive and can cause high CPU temperatures. Always monitor your hardware when running long cracking sessions.**
