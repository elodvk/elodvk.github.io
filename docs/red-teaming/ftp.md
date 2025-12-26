---
title: "FTP"
---

# FTP Footprinting Cheatsheet

Footprinting FTP (File Transfer Protocol) involves reconnaissance to identify FTP servers, versions, configurations, and accessible resources. FTP typically runs on ports 21 (control) and 20 (data). Focus on passive methods first to avoid detection. Always obtain explicit permission; FTP footprinting can reveal sensitive file structures.

*Legal Note*: Comply with laws (e.g., CFAA in the US). Use in authorized pentests only.

## 1. Passive Footprinting (No Direct Interaction)
Gather intel without connecting to the FTP service.

### DNS Enumeration for FTP
- **Purpose**: Discover FTP-specific subdomains or records.
- **Tools/Commands**:
  - `dig ftp.domain.com A` (resolve FTP subdomain IP).
  - `dig domain.com AXFR` (zone transfer attempt; often fails but worth trying).
  - Online: dnsdumpster.com (filter for "ftp" subdomains).
- **Common Subdomains**: ftp.domain.com, files.domain.com, upload.domain.com.
- **Tip**: Cross-reference with Shodan.io queries like `port:21 hostname:domain.com` for exposed FTP banners (use search filters).

### WHOIS & Domain Intel
- **Purpose**: Check if domain hosts FTP-related services via registrar data.
- **Tools**: `whois domain.com` (look for hosting providers known for FTP, e.g., shared hosts).
- **Online**: ViewDNS.info (reverse IP for shared FTP hosts).

### Search Engine Dorking
- **Purpose**: Find exposed FTP links or directories.
- **Common Dorks** (use `site:domain.com` prefix):

| Category | Dork Example | Purpose |
|----------|--------------|---------|
| FTP Links | `inurl:ftp filetype:pdf` | Public FTP file shares. |
| Directories | `intitle:"index of" ftp` | Open FTP listings. |
| Vulnerabilities | `site:domain.com "vsftpd 2.3.4"` | Version-specific exploits. |

- **Tools**: Google, Bing; Exploit-DB for FTP vulns.

### OSINT for FTP Exposure
- **Purpose**: Employee-shared FTP links or configs.
- **Tools**:
  - theHarvester: `theharvester -d domain.com -b google` (harvest FTP-related emails/links).
  - Pastebin.com searches: `ftp domain.com`.
- **Tip**: Check GitHub for leaked FTP configs (search "ftp.domain.com password").

## 2. Active Footprinting (Direct Interaction – Use Stealth)
Connect briefly; use VPN/Tor. Limit to single attempts.

### Port & Service Discovery
- **Purpose**: Confirm FTP is running and get basic info.
- **Tools/Commands**:
  - `nmap -p 21,20,990 domain.com` (scan FTP ports; 990 for FTPS).
  - `nmap -sV -p 21 domain.com` (version detection via banner).
  - Shodan CLI: `shodan host IP` (if IP known; shows FTP banners).
- **Output Example** (Nmap):
  ```
  21/tcp open  ftp     vsftpd 3.0.3
  ```
- **Scan Types for FTP**:
  | Type | Nmap Flag | Notes |
  |------|-----------|-------|
  | TCP SYN | `-sS -p 21` | Stealthy discovery. |
  | Version Grab | `-sV -p 21` | Extracts banner (e.g., "ProFTPD 1.3.5"). |
  | UDP (if needed) | `-sU -p 20` | Rare for FTP; checks data port. |

### Banner Grabbing
- **Purpose**: Retrieve server software/version without full login.
- **Tools/Commands**:
  - `telnet domain.com 21` (type `QUIT` to exit; banner shows on connect).
  - `nc -v domain.com 21` (Netcat: connect and read response).
  - `curl ftp://domain.com` (basic connect; shows greeting).
- **Common Banners**:
  - vsftpd: `220 (vsFTPd 3.0.3)`
  - ProFTPD: `220 ProFTPD 1.3.5 Server`
- **Tip**: Script it: `echo -e "QUIT\r\n" | nc domain.com 21` for automated grab.

### Anonymous Login & Enumeration
- **Purpose**: Test public access and list directories/files.
- **Tools/Commands**:
  - FTP Client: `ftp domain.com` → login as `anonymous` / `anonymous@domain.com`.
    - Commands inside: `ls` (list), `pwd` (current dir), `cd /` (root), `get file.txt` (download sample).
  - `lftp -u anonymous domain.com` (scriptable: `ls -la` for details).
  - `gopher://domain.com:21/_%2F%2F` (alternative protocol for enumeration if blocked).
- **Enumeration Techniques**:
  | Action | Command | Potential Findings |
  |--------|---------|--------------------|
  | List Root | `ls /` | Public dirs like /pub, /incoming. |
  | Recursive List | `ls -R` | Full tree structure. |
  | File Details | `ls -la` | Permissions, owners (e.g., writable dirs). |
  | Search | `mls` or external `grep` on output | Sensitive files (e.g., config.bak). |
- **Common Exposures**:
  - Writable dirs: Test `put test.txt` (upload attempt).
  - Backups: Look for .bak, ~ files.
- **Automation**: `ftp -n domain.com <<EOF` (here-doc script for batch commands).

### Vulnerability Scanning
- **Purpose**: Identify known FTP weaknesses.
- **Tools**:
  - `nmap --script ftp-* domain.com` (e.g., ftp-anon, ftp-bounce, ftp-vuln-vsftpd-backdoor).
  - Nikto: `nikto -h domain.com -port 21` (web-like scan for FTP).
  - OpenVAS/Nessus: FTP plugins for CVEs (e.g., CVE-2011-2523 vsftpd backdoor).
- **Common Vulns**:
  | Software | CVE Example | Check |
  |----------|-------------|-------|
  | vsftpd 2.3.4 | Backdoor | Banner match + script. |
  | ProFTPD | Mod_copy RCE | Version <1.3.5. |
  | Pure-FTPd | DoS | UDP scan + fuzz. |

## 3. Advanced Techniques
- **FTPS/SFTP Check**: Scan port 990 (implicit FTPS) or 22 (SFTP). Use `openssl s_client -connect domain.com:990`.
- **Traffic Analysis**: Wireshark filter `ftp` on captured packets (if in scope).
- **Brute-Force Intel**: Use `hydra -L users.txt -P pass.txt ftp://domain.com` (but ethically; for weak anon setups).
- **IPv6 FTP**: `nmap -6 -p 21 domain.com`.

## Best Practices
- **Stealth**: Rate-limit scans (`nmap -T2`), single IP probes.
- **Documentation**: Screenshot banners, log outputs (e.g., `script ftp_session.log`).
- **Evasion**: Spoof source (`hping3 --spoof`), use proxies.
- **Next Steps**: If vulnerable, escalate to exploitation (e.g., bounce attacks).
- **Resources**: RFC 959 (FTP spec), SANS "FTP Security", Exploit-DB FTP section.

*Last Updated: November 2025. Tailor to target; test in lab first.*