---
title: "Digging DNS"
description: "Manually querying DNS records using dig, nslookup, and host to uncover a target's infrastructure."
tags:
  - dns
  - dig
  - nslookup
  - host
  - information-gathering
  - active-recon
icon: material/web
---

# 🔎 Digging DNS

**DNS (Domain Name System)** is the backbone of the internet. Every domain name resolves to an IP address (or multiple), and the various record types (A, AAAA, MX, NS, TXT, CNAME, SOA, SRV, PTR) can reveal a tremendous amount about a target's infrastructure. This page covers how to manually query and interpret DNS records.

---

## 1️⃣ DNS Record Types Cheat Sheet

| Record | Description | Example |
|--------|-------------|---------|
| **A** | Maps a hostname to an IPv4 address. | `example.com → 93.184.216.34` |
| **AAAA** | Maps a hostname to an IPv6 address. | `example.com → 2606:2800:220:1:248:1893:25c8:1946` |
| **CNAME** | Alias — points one hostname to another. | `www.example.com → example.com` |
| **MX** | Mail Exchange — which server handles email for the domain. | `example.com → mail.example.com (priority 10)` |
| **NS** | Name Server — authoritative DNS servers for the domain. | `example.com → ns1.example.com` |
| **TXT** | Arbitrary text, often used for SPF, DKIM, DMARC, and domain verification. | `"v=spf1 include:_spf.google.com ~all"` |
| **SOA** | Start of Authority — admin email, serial number, refresh/retry/expire timers. | Contains zone metadata. |
| **SRV** | Service record — defines the location of specific services (e.g., SIP, LDAP, XMPP). | `_sip._tcp.example.com → sipserver.example.com:5060` |
| **PTR** | Pointer — reverse DNS, maps an IP back to a hostname. | `34.216.184.93.in-addr.arpa → example.com` |

---

## 2️⃣ Using `dig`

`dig` (Domain Information Groper) is the most powerful and flexible DNS query tool available on Linux and macOS.

### Query a Specific Record Type
```bash
# A record
dig a example.com

# MX records
dig mx example.com

# NS records
dig ns example.com

# TXT records (useful for finding SPF, DKIM, DMARC)
dig txt example.com

# SOA record (admin email and zone serial)
dig soa example.com

# ALL records (some servers block this)
dig any example.com
```

### Query a Specific DNS Server
By default, `dig` uses your system's configured resolver (`/etc/resolv.conf`). To target a specific server:
```bash
dig a example.com @8.8.8.8
dig a example.com @ns1.example.com
```

### Short Output (`+short`)
For scripting or quick results:
```bash
dig +short a example.com
# Output: 93.184.216.34
```

### Trace the Full Resolution Path (`+trace`)
This shows every step of the recursive DNS resolution process, from the root servers down to the authoritative server:
```bash
dig +trace example.com
```

!!! concept
    `+trace` is extremely useful for understanding the DNS hierarchy and identifying which server is ultimately authoritative for a domain. It can also reveal if DNS responses are being intercepted or modified (e.g., by a captive portal or ISP).

---

## 3️⃣ Using `nslookup`

`nslookup` is available on Windows, Linux, and macOS. It's simpler than `dig` but less flexible.

```bash
# Basic lookup
nslookup example.com

# Query a specific record type
nslookup -type=mx example.com

# Query a specific DNS server
nslookup example.com 8.8.8.8

# Interactive mode
nslookup
> set type=any
> example.com
```

---

## 4️⃣ Using `host`

`host` provides clean, human-readable output.

```bash
# Basic lookup
host example.com

# Specific record type
host -t mx example.com
host -t ns example.com
host -t txt example.com

# Reverse lookup (IP to hostname)
host 93.184.216.34
```

---

## 5️⃣ Reverse DNS Lookups

If you have an IP address (or a range), you can perform reverse lookups to discover what hostnames are associated with it.

```bash
# Single IP reverse lookup
dig -x 10.10.10.15

# Using dnsrecon to sweep a subnet
dnsrecon -r 10.10.10.0/24 -n <dns_server>
```

!!! tip
    Reverse DNS lookups on a target's known IP range can uncover internal hostnames, development servers, or services that are not linked from the main website.

---

## 6️⃣ Extracting Useful Intelligence from DNS

### SPF Records → Mail Infrastructure
```bash
dig txt example.com | grep "v=spf1"
```
SPF records list all IP addresses and services authorized to send email on behalf of the domain. This reveals mail servers and third-party email providers (e.g., Google Workspace, Microsoft 365, SendGrid).

### DMARC Records → Email Policy
```bash
dig txt _dmarc.example.com
```
DMARC policies (`p=none`, `p=quarantine`, `p=reject`) indicate how strictly the domain handles spoofed emails.

### SRV Records → Internal Services
```bash
dig srv _sip._tcp.example.com
dig srv _ldap._tcp.example.com
```
SRV records can expose internal service endpoints like LDAP, SIP, or XMPP servers.

---

!!! warning
    **DNS queries are generally considered passive reconnaissance, but querying a target's own DNS server directly (e.g., `dig @ns1.target.com`) is active and may be logged.**
