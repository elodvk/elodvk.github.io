---
title: "DNS Zone Transfers"
description: "Exploiting misconfigured DNS servers to dump entire zone files via AXFR."
tags:
  - dns
  - axfr
  - zone-transfer
  - information-gathering
  - active-recon
icon: material/web
---

# 📋 DNS Zone Transfers

A **DNS Zone Transfer (AXFR)** is a mechanism designed to replicate DNS databases between authoritative DNS servers. If a DNS server is misconfigured to allow zone transfers from any IP address, an attacker can request and receive **every single DNS record** for the domain — effectively mapping out the entire publicly-facing (and sometimes internal) infrastructure in one query.

---

## 1️⃣ How Zone Transfers Work

In a properly configured environment:
1. A **primary (master) DNS server** holds the authoritative copy of the zone file.
2. **Secondary (slave) DNS servers** periodically request a full copy of the zone (AXFR) or incremental updates (IXFR) from the primary to stay synchronized.
3. The primary server should **only allow** these transfers to known, trusted secondary servers by IP address.

The vulnerability arises when the primary server allows transfers to **any requesting IP** — including an attacker's machine.

!!! concept
    A successful zone transfer is the single most impactful DNS enumeration technique. It reveals every A, AAAA, CNAME, MX, NS, TXT, SRV, and PTR record in the zone, potentially exposing internal hostnames, development servers, and network architecture.

---

## 2️⃣ Attempting a Zone Transfer

You must direct your AXFR request at one of the domain's **authoritative name servers** (not a general resolver like 8.8.8.8).

### Step 1: Find the Name Servers
```bash
dig ns example.com +short
```
Output:
```
ns1.example.com.
ns2.example.com.
```

### Step 2: Attempt the Transfer Against Each NS
```bash
# Try each name server — one might be misconfigured while the other is secure
dig axfr example.com @ns1.example.com
dig axfr example.com @ns2.example.com
```

### Using `host`
```bash
host -l example.com ns1.example.com
```

### Using `nslookup`
```bash
nslookup
> server ns1.example.com
> set type=any
> ls -d example.com
```

---

## 3️⃣ Successful Zone Transfer Output

If the transfer succeeds, you'll see a dump of every record in the zone:

```text
; <<>> DiG 9.18.12 <<>> axfr example.com @ns1.example.com
;; ANSWER SECTION:
example.com.        86400  IN  SOA   ns1.example.com. admin.example.com. 2024010101 3600 900 604800 86400
example.com.        86400  IN  NS    ns1.example.com.
example.com.        86400  IN  NS    ns2.example.com.
example.com.        86400  IN  A     93.184.216.34
example.com.        86400  IN  MX    10 mail.example.com.
example.com.        86400  IN  TXT   "v=spf1 include:_spf.google.com ~all"
dev.example.com.    86400  IN  A     10.10.10.50
staging.example.com. 86400  IN  A    10.10.10.51
vpn.example.com.    86400  IN  A     10.10.10.52
db.example.com.     86400  IN  A     10.10.10.100
admin.example.com.  86400  IN  CNAME example.com.
```

!!! tip
    Save the output to a file for later analysis: `dig axfr example.com @ns1.example.com > zone_dump.txt`

---

## 4️⃣ Automating Zone Transfers with `dnsrecon`

`dnsrecon` automatically finds name servers and attempts transfers against all of them:
```bash
dnsrecon -d example.com -t axfr
```

### Using `dnsenum`
```bash
dnsenum example.com
```
`dnsenum` also attempts zone transfers as part of its default enumeration run.

---

## 5️⃣ What to Look For in Zone Data

| Record Pattern | Intelligence Value |
|----------------|-------------------|
| `dev.*`, `staging.*`, `test.*` | Development/staging environments — often less secure than production. |
| `vpn.*`, `remote.*` | VPN endpoints — potential targets for credential attacks. |
| `db.*`, `sql.*`, `mongo.*` | Database servers — high-value targets if exposed. |
| `admin.*`, `panel.*`, `cms.*` | Administrative interfaces — often have weaker authentication. |
| `mail.*`, `smtp.*`, `imap.*` | Mail infrastructure — useful for phishing and email attacks. |
| Internal RFC1918 addresses (`10.x`, `172.16.x`, `192.168.x`) | Leaked internal network structure. |

---

## 6️⃣ Defensive Recommendations

- **Restrict Zone Transfers by IP:** In BIND, use `allow-transfer { trusted_secondary_ip; };` in `named.conf`. In Windows DNS, configure zone transfer restrictions in the DNS Manager.
- **Use TSIG (Transaction Signatures):** Authenticate zone transfer requests with shared secret keys for an additional layer of security beyond IP-based ACLs.
- **Audit Regularly:** Periodically test your own DNS servers for open zone transfers using `dig axfr`.
- **Monitor DNS Logs:** Alert on AXFR requests from unauthorized IP addresses.

---

!!! warning
    **Attempting a zone transfer against a server you do not own or have authorization to test may be logged and flagged as suspicious activity.**
