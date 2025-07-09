---
title: "AS-REP Roasting"
sidebar_position: 2
---

## What is AS-REP Roasting?

AS-REP Roasting is an attack that targets user accounts in an Active Directory environment that have a specific, and often insecure, configuration: Kerberos pre-authentication disabled. By exploiting this misconfiguration, an attacker can request an Authentication Server Response (AS-REP) from a Domain Controller for a user. This response contains a portion of data encrypted with the user's password hash. The attacker can then take this encrypted data offline and attempt to crack the password using brute-force or dictionary attacks.

The beauty of this attack from an adversary's perspective is its stealth. It doesn't require any prior authentication to the domain and can be executed with just a list of potential usernames.

## How It Works

To understand AS-REP Roasting, we need a basic grasp of the Kerberos authentication process.

Normally, when a user initiates a login, the Kerberos authentication process begins with an Authentication Server Request (AS-REQ). This initial request includes a timestamp encrypted with the user's password hash. This is known as pre-authentication. The Domain Controller (DC) receives this request and, if it can successfully decrypt the timestamp using its copy of the user's password hash, it proves the user knows the password. The DC then sends back an Authentication Server Response (AS-REP) containing the Ticket Granting Ticket (TGT).

However, some user accounts can be configured with the "Do not require Kerberos preauthentication" flag enabled. When this flag is set, the initial pre-authentication step is skipped. An attacker can send an AS-REQ for a user with this setting, and the DC will directly return an AS-REP. A part of this AS-REP message is encrypted with the user's NTLM password hash.

This is the golden ticket for the attacker. They now have a legitimate piece of encrypted data that they can work on cracking offline, without fear of triggering account lockout policies on the domain.

## Identifying Vulnerable Accounts

The first step for an attacker is to find user accounts susceptible to this attack. This can be achieved using various tools that query the Active Directory for users with the DONT_REQ_PREAUTH attribute set. PowerShell scripts and tools like GetNPUsers.py from the popular Impacket suite are commonly used for this purpose.

A simple PowerShell command to identify such users might look like this:

```powershell
Get-ADUser -Filter {UserAccountControl -band 4194304} -Properties SamAccountName, DistinguishedName
```

This command filters for users where the "Do not require Kerberos preauthentication" flag is set within their UserAccountControl attribute.

## The Exploitation: Roasting for Hashes
Once vulnerable accounts are identified, the attacker can use tools to request the AS-REP and extract the crackable hash.

A popular tool for this is Impacket's GetNPUsers.py. An attacker would run a command similar to the following:

```shell
impacket-GetNPUsers contoso.local/ -usersfile users.txt -format hashcat -outputfile hashes.txt
```

In this command:

 - `contoso.local/` is the target domain.

 - `-usersfile users.txt` specifies a file containing a list of potential usernames.

 - `-format hashcat` formats the output hash in a way that is compatible with the password cracking tool Hashcat.

 - `-outputfile hashes.txt` saves the captured hashes to a file.

With the hashes in hand, the attacker can then use a powerful password cracking tool like Hashcat or John the Ripper to find the plaintext password.


## Why is This a Serious Threat?

AS-REP Roasting poses a significant risk for several reasons:

 - **Stealthy**: The initial reconnaissance and the attack itself generate minimal noise and are less likely to be detected by standard security monitoring.

 - **No Prior Access Required**: An attacker doesn't need a foothold within the network to perform the initial stages of this attack. If they have network access to a Domain Controller, they can attempt it.

 - **Offline Cracking**: The password cracking process is done on the attacker's own machine, meaning there are no repeated failed login attempts on the domain that would trigger alerts or account lockouts.

 - **Weak Passwords are Easy Targets**: If users have weak or common passwords, cracking the captured hash can be a trivial task for a determined attacker.

## Defending Against AS-REP Roasting: Your Shield and Sword

Fortunately, defending against AS-REP Roasting is straightforward and highly effective. Here are the key mitigation strategies:

1. **Enforce Kerberos Pre-authentication**: This is the most critical defense. Ensure that the "Do not require Kerberos preauthentication" setting is disabled for all user accounts, especially for privileged ones. This setting is often enabled for compatibility with older systems or third-party applications. If it's necessary for a specific service account, ensure the password is exceptionally strong and regularly rotated. You can use PowerShell to find and disable this setting on accounts:

    ```PowerShell
    Get-ADUser -Filter {UserAccountControl -band 4194304} | Set-ADUser -Replace @{userAccountControl=($_.userAccountControl -bxor 4194304)}
    ```

2. **Implement Strong Password Policies**: Enforce the use of long, complex passwords that are difficult to brute-force. A strong password policy is a fundamental defense against any password-based attack.

3. **Monitor for Suspicious Activity**: While the attack is stealthy, it's not invisible. Monitor for a large number of AS-REQ requests from a single source for various users, especially if those requests are for accounts that don't typically authenticate from that source. Security Information and Event Management (SIEM) systems can be configured to detect such patterns. Specifically, monitor for Windows Event ID 4768 (A Kerberos authentication ticket (TGT) was requested) where the `Pre-Authentication Type is 0`.

4. **Regularly Audit User Accounts**: Periodically audit your Active Directory for misconfigurations, including accounts with pre-authentication disabled. Tools like PingCastle or built-in security assessment features can help automate this process.

By understanding the mechanics of AS-REP Roasting and implementing these defensive measures, you can significantly reduce your organization's attack surface and protect your valuable user credentials from being compromised. Stay vigilant, stay secure.