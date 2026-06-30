---
title: 'Detection & Prevention'
description: 'Blue team strategies for detecting pivoting, tunneling, and port forwarding activities, plus network hardening best practices.'
tags:
  - detection
  - prevention
  - blue-team
  - monitoring
  - hardening
icon: material/shield-check
---

# 🛡️ Detection & Prevention

Understanding how to detect and prevent pivoting techniques is critical for both offensive operators (to improve tradecraft) and defensive teams (to protect the network). This page covers indicators of compromise, detection strategies, and hardening recommendations for each tunneling technique.

---

## 1. General Detection Principles

### Network Baseline Anomalies

Most pivoting techniques create detectable anomalies when compared to normal network behavior:

| Indicator | Normal Behavior | Pivoting Behavior |
| :--- | :--- | :--- |
| **SSH sessions** | Short, interactive, to known hosts | Long-lived, high-throughput, to unusual destinations |
| **DNS traffic** | Small queries, known resolvers | Large TXT records, high volume, to unknown domains |
| **ICMP traffic** | Small echo/reply, low frequency | Large packets, sustained high frequency |
| **HTTP traffic** | Standard request/response patterns | Persistent connections, binary payloads, unusual User-Agents |
| **Port patterns** | Standard services on expected ports | Services on non-standard ports, listeners appearing on compromised hosts |

### The Detection Mindset

!!! important
    **No single indicator is definitive.** Effective detection requires correlating multiple signals across network, host, and log data. A single long-lived SSH session isn't suspicious — but a long-lived SSH session from a newly compromised host, with unusual data volumes, to an internal subnet it's never contacted before, is a high-fidelity alert.

---

## 2. Detecting SSH Tunneling

### Indicators

- **Unusually long SSH sessions** — Tunnel sessions remain open for hours or days
- **High data volume over SSH** — Normal SSH sessions transfer relatively little data; tunneling sessions move significantly more
- **SSH to non-standard ports** — Attackers often use non-standard ports to avoid detection
- **SSH sessions from service accounts** — Accounts that shouldn't be using SSH interactively
- **No PTY allocation** — SSH sessions opened with `-N -T` flags don't allocate a terminal, which is visible in SSH server logs

### Detection Commands & Rules

```bash
# Check for SSH processes with port forwarding flags
ps aux | grep ssh | grep -E '\-[DLR]'

# Monitor SSH auth logs for unusual patterns
grep "sshd" /var/log/auth.log | grep -i "forwarding"

# Check netstat for SOCKS proxy listeners
ss -tlnp | grep -E ':(9050|1080|8080)'
```

**Snort/Suricata Rule Example:**

```text
alert tcp any any -> any 22 (msg:"Potential SSH tunnel - high data volume"; \
    flow:established; dsize:>1000; threshold:type both,track by_src,count 100,seconds 60; \
    sid:1000001; rev:1;)
```

### Mitigation

- Restrict SSH access via firewall rules and jump hosts
- Monitor and alert on SSH sessions exceeding duration thresholds
- Disable SSH port forwarding where not needed: `AllowTcpForwarding no` in `sshd_config`
- Use SSH certificate authentication instead of passwords
- Implement network segmentation to limit what compromised hosts can reach via SSH

---

## 3. Detecting DNS Tunneling

### Indicators

- **Abnormally long DNS queries** — Encoded data creates unusually long subdomain labels
- **High volume of DNS requests** to a single domain — Normal DNS is bursty; tunneling creates sustained traffic
- **Unusual record types** — Heavy use of TXT, NULL, or CNAME records
- **DNS to non-standard resolvers** — Queries bypassing the corporate DNS infrastructure
- **High entropy in query names** — Base64/hex encoded data creates high-entropy strings

### Detection Tools

```bash
# Analyze DNS query lengths (queries over 50 chars are suspicious)
tcpdump -n -i eth0 port 53 2>/dev/null | awk '{print length($0), $0}' | sort -rn | head

# Use Zeek/Bro to log DNS and analyze
zeek -r capture.pcap local "Log::default_rotation_interval = 0 sec"
cat dns.log | awk '$10 > 50 {print}' # Queries with names longer than 50 chars
```

**Snort/Suricata Rule Example:**

```text
alert udp any any -> any 53 (msg:"Potential DNS tunnel - long query"; \
    content:"|00 01|"; offset:2; depth:2; \
    byte_test:1,>,50,12; sid:1000002; rev:1;)
```

### Mitigation

- Force all DNS traffic through monitored internal resolvers
- Block direct DNS (port 53) to external IPs at the firewall
- Implement DNS monitoring with tools like **Zeek**, **Passive DNS**, or **DNS Analytics**
- Set maximum query length limits on DNS resolvers
- Monitor for domains with high query volume from single hosts

---

## 4. Detecting ICMP Tunneling

### Indicators

