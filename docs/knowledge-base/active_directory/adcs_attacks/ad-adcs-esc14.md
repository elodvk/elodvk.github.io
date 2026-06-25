---
title: 'ESC14: altSecurityIdentities'
description: 'ESC14: altSecurityIdentities.'
---
# ESC14: altSecurityIdentities

ESC14 targets the explicit mapping configurations within Active Directory, specifically the `altSecurityIdentities` attribute.

When strong certificate mapping fails (or is disabled), AD tries to map a certificate to a user account using explicit mappings defined in `altSecurityIdentities`. This attribute holds a string that tells AD how to identify the user (e.g., `X509:<I>DC=com,DC=domain,CN=CA<S>CN=Administrator`).

## The Attack Path

The vulnerability happens when the explicit mapping is incredibly weak, like mapping based purely on the `Subject` name without verifying the Issuer (`<S>CN=Administrator`), AND a low-privileged user can enroll in a template where they can define that Subject.

### 1. Identify Weak Mappings
You must find a highly privileged account (like `Administrator`) that has a weak mapping string in its `altSecurityIdentities` attribute.
```bash
# We're looking for something like: X509:<S>CN=Administrator
```

### 2. Request a Matching Certificate
Find a template that allows you to specify the Subject name (`ENROLLEE_SUPPLIES_SUBJECT`). Unlike ESC1 where we supply the SAN (Subject Alternative Name), here we only care about the primary `Subject`.

Request a certificate and set the Subject to exactly match the string expected by the weak mapping.
```bash
certipy req -u 'john' -p 'Pass' -ca 'domain-CA' -template 'SubjectTemplate' -subject 'CN=Administrator'
```

### 3. Authenticate
Use the certificate to authenticate. The KDC will look at the `Subject`, search Active Directory for a matching `altSecurityIdentities` string, find the `Administrator` account, and log you in.

!!! important
    To prevent ESC14, administrators should ensure that `altSecurityIdentities` mappings are robust, ideally using Issuer+Subject (`<I>...<S>...`) or Issuer+SerialNumber (`<I>...<SR>...`), rather than just relying on the Subject name alone.
