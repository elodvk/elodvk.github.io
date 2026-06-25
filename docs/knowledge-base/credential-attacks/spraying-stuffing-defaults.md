---
title: "Spraying, Stuffing, and Defaults"
description: "How to avoid account lockouts using password spraying, credential stuffing, and exploiting default vendor credentials."
tags:
  - password-attacks
  - spraying
  - credential-stuffing
  - default-passwords
  - netexec
  - hydra
---

# 🚿 Spraying, Stuffing, and Defaults

Traditional brute-forcing (trying thousands of passwords against one user) is extremely loud and almost guaranteed to trigger an account lockout in an enterprise environment. Professional penetration testers rely on **Password Spraying**, **Credential Stuffing**, and **Default Credentials** to gain access silently.

---

## 1️⃣ Password Spraying

**Password Spraying** inverses the brute-force model: instead of trying many passwords against one user, you try **one carefully chosen password against many users**.

Because you only attempt one or two logins per user, you stay well below the Active Directory account lockout threshold (e.g., 5 failed attempts in 15 minutes).

### Step 1: Gather a User List
A password spray is only as good as the user list. You must gather valid usernames through OSINT, LDAP null sessions, RPC enumeration, or SMB enumeration.
```bash
# Example list (users.txt)
jsmith
ajohnson
mwilliams
admin
```

### Step 2: Choose the Right Passwords
Select 1-3 highly probable passwords based on the season, year, or company name.
- `Fall2024!`
- `Welcome1!`
- `CompanyName2024`

### Step 3: Execute the Spray

Using **NetExec** (formerly CrackMapExec) against SMB:
```bash
# Spray one password against a list of users on the Domain Controller
netexec smb 10.10.10.10 -u users.txt -p 'Fall2024!'

# Continue spraying even if a success is found
netexec smb 10.10.10.10 -u users.txt -p 'Fall2024!' --continue-on-success
```

Using **Hydra** against an SSH server:
```bash
# Provide a user list (-L) and a single password (-p)
hydra -L users.txt -p "Fall2024!" 10.10.10.5 ssh
```

!!! tip
    If your first spray fails, **wait** until the account lockout observation window expires (often 15-30 minutes) before spraying a second password.

---

## 2️⃣ Credential Stuffing

**Credential Stuffing** involves using lists of compromised usernames and passwords (gleaned from public data breaches) and automating login requests against a target application.

People frequently reuse passwords across personal and corporate accounts. If an employee's LinkedIn password was leaked in 2012, there's a chance they use a variation of that same password for their corporate VPN today.

### The Attack Flow
1. **Discover a corporate email address:** `jsmith@example.com`
2. **Search breach databases:** Use services like DeHashed or HaveIBeenPwned (to see *if* they were breached) to find plaintext passwords previously associated with that email.
3. **Stuff the credentials:** Try the exact breached password against the corporate OWA (Outlook Web Access), VPN, or SSH server.
4. **Mutate and retry:** If `password123` fails, try variations: `Password123!`, `password1234`, `Company123`.

---

## 3️⃣ Exploiting Default Credentials

Many appliances, web applications, IoT devices, and databases ship with default administrative credentials. System administrators frequently forget to change them during deployment.

**Never underestimate default credentials.** They are one of the most common vectors for initial access during an internal penetration test.

### Common Default Credentials

| Vendor / Application | Username | Password |
|----------------------|----------|----------|
| Tomcat Manager | `tomcat` | `tomcat` |
| Jenkins | `admin` | `admin` (or no password) |
| Apache Tomcat | `admin` | `admin` |
| pfSense | `admin` | `pfsense` |
| MSSQL Server | `sa` | (Blank) |
| Cisco Routers | `cisco` | `cisco` |
| Default Raspberry Pi | `pi` | `raspberry` |

### Finding Default Passwords
If you identify an appliance (e.g., via Wappalyzer or Nmap service scanning), search for its default credentials online:

1. **Default-Password.info:** Searchable database of default credentials.
2. **CIRT.net (Default Password List):** Extensive list of vendor defaults.
3. **Google:** Simply search `"VendorName ProductName default password"`.

### Automating the Search
Metasploit contains dozens of auxiliary modules specifically designed to test for default credentials on common services:

```bash
msf6 > search type:auxiliary name:login
# Examples:
# auxiliary/scanner/tomcat/tomcat_mgr_login
# auxiliary/scanner/ssh/ssh_login
# auxiliary/scanner/postgres/postgres_login
```

---

!!! warning
    **Password spraying can still trigger lockouts if multiple testers spray simultaneously, or if the lockout threshold is unusually low (e.g., 2 attempts). Always coordinate with your team and review client policies.**
