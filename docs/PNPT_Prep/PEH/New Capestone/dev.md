---
title: "Dev"
sidebar_position: 3
---



## Recon

Start with the `nmap` scan:

```shell
nmap -p- -sC -sV -T4 -oA nmap_report 172.17.1.122
```

**Output**

```
PORT      STATE SERVICE  VERSION
22/tcp    open  ssh      OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 bd:96:ec:08:2f:b1:ea:06:ca:fc:46:8a:7e:8a:e3:55 (RSA)
|   256 56:32:3b:9f:48:2d:e0:7e:1b:df:20:f8:03:60:56:5e (ECDSA)
|_  256 95:dd:20:ee:6f:01:b6:e1:43:2e:3c:f4:38:03:5b:36 (ED25519)
80/tcp    open  http     Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: Bolt - Installation error
111/tcp   open  rpcbind  2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|   100000  3,4          111/udp6  rpcbind
|   100003  3           2049/udp   nfs
|   100003  3           2049/udp6  nfs
|   100003  3,4         2049/tcp   nfs
|   100003  3,4         2049/tcp6  nfs
|   100005  1,2,3      37907/tcp6  mountd
|   100005  1,2,3      42602/udp   mountd
|   100005  1,2,3      46527/tcp   mountd
|   100005  1,2,3      53739/udp6  mountd
|   100021  1,3,4      36081/tcp   nlockmgr
|   100021  1,3,4      38249/tcp6  nlockmgr
|   100021  1,3,4      52460/udp6  nlockmgr
|   100021  1,3,4      58763/udp   nlockmgr
|   100227  3           2049/tcp   nfs_acl
|   100227  3           2049/tcp6  nfs_acl
|   100227  3           2049/udp   nfs_acl
|_  100227  3           2049/udp6  nfs_acl
2049/tcp  open  nfs      3-4 (RPC #100003)
8080/tcp  open  http     Apache httpd 2.4.38 ((Debian))
|_http-title: PHP 7.3.27-1~deb10u1 - phpinfo()
| http-open-proxy: Potentially OPEN proxy.
|_Methods supported:CONNECTION
|_http-server-header: Apache/2.4.38 (Debian)
36081/tcp open  nlockmgr 1-4 (RPC #100021)
37553/tcp open  mountd   1-3 (RPC #100005)
46527/tcp open  mountd   1-3 (RPC #100005)
59787/tcp open  mountd   1-3 (RPC #100005)
MAC Address: 00:0C:29:64:BA:58 (VMware)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 16.03 seconds
```

I am getting a feeling that I should start with NFS - Network File Storage.

So, I am going to run some scripts this time

```shell
┌──(elodvk㉿kali)-[~/pnpt/dev]
└─$ nmap --script=nfs* 172.17.1.122
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-10 22:57 IST
Nmap scan report for 172.17.1.122
Host is up (0.0017s latency).
Not shown: 995 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
111/tcp  open  rpcbind
| nfs-statfs: 
|   Filesystem  1K-blocks  Used       Available  Use%  Maxfilesize  Maxlink
|_  /srv/nfs    7205476.0  1847492.0  4972244.0  28%   16.0T        32000
| nfs-showmount: 
|_  /srv/nfs 172.16.0.0/12 10.0.0.0/8 192.168.0.0/16
| nfs-ls: Volume /srv/nfs
|   access: Read Lookup Modify Extend Delete NoExecute
| PERMISSION  UID    GID    SIZE  TIME                 FILENAME
| rwxr-xr-x   65534  65534  4096  2021-06-02T09:25:00  .
| ??????????  ?      ?      ?     ?                    ..
| rw-r--r--   0      0      1911  2021-06-02T09:23:32  save.zip
|_
2049/tcp open  nfs
8080/tcp open  http-proxy
MAC Address: 00:0C:29:64:BA:58 (VMware)

Nmap done: 1 IP address (1 host up) scanned in 0.51 seconds

```

Focus on the `save.zip` here.

To downliad it, I might need to first mount the nfs but 