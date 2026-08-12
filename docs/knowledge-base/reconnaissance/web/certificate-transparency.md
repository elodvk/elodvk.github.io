---
title: "Certificate Transparency Logs"
description: "Using Certificate Transparency (CT) logs to passively discover subdomains, monitor certificate issuance, and detect unauthorized certificates."
tags:
  - certificate-transparency
  - ct-logs
  - crt.sh
  - subdomain
  - osint
  - passive-recon
---

# 📜 Certificate Transparency Logs

**Certificate Transparency (CT)** is a framework that requires Certificate Authorities (CAs) to publicly log every SSL/TLS certificate they issue. These logs are openly searchable, making them one of the most powerful passive reconnaissance resources for discovering subdomains and monitoring a target's certificate infrastructure.

---

## 1️⃣ How Certificate Transparency Works

When a CA (e.g., Let's Encrypt, DigiCert, Comodo) issues a certificate for `example.com` or `*.example.com`, it must submit the certificate to one or more **CT log servers**. These servers store the certificate in an append-only, cryptographically verifiable log.

The process:

1. A domain owner requests a certificate from a CA for `dev.example.com`.
2. The CA issues the certificate and submits it to public CT logs.
3. The certificate (including the domain name) is now **permanently and publicly visible**.

!!! concept
    CT was designed to detect rogue or misissued certificates (e.g., a compromised CA issuing a cert for `google.com`). As a side effect, it creates a comprehensive, searchable database of every domain that has ever had a certificate issued — a goldmine for reconnaissance.

---

## 2️⃣ Searching CT Logs with `crt.sh`

**crt.sh** (https://crt.sh) is the most popular web interface for searching CT logs. It's maintained by Sectigo (formerly Comodo).

### Web Interface
1. Navigate to https://crt.sh
2. Enter `%.example.com` to search for all certificates issued for any subdomain of `example.com`.
3. Review the results for subdomains, wildcard certs, and issuance dates.

### Command-Line Query (JSON API)
```bash
# Query crt.sh for all subdomains of example.com
curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq -r '.[].name_value' | sort -u
```

### Extracting Unique Subdomains
```bash
curl -s "https://crt.sh/?q=%25.example.com&output=json" | \
  jq -r '.[].name_value' | \
  sed 's/\*\.//g' | \
  sort -u > ct_subdomains.txt
```

!!! tip
    The `%25` in the URL is the URL-encoded form of `%`, which acts as a wildcard in crt.sh queries. `%.example.com` matches any subdomain.

---

## 3️⃣ Other CT Log Search Tools

### `certsh` (CLI wrapper)
```bash
# A simple Python wrapper for crt.sh
pip install certsh
certsh example.com
```

### `subfinder` (Built-in CT Source)
`subfinder` queries CT logs (among many other sources) by default:
```bash
subfinder -d example.com -sources crtsh
```

### `amass` (CT Integration)
Amass includes CT log querying in its passive enumeration:
```bash
amass enum -passive -d example.com
```

### Google Certificate Transparency Search
Google provides a searchable CT log viewer:
🔗 https://transparencyreport.google.com/https/certificates

### Censys Certificate Search
Censys indexes certificates and allows searching by domain, issuer, or fingerprint:
🔗 https://search.censys.io/certificates

---

## 4️⃣ What to Look For in CT Results

| Finding | Intelligence Value |
|---------|-------------------|
| `dev.example.com`, `staging.example.com` | Development/staging environments — often less hardened. |
| `vpn.example.com`, `remote.example.com` | VPN or remote access endpoints. |
| `api.example.com`, `api-v2.example.com` | API endpoints — potential targets for injection or auth bypass. |
| `internal.example.com`, `corp.example.com` | Internal-facing services accidentally exposed via certificate issuance. |
| `mail.example.com`, `smtp.example.com` | Mail infrastructure. |
| Wildcard certs (`*.example.com`) | Indicate the organization uses a single cert for all subdomains — limits what you can learn from individual certs. |
| Expired or revoked certs | May indicate decommissioned services that are still reachable. |
| Issuer information | Reveals which CA the organization uses (useful for phishing — attackers can issue look-alike certs from the same CA). |

---

## 5️⃣ Monitoring CT Logs for New Certificates

You can set up continuous monitoring to receive alerts whenever a new certificate is issued for your target domain. This is useful for both offensive (tracking new infrastructure) and defensive (detecting unauthorized certs) purposes.

### CertSpotter (by SSLMate)
```bash
# Sign up for free monitoring at:
# https://sslmate.com/certspotter/
```
CertSpotter sends email alerts whenever a new certificate is logged for your monitored domains.

### `certstream` (Real-Time CT Log Streaming)
```bash
pip install certstream
```

```python
import certstream

def callback(message, context):
    if message['message_type'] == "certificate_update":
        domains = message['data']['leaf_cert']['all_domains']
        for domain in domains:
            if "example.com" in domain:
                print(f"[+] New cert: {domain}")

certstream.listen_for_events(callback, url='wss://certstream.calidog.io/')
```

!!! concept
    `certstream` provides a real-time firehose of every certificate being issued across the internet. Filtering this stream for your target domain lets you detect new subdomains the moment they go live.

---

## 6️⃣ CT Logs and Wildcard Certificates

Organizations that use **wildcard certificates** (`*.example.com`) reduce their CT log footprint — only the wildcard cert appears in logs, not the individual subdomains it covers.

However:
- Not all subdomains may be covered by the wildcard (e.g., `*.dev.example.com` requires a separate cert).
- Some services issue individual certs even when a wildcard is available.
- Historical CT data may include individual subdomain certs from before the wildcard was adopted.

---

## 7️⃣ Defensive Recommendations

- **Monitor Your CT Logs:** Use CertSpotter or a similar service to get alerts when new certificates are issued for your domains. This detects:
  - Unauthorized certificates (e.g., from a compromised CA).
  - Shadow IT — employees setting up services and getting certs without IT approval.
  - Phishing domains using look-alike certificates.
- **Use CAA Records:** DNS CAA (Certificate Authority Authorization) records specify which CAs are allowed to issue certificates for your domain. This prevents unauthorized CAs from issuing certs.
  ```bash
  # Check existing CAA records
  dig caa example.com
  
  # Example CAA record (only allow Let's Encrypt)
  example.com. IN CAA 0 issue "letsencrypt.org"
  ```
- **Be Aware of Information Leakage:** Every certificate you request reveals the domain name publicly. Avoid requesting certs for internal-only subdomains unless necessary — use self-signed certs for internal services instead.

---

!!! warning
    **Querying CT logs is entirely passive and legal. The data is public by design. However, using discovered subdomains to access systems without authorization is illegal.**
