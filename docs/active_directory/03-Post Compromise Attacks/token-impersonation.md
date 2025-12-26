---
title: "Token Impersonation"
sidebar_position: 3
---

You've compromised a server. You have a shell, but you're running as a low-privilege service account like `NT AUTHORITY\NETWORK SERVICE`. You run `whoami /groups` and see that you have a very interesting privilege: `SeImpersonatePrivilege`. Suddenly, your day just got a lot better.

Welcome to the world of **Token Impersonation**, also known as Token Theft. This isn't about stealing a password hash to crack later. This is about stealing a user's *active login session* right out from under them. If a Domain Admin is logged onto the server you just compromised, you don't need their password; you just need to borrow their identity for a little while.

Think of it like this: A Domain Admin swipes their master keycard to enter a secure room (they log onto the server). The system grants them a temporary security token that says "This person is a Domain Admin." Instead of trying to steal the master keycard, you, the sneaky intruder, simply clone that temporary token. For as long as that token is valid, the system's doors will open for you just as they would for the real admin.

---

## The "Why": Understanding Windows Access Tokens

Every time a user logs into Windows, the system creates an **access token**. This token is like a digital ID card that is attached to every process the user starts. It contains information about the user, their group memberships (like "Domain Admins"), and their specific privileges.

When that user tries to access a file or perform an action, Windows checks their token to see if they have permission.

The key to this attack is that Windows processes can have two types of tokens:

1.  **Primary Token:** The main token that defines the process's identity.
2.  **Impersonation Token:** A temporary token that a thread within a process can use to act on behalf of a *different* user.

If you have the right privileges (`SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege`), you can tell your process to drop its boring, low-privilege token and start using the high-privilege impersonation token of another user who is logged onto the same system.

---

## The Heist: The Art of Identity Theft

This attack is a classic post-exploitation technique for privilege escalation on a single machine.

1.  **Get a Foothold:** You compromise a machine and get a shell. This is often a web server where you're running as a service account.
2.  **Check Your Privileges:** The first thing you do is check who you are and what privileges you have.
    ```powershell
    whoami /priv
    ```
    If you see `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege` in the list, it's game on. These are very common for service accounts like `NETWORK SERVICE`.
3.  **Find Your Target:** You need to find a high-value user who is also logged onto the machine. You can list running processes and see who owns them. You're looking for a process owned by a Domain Admin or another privileged account.
4.  **Steal the Token:** Using a specialized tool, you find the process belonging to the Domain Admin and steal its access token.
5.  **Impersonate:** Your current process or thread adopts the stolen token. Running `whoami` now will show that you are the Domain Admin.
6.  **Profit:** You now have all the rights and permissions of the user you are impersonating. You can add a new user, access sensitive files, or use this new identity to move laterally to other machines.

---

## The Tools and Commands

The original and most famous tool for this was **Incognito**, which now lives on as a module inside both Metasploit and Mimikatz.

### **Using Metasploit's Incognito**

If you have a Meterpreter shell, this is incredibly easy.

```shell
meterpreter > use incognito
meterpreter > list_tokens -u

Delegation Tokens Available
========================================
CORP\DomainAdmin
NT AUTHORITY\LOCAL SERVICE
...

meterpreter > impersonate_token "CORP\\DomainAdmin"
[+] Successfully impersonated user CORP\DomainAdmin

meterpreter > getuid
Server username: CORP\DomainAdmin

meterpreter > shell
C:\Windows\system32> whoami
corp\domainadmin
```

In just two commands, you went from a low-privilege shell to a command prompt running as a Domain Admin.

### **Using Standalone Tools**

On a compromised machine, you can use a number of tools. The popular "PrintSpoofer" exploit, for example, abuses the printer service to get a `SYSTEM` shell, from which you can easily steal any token.

After getting `SYSTEM` (for example, with PrintSpoofer), you can use built-in Windows commands or PowerShell to create a new process running as that user. The concept is to find the process ID of a privileged user's process (e.g., `winlogon.exe`) and then steal its token to launch a new process like `cmd.exe`.

---

## How It Fits into Your Attack Strategy

Token Impersonation is a primary **local privilege escalation** technique.

* **It's the Next Step after a Foothold:** It's often the very first thing you try after compromising a web server or another service box.
* **It Enables Credential Dumping:** Once you impersonate a privileged user and become `NT AUTHORITY\SYSTEM`, you can then run Mimikatz to dump all the hashes from LSASS, which you couldn't do before.
* **It's Stealthy:** You are not creating a new user or installing a backdoor. You are simply using a legitimate, existing login session. From the perspective of the operating system and many logging tools, your actions will appear to be performed by the legitimate user.

---

## Mitigation: How to Stop an Identity Thief

* **Principle of Least Privilege:** This is the most important defense. Domain Admins should not be logging into member servers (like web servers) for routine tasks. If they don't log in, their token is never available to be stolen.
* **Secure Service Accounts:** Configure service accounts with the minimum necessary privileges. They should not be local administrators. Windows has a built-in feature to prevent service accounts with `SeImpersonatePrivilege` from being able to escalate to `SYSTEM` in many cases, but misconfigurations can break this.
* **Just Enough Administration (JEA):** Use modern administration tools like JEA, which allow admins to perform specific tasks without granting them full interactive logon rights on a server.