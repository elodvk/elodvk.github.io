---
title: 'Proxychains'
description: 'A deep dive into Proxychains, its configuration modes, and tunneling usage.'
tags:
  - pivoting
  - proxychains
  - tunneling
icon: material/link-variant
---

# ⛓️ Proxychains: The Classic Proxifier

Proxychains is one of the oldest and most widely used tools for network pivoting. It forces any TCP connection made by a given application to follow through proxy like TOR or any other SOCKS4, SOCKS5 or HTTP proxies.

It works by hooking network-related libc functions via `LD_PRELOAD`. 

## 1. How It Works

When you run a command like `proxychains nmap -sT 10.10.10.5`, Proxychains dynamically injects its own shared object (`libproxychains.so`) into the `nmap` process. This library intercepts functions like `connect()` and redirects the traffic through the proxies defined in your configuration file.

```mermaid
graph LR
    A[Attacker Machine<br>nmap] -- LD_PRELOAD --> B[Proxychains]
    B -- SOCKS5 --> C[Compromised Host<br>SOCKS Server]
    C -- Native TCP --> D[Internal Target]
    
    style A fill:#1a1b26,stroke:#7aa2f7,color:#fff
    style B fill:#1a1b26,stroke:#bb9af7,color:#fff
    style C fill:#1a1b26,stroke:#f7768e,color:#fff
    style D fill:#1a1b26,stroke:#9ece6a,color:#fff
```

!!! warning
      **Limitations:** Because Proxychains relies on `LD_PRELOAD`, it **cannot** proxy statically compiled binaries (like those compiled with Go) and it **does not** support ICMP or UDP natively (no `ping` or `nmap -sS` / `nmap -sU`). You must use TCP connect scans (`-sT`).

---

## 2. Configuration (`/etc/proxychains4.conf`)

The configuration file is typically located at `/etc/proxychains4.conf`. If you don't want to run it globally, you can create a local `proxychains.conf` in your current directory and run `proxychains -f proxychains.conf <command>`.

### Chain Modes

Proxychains supports three distinct modes for chaining multiple proxies:

1.  **Strict Chain (`strict_chain`)**
    *   Traffic is routed through all proxies in the exact order they are listed.
    *   If **any** proxy in the list is down, the connection fails.
2.  **Dynamic Chain (`dynamic_chain`)**
    *   Traffic is routed through proxies in the exact order, but dead proxies are **skipped**.
    *   *This is usually the recommended mode for pivoting during engagements.*
3.  **Random Chain (`random_chain`)**
    *   Traffic is routed through a random sequence of proxies from the list.
    *   Useful for avoiding detection, often paired with TOR.

### Defining Proxies

At the bottom of the config file, you define the proxies. The syntax is: `<type> <IP> <port> [user] [pass]`

```ini
[ProxyList]
# SOCKS4 created by Chisel or SSH dynamic port forwarding
socks4  127.0.0.1 9050

# SOCKS5 proxy requiring authentication
socks5  10.10.10.10 1080 admin password123
```

> [!TIP]
> **SOCKS4 vs SOCKS5:** SOCKS5 is generally superior because it supports UDP (though Proxychains barely uses it) and remote DNS resolution, which prevents DNS leaks.

---

## 3. Resolving DNS Leaks

By default, when you proxy an application that tries to resolve a hostname (e.g., `proxychains curl http://internal.corp`), your local machine might try to resolve `internal.corp` using your own DNS servers before sending the traffic through the proxy.

This is a massive OPSEC failure (DNS leak) and will fail to resolve internal hostnames.

To fix this, ensure `proxy_dns` is uncommented in your `/etc/proxychains4.conf`:
```ini
# Proxy DNS requests - no leak for DNS data
proxy_dns 
```

---

## 4. Common Use Cases

### Scanning Through a Pivot
```bash
proxychains nmap -sT -Pn -p 22,80,445,3389 10.10.20.0/24
```

**Example Output:**
```text
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.14
[proxychains] Strict chain  ...  127.0.0.1:1080  ...  10.10.20.5:22  ...  OK
[proxychains] Strict chain  ...  127.0.0.1:1080  ...  10.10.20.5:80  ...  DENIED
Nmap scan report for 10.10.20.5
Host is up (0.052s latency).

PORT     STATE  SERVICE
22/tcp   open   ssh
80/tcp   closed http
445/tcp  closed microsoft-ds
3389/tcp closed ms-wbt-server
```
*Note: Always use `-sT` (TCP Connect) and `-Pn` (Disable Ping) because Proxychains cannot proxy ICMP or SYN packets.*

### Using CrackMapExec / NetExec
```bash
proxychains crackmapexec smb 10.10.20.5 -u 'Administrator' -p 'Password123!'
```

### Accessing Internal Web Apps
While you can use `proxychains firefox`, it's usually better to configure a proxy extension like FoxyProxy directly in your browser. However, for quick CLI checks:
```bash
proxychains curl -s http://10.10.20.10/api/v1/health
```
