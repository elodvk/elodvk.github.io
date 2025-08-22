---
title: "Dumping & Cracking Hashes 🔐"
sidebar_position: 1
---



In the world of penetration testing, passwords are the ultimate prize. But you'll almost never find them stored in plaintext. Instead, you'll find their cryptographic shadows: **hashes**. A hash is a one-way mathematical function that turns a password into a fixed-length string of characters. While you can't reverse the math, if you can steal the hash, you can either use it directly (Pass the Hash) or try to find the original password.

This guide covers the art of finding and breaking these credentials, including a trip down memory lane to a time when plaintext passwords were much easier to come by.

---

### ## Part 1: The Treasure Chests (Where Hashes Live)

Credentials are stored in three primary locations, each more valuable than the last.

#### **1. The SAM File**
* **What is it?** The **Security Account Manager (SAM)** is a database file found on every Windows machine (`C:\Windows\System32\config\SAM`).
* **What's inside?** It stores the NTLM hashes for all **local** user accounts on that specific computer.
* **How to access it?** You need `SYSTEM` privileges on the local machine. The file is locked while Windows is running, so you typically need to dump it from memory or a backup.

#### **2. The LSASS Process (The Goldmine)**
* **What is it?** The **Local Security Authority Subsystem Service (LSASS)** is a running process (`lsass.exe`) in memory.
* **What's inside?** It caches the credentials of users who are **currently or have recently logged on**. This is the best place to find hashes for domain users on member servers.

* **A Trip Down Memory Lane: The WDigest Protocol**
    * **The "Good" Old Days:** In the past (Windows XP/Server 2003/pre-patched Windows 7/8), LSASS used to be an even bigger treasure chest. To support a web authentication protocol called **WDigest** (Digest Authentication), Windows would store a copy of the user's password in LSASS memory in a reversibly encrypted format.
    * **The Game Changer (Mimikatz):** An attacker with admin rights could use **Mimikatz** and its famous `sekurlsa::wdigest` command to instantly decrypt and dump these credentials as **pure cleartext passwords**. There was no cracking required.
    * **Microsoft's Fix:** This feature was a massive security risk. Microsoft disabled this behavior by default starting in Windows 8.1. For older systems, they released a critical security update **(KB2871997)** that introduced a registry key (`UseLogonCredential` under `HKLM\SYSTEM\CurrentControlSet\Control\Lsa\WDigest\`) which, when set to `0`, prevents WDigest from storing cleartext credentials in memory.
    * **Why it Still Matters:** While off by default now, you might still find this enabled on unpatched legacy systems or in environments where an old application specifically required it. It's always worth checking for.

#### **3. The NTDS.dit File (The Crown Jewels)**
* **What is it?** This is the **Active Directory database**. It exists *only* on Domain Controllers.
* **What's inside?** The NTLM hashes for **every single user and computer account** in the entire domain.
* **How to access it?** You need Domain Admin (or equivalent) privileges to dump it remotely.

---

### ## Part 2: The Crowbars (Tools for Dumping)

You need the right tool to pry open these treasure chests.

#### **1. Mimikatz (The Post-Exploitation Scalpel)**
Once you have high privileges on a machine, Mimikatz is the go-to tool for dumping credentials from memory. Its `sekurlsa::logonpasswords` command will attempt to dump all available credentials, including NTLM hashes and, if WDigest is enabled, cleartext passwords.

#### **2. Impacket's `secretsdump.py` (The Remote Dumper)**
This is a pentester's favorite for remotely dumping **SAM** and **NTDS.dit** files with a single command once you have privileged credentials.

* **How to Use:**
    ```bash
    secretsdump.py 'corp.local/j.smith:Password123!'@192.168.1.10
    ```

#### **3. NetExec / nxc (The Mass-Production Tool)**
Use `netexec` to run commands like hash dumping across entire subnets, targeting machines where your compromised user has admin rights.

* **How to Use:**
    ```bash
    nxc smb 192.168.1.0/24 -u j.smith -p 'Password123!' --lsa
    ```

---

### ## Part 3: The Codebreakers (Understanding & Cracking Hashes)

#### **Types of Hashes: What Works and What Doesn't**

* **NTLM Hash:** This is the primary hash we care about. It's used for Pass the Hash attacks and is the most common hash you will crack.
* **DCC2 Hash (Domain Cached Credentials):** A much stronger, salted hash used for offline logons. You cannot "pass" this hash; your only option is to attempt to crack it, which is significantly slower than cracking NTLM.

#### **The Cracking Process with Hashcat**

**Hashcat** is the industry-standard tool for password cracking.

* **The Commands:**
    ```bash
    # Cracking NTLM Hashes (fast)
    # -m 1000 is the mode for NTLM
    hashcat -m 1000 ntlm_hashes.txt /usr/share/wordlists/rockyou.txt

    # Cracking DCC2/MS-Cache V2 Hashes (slow)
    # -m 2100 is the mode for DCC2
    hashcat -m 2100 dcc2_hashes.txt /usr/share/wordlists/rockyou.txt
    ```
The goal is to dump all available credentials, prioritize cracking the faster NTLM hashes, and use any cracked passwords to escalate privileges and expand your access.