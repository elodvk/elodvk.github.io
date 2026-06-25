---
title: "Credential Hunting in Windows"
description: "Techniques for finding plaintext passwords hidden in files, the registry, scheduled tasks, services, and browser storage on Windows systems."
tags:
  - password-attacks
  - credential-hunting
  - windows
  - registry
  - powershell
icon: material/key
---

# 🔎 Credential Hunting in Windows

While extracting hashes from SAM or LSASS is powerful, it usually requires Local Administrator privileges. **Credential Hunting** is the process of finding plaintext passwords left behind by users or administrators. This can often be done by a standard, unprivileged user.

Users are notoriously bad at managing passwords. You will frequently find them in text files on the desktop, embedded in scripts, or hardcoded in configuration files.

---

## 1️⃣ Hunting in Files and Scripts

Administrators often write automation scripts (PowerShell, Batch) that map network drives or connect to databases, hardcoding credentials directly into the script.

### Searching with PowerShell
You can use `Select-String` (the PowerShell equivalent of `grep`) to recursively search for files containing the word "password".

```powershell
# Search common user directories for text files containing 'password'
cd C:\Users\
Get-ChildItem -Path . -Recurse -Include *.txt, *.ini, *.xml, *.ps1 -ErrorAction SilentlyContinue | Select-String -Pattern "password" -CaseSensitive:$false
```

### Unattend / Sysprep Files
When Windows is installed automatically in enterprise environments, the deployment system uses answer files (e.g., `unattend.xml`). These files often contain local administrator passwords. If the administrators forget to delete them after deployment, they remain readable.

Look for these files:
- `C:\Unattend.xml`
- `C:\Windows\Panther\Unattend.xml`
- `C:\Windows\Panther\Unattend\Unattend.xml`
- `C:\Windows\system32\sysprep.inf`

Inside the XML, look for `<Password>` tags. They may be base64 encoded.

---

## 2️⃣ Hunting in the Registry

The Windows Registry is a massive database of configuration settings. Passwords are sometimes stored here by third-party applications or careless administrators.

### Searching the Registry
You can search the registry using `reg query`:

```cmd
# Search for keys or values containing 'password'
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
```

### AutoLogon Credentials
Administrators sometimes configure machines (like kiosk terminals or digital signage) to log in automatically. The credentials for this are stored in plaintext in the registry.

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon"
```
Look for `DefaultUserName` and `DefaultPassword`.

### Putty Sessions
If the user uses Putty for SSH, you can view their saved sessions (which might hint at target infrastructure).
```cmd
reg query "HKCU\Software\SimonTatham\PuTTY\Sessions"
```

---

## 3️⃣ Hunting in Browsers and Email Clients

If you have compromised a user's machine, their web browser is a treasure trove of saved passwords, session cookies, and history.

As mentioned in the [Attacking Credential Manager](attacking-credential-manager.md) section, you can use tools like **SharpChrome** or **Seatbelt** to decrypt these.

If you cannot run executable tools, simply looking at the browser history can be revealing:
- `C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default\History` (SQLite database)

---

## 4️⃣ Hunting in PowerShell History

PowerShell maintains a history of commands executed by the user. Administrators frequently type commands that include credentials, such as connecting to a database or authenticating to Azure/AWS.

Starting in PowerShell v5, the history is saved to a file on disk.

```powershell
# View the current user's PowerShell history
cat (Get-PSReadLineOption).HistorySavePath

# Default location:
# C:\Users\<username>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

---

## 5️⃣ Automated Credential Hunting (Seatbelt & WinPEAS)

Manually searching through the file system and registry is tedious. You should use automated enumeration scripts.

### WinPEAS (Windows Privilege Escalation Awesome Scripts)
WinPEAS searches for hundreds of common misconfigurations and locations where credentials might be stored.
```cmd
# Run winpeas and pipe to a file
winpeas.exe > C:\temp\peas_output.txt
```

### Seatbelt (GhostPack)
Seatbelt is a C# project that performs a variety of security-oriented host-survey "safety checks," heavily focused on finding credentials.
```cmd
# Run all checks
Seatbelt.exe -group=all

# Run only user-focused checks
Seatbelt.exe -group=user
```

---

!!! tip
    **Check the Recycle Bin.** Users often create a file named `Passwords.txt`, realize it's a security risk, and delete it — but forget to empty the Recycle Bin. You can view the contents of the Recycle Bin via the CLI or GUI.
