---
title: "GPP & cPassword"
sidebar_position: 5
---

Imagine a king who wanted to set the same password for the guards at every barracks in the kingdom. Instead of telling each guard individually, he wrote the password on a notice, locked it in a "secure" box using a key that everyone in the kingdom knew how to make, and then posted that notice in the public square for every guard to see. Sounds insane, right?

Welcome to the world of **Group Policy Preferences (GPP) password attacks**. For years, this was exactly how many system administrators managed local administrator passwords across their domains, and it remains one of the most devastatingly simple vulnerabilities a pentester can find.

This attack involves finding passwords stored within Group Policy files on the domain's **SYSVOL** share. The passwords are encrypted, but they are encrypted with a publicly known AES-256 key published by Microsoft on MSDN. This is the equivalent of locking a box and then publicly posting the blueprints for the key.

---
## The History: A Feature of Convenience (2008)

The story begins with **Windows Server 2008**. Microsoft introduced a powerful new feature called **Group Policy Preferences (GPP)**. It was a massive quality-of-life improvement for system administrators, allowing them to easily push a wide range of settings to workstations—everything from registry keys to mapped drives.

One of the most popular features was the ability to set the password for the local administrator account on all machines in an Organizational Unit (OU). To do this, an admin would simply type the desired password into the Group Policy editor. The system would then create an XML file (like `Groups.xml` or `ScheduledTasks.xml`) inside that policy's folder on the **SYSVOL share**.

To give the appearance of security, the password was not stored in plaintext. It was placed in a field called **`cPassword`** and encrypted with AES-256.

**The Fatal Flaw:** The AES key used for this encryption was static. It was the same key across every Windows installation in the world. Worse, Microsoft **published this key publicly on MSDN**. This meant that anyone who could read the XML file could use the public key to instantly decrypt the password. Since the SYSVOL share is readable by all authenticated domain users, this "security" feature was effectively a public notice board for privileged passwords.

---
## The Patch: Microsoft Intervenes (2014)

After years of this vulnerability being exploited in the wild, Microsoft finally addressed it in **May 2014** with the security bulletin **MS14-025**.

The patch did two key things:
1.  It updated the Group Policy Management Console to **remove the ability for administrators to set passwords** in this manner. The interface was simply taken away.
2.  It patched the client-side extension on Windows machines. This meant that even if a GPO with a `cPassword` existed, a patched machine would **no longer process or apply that setting**.

---
## Is It Still Relevant Today? **Absolutely.**

This is the most important part of the story. The patch was **not retroactive**.

While it stopped the bleeding, **it did not clean up the old wounds**. The MS14-025 patch did **not** delete the old, vulnerable XML files that were already sitting in SYSVOL.

Many organizations applied the patch and thought the problem was solved. They never went back to audit their SYSVOL shares to find and delete the lingering policy files.

Therefore, in **2025**, an attacker with a low-privilege domain account can still perform this attack with a high chance of success in older, less-maintained environments. The attack flow remains the same:
1.  Authenticate to the domain.
2.  Browse the `\\<domain>\SYSVOL` share.
3.  Search for XML files containing the `<cPassword>` attribute.
4.  Copy the encrypted value and decrypt it instantly using any number of publicly available tools.

Finding a GPP `cPassword` on a pentest is like finding a fossil from a bygone era. It's a sign of poor security hygiene and an environment that hasn't been properly audited in years. While less common than a decade ago, it's still a critical finding that often provides a pentester with a "golden key" local administrator password used across a vast number of machines, enabling immediate and widespread lateral movement. It's a classic piece of low-hanging fruit that is always worth checking for.

---
## The Tools and Commands

You can manually search for the files, but scripts make it trivial.

### **Using PowerShell**

The `Get-GPPPassword` function from the PowerSploit framework is a popular choice. You would run this from a compromised machine.

```powershell
# Import the PowerSploit module first
Import-Module .\PowerSploit.psm1

# Run the function to automatically search all GPOs in the domain
Get-GPPPassword
```

The script will automatically find all Domain Controllers, search every GPP XML file in their SYSVOL share, find any `cPassword` entries, and decrypt them on the fly, printing the plaintext password and the GPO it was found in.

### Manual Decryption

If you find an XML file manually, you can copy the `cPassword` value and decrypt it using online tools or simple scripts that have the public key hardcoded.

The result is often the password for the local administrator account on hundreds or thousands of workstations and servers—all from a single file that any user could read.

---

## Mitigation: Cleaning Up the Skeletons

 - **Patch Your Systems (MS14-025)**: The first step is to ensure all systems are patched to prevent the processing of these passwords.

 - **AUDIT, AUDIT, AUDIT**: The patch does not remove the old, vulnerable XML files from your SYSVOL share. You must manually or with scripts search your entire SYSVOL directory for any XML files containing a cPassword attribute and delete them. This is the most critical remediation step.

 - **Use Modern Solutions**: For managing local administrator passwords, use modern, secure solutions like **Microsoft LAPS (Local Administrator Password Solution)**, which provides each computer with its own unique, complex, and regularly rotated local administrator password stored securely in Active Directory.
