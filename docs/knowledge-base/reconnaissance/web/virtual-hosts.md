---
title: "Virtual Hosts"
description: "Discovering additional websites hosted on the same IP address using virtual host enumeration."
tags:
  - vhost
  - virtual-host
  - ffuf
  - gobuster
  - information-gathering
icon: material/server-network
---

# 🏠 Virtual Hosts

A single web server can host **multiple websites** on the same IP address using **Virtual Hosting**. The server decides which website to serve based on the `Host` header in the HTTP request. This means that simply browsing to `http://<target_ip>/` might only show you one site, while other hidden sites exist on the same server.

---

## 1️⃣ How Virtual Hosting Works

When a browser sends an HTTP request, it includes a `Host` header:

```http
GET / HTTP/1.1
Host: www.example.com
```

The web server (Apache, Nginx, IIS) reads this header and routes the request to the appropriate virtual host configuration. If the `Host` header doesn't match any configured virtual host, the server returns the **default** site.

### Types of Virtual Hosting

| Type | Description |
|------|-------------|
| **Name-Based** | Multiple domains share the same IP. The server differentiates by the `Host` header. This is the most common type. |
| **IP-Based** | Each website has its own dedicated IP address. Less common due to IPv4 scarcity. |
| **Port-Based** | Different websites run on different ports on the same IP (e.g., `:8080`, `:8443`). |

!!! concept
    Virtual host enumeration is critical because a target might have `admin.example.com`, `dev.example.com`, or even `internal.corp` configured as virtual hosts on the same server — but none of them appear in public DNS. You can only discover them by guessing the `Host` header.

---

## 2️⃣ Discovering Virtual Hosts with `ffuf`

`ffuf` is the go-to tool for virtual host brute-forcing because it's fast and highly configurable.

### Basic Vhost Fuzzing
```bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
     -u http://<target_ip>/ \
     -H "Host: FUZZ.example.com" \
     -mc 200,301,302,403
```

### Filtering False Positives
The default virtual host will likely return a response for every request. To filter it out:

1. First, send a request with a random, non-existent hostname to get the default response size:
   ```bash
   curl -s -o /dev/null -w "%{size_download}" -H "Host: nonexistent12345.example.com" http://<target_ip>/
   # Output: 15231
   ```

2. Use `-fs` to filter out responses of that size:
   ```bash
   ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
        -u http://<target_ip>/ \
        -H "Host: FUZZ.example.com" \
        -fs 15231
   ```

!!! tip
    You can also filter by response word count (`-fw`), line count (`-fl`), or status code (`-fc`). Choose the filter that best differentiates valid responses from the default.

---

## 3️⃣ Discovering Virtual Hosts with `gobuster`

```bash
gobuster vhost -u http://<target_ip>/ \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  --domain example.com \
  --append-domain
```

!!! note
    In newer versions of `gobuster`, the `--append-domain` flag is required to append the base domain to each word in the wordlist (e.g., `FUZZ` becomes `FUZZ.example.com`).

---

## 4️⃣ Manual Testing with `curl`

If you suspect a specific virtual host exists, test it manually:
```bash
curl -s -H "Host: dev.example.com" http://<target_ip>/
curl -s -H "Host: admin.example.com" http://<target_ip>/
curl -s -H "Host: staging.example.com" http://<target_ip>/
```

Compare the responses to the default site. Different content, a different title, or a redirect indicates a valid virtual host.

---

## 5️⃣ Adding Discovered Hosts to `/etc/hosts`

Once you discover a virtual host, add it to your local hosts file so your browser can access it:

```bash
echo "<target_ip>  dev.example.com" | sudo tee -a /etc/hosts
```

Now you can navigate to `http://dev.example.com` in your browser and interact with the site normally.

---

## 6️⃣ Defensive Recommendations

- **Avoid Hosting Sensitive Virtual Hosts on Public-Facing Servers:** Internal applications should be on separate infrastructure, not sharing an IP with public sites.
- **Configure a Strict Default Virtual Host:** Return a `403 Forbidden` or a blank page for any `Host` header that doesn't match a configured site, instead of serving the default site.
- **Use HTTPS with SNI:** TLS Server Name Indication (SNI) reveals the virtual host name during the TLS handshake. Ensure you're aware of this exposure.

---

!!! warning
    **Virtual host brute-forcing generates HTTP traffic directly to the target server and will appear in access logs. Ensure you have authorization before performing this technique.**
