---
title: 'Active Directory Certificate Services (ADCS) Attacks'
description: 'Active Directory Certificate Services (ADCS) Attacks.'
---

# Active Directory Certificate Services (ADCS) Attacks

Welcome to the wonderful world of Active Directory Certificate Services (ADCS), where Microsoft decided that handing out cryptographically signed skeleton keys to anyone who asks nicely was a stellar security posture.

ADCS is Microsoft’s Public Key Infrastructure (PKI) implementation. It provides everything an organization needs to issue and manage digital certificates. These certificates are used for a myriad of purposes: encrypting file systems, signing code, and most importantly for us—authenticating to the domain.

Unfortunately, out of the box, or when managed by an overworked sysadmin on a Friday afternoon, ADCS introduces massive privilege escalation vectors. Researchers have categorized these misconfigurations into various **ESC** (Escalation) techniques.

Below is your master index for weaponizing ADCS misconfigurations. Grab some coffee, fire up `Certipy`, and let's forge some trust.

---

### The ESC Arsenal

* **[ESC1 - Misconfigured Certificate Templates](ad-adcs-esc01.md)**: The classic. When a template lets you enroll and specify arbitrary Subject Alternative Names (SANs).
* **[ESC2 - Misconfigured Certificate Templates II](ad-adcs-esc02.md)**: Similar to ESC1, but relying on "Any Purpose" or missing Extended Key Usage (EKU) constraints.
* **[ESC3 - Enrollment Agent](ad-adcs-esc03.md)**: Abusing the "Certificate Request Agent" EKU to request certificates on behalf of other users.
* **[ESC4 - Access Control Vulnerabilities](ad-adcs-esc04.md)**: When you have write access to a template and can literally change its configuration to make it vulnerable to ESC1. Thanks for the keys!
* **[ESC5 - Vulnerable PKI Object Access Control](ad-adcs-esc05.md)**: Extensive permissions over the CA server itself, or related AD objects.
* **[ESC6 - EDITF_ATTRIBUTESUBJECTALTNAME2](ad-adcs-esc06.md)**: A registry key on the CA that says "Sure, we'll accept any SAN you provide, even if the template forbids it."
* **[ESC7 - Vulnerable CA Access Control](ad-adcs-esc07.md)**: Having "Manage CA" or "Manage Certificates" rights. It's game over.
* **[ESC8 - Web Enrollment Relay](ad-adcs-esc08.md)**: Classic NTLM relay attack, but targeting the HTTP web enrollment endpoints.
* **[ESC9 - No Security Extension](ad-adcs-esc09.md)**: Abusing `CT_FLAG_NO_SECURITY_EXTENSION` to spoof UPNs after a target has had their password reset.
* **[ESC10 - Weak Certificate Mapping](ad-adcs-esc10.md)**: Bypassing strong certificate mapping by manipulating the `userPrincipalName`.
* **[ESC11 - Relaying NTLM to ICPR](ad-adcs-esc11.md)**: Relaying authentication to the RPC endpoint without requiring RPC sealing.
* **[ESC12 - ADCS CA on YubiHSM](ad-adcs-esc12.md)**: Extracting CA keys stored on poorly secured YubiHSMs.
* **[ESC13 - Issuance Policy](ad-adcs-esc13.md)**: Abusing overlapping Issuance Policies to achieve privilege escalation.
* **[ESC14 - altSecurityIdentities](ad-adcs-esc14.md)**: Manipulating `altSecurityIdentities` to map your certificate to a highly privileged account.
* **[ESC15 - EKUwu Application Policies](ad-adcs-esc15.md)**: The newly discovered CVE-2024-49019, abusing `msPKI-Certificate-Application-Policy` extensions.

### Advanced Operations

* **[Golden Certificate](ad-adcs-golden-certificate.md)**: The ultimate persistence mechanism. Steal the CA's private key and mint your own valid certificates for *anyone*, *anytime*.