- **Abnormally large ICMP packets** — Normal pings are 64 bytes; ICMP tunnels use much larger packets
- **Sustained ICMP traffic** — Continuous echo/reply streams instead of occasional pings
- **ICMP data payload entropy** — Normal ping payloads are repetitive patterns; tunneled data has high entropy
- **ICMP sessions** — Matched echo/reply pairs with varying payload sizes

### Detection

```bash
# Monitor for large ICMP packets (>100 bytes payload)
tcpdump -n -i eth0 'icmp and greater 128' -c 100

# Analyze ICMP payload sizes
tshark -r capture.pcap -Y "icmp" -T fields -e frame.len -e ip.src -e ip.dst | \
    awk '$1 > 100 {print}'
```

### Mitigation

- Limit ICMP packet sizes at the firewall (drop ICMP packets > 128 bytes)
- Rate-limit ICMP traffic
- Monitor ICMP traffic patterns and alert on anomalies
- Consider blocking ICMP entirely if not operationally required

---

## 5. Detecting HTTP/SOCKS Tunneling (Chisel, Rpivot)

### Indicators

- **Persistent HTTP connections** — Chisel and Rpivot maintain long-lived HTTP connections
- **Unusual User-Agent strings** — Default tool User-Agents differ from browser traffic
- **WebSocket upgrades** — Chisel uses WebSocket connections over HTTP
- **Binary data in HTTP payloads** — Tools transmit binary data that doesn't match normal web traffic
- **High-volume HTTP to non-web servers** — HTTP traffic to internal hosts that don't serve web content

### Detection

```bash
# Look for unusual HTTP connections to internal hosts
zeek -r capture.pcap
cat http.log | awk '$10 ~ /chisel|Go-http-client/ {print}'

# Check for long-lived HTTP connections
ss -tnp | grep -E ':(1234|8080)' | grep ESTAB
```

### Mitigation

- Deploy TLS inspection / SSL interception on egress proxies
- Monitor for WebSocket connections, especially to internal hosts
- Block outbound connections to non-standard ports
- Implement application-layer firewalls that validate HTTP traffic patterns
- Use EDR solutions that monitor process network behavior

---

## 6. Detecting Windows-Specific Pivoting

### Netsh Port Forwarding

```cmd
# Check for active port proxy rules
netsh interface portproxy show all

# Monitor for netsh execution in audit logs
# Event ID 1 (Process Create) in Sysmon for netsh.exe with portproxy arguments
```

### plink.exe

```cmd
# Look for plink.exe or renamed copies in unusual locations
Get-Process | Where-Object {$_.Path -notlike "C:\Program Files*"} | 
    Where-Object {$_.MainModule.FileVersionInfo.OriginalFilename -eq "PuTTY"}
```

### SocksOverRDP

- Monitor for `regsvr32.exe` loading unusual DLLs
- Watch for new virtual channels in RDP sessions
- Monitor for unexpected executable launches within RDP sessions

### Mitigation

- Enable **PowerShell Script Block Logging** and **Module Logging**
- Deploy **Sysmon** with rules monitoring for:
    - `netsh.exe` with `portproxy` arguments
    - `plink.exe` execution (or renamed binaries with PuTTY version info)
    - `regsvr32.exe` loading non-standard DLLs
- Restrict RDP access through Network Level Authentication and firewall rules
- Implement application whitelisting (AppLocker / WDAC) to prevent unauthorized tool execution

---

## 7. Network Hardening Checklist

| Category | Action | Priority |
| :--- | :--- | :--- |
| **Segmentation** | Implement micro-segmentation between network zones | 🔴 Critical |
| **Firewall Rules** | Default-deny with explicit allow rules, both inbound and outbound | 🔴 Critical |
| **SSH Hardening** | Disable port forwarding, use certificate auth, restrict access by IP | 🟡 High |
| **DNS Security** | Force all DNS through monitored resolvers, block external DNS | 🟡 High |
| **ICMP Controls** | Rate-limit and size-limit ICMP, block if not needed | 🟢 Medium |
| **HTTP Inspection** | Deploy TLS inspection on egress, block non-standard ports | 🟡 High |
| **Endpoint Detection** | Deploy EDR with behavior-based detection on all hosts | 🔴 Critical |
| **Logging** | Centralize logs (Sysmon, auth logs, network flow) into a SIEM | 🔴 Critical |
| **Monitoring** | Implement network flow analysis for anomaly detection | 🟡 High |
| **Access Control** | Principle of least privilege for all accounts and network access | 🔴 Critical |

---

## 8. Key Takeaways

!!! tip "For Offensive Operators"
    - Blend your tunneling traffic with normal network patterns
    - Use encrypted protocols (SSH, HTTPS) whenever possible
    - Minimize the duration and data volume of your tunnels
    - Clean up port forwarding rules and tools after use
    - Test your tools against the target's EDR before deploying

!!! tip "For Defensive Teams"
    - No single tool detects everything — layer your detection
    - Focus on behavioral anomalies rather than signature matching
    - Network segmentation is the single most effective control against pivoting
    - Assume breach: design your network so that compromising one host doesn't grant access to everything
    - Regularly audit firewall rules, SSH configurations, and network flow data
