---
title: "Introduction to Hashcat"
description: "A guide to using Hashcat for GPU-accelerated password cracking, covering attack modes, hash types, and optimization."
tags:
  - password-cracking
  - hashcat
  - gpu
  - hashes
  - brute-force
icon: material/pound
---

# 🚀 Introduction to Hashcat

**Hashcat** is the world's fastest and most advanced password recovery utility. Unlike John the Ripper, which primarily uses the CPU, Hashcat is designed to leverage the massive parallel processing power of modern GPUs (Graphics Processing Units). This makes it exponentially faster at cracking simple hashes like MD5 and NTLM.

---

## 1️⃣ Basic Syntax & Requirements

Hashcat requires you to explicitly define the **hash type** (`-m`) and the **attack mode** (`-a`).

```bash
hashcat -m [hash type] -a [attack mode] [hash file] [wordlist]
```

### Identifying the Hash Type
You must tell Hashcat exactly what type of hash you are trying to crack. Use `hashid` or `name-that-hash` to identify unknown hashes, then look up the corresponding code in Hashcat's help menu.

```bash
# Search Hashcat's help menu for the hash code
hashcat --help | grep -i "ntlm"
# Output: 1000 | NTLM

hashcat --help | grep -i "sha256"
# Output: 1400 | SHA2-256
```

---

## 2️⃣ Common Hash Modes (`-m`)

| Code | Hash Type | Example Use Case |
|------|-----------|------------------|
| `0` | MD5 | Old web apps, generic hashes. |
| `1000` | NTLM | Windows passwords. |
| `1800` | SHA-512(Unix) | Linux `/etc/shadow` passwords. |
| `3200` | bcrypt | Modern web apps. |
| `5600` | NetNTLMv2 | SMB relay attacks, Responder captures. |
| `13000` | RAR5 | Encrypted WinRAR archives. |
| `13721` | VeraCrypt | Encrypted volumes. |
| `22000` | WPA-PBKDF2-PMKID+EAPOL | Wi-Fi cracking (modern hc22000 format). |

---

## 3️⃣ Attack Modes (`-a`)

Hashcat supports several attack modes to suit different scenarios.

### Mode 0: Straight (Dictionary Attack)
Tries every word in a wordlist.
```bash
# Crack NTLM hashes using rockyou.txt
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

### Mode 1: Combination
Combines words from multiple dictionaries (e.g., `wordlist1.txt` + `wordlist2.txt` -> `Password` + `123` = `Password123`).
```bash
hashcat -m 1000 -a 1 hashes.txt wordlist1.txt wordlist2.txt
```

### Mode 3: Brute-Force / Mask Attack
Uses a defined "mask" to generate candidates. Excellent when you know the password structure (e.g., 8 characters, starting with a capital letter, ending with two digits).

**Mask Charsets:**
- `?l` = lowercase a-z
- `?u` = uppercase A-Z
- `?d` = digits 0-9
- `?s` = special characters
- `?a` = all of the above

```bash
# Mask: uppercase, 5 lowercase, 2 digits (e.g., Password12)
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?d?d

# Brute force ALL 6-character lowercase passwords
hashcat -m 1000 -a 3 hashes.txt ?l?l?l?l?l?l
```

### Mode 6 & 7: Hybrid Attacks
Combines a dictionary with a mask.
- **Mode 6:** Dictionary + Mask (e.g., `rockyou.txt` + `?d?d?d`)
- **Mode 7:** Mask + Dictionary (e.g., `?u?l` + `rockyou.txt`)

```bash
# Append 4 digits to every word in rockyou.txt (e.g., Password2024)
hashcat -m 1000 -a 6 hashes.txt /usr/share/wordlists/rockyou.txt ?d?d?d?d
```

---

## 4️⃣ Rules

Rules apply transformations to wordlists (e.g., capitalizing the first letter, appending symbols, replacing 'a' with '@'). Hashcat comes with several excellent rule files.

```bash
# Apply the best64 ruleset (fast and effective)
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# Apply the Dive ruleset (comprehensive but slower)
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/dive.rule

# Apply OneRuleToRuleThemAll (custom, highly recommended)
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt -r /path/to/OneRuleToRuleThemAll.rule
```

---

## 5️⃣ Optimization and Options

Hashcat is highly configurable to squeeze maximum performance out of your hardware.

| Flag | Description |
|------|-------------|
| `-O` | Enable optimized kernels (limits password length to 31 chars, but faster). |
| `-w 3` | Workload profile 3 (High). Makes the desktop sluggish but increases hash rate. |
| `--show` | Show already cracked passwords from the potfile. |
| `--status` | Automatically show status updates. |
| `--status-timer=10` | Show status every 10 seconds. |
| `--session` | Name the session for easier resuming. |
| `--restore` | Resume a stopped session. |

### Example: Fully Optimized NTLM Crack
```bash
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r best64.rule -O -w 3
```

---

## 6️⃣ Gotchas and Troubleshooting

!!! note
    **"Token length exception" error:** This usually means you have selected the wrong hash mode (`-m`), or the hashes are improperly formatted in your text file (e.g., trailing spaces, wrong delimiter).

!!! note
    **"No hashes loaded" error:** Hashcat expects a specific format for each hash type. Look up example hashes on the [Hashcat Example Hashes page](https://hashcat.net/wiki/doku.php?id=example_hashes) and ensure your file matches the format perfectly.

!!! note
    **GPU Driver Issues:** Hashcat relies heavily on OpenCL and proprietary GPU drivers. If it falls back to the CPU or throws OpenCL errors, ensure your Nvidia/AMD drivers and compute toolkits are correctly installed.

---

!!! warning
    **Hashcat will push your GPU to its absolute thermal limits. Ensure your cooling is adequate before running long jobs on personal hardware to prevent damage.**
