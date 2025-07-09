---
title: "Blue"
sidebar_position: 1
---



## SMB Enumeration

Guest account seems to be enabled on the target, and I have got `READ` permissions on 2 shares: `Share` and `Users`.

It is also very important to note that the target is a windows Server 2008 or Windows 7 machine with SMBv1 enabled and SMB Signing signing disabled.

```shell
┌──(elodvk㉿kali)-[~/dvwa/blue]
└─$ netexec smb 10.129.233.92 -u elodvk -p '' --shares
SMB         10.129.233.92   445    HARIS-PC         [*] Windows 7 / Server 2008 R2 Build 7601 x64 (name:HARIS-PC) (domain:haris-PC) (signing:False) (SMBv1:True)
SMB         10.129.233.92   445    HARIS-PC         [+] haris-PC\elodvk: (Guest)
SMB         10.129.233.92   445    HARIS-PC         [*] Enumerated shares
SMB         10.129.233.92   445    HARIS-PC         Share           Permissions     Remark
SMB         10.129.233.92   445    HARIS-PC         -----           -----------     ------
SMB         10.129.233.92   445    HARIS-PC         ADMIN$                          Remote Admin
SMB         10.129.233.92   445    HARIS-PC         C$                              Default share
SMB         10.129.233.92   445    HARIS-PC         IPC$                            Remote IPC
SMB         10.129.233.92   445    HARIS-PC         Share           READ            
SMB         10.129.233.92   445    HARIS-PC         Users           READ   
```

I connected to both the shares but was unable to find any valuable files.


`Share` was empty.
```shell
smbclient \\\\10.129.233.92\\Share -N
```

And `Users` did not have any valuable files.
```shell
smbclient \\\\10.129.233.92\\Users -N
```

## Eternal Blue

The target is clearly vulnerable to `smb-vuln-ms17-010:`.




