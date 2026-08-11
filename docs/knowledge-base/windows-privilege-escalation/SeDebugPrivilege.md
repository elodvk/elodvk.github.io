---
title: "SeDebugPrivilege"
description: ""
date: 2026-08-04
tags:
  - Windows
  - Privilege Escalation
  - Kerberos
  - Active Directory
---

After logging on as a user assigned the Debug programs right and opening an elevated shell, we see `SeDebugPrivilege` is listed.

```powershell
PS C:\Users\tstark> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State
============================= ==================================== ========
SeTcbPrivilege                Act as part of the operating system  Disabled
SeShutdownPrivilege           Shut down the system                 Disabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled
SeUndockPrivilege             Remove computer from docking station Disabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Disabled
SeTimeZonePrivilege           Change the time zone                 Disabled
```