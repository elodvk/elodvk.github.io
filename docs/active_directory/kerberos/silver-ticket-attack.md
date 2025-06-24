---
title: "Silver Ticket"
categories: []
tags: []
author: bilash
mermaid: true
---

A **silver ticket attack** is a post-exploitation technique that allows an attacker to gain unauthorized access to a specific service on a particular machine within a Windows Active Directory domain. Unlike the more powerful golden ticket attack which targets the Kerberos Ticket Granting Ticket (TGT) for domain-wide compromise, the silver ticket attack focuses on forging a **Kerberos Ticket Granting Service (TGS)** ticket for a single service (like CIFS for file sharing, HTTP for web services, or MSSQL for databases) running on a specific server. This forged ticket enables the attacker to authenticate directly to that service, bypassing the need for a legitimate Kerberos authentication flow involving the Domain Controller (DC).

## How the Kerberos Protocol Works (Briefly)

To understand the silver ticket attack, it's helpful to have a basic grasp of the relevant parts of the Kerberos authentication process:

1.  **Authentication Service Exchange (AS-REQ/AS-REP):** A user logs in and requests a TGT from the KDC (Domain Controller). If the credentials are valid, the KDC issues a TGT, encrypted with the user's password hash, and a session key.
2.  **Ticket Granting Service Exchange (TGS-REQ/TGS-REP):** When the user wants to access a service, their client presents the TGT to the KDC and requests a TGS for that specific service. The KDC validates the TGT and the user's authorization, and if approved, issues a TGS encrypted with the **service account's password hash**. A session key for the client-service communication is also included.
3.  **Client-Server Exchange (AP-REQ/AP-REP):** The user's client presents the TGS to the target service. The service decrypts the TGS using its own secret key (derived from the service account's password hash). If successful, the service trusts the ticket and the user's identity and grants access based on the permissions specified in the ticket (within the Privilege Attribute Certificate - PAC).

## How a Silver Ticket Attack Works

The silver ticket attack exploits the trust relationship in the third step of the Kerberos process. The key vulnerability is that the service primarily trusts the TGS because it can successfully decrypt it using its own secret key. The service doesn't typically go back to the KDC to re-validate the ticket's authenticity after the initial issuance.

Here's a detailed breakdown of the attack steps:

1.  **Initial Foothold and Reconnaissance:** The attacker first gains access to a system on the network. This could be through various means like exploiting a vulnerability, a successful phishing attack, or compromising weak credentials. Once inside, the attacker performs reconnaissance to identify valuable target services (e.g., file servers, database servers, web applications) and the specific server hosting them. They also need to identify the domain's FQDN and SID.
2.  **Obtain the Service Account NTLM Hash:** This is the most critical step and the core requirement for a silver ticket attack. The attacker needs to obtain the NTLM hash of the password for the Active Directory account that the target service is running under. Common methods for obtaining this hash include:
    * **Credential Dumping:** If the attacker has local administrator privileges on a machine where the service account has logged in or its credentials have been cached, they can use tools like **Mimikatz** to extract the NTLM hash from memory (LSASS process).
    * **Kerberoasting (Less Direct but Can Lead to Hashes):** While Kerberoasting targets service account hashes stored in Active Directory for *offline* cracking, a successfully cracked Kerberoasted hash for a service account is exactly what's needed for a silver ticket attack targeting that service.
    * **Exploiting Vulnerabilities:** Certain vulnerabilities in systems or services might allow attackers to extract credentials, including service account hashes.
3.  **Gather Domain and Service Information:** The attacker needs specific information to craft the ticket:
    * **Domain FQDN:** The fully qualified domain name of the Active Directory domain.
    * **Domain SID:** The Security Identifier of the domain. This can often be obtained using built-in Windows tools or reconnaissance scripts.
    * **Target Server FQDN:** The fully qualified domain name of the server hosting the target service.
    * **Target Service SPN:** The Service Principal Name associated with the target service. SPNs are unique identifiers for services instances in a Kerberos environment (e.g., `cifs/fileserver.domain.com`, `http/webapp.domain.com`, `mssql/dbserver.domain.com`).
4.  **Forge the TGS Ticket:** Using the gathered information and the crucial service account NTLM hash, the attacker uses a tool to forge the TGS ticket. The forged ticket will contain:
    * An arbitrary username (the attacker can choose to impersonate any user, even a fake one).
    * The domain SID.
    * The target service's SPN.
    * A validity period (often set to a very long time for persistence).
    * Crucially, a Privilege Attribute Certificate (PAC) that the attacker can manipulate to include arbitrary group memberships and privileges for the impersonated user. This PAC is then signed using the compromised service account's NTLM hash.
    * The entire ticket is then encrypted using the same service account NTLM hash.
    * **Tools Used for Forging:** The most well-known tool for forging silver tickets is **Mimikatz**. Other frameworks like **Impacket** also contain scripts for this purpose.

    * **Example Mimikatz Command (Conceptual):**
        ```
        kerberos::golden /domain:<domain_name> /sid:<domain_sid> /target:<target_server_fqdn> /service:<service_spn> /rc4:<service_account_ntlm_hash> /user:<impersonated_username> /ptt
        ```
        *Note: The `golden` module in Mimikatz is used for both golden and silver tickets, with the key difference being the `/service` and `/target` parameters and the use of the service account hash instead of the `krbtgt` hash.*

