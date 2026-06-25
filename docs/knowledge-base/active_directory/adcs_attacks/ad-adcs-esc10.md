---
title: 'ESC10: Weak Certificate Mapping'
description: 'ESC10: Weak Certificate Mapping.'
icon: material/file-document-outline
---
# ESC10: Weak Certificate Mapping

ESC10 is essentially ESC9's twin, but instead of relying on a misconfigured template, it relies on a misconfigured domain.

Even if all your templates are perfectly secure and include the strong security extension (SID mapping), you can still fall victim to weak mapping attacks if the domain itself is configured to ignore the strong mappings.

## Requirements

This attack is possible if the `StrongCertificateBindingEnforcement` registry key on the Domain Controllers is set to `0` (disabled) or `1` (compatibility mode). 

If the DC is in compatibility mode, it will *prefer* strong mapping, but if strong mapping fails, it will happily fall back to weak mapping (UPN).

## The Attack Path

The attack path is identical to ESC9.

1. **Compromise a User**: Gain GenericWrite over a standard user account.
2. **Change the UPN**: Alter their `userPrincipalName` to match the Domain Admin.
3. **Request a Certificate**: Request a certificate using any valid Client Authentication template. (Even though the certificate will contain the strong SID extension for the low-privileged user, it will also contain the UPN of the Domain Admin).
4. **Remove the Strong Mapping**: Wait, if the certificate has the low-privileged user's SID, the DC will map it to them! To bypass this, simply **remove the `userCertificate` property** from the low-privileged user in AD.
5. **Authenticate**: When you use the certificate, the DC tries strong mapping (SID), fails (because you cleared the `userCertificate` property), and falls back to weak mapping. It sees the Domain Admin UPN, and logs you in as the DA.

!!! important
    Microsoft is moving towards enforcing `StrongCertificateBindingEnforcement = 2` (Full Enforcement) globally, which completely kills ESC9 and ESC10. Make sure your environment isn't stuck in compatibility mode!
