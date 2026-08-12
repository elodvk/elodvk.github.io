---
title: 'User & Group Privileges Overview'
description: 'Overview of Windows user privileges and group memberships that enable privilege escalation — quick decision guide for exam reference.'
---

# User & Group Privileges — Quick Decision Guide

This is a quick reference page. For detailed exploitation steps, see the dedicated pages:

### User Privileges
- **[SeImpersonate & Potato Attacks](seimpersonate-potato-attacks.md)** — GodPotato, PrintSpoofer, JuicyPotato, etc.
- **[SeDebug Privilege](sedebug-privilege.md)** — LSASS dumping (procdump, comsvcs.dll, Mimikatz)
- **[SeBackup & SeRestore](sebackup-serestore.md)** — SAM/ntds.dit extraction, arbitrary file write
- **[SeTakeOwnership & SeLoadDriver](setakeownership-seloaddriver.md)** — File ownership takeover, Capcom.sys

### Group Privileges
- **[Windows Group Privileges](windows-group-privileges.md)** — DnsAdmins, Server Operators, Backup Operators, Print Operators, Hyper-V Admins, Event Log Readers

---

## Step 1: Check Your Privileges and Groups

```cmd
whoami /priv
whoami /groups
```

---

## Step 2: Privilege Decision Tree

```
                    whoami /priv
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
   SeImpersonate    SeDebug           SeTakeOwnership
          │              │                  │
          ▼              ▼                  ▼
   Use Potato       Dump LSASS         Take ownership
   attacks          (procdump,         of SAM/ntds.dit
   (GodPotato       comsvcs.dll)       then extract hashes
    first)               │                  │
          │              ▼                  ▼
          ▼         Credentials        File Access
       SYSTEM       

          ┌──────────────┼──────────────────┐
          │              │                  │
   SeBackup         SeRestore         SeLoadDriver
          │              │                  │
          ▼              ▼                  ▼
   Copy any file    Write any file    Load vulnerable
   (SAM, ntds.dit)  (replace DLL,     kernel driver
   bypassing DACLs  service binary)   (Capcom.sys)
```

---

## Step 3: Group Decision Tree

```
                    whoami /groups
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
 DnsAdmins         Server Operators    Backup Operators
     │                   │                   │
     ▼                   ▼                   ▼
 Config DNS         Modify service     reg save SAM
 to load DLL        binpath, then      SYSTEM SECURITY
 (UNC path),        restart service    + diskshadow
 restart DNS        → SYSTEM           for ntds.dit
 → SYSTEM                              → all hashes
     │
     ├───────────────────┼───────────────────┐
     │                   │                   │
Print Operators    Hyper-V Admins      Event Log Readers
     │                   │                   │
     ▼                   ▼                   ▼
SeLoadDriver       Clone DC VHD,      Search Event IDs
→ Capcom.sys       mount offline,     4688 & 4104 for
→ kernel exec      extract ntds.dit   cleartext creds
```
