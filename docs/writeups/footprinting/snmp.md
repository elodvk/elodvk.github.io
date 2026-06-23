---
title: 'SNMP Footprinting & Enumeration'
description: 'A comprehensive guide on fingerprinting Simple Network Management Protocol (SNMP) services, discovering device information, and enumerating OIDs using tools like snmpwalk, nmap, snmpcheck, and Metasploit.'
tags: ['snmp', 'footprinting', 'enumeration', 'reconnaissance', 'nmap', 'metasploit', 'snmpwalk']
---

# 📡 SNMP Footprinting & Enumeration

Simple Network Management Protocol (SNMP) is widely used for monitoring and managing network devices (routers, switches, servers, printers, IoT devices, etc.). Because many devices expose SNMP publicly with default or weak community strings, SNMP becomes a treasure‑trove of information for both attackers and defenders.

---

## 1. Why SNMP is a High‑Value Target

- **Rich Asset Data:** Each device can disclose hardware model, OS version, interface list, routing tables, running processes, and even configuration files.
- **Default Communities:** The majority of devices ship with `public`/`private` community strings. If unchanged, they grant read‑only or read‑write access to the MIB tree.
- **Passive Reconnaissance:** SNMP queries are UDP‑based and relatively low‑volume, making them difficult to detect with traditional IDS.
- **Pivot Point:** Knowledge gleaned from SNMP often reveals internal IP ranges, VLAN IDs, and other services that can be later targeted.

---

## 2. Basic SNMP Enumeration Commands

| Command | Description |
| :--- | :--- |
| `snmpwalk -v2c -c public <target>` | Walks the entire MIB tree using SNMPv2c with the `public` community (default read‑only). |
| `snmpwalk -v1 -c private <target>` | Same as above but using SNMPv1 and the `private` community (often read‑write). |
| `snmpget -v2c -c public <target> .1.3.6.1.2.1.1.1.0` | Retrieves a single OID – here the sysDescr (device description). |
| `snmpcheck -c public -t <target>` | Specialized tool that extracts a curated set of common OIDs (interfaces, routing tables, software inventory). |

> **Tip:** When scanning many hosts, wrap the above commands in a loop or use tools like `masscan` to discover open UDP 161 ports first.

---

## 3. Nmap Scripting Engine (NSE) for SNMP

Nmap ships with a suite of SNMP‑related scripts that automate discovery and vulnerability checks.

```bash
# Quick SNMP version & community discovery
nmap -sU -p161 --script snmp-info <target>

# Brute‑force community strings (uses a wordlist)
nmap -sU -p161 --script snmp-brute --script-args snmp-brute.communities=communities.txt <target>

# Enumerate interfaces, routing tables, and more
nmap -sU -p161 --script snmp-netstat,snmp-interfaces,snmp-processes <target>
```

**Common NSE Scripts**:
- `snmp-info` – identifies SNMP version and device type.
- `snmp-brute` – tries a list of community strings.
- `snmp-interfaces` – pulls interface details.
- `snmp-netstat` – shows routing tables.
- `snmp-processes` – attempts to list running processes (requires read‑write access).

---

## 4. Metasploit Modules

Metasploit provides several auxiliary modules for SNMP:

```bash
msfconsole
use auxiliary/scanner/snmp/snmp_walk
set RHOSTS 10.10.10.0/24
set COMMUNITY public
run
```

Other useful modules:
- `auxiliary/scanner/snmp/snmp_login` – brute‑forces community strings.
- `auxiliary/scanner/snmp/snmp_enum` – gathers extensive system information.

---

## 5. Advanced SNMP Tools

| Tool | Purpose |
| :--- | :--- |
| **snmpcheck** | Fast, opinionated enumeration of common OIDs (interfaces, routes, software). |
| **onesixtyone** | UDP scanner that quickly tests a list of community strings against many hosts. |
| **snmprecon** | Python script that extracts a wide range of MIB data and outputs JSON for further analysis. |
| **walktrap** | Visualizes MIB trees, helpful for spotting unusual OIDs. |

---

## 6. Sample Workflow (Step‑by‑Step)

1. **Discovery** – Identify hosts with UDP 161 open.
   ```bash
   masscan -pU:161 10.0.0.0/16 --rate 1000 -oL snmp_hosts.txt
   ```
2. **Community Guessing** – Use `snmp-brute` or `onesixtyone`.
   ```bash
   onesixtyone -c communities.txt -i snmp_hosts.txt
   ```
3. **Information Harvesting** – Run `snmpwalk` / `snmpcheck`.
   ```bash
   snmpcheck -c public -t 10.10.10.25 > snmp_report.txt
   ```
4. **Correlate Data** – Map interfaces to IP ranges, identify default passwords, and feed results into a central asset inventory.

---

## 7. Defensive Countermeasures

- **Change Default Communities** – Use strong, non‑guessable community strings. Rotate them regularly.
- **Restrict Access** – Limit SNMP to trusted management subnets (firewall ACLs).
- **Upgrade to SNMPv3** – Provides authentication (HMAC) and encryption (DES/AES). Disable v1/v2c where possible.
- **Monitor UDP 161** – Deploy IDS/IPS signatures for abnormal SNMP traffic and brute‑force attempts.
- **Patch Firmware** – Many devices have known SNMP information leaks; keep firmware up‑to‑date.

---

## 8. References & Further Reading

- [SNMP RFC 3411‑3418](https://tools.ietf.org/html/rfc3411) – Official protocol specifications.
- [Nmap NSE – SNMP Scripts](https://nmap.org/nsedoc/scripts/snmp-*.html)
- [snmpcheck GitHub Repository](https://github.com/jessek/snmpcheck)
- [Metasploit SNMP Modules](https://github.com/rapid7/metasploit-framework/tree/master/modules/auxiliary/scanner/snmp)

---

*All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of SNMP services is illegal and may trigger security alerts.*