5.  **Present the Forged Ticket:** The attacker injects the forged TGS ticket into their current Windows session's Kerberos ticket cache. When the attacker then attempts to access the target service (e.g., by trying to access a shared folder on the file server if the service is CIFS), the Windows client will present the forged TGS ticket from its cache directly to the service.
6.  **Service Grants Access:** The target service receives the ticket, attempts to decrypt it using its service account's secret key (derived from the NTLM hash), and successfully does so because the attacker used the correct hash to encrypt the ticket. The service then reads the (potentially manipulated) PAC within the ticket, sees the high privileges of the impersonated user, and grants access to the attacker.

## Tools Commonly Used

* **Mimikatz:** The most popular and powerful tool for performing various Kerberos attacks, including forging silver tickets. It can extract credentials, perform pass-the-hash, pass-the-ticket, and forge golden and silver tickets.
* **Impacket:** A collection of Python classes for working with network protocols. It includes scripts like `ticketer.py` that can be used to forge Kerberos tickets, including silver tickets.
* **PowerShell/PowerView:** These tools are often used for initial reconnaissance to gather information like the domain SID, server names, and potentially identify service accounts and their SPNs (though not for hash extraction or ticket forging directly).

## Examples of Target Services and SPNs

Silver ticket attacks can target any service that uses Kerberos authentication and runs under a service account. Common targets include:

* **CIFS (Common Internet File System):** Used for file sharing. SPN format: `cifs/<server_fqdn>`. A silver ticket for CIFS on a file server would grant access to shared folders on that server with the impersonated user's forged privileges.
* **HTTP:** Used for web services. SPN format: `http/<server_fqdn>`. Can grant access to web applications running under a service account.
* **MSSQL (Microsoft SQL Server):** Used for database services. SPN format: `mssqlsvc/<server_fqdn>:<port>` or `mssqlsvc/<server_fqdn>`. A silver ticket could grant access to SQL databases.
* **HOST:** A generic SPN often associated with the computer account, providing broad access to local services. SPN format: `host/<server_fqdn>`.
* **RPCSS (Remote Procedure Call Subsystem):** SPN format: `rpcss/<server_fqdn>`.
* **WMI (Windows Management Instrumentation):** Often relies on HOST or RPCSS SPNs.

The attacker chooses the target service based on their objectives and the availability of a compromised service account hash for that service.

## Impact of a Silver Ticket Attack

Even though a silver ticket is scoped to a specific service on a specific server, the impact can be severe:

* **Unauthorized Data Access/Modification:** Accessing file shares, databases, or applications can lead to sensitive data breaches or manipulation.
* **Privilege Escalation:** If the targeted service runs with elevated privileges on the server, the attacker effectively gains those privileges on that machine.
* **Lateral Movement:** While the ticket is for a specific service, the access gained can facilitate further reconnaissance and attacks from the compromised server.
* **Persistence:** A silver ticket provides a persistent backdoor to the specific service, even if the initial compromise vector is closed or user account passwords are changed (unless the service account password itself is changed).

## Detection and Prevention

Detecting and preventing silver ticket attacks is challenging due to their nature but not impossible:

**Prevention:**

* **Secure Service Accounts:**
    * **Strong, Unique Passwords:** Enforce complex and unique passwords for all service accounts.
    * **Regular Password Rotation:** Regularly change service account passwords.
    * **Principle of Least Privilege:** Ensure service accounts have only the absolute minimum permissions required.
    * **Avoid High Privileges:** Do not run services under Domain Admin or other highly privileged accounts.
    * **Use gMSAs/MSAs:** Utilize Group Managed Service Accounts or Managed Service Accounts where possible. These accounts have automatically managed, strong passwords, significantly mitigating the risk of hash theft and forging.
* **Limit Credential Exposure:**
    * **Enable Credential Guard:** On supported Windows versions, Credential Guard uses virtualization-based security to protect LSASS and prevent credential dumping.
    * **Restrict Administrative Privileges:** Limit the number of users with local administrator rights on servers.
    * **Patching and Vulnerability Management:** Regularly patch systems and address vulnerabilities that could be used for initial compromise or credential theft.
* **Network Segmentation:** Segment your network to limit the blast radius of a compromise and make it harder for attackers to reach high-value targets even with a forged ticket.

**Detection:**

* **Monitor Windows Event Logs:** While direct detection of ticket *forging* is difficult, monitoring the *usage* of potentially forged tickets can reveal suspicious activity:
    * **Event ID 4769 (A Kerberos service ticket was requested):** Monitor this event on domain controllers and targeted servers. Look for anomalies such as:
        * Requests for service tickets by accounts that shouldn't be accessing that service.
        * Service tickets with unusually long lifetimes.
        * Service tickets using older, weaker encryption types (like RC4) if your environment is configured for stronger AES encryption.
        * Requests for services that don't exist.
        * Logons to service machines (Event ID 4624) without corresponding TGT requests (Event ID 4768) on the DC for the same account in a timely manner.
    * **Monitor Service Account Activity:** Look for unusual logon locations, times, or access patterns for service accounts.
* **Analyze Kerberos Traffic:** While silver tickets bypass the KDC request, their usage involves communication between the client and the service. Network monitoring tools might detect anomalies in this traffic, although this can be challenging due to encryption.
* **Behavioral Analytics (UEBA):** User and Entity Behavior Analytics solutions can help detect unusual activity patterns that might indicate the use of forged tickets, such as an account accessing resources they've never accessed before or accessing resources at strange times.
* **Require PAC Validation:** Configure services to require and validate the PAC. While attackers can forge the PAC, enabling validation adds a layer of defense and can potentially generate alerts if the validation fails.

By combining strong preventive measures, particularly around service account management, with diligent monitoring and behavioral analysis, organizations can improve their ability to detect and mitigate the risks associated with silver ticket attacks.