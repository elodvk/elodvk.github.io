---
title: 'OS & Service Exploitation Overview'
description: 'Overview of Windows OS and service-level vulnerabilities for privilege escalation.'
---

# OS & Service Exploitation — Quick Reference

This is a quick reference page. For detailed exploitation steps, see the dedicated pages:

- **[Unquoted Service Paths](unquoted-service-paths.md)** — Exploiting unquoted paths with spaces
- **[Weak Service Permissions](weak-service-permissions.md)** — Modifiable service config (`binPath`) and writable binaries
- **[DLL Hijacking](dll-hijacking.md)** — Search order abuse, missing DLLs, DLL proxying
- **[AlwaysInstallElevated & Tasks](always-install-elevated-scheduled-tasks.md)** — Malicious MSIs and writable scheduled tasks
- **[UAC Bypass](uac-bypass.md)** — fodhelper, eventvwr, UACME, token impersonation
- **[Kernel Exploits](kernel-exploits.md)** — Exploit suggesters, EternalBlue, PrintNightmare, HiveNightmare

---

## Quick Detection Cheatsheet

### 1. Unquoted Service Paths

```cmd
wmic service get name,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\Windows" | findstr /i /v """
```

### 2. Modifiable Services (Requires PowerUp/accesschk)

```powershell
# PowerUp
Get-ModifiableService
Get-ModifiableServiceFile
```

### 3. AlwaysInstallElevated

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
:: Both must be 1 (0x1)
```

### 4. Scheduled Tasks

```cmd
schtasks /query /fo LIST /v | findstr /B /C:"TaskName" /C:"Run As User" /C:"Task To Run" | findstr -A 1 "SYSTEM"
```

### 5. Kernel Vulnerabilities (Requires wesng/Sherlock)

```cmd
systeminfo > sysinfo.txt
:: Run wesng against sysinfo.txt on attacker machine
```
