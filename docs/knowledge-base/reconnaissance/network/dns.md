---
title: "DNS Reconnaissance"
description: "Techniques and tools to discover, enumerate, and extract information from DNS (Domain Name System) servers."
tags:
  - enumeration
  - dns
  - footprinting
  - reconnaissance
  - dig
  - nslookup
  - zone transfer
icon: material/dns
---

# 🌐 DNS Footprinting

**DNS** (Domain Name System) translates human-readable domain names into IP addresses. Since it maps out a target's infrastructure, querying and enumerating DNS records is a critical first step in external reconnaissance. Misconfigured DNS servers can leak the entire zone file (all records) or internal network structures.

---

## 1️⃣ Service Discovery & Basic Queries

DNS operates primarily on **TCP and UDP port 53**. UDP is used for standard queries, while TCP is used for zone transfers and large responses (e.g., DNSSEC).

### Basic Record Types to Enumerate
- **A / AAAA**: IPv4 / IPv6 addresses.
- **MX**: Mail Exchange servers.
- **NS**: Name Servers.
- **TXT**: Text records (often contain SPF, DMARC, or verification keys).
- **CNAME**: Canonical names (aliases).
- **SOA**: Start of Authority (contains admin email and zone serial numbers).

### Using `dig`
```bash
# Query an A record
dig a example.com @<target_dns_server>

# Query ANY records (deprecated on some modern setups, but worth trying)
dig any example.com @<target_dns_server>

# Query Mail Exchange (MX) records
dig mx example.com @<target_dns_server>

# Query Name Servers (NS)
dig ns example.com @<target_dns_server>
```

### Using `nslookup`
```bash
nslookup -type=any example.com <target_dns_server>
```

### Using `host`
```bash
host -t ns example.com
host -t mx example.com
```

---

## 2️⃣ Zone Transfers (AXFR)

A **Zone Transfer (AXFR)** is a mechanism used to replicate DNS databases across a set of DNS servers. If a server is misconfigured to allow zone transfers to any IP address, an attacker can extract all DNS records for a domain, revealing internal subdomains and IP addresses.

### Attempting an AXFR with `dig`
```bash
# You must query a specific Name Server (NS) for the domain
dig axfr example.com @ns1.example.com
```

### Attempting an AXFR with `host`
```bash
host -l example.com ns1.example.com
```

### Automated DNS Reconnaissance with `dnsrecon`
```bash
# dnsrecon will automatically find NS servers and attempt a zone transfer
dnsrecon -d example.com -t axfr
```

!!! concept
    If a zone transfer succeeds, you have effectively mapped the organization's exposed infrastructure. Always attempt AXFR against *all* name servers for a domain, as one might be misconfigured while the others are secure.

---

## 3️⃣ Subdomain Enumeration (Brute-Force)

When a zone transfer fails, we can brute-force subdomains by querying a list of common prefixes (e.g., `dev`, `staging`, `vpn`, `mail`).

### `fierce`
Fierce is a classic DNS reconnaissance tool that attempts zone transfers and falls back to brute-forcing.
```bash
fierce --domain example.com --dns-servers <target_dns_server>
```

### `dnsenum`
Automates MX/NS lookups, zone transfers, and brute-forcing.
```bash
dnsenum --dnsserver <target_dns_server> -f /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt example.com
```

### `gobuster` (DNS Mode)
```bash
gobuster dns -d example.com -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -r <target_dns_server>
```

### `ffuf` (Virtual Host & DNS Brute-forcing)
Often, resolving a subdomain locally and checking for HTTP virtual host routing yields results:
```bash
ffuf -w subdomains.txt -u http://10.10.10.10/ -H "Host: FUZZ.example.com" -mc 200,301,302
```

---

## 4️⃣ Reverse DNS Lookups (PTR)

If you have a target subnet, you can perform reverse DNS lookups to resolve IP addresses back to hostnames. This often uncovers hidden services.

```bash
# Perform a reverse lookup on a single IP
dig -x 10.10.10.15

# Perform a reverse lookup on an entire subnet using dnsrecon
dnsrecon -r 10.10.10.0/24 -n <target_dns_server>
```

---

## 5️⃣ DNSSEC Zone Walking

If **DNSSEC** (DNS Security Extensions) is enabled, it uses NSEC or NSEC3 records to provide cryptographic proof of non-existence for a domain name.

- **NSEC Zone Walking:** Since NSEC records point to the "next" valid record in a sorted zone, an attacker can walk the chain of NSEC records to discover all subdomains.
- **NSEC3:** Uses hashed domain names to prevent simple zone walking, but these hashes can sometimes be cracked offline.

### Enumerating NSEC records with `dnsrecon`
```bash
dnsrecon -d example.com -t zonewalk
```

### Enumerating with Nmap
```bash
nmap -sSU -p 53 --script dns-nsec-enum --script-args dns-nsec-enum.domains=example.com <target_dns_server>
```

---

## 6️⃣ Advanced Tools Overview

| Tool | Description | Example Command |
|------|-------------|-----------------|
| **dnsrecon** | Comprehensive DNS enumeration script (Python). | `dnsrecon -d example.com -t std,brt` |
| **dnsenum** | Perl script that enumerates DNS information. | `dnsenum example.com` |
| **subfinder** | Fast passive subdomain discovery tool. | `subfinder -d example.com` |
| **amass** | In-depth attack surface mapping and asset discovery. | `amass enum -d example.com` |

---

## 7️⃣ Defensive Recommendations (Quick Checklist)

- **Restrict Zone Transfers:** Configure the DNS server to allow AXFR/IXFR requests *only* from trusted secondary/replica servers.
  - In BIND (`named.conf`): `allow-transfer { 192.168.1.10; };`
- **Implement Split-Horizon DNS:** Serve internal DNS records to internal clients and public records to external clients. This prevents external exposure of internal infrastructure.
- **Rate Limiting:** Protect against DNS amplification attacks and brute-forcing by rate-limiting queries.
- **Hide Server Version:** Disable version binding to prevent banner grabbing (e.g., `version "Not Disclosed";` in BIND).
- **Use NSEC3 (if using DNSSEC):** Configure NSEC3 instead of NSEC to mitigate trivial zone walking.

---

## 8️⃣ References & Further Reading

- HackTricks - DNS Pentesting: https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns
- Nmap DNS Scripts: https://nmap.org/nsedoc/scripts/dns-zone-transfer.html
- dnsrecon GitHub: https://github.com/darkoperator/dnsrecon
- BIND 9 Security Best Practices: https://kb.isc.org/docs/aa-00512


!!! warning
    **All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of DNS infrastructure is illegal and may trigger security alerts.**
