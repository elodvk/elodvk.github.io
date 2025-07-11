---
title: ZeroLogon (CVE-2020-1472)
sidebar_position: 1
---

Every so often, a vulnerability is discovered that is so critical, so easy to exploit, and so devastating that it sends shockwaves through the entire security industry. In 2020, that vulnerability was **ZeroLogon (CVE-2020-1472)**.

ZeroLogon is an attack that allows any attacker on the local network to become a Domain Admin in seconds. No credentials are required. No phishing, no password cracking, no waiting. You just run a script, and the domain is yours. It was, for a brief and terrifying period, a true "god mode" vulnerability for Active Directory.

Think of it like this: The master password to the kingdom's main gate control system was supposed to be a complex, secret passphrase. But due to a flaw in the lock's design, you could send it a specially crafted sequence of 8 empty messages, and the lock would reset the master password to a blank value. ZeroLogon is the digital equivalent of that attack.

---

### ## The "Why": A Catastrophic Cryptographic Flaw

The vulnerability existed in a core Windows protocol called the **Netlogon Remote Protocol (MS-NRPC)**, which is used for various tasks, including validating user logons and maintaining relationships between Domain Controllers (DCs).

When a computer tries to authenticate using Netlogon, it goes through a cryptographic challenge-response process. The fatal flaw was in how this process used the **AES-CFB8** encryption mode.

* The process required an 8-byte challenge.
* The encryption used a 16-byte Initialization Vector (IV).
* Critically, the protocol specified that this IV should **always be set to all zeros** (`0000000000000000`).

A researcher at Secura discovered that if you sent a challenge consisting of all zeros, this fixed IV would result in a ciphertext that had a 1-in-256 chance of also being all zeros. So, an attacker could just spam the DC with these "all-zero" authentication attempts. On average, after about 256 tries, one would succeed.

A successful authentication allows you to perform other Netlogon functions, including the most dangerous one of all: **resetting a computer account's password**.

---

### ## The Heist: From Zero to Domain Admin in 10 Seconds

The attack chain is breathtakingly fast and simple. All you need is network access to a Domain Controller.

1.  **The ZeroLogon Attack:** The attacker runs a script that targets a Domain Controller. The script repeatedly sends specially crafted Netlogon authentication messages. After a few seconds and a few hundred attempts, it succeeds.

2.  **Reset the DC's Password:** The script immediately uses its successful authentication to call the function to change the DC's own computer account password. It changes the password to an **empty string**.

3.  **The Aftermath:** The Domain Controller's computer account (`DC01$`) now has no password. This means its NTLM hash is now the well-known hash for an empty password: `aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0`.

4.  **Dump All Hashes with DCSync:** The attacker now uses `impacket-secretsdump` with the DC's account name and its new, empty password hash to perform a DCSync attack. Since a DC's computer account has replication rights, this succeeds.
    ```bash
    secretsdump.py -just-dc -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 'corp.local/DC01$'@dc01.corp.local
    ```
    This command dumps the NTLM hash for **every single user in the domain**, including the all-important `krbtgt` account.

5.  **Restore the Original Password (Optional but Recommended):** A professional pentester would then use the *original* hash of the DC computer account (which was dumped in the previous step) to restore its password, preventing the domain from breaking.

At this point, the game is over. The attacker has the `krbtgt` hash and can forge Golden Tickets, giving them permanent, undetectable access to the entire domain. The entire process, from start to finish, can take less than a minute.

---

### ## Is It Still Relevant Today? Less So, But Know The History

This vulnerability was so critical that Microsoft released an out-of-band patch for it in **August 2020**. The CISA even issued an emergency directive ordering all federal agencies to patch immediately.

* **Is it relevant?** In any environment that has been patched since late 2020, **this attack will not work**. The patch fixed the cryptographic flaw in the Netlogon protocol.
* **Why know it?** Understanding ZeroLogon is crucial for any security professional. It serves as a stark reminder of how a single, deep cryptographic flaw can bring down an entire enterprise infrastructure. On a pentest, if you ever encounter an unpatched, pre-2020 Domain Controller, this should be one of the first things you check for. Finding a vulnerable DC is the equivalent of finding a "win" button.

---

### ## Mitigation: The Only Defense

* **PATCH. YOUR. DOMAIN. CONTROLLERS.** This is the only defense. The security updates from August 2020 and the enforcement phase from February 2021 fully remediate this vulnerability. There is no other workaround. Any unpatched DC is a ticking time bomb.