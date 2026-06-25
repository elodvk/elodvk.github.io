---
title: 'ESC5: The Keys to the Kingdom Control'
description: 'ESC5: The "Keys to the Kingdom" Control.'
icon: material/file-document-outline
---
# ESC5: The "Keys to the Kingdom" Control

ESC5 is a broad category that essentially boils down to: "You have too much administrative control over the PKI infrastructure itself."

If an attacker compromises an account that has extensive permissions over the CA server's AD object, the PKI container, or the server itself, they can manipulate the entire certificate issuance process to their advantage.

## The Attack Path: Escalate from DA to EA

A classic ESC5 scenario is when a Domain Admin (DA) in a child domain wants to escalate to Enterprise Admin (EA) in the forest root.

### 1. Take Control of the CA
If the child DA has rights to the PKI container, they can use `PsExec` to launch an MMC console as `SYSTEM` on the child DC.
```powershell
psexec.exe /accepteula -i -s mmc
```

### 2. Malicious Template Duplication
Connect to the "Configuration naming context" -> "Certificate Template" container. Open `certsrv.msc` and duplicate an existing template. Now, configure your shiny new rogue template:
* Grant enroll rights to a principal you control in the child domain.
* Include Client Authentication in the Application Policies.
* **Allow SANs in certificate requests (Hello, ESC1!).**
* Disable any manager approval requirements.

### 3. Publish the Template
You must publish the template to the CA by adding it to the `certificateTemplate` property of the `pkiEnrollmentService` object in Active Directory.

### 4. Profit
You've manually crafted an ESC1 vulnerability. Request a certificate using your rogue template, specify the Enterprise Administrator as the SAN, and enjoy your new forest-wide privileges.

Alternatively, if you have direct administrative access to the CA server itself, skip the AD gymnastics, run Certipy or Mimikatz, and just steal the **Golden Certificate**. Why pick the lock when you can steal the master blueprint?
