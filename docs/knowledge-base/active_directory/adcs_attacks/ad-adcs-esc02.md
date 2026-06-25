---
title: 'ESC2: Misconfigured Certificate Templates II'
description: 'ESC2: Misconfigured Certificate Templates II.'
icon: material/file-document-outline
---
# ESC2: Misconfigured Certificate Templates II

ESC2 is ESC1's slightly less famous, but equally devastating sibling. 

The core issue here is that a template allows requesters to specify a Subject Alternative Name (SAN), but instead of specifically allowing Client Authentication, it allows **Any Purpose** (EKU `2.5.29.37.0`) or simply has no Extended Key Usage (EKU) defined at all.

When a certificate is valid for "Any Purpose", Active Directory assumes that "Any Purpose" includes "Client Authentication". AD takes things very literally.

## Requirements

* Template allows AD authentication (implicitly through Any Purpose/No EKU).
* `ENROLLEE_SUPPLIES_SUBJECT` is enabled.
* Enrollment rights for standard users.

## The Attack Path

The exploitation path is virtually identical to ESC1. You find it, you ask for a certificate as a Domain Admin, and you take over the domain.

### 1. Find the Template
Use BloodHound or BloodyAD to spot templates with the Any Purpose EKU.
```bash
python bloodyAD.py -u john.doe -p 'Password123!' --host 192.168.100.1 -d bloody.lab get search --base 'CN=Configuration,DC=megacorp,DC=local' --filter '(&(objectclass=pkicertificatetemplate)(!(mspki-enrollment-flag:1.2.840.113556.1.4.804:=2))(|(mspki-ra-signature=0)(!(mspki-ra-signature=*)))(|(pkiextendedkeyusage=2.5.29.37.0)(!(pkiextendedkeyusage=*))))'
```

### 2. Request and Authenticate
Proceed exactly as you would with ESC1. Use Certipy or Certify to request the certificate with the `/altname` flag set to a Domain Admin, and pass the resulting `.pfx` into Rubeus for that sweet TGT.
