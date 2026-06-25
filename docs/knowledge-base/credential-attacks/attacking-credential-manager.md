---
title: "Attacking Windows Credential Manager"
description: "How to extract saved web and network passwords from the Windows Credential Manager and Vault."
tags:
  - password-attacks
  - credential-manager
  - vault
  - mimikatz
  - windows
icon: material/card-account-details
---

# 🗃️ Attacking Windows Credential Manager

The **Windows Credential Manager** (and the older Windows Vault) stores credentials that users choose to save for websites, network shares, RDP connections, and Outlook.

Unlike dumping the SAM or LSASS, extracting credentials from the Credential Manager **does not strictly require Local Administrator privileges**. You can extract the saved credentials for the user you have currently compromised.

---

## 1️⃣ Viewing Stored Credentials via CLI

Windows provides a built-in command-line utility, `cmdkey`, which interacts with the Credential Manager.

```cmd
# List all stored credentials for the current user
cmdkey /list
```

**Example Output:**
```text
Currently stored credentials:
    Target: Domain:targetserver
    Type: Domain Password
    User: CORP\admin_svc
```

!!! concept
    `cmdkey /list` only shows you the *targets* and *usernames*. It **does not** output the plaintext passwords. To get the passwords, you must extract and decrypt the vault files.

---

## 2️⃣ Extracting Passwords with Mimikatz

Mimikatz can decrypt the Windows Vault if you have the user's master key. If you are already running in the context of the user, this process is seamless.

### Step 1: List the Vaults
```cmd
mimikatz # vault::list
```

### Step 2: Extract Credentials
```cmd
mimikatz # vault::cred
```
This will output the stored plaintext passwords for the current user's RDP sessions, network shares, and web logins.

---

## 3️⃣ Extracting Web Credentials (DPAPI)

Modern web browsers (Chrome, Edge) use the Windows **Data Protection API (DPAPI)** to encrypt saved passwords, cookies, and credit card data. The encryption key is tied to the user's login password.

If you have a shell as the user, you can decrypt these files using tools like **Seatbelt** or **SharpChrome** (part of the GhostPack toolset).

### Using Seatbelt
Seatbelt can parse the Credential Manager and DPAPI vaults automatically.
```cmd
Seatbelt.exe WindowsVault
Seatbelt.exe DpapiMasterKeys
Seatbelt.exe ChromePresence
```

### Using SharpChrome
```cmd
SharpChrome.exe logins
SharpChrome.exe cookies
```

---

## 4️⃣ Offline Extraction (Requires Master Key)

If you have exfiltrated a user's vault files (located in `%APPDATA%\Microsoft\Credentials` and `%LOCALAPPDATA%\Microsoft\Credentials`) but you are not executing code on the target machine, you must decrypt them offline.

This requires extracting the DPAPI Master Key.

1. **Dump the Master Keys from memory (requires SYSTEM):**
   ```cmd
   mimikatz # privilege::debug
   mimikatz # sekurlsa::dpapi
   ```
2. **Use the Master Key to decrypt the vault offline:**
   (Using Impacket's `dpapi.py` or similar offline parsing tools).

---

!!! tip
    **Always check for saved RDP credentials.** System administrators frequently save their credentials for RDP connections to internal servers. Compromising a developer's machine and finding a saved RDP connection to a staging server is a classic lateral movement path.
