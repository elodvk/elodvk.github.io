---
title: 'Credentials & Environment Security Overview'
description: 'Overview of Windows credential hunting and restricted environment breakouts.'
---

# Credentials & Environment Security — Quick Reference

This is a quick reference page. For detailed exploitation steps, see the dedicated pages:

- **[Credential Hunting](credential-hunting.md)** — Searching registry, Unattend.xml, PS history, cmdkey, DPAPI, IIS configs
- **[Restricted Environment Breakouts](restricted-environment-breakouts.md)** — Escaping Citrix, Constrained Language Mode, and AppLocker

---

## Top 5 Quick Wins (Check These First!)

During an exam, these take 2 minutes to check and often yield immediate results:

### 1. Saved Credentials (cmdkey)

```cmd
cmdkey /list
:: If you see admin creds:
runas /savecred /user:DOMAIN\admin "cmd.exe"
```

### 2. PowerShell History

```cmd
type %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

### 3. Unattend.xml Files

```cmd
dir /s /b C:\Unattend.xml 2>nul
dir /s /b C:\Windows\Panther\Unattend.xml 2>nul
```

### 4. AutoLogon Registry Keys

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" 2>nul | findstr /i "DefaultUserName DefaultPassword"
```

### 5. GPP cPassword (Domain Environment)

```cmd
findstr /si "cpassword" \\%USERDNSDOMAIN%\SYSVOL\%USERDNSDOMAIN%\Policies\*.xml 2>nul
```
