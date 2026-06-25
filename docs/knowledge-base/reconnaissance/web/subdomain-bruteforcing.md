---
title: "Subdomain Bruteforcing"
description: "Discovering hidden subdomains using wordlists, passive sources, and automated tools."
tags:
  - subdomain
  - bruteforce
  - gobuster
  - ffuf
  - subfinder
  - information-gathering
icon: material/web-search
---

# 🔨 Subdomain Bruteforcing

When DNS zone transfers fail (as they should on a well-configured server), **subdomain brute-forcing** becomes the primary method for discovering the target's subdomains. By prepending common words (e.g., `dev`, `staging`, `api`, `mail`, `vpn`) to the base domain and checking if they resolve, you can uncover hidden infrastructure.

---

## 1️⃣ Passive Subdomain Enumeration

Before sending any traffic to the target, collect subdomains from public sources. These tools query certificate transparency logs, search engines, and DNS datasets — the target never sees your IP.

### `subfinder`
A fast passive subdomain discovery tool that queries dozens of sources (crt.sh, VirusTotal, Shodan, etc.).
```bash
subfinder -d example.com -o subdomains.txt
```

### `amass enum` (Passive Mode)
```bash
amass enum -passive -d example.com -o amass_passive.txt
```

### Certificate Transparency Logs (crt.sh)
Certificates issued for a domain are publicly logged. Query them directly:
```bash
curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq -r '.[].name_value' | sort -u
```

!!! concept
    **Certificate Transparency (CT)** is a framework where Certificate Authorities (CAs) are required to publish every SSL/TLS certificate they issue to a public log. Since wildcard certs or individual subdomain certs are logged, this is a goldmine for subdomain discovery.

---

## 2️⃣ Active Subdomain Brute-Forcing

If passive methods don't reveal enough, it's time to actively resolve subdomains against the target's DNS server.

### `gobuster` (DNS Mode)
```bash
gobuster dns -d example.com \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -r <target_dns_server>
```

### `ffuf` (DNS Resolution via Virtual Hosts)
`ffuf` can also be used for subdomain discovery by fuzzing the `Host` header:
```bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
     -u http://<target_ip>/ \
     -H "Host: FUZZ.example.com" \
     -mc 200,301,302 \
     -fs <default_response_size>
```

!!! tip
    The `-fs` (filter size) flag is critical with `ffuf`. First, send a request with a non-existent subdomain to see the default response size, then filter it out to see only valid results.

### `dnsenum`
Automates NS lookups, zone transfers, and brute-forcing in one command:
```bash
dnsenum --dnsserver <target_dns> \
  -f /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  example.com
```

### `fierce`
```bash
fierce --domain example.com --dns-servers <target_dns_server>
```

---

## 3️⃣ Choosing the Right Wordlist

The quality of your results depends heavily on the wordlist you use.

| Wordlist | Size | Best For |
|----------|------|----------|
| `subdomains-top1million-110000.txt` | ~110k entries | Thorough general-purpose scan. |
| `subdomains-top1million-5000.txt` | ~5k entries | Quick initial scan. |
| `bitquark-subdomains-top100000.txt` | ~100k entries | Alternative dataset with different coverage. |
| Custom (from passive recon) | Varies | Combine passive results into a custom list for targeted brute-forcing. |

Wordlists are typically found in `/usr/share/wordlists/seclists/Discovery/DNS/` on Kali Linux.

---

## 4️⃣ Permutation & Alteration Scanning

Beyond static wordlists, **permutation scanning** generates variations of known subdomains. For example, if you know `dev.example.com` exists, the tool will try `dev1.example.com`, `dev-staging.example.com`, `dev2.example.com`, etc.

### `altdns`
```bash
# Generate permutations and resolve them
altdns -i known_subdomains.txt -o permutations.txt -w words.txt -r -s resolved.txt
```

### `dnsgen`
```bash
cat known_subdomains.txt | dnsgen - | massdns -r resolvers.txt -t A -o S
```

---

## 5️⃣ Recursive Subdomain Enumeration

Don't stop at the first level. If you find `dev.example.com`, it might have its own subdomains (e.g., `api.dev.example.com`, `db.dev.example.com`).

```bash
# Run subfinder or gobuster against each discovered subdomain
subfinder -d dev.example.com
```

---

## 6️⃣ Defensive Recommendations

- **Wildcard DNS:** Configure a wildcard DNS record (`*.example.com`) to point to a default page. This makes brute-forcing harder (every query resolves), though attackers can filter by response size.
- **Rate Limiting:** Implement DNS rate limiting on your authoritative servers to slow down brute-force attempts.
- **Monitor CT Logs:** Use tools like [CertSpotter](https://sslmate.com/certspotter/) to monitor for unauthorized certificate issuance.
- **Internal DNS Separation:** Never expose internal subdomains (e.g., `dc01.corp.example.com`) via public DNS.

---

!!! warning
    **Active subdomain brute-forcing generates a large volume of DNS queries and is easily detectable. Ensure you have authorization before performing active enumeration.**
