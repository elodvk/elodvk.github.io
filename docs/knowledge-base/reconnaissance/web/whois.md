---
title: "WHOIS"
description: "Using WHOIS to query domain registration data, uncover ownership details, registrar information, and name servers."
tags:
  - whois
  - osint
  - passive-recon
  - domain
  - information-gathering
icon: material/card-account-details-outline
---

# 🔍 WHOIS

**WHOIS** is a query-response protocol used to look up information about the registration of a domain name, IP address, or autonomous system number. It is one of the first tools used in passive reconnaissance because it requires no direct interaction with the target's web application or infrastructure.

---

## 1️⃣ What Information Does WHOIS Reveal?

A WHOIS query can return a wealth of information:

| Field | Description | Pentesting Value |
|-------|-------------|-----------------|
| **Registrant Name / Org** | The person or organization that registered the domain. | Identifies the target company or individual. |
| **Admin / Tech Contact** | Email addresses and phone numbers of administrative contacts. | Useful for social engineering or phishing. |
| **Registrar** | The company through which the domain was registered (e.g., GoDaddy, Namecheap). | Potential attack vector if registrar account is compromised. |
| **Name Servers** | The DNS servers authoritative for the domain. | Targets for DNS enumeration and zone transfer attempts. |
| **Creation / Expiry Date** | When the domain was registered and when it expires. | Expiring domains can be hijacked. |
| **DNSSEC** | Whether DNS Security Extensions are enabled. | Indicates security posture. |

!!! concept
    Many domains now use **WHOIS Privacy Protection** (offered by registrars). This replaces the registrant's personal details with proxy contact information. While this hinders direct contact discovery, the registrar and name servers are still visible.

---

## 2️⃣ Using the `whois` Command

The `whois` command-line tool is available on most Linux distributions and macOS.

### Basic Query
```bash
whois example.com
```

### Querying a Specific WHOIS Server
Different TLDs (Top-Level Domains) are managed by different WHOIS servers. You can specify one directly:
```bash
whois -h whois.verisign-grs.com example.com
```

### Querying an IP Address
You can also WHOIS an IP address to find out who owns it (the ISP, hosting provider, or organization):
```bash
whois 93.184.216.34
```

---

## 3️⃣ Online WHOIS Tools

If you don't have command-line access, several web-based tools provide the same data:

- **DomainTools:** https://whois.domaintools.com/
- **who.is:** https://who.is/
- **ICANN Lookup:** https://lookup.icann.org/
- **ViewDNS.info:** https://viewdns.info/whois/

---

## 4️⃣ Reverse WHOIS Lookups

A **Reverse WHOIS** lookup takes a known piece of registrant data (e.g., an email address, organization name, or phone number) and finds **all other domains** registered with the same details. This is extremely powerful for mapping out a target's full domain portfolio.

```bash
# Using ViewDNS.info (web-based)
# Navigate to: https://viewdns.info/reversewhois/
# Enter the registrant email or organization name
```

!!! tip
    Reverse WHOIS is invaluable during bug bounty and red team engagements. A company might have `example.com` in scope, but you could discover `example-staging.com`, `exampledev.io`, or `internal-example.net` — all registered under the same organization.

---

## 5️⃣ WHOIS History

Domain registration details change over time. **WHOIS History** services let you see past registration records, which can reveal:
- Previous owners of the domain.
- Old name servers that might still have cached zone data.
- Past email addresses that could be used in credential stuffing attacks.

**Tools:**
- **DomainTools WHOIS History:** https://whois.domaintools.com/
- **WhoisFreaks:** https://whoisfreaks.com/

---

## 6️⃣ Defensive Recommendations

- **Enable WHOIS Privacy:** Use your registrar's privacy protection service to hide personal contact details from public WHOIS queries.
- **Use a Generic Admin Email:** If privacy protection isn't available, use a role-based email (e.g., `admin@example.com`) instead of a personal one.
- **Monitor Domain Expiry:** Set up reminders and auto-renewal to prevent domain expiration and hijacking.
- **Consolidate Registrars:** Use a single, reputable registrar with strong 2FA to reduce the attack surface.

---

!!! warning
    **WHOIS data is publicly available and querying it is legal. However, using the information obtained for unauthorized access, social engineering, or harassment is illegal.**
