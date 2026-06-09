---
title: 'ESC12: ADCS on YubiHSM'
description: 'ESC12: ADCS on YubiHSM.'
---

# ESC12: ADCS on YubiHSM

ESC12 enters the realm of physical security devices. Sometimes, an organization decides that storing the Certificate Authority's private key on a hard drive isn't secure enough, so they store it on a Hardware Security Module (HSM)—specifically, a YubiHSM.

The idea is that the key can never leave the physical device. But what happens if the administrative interface for that device is left with default or weak credentials? Enter ESC12.

## The Attack Path

If you compromise the CA server, you might find that the private key isn't in the Windows crypto store, but the YubiHSM Key Storage Provider is active.

### 1. Extract the YubiHSM Credentials
To interact with the YubiHSM, you need its authentication key (usually stored in the registry so the CA can use it).
Look for the `AuthKey` in:
```
HKLM\SOFTWARE\Yubico\YubiHSM\AuthKeys
```

### 2. Connect to the HSM
Using the extracted credentials, you can connect to the YubiHSM over the network (usually port `12345`).

### 3. The Extraction (If you're lucky)
If the administrators failed to properly configure the key generation policies, the private key might actually be marked as `Exportable`. If so, you can just ask the HSM to hand it over.

If the key isn't exportable (which is the point of an HSM), you can't steal the private key itself. But you *can* use the HSM as your personal signing oracle.

### 4. Forging via Oracle
You can craft a rogue certificate request (e.g., a Golden Certificate), send the hash to the HSM using your extracted credentials, and ask the HSM to sign it. 

The HSM happily obliges, providing you with a perfectly signed, valid certificate, completely bypassing the need to steal the private key.

!!! warning
    Hardware security is only as strong as the software configuration wrapping it. If the auth key is stored in plaintext in the registry, the physical security doesn't matter.
