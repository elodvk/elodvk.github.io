---
title: "Blue"
sidebar_position: 1
---

## Recon

### Nmap

First I am going to run an `nmap` scan with default script and version scan and output the report in all formats to `nmap_report`.

```shell
nmap -sC -sV -T4 -oA nmap_report 10.129.233.194
```

The output quickly revealed that we are dealing with a windows 7 machine. 

```
PORT      STATE SERVICE      VERSION
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds Windows 7 Professional 7601 Service Pack 1 microsoft-ds (workgroup: WORKGROUP)
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49156/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: HARIS-PC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-07-15T08:11:34
|_  start_date: 2025-07-15T07:28:53
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery: 
|   OS: Windows 7 Professional 7601 Service Pack 1 (Windows 7 Professional 6.1)
|   OS CPE: cpe:/o:microsoft:windows_7::sp1:professional
|   Computer name: haris-PC
|   NetBIOS computer name: HARIS-PC\x00
|   Workgroup: WORKGROUP\x00
|_  System time: 2025-07-15T09:11:32+01:00
| smb2-security-mode: 
|   2:1:0: 
|_    Message signing enabled but not required
|_clock-skew: mean: -20m08s, deviation: 34m36s, median: -10s
```
### SMB Enumeration

Guest account seems to be enabled on the target, and I have got `READ` permissions on 2 shares: `Share` and `Users`.

It is also very important to note that the target is a Windows 7 machine with SMBv1 enabled and SMB Signing signing disabled.

```shell
┌──(elodvk㉿kali)-[~/dvwa/blue]
└─$ netexec smb 10.129.233.194 -u elodvk -p '' --shares
SMB         10.129.233.194   445    HARIS-PC         [*] Windows 7 / Server 2008 R2 Build 7601 x64 (name:HARIS-PC) (domain:haris-PC) (signing:False) (SMBv1:True)
SMB         10.129.233.194   445    HARIS-PC         [+] haris-PC\elodvk: (Guest)
SMB         10.129.233.194   445    HARIS-PC         [*] Enumerated shares
SMB         10.129.233.194   445    HARIS-PC         Share           Permissions     Remark
SMB         10.129.233.194   445    HARIS-PC         -----           -----------     ------
SMB         10.129.233.194   445    HARIS-PC         ADMIN$                          Remote Admin
SMB         10.129.233.194   445    HARIS-PC         C$                              Default share
SMB         10.129.233.194   445    HARIS-PC         IPC$                            Remote IPC
SMB         10.129.233.194   445    HARIS-PC         Share           READ            
SMB         10.129.233.194   445    HARIS-PC         Users           READ   
```

I connected to both the shares but was unable to find any valuable files.


`Share` was empty.
```shell
smbclient \\\\10.129.233.194\\Share -N
```

And `Users` did not have any valuable files.
```shell
smbclient \\\\10.129.233.194\\Users -N
```

### Nmap SMB Scripts



## Eternal Blue

The target is clearly vulnerable to `smb-vuln-ms17-010:`.

### **Some background**

MS-17-010, otherwise known as ETERNALBLUE, is a unauthenticated remote code execution vulnerability in Windows SMB most famous for it’s leak by [the Shadow Brokers](https://en.wikipedia.org/wiki/The_Shadow_Brokers) and for driving the [WannaCry](https://en.wikipedia.org/wiki/WannaCry_ransomware_attack) worm in May 2017.

The exploits in Metasploit for MS17-010 are much more stable than the Python script counterparts. If you’re doing this in the real world, I’d strongly recommend using Metasploit here. If you’re doing this for some kind of training activity that doesn’t allow Metasploit (like OSCP), then the downside of crashing a few boxes acceptable. I’ll show both.




