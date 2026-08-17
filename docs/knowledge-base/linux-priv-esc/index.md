---
title: 'Linux Privilege Escalation'
description: 'Linux privilege escalation techniques — environment enumeration, services and internals, credential hunting, PATH abuse, wildcard injection, and restricted shell escapes.'
---

# Linux Privilege Escalation

A structured reference for Linux privilege escalation techniques, organized for quick lookup during exams and engagements.

## Enumeration

| Topic | Description |
|:------|:------------|
| [Environment Enumeration](environment_enumeration.md) | System info, users, groups, network, defenses, file systems |
| [Services & Internals](linux_services_adn_internals_enumeration.md) | Running processes, packages, cron jobs, sudo version, GTFOBins |
| [Credential Hunting](credential-hunting.md) | Config files, SSH keys, bash history, database creds, mail spools |
| [Privileged Groups](privileged-groups.md) | Docker, LXD/LXC, disk, adm, staff group escalations |

## Exploitation Techniques

| Topic | Description |
|:------|:------------|
| [Special Permissions (SUID/SGID)](special-permissions.md) | SUID/SGID enumeration, GTFOBins, shared object hijacking |
| [Capabilities Abuse](capabilities.md) | cap_setuid, cap_dac_override, capability enumeration |
| [Sudo Rights Abuse](sudo-rights-abuse.md) | GTFOBins sudo exploits, LD_PRELOAD, sudo CVEs, env_keep abuse |
| [PATH Abuse](path-abuse.md) | Writable PATH dirs, SUID hijacking, LD_PRELOAD, cron PATH injection |
| [Wildcard Abuse](wildcard-abuse.md) | Tar checkpoint injection, rsync, chown, chmod wildcard exploitation |
| [Escaping Restricted Shells](escaping-restricted-shell.md) | rbash/rksh/rzsh breakouts via interpreters, editors, SSH, pagers |
