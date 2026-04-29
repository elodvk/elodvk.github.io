---
title: "Kerberoasting 🔥"
sidebar_position: 2
---

So you've landed in a target network, and you have a single, low-privilege domain user account. You can't dump hashes from the Domain Controller, and you don't have local admin anywhere. What do you do? Do you pack up and go home? No. You fire up the grill, because it's time for a **Kerberoasting**.

Kerberoasting is one of the most effective and stealthy attacks in any pentester's arsenal. It's a method of extracting password hashes for Active Directory **service accounts** and cracking them offline. The best part? **You can do it as any authenticated domain user.** You don't need any special privileges.

Think of it like this: You're a tourist in a kingdom (a low-privilege user). You walk up to the royal quartermaster (the Domain Controller) and say, "I'd like a key to the royal stable's hayloft, please." The quartermaster, not caring who you are, gives you a key (a Kerberos ticket). The vulnerability is that this key is made of a special metal that is secretly encrypted with the stable master's password. You can take this key, go back to your lab, analyze the metal, and figure out the stable master's password. And as it turns out, the stable master often uses a very simple password.

---

## The "Why": Service Principal Names (SPNs)

This entire attack hinges on a feature of Kerberos called a **Service Principal Name (SPN)**.

An SPN is essentially a unique username for a *service*. When a service like Microsoft SQL Server or a custom web application needs to be integrated with Kerberos authentication, an SPN is registered to the user account that runs that service. For example: `MSSQLSvc/sql01.corp.local:1433`.

Here's the crucial part: To ensure everything works correctly, **any authenticated user in the domain is allowed to request a Kerberos service ticket (a Ticket-Granting Service ticket, or TGS) for any SPN.** This is a fundamental feature, not a bug.

The ticket that the Domain Controller sends back is encrypted. A portion of this ticket is encrypted with the NTLM hash of the password of the **service account** itself. And that's our golden ticket.

---

## The Heist: From Ticket Request to Plaintext

The attack flow is simple, elegant, and devastatingly effective.

1.  **Find the Targets:** We ask Active Directory, "Show me all the user accounts that are being used to run services" (i.e., all accounts with an SPN set).
2.  **Request the Tickets:** As our low-privilege user, we go to the Domain Controller for each of those services and say, "Hi, I'd like a ticket for the MSSQL service, please." The Domain Controller happily gives us one. We do this for all the services we found.
3.  **Extract the Hashes:** The tickets we receive are now in our possession. We can extract the encrypted part from each ticket, which contains the service account's hash.
4.  **Crack Offline:** We take these extracted hashes back to our powerful cracking rig and use a tool like **Hashcat** to crack them.

Service account passwords are often a pentester's dream. They are frequently weak, rarely changed (sometimes set to "never expire"), and often have high privileges to run their applications.


## The Tools and Commands

The best tool for this job is Impacket's `GetUserSPNs.py`, which automates the first three steps for us.

### Step 1: Request Tickets and Dump Hashes

From your attacker machine, run this command using your low-privilege user's credentials.

```shell
# This will find all kerberoastable accounts and request tickets for them,
# saving the crackable hashes to a file.
GetUserSPNs.py -request -dc-ip 192.168.1.10 'corp.local/j.smith:Password123!' -outputfile kerberoastable_hashes.txt
```

 - `-request`: Tells the tool to actually request the TGS tickets.
 - `-dc-ip 192.168.1.10`: The IP of the Domain Controller.
 - `'corp.local/j.smith:Password123!'`: Your compromised user's credentials.
 - `-outputfile` ...: The file where the extracted, crackable hashes will be saved.

### Step 2: Crack with Hashcat

Now, take `kerberoastable_hashes.txt` and feed it to `Hashcat`. The hash mode for these Kerberos TGS tickets is **13100**.

```shell
hashcat -m 13100 kerberoastable_hashes.txt /usr/share/wordlists/rockyou.txt
```

If any of the service accounts have a weak password that exists in your wordlist, Hashcat will pop it in minutes. You now have the plaintext password for a service account, which could be anything from a simple web admin to a full-blown Domain Admin.


## Mitigation: How to Stop the BBQ

 - **STRONG PASSWORDS**: This is the number one defense. Service account passwords should be long (25+ characters) and complex. Since a human doesn't need to type them, there's no excuse for them to be weak.

 - **Use Group Managed Service Accounts (gMSA)**: This is the modern, preferred way to run services. gMSAs use automatically managed, complex 240-character passwords that are rotated regularly by Active Directory itself, making them impossible to crack.

 - **Principle of Least Privilege**: A service account for a web server does not need to be a member of the Domain Admins group. Grant it only the permissions it absolutely needs to function.

 - **Monitoring**: It is possible to detect Kerberoasting by monitoring for an unusual number of TGS ticket requests, especially for tickets using weaker RC4 encryption. However, this can be difficult to distinguish from normal network traffic.