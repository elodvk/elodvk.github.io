---
icon: material/shield-account
title: 'Windows Privilege Escalation'
description: 'Comprehensive Windows privilege escalation reference for penetration testing — enumeration, exploitation techniques, tools, and cheatsheets.'
hide:
  - toc
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Windows Privilege Escalation</h1>
<p class="ps-blog-masthead-sub">From initial foothold to SYSTEM — enumeration methodology, privilege abuse, service exploitation, credential theft, and environment breakout techniques.</p>
</div>

## Privilege Escalation Methodology

Privilege escalation on Windows follows a systematic approach: enumerate → identify misconfigurations → exploit → escalate.

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌─────────────┐
│  Initial Access  │───▶│   Enumeration    │───▶│   Exploitation   │───▶│   SYSTEM     │
│  (Low-priv user) │    │  (Situational    │    │  (Abuse misconf, │    │  (Full       │
│                  │    │   awareness)     │    │   privs, creds)  │    │   control)   │
└─────────────────┘    └──────────────────┘    └──────────────────┘    └─────────────┘
```

---

## Situational Awareness — First Commands

When you land on a Windows box, run these immediately to understand your context:

### Who Am I?

```cmd
:: Current user and hostname
whoami
hostname

:: Full token details — SIDs, groups, privileges
whoami /all

:: Just privileges (quick check for juicy ones)
whoami /priv

:: Group memberships
whoami /groups
```

### What's This System?

```cmd
:: OS version, architecture, hotfixes
systeminfo

:: Just OS name and version (faster)
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"

:: Installed patches (check for missing KBs)
wmic qfe list brief

:: Network interfaces and routes
ipconfig /all
route print

:: ARP cache (discover other hosts)
arp -a
```

### Who Else Is Here?

```cmd
:: All local users
net user

:: Detailed user info
net user username

:: Local groups
net localgroup

:: Members of Administrators
net localgroup Administrators

:: Domain info (if domain-joined)
systeminfo | findstr /B /C:"Domain"
net user /domain 2>nul
```

### What's Running?

```cmd
:: Running processes
tasklist /v

:: Processes with services
tasklist /svc

:: Network connections with owning process
netstat -ano

:: Find process listening on a port
netstat -ano | findstr LISTENING

:: Scheduled tasks
schtasks /query /fo TABLE /nh

:: Installed software
wmic product get name,version

:: Running services
sc query state= all
wmic service get name,displayname,pathname,startmode
```

### Defensive Posture

```cmd
:: Check Windows Defender status
sc query WinDefend

:: Check firewall status
netsh advfirewall show allprofiles

:: AppLocker rules (if enforced)
Get-AppLockerPolicy -Effective | Select -ExpandProperty RuleCollections
```

---

## Quick Reference — Attack Surface Checklist

Use this checklist during your exam to systematically check every escalation vector:

| # | Vector | Quick Check Command | What to Look For |
|:--|:-------|:-------------------|:-----------------|
| 1 | **User Privileges** | `whoami /priv` | `SeImpersonate`, `SeDebug`, `SeTakeOwnership`, `SeBackup`, `SeRestore`, `SeLoadDriver` |
| 2 | **Group Memberships** | `whoami /groups` | `DnsAdmins`, `Server Operators`, `Backup Operators`, `Print Operators`, `Hyper-V Admins` |
| 3 | **Unquoted Service Paths** | `wmic service get name,pathname,startmode` | Paths with spaces, not quoted |
| 4 | **Weak Service Permissions** | `accesschk.exe -uwcqv "Everyone" *` | `SERVICE_CHANGE_CONFIG`, `SERVICE_ALL_ACCESS` |
| 5 | **Writable Service Binaries** | `accesschk.exe -uws "Everyone" "C:\Program Files"` | Write access to `.exe` / `.dll` files |
| 6 | **Scheduled Tasks** | `schtasks /query /fo LIST /v` | Tasks running as SYSTEM with writable scripts |
| 7 | **AlwaysInstallElevated** | `reg query HKLM\...\Installer /v AlwaysInstallElevated` | Value = `0x1` = instant SYSTEM |
| 8 | **AutoLogon Creds** | `reg query "HKLM\...\Winlogon"` | `DefaultUserName`, `DefaultPassword` |
| 9 | **Saved Credentials** | `cmdkey /list` | Stored credentials for `runas /savecred` |
| 10 | **Unattended Install Files** | `dir /s C:\Unattend.xml C:\sysprep.inf` | Cleartext/base64 passwords |
| 11 | **PowerShell History** | `type %APPDATA%\...\ConsoleHost_history.txt` | Credentials in command history |
| 12 | **Kernel Exploits** | `systeminfo` → check OS + patch level | Missing patches = potential kernel exploit |
| 13 | **DLL Hijacking** | ProcMon → filter `NAME NOT FOUND` | Missing DLLs in writable paths |
| 14 | **UAC Bypass** | Check `whoami /groups` for Medium IL | If admin but Medium IL, bypass UAC |

---

## Module Reference Guide

| Module | Topics Covered |
|:-------|:-------------|
| [Tools & Enumeration](tools-and-enumeration.md) | WinPEAS, PowerUp, Seatbelt, SharpUp, accesschk, native enumeration |
| [Privileges & Groups Overview](user-and-group-privileges.md) | Quick decision guide for privileges and groups |
| [SeImpersonate (Potato Attacks)](seimpersonate-potato-attacks.md) | GodPotato, PrintSpoofer, JuicyPotato, SweetPotato |
| [SeDebug (LSASS Dumping)](sedebug-privilege.md) | Procdump, comsvcs.dll, Mimikatz, WDigest |
| [SeBackup & SeRestore](sebackup-serestore.md) | SAM/ntds.dit extraction via diskshadow |
| [SeTakeOwnership & SeLoadDriver](setakeownership-seloaddriver.md) | File takeover and Capcom.sys kernel execution |
| [Windows Group Privileges](windows-group-privileges.md) | DnsAdmins, Server Operators, Backup Operators |
| [OS & Service Exploitation Overview](os-and-service-hardening.md) | Quick decision guide for OS and services |
| [Unquoted Service Paths](unquoted-service-paths.md) | Exploiting unquoted paths with spaces |
| [Weak Service Permissions](weak-service-permissions.md) | Modifiable binPath and writable binaries |
| [DLL Hijacking](dll-hijacking.md) | Search order abuse, missing DLLs, DLL proxying |
| [AlwaysInstallElevated & Tasks](always-install-elevated-scheduled-tasks.md) | Malicious MSIs and writable scheduled tasks |
| [UAC Bypass](uac-bypass.md) | fodhelper, eventvwr, UACME, token impersonation |
| [Kernel Exploits](kernel-exploits.md) | Exploit suggesters, EternalBlue, PrintNightmare |
| [Credentials & Environment Overview](credentials-and-environment-security.md) | Quick decision guide for credentials |
| [Credential Hunting](credential-hunting.md) | cmdkey, PS History, Unattend.xml, GPP cPassword |
| [Restricted Environment Breakouts](restricted-environment-breakouts.md) | Escaping Citrix, Constrained Language Mode, AppLocker |
