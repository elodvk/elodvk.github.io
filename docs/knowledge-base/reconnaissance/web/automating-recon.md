---
title: "Automating Recon"
description: "Chaining reconnaissance tools together with frameworks like Amass, recon-ng, and custom scripts for efficient, repeatable information gathering."
tags:
  - automation
  - amass
  - recon-ng
  - reconftw
  - information-gathering
---

# ⚙️ Automating Recon

Manual reconnaissance is thorough but slow. **Automating recon** allows you to chain multiple tools together, run them in parallel, and produce comprehensive results in a fraction of the time. This page covers frameworks, wrapper scripts, and best practices for building an automated recon pipeline.

---

## 1️⃣ Why Automate?

| Benefit | Description |
|---------|-------------|
| **Speed** | Run dozens of tools simultaneously instead of one at a time. |
| **Consistency** | Every target gets the same level of enumeration — nothing is forgotten. |
| **Repeatability** | Re-run the same pipeline against the same target days or weeks later to detect changes. |
| **Scale** | Handle hundreds of targets in bug bounty or red team engagements. |

---

## 2️⃣ Amass

**Amass** (by OWASP) is one of the most powerful attack surface mapping tools available. It combines passive sources, DNS brute-forcing, and active probing.

### Installation
```bash
# Go install
go install -v github.com/owasp-amass/amass/v4/...@master

# Or via package manager on Kali
sudo apt install amass
```

### Passive Enumeration (No Direct Contact)
```bash
amass enum -passive -d example.com -o amass_passive.txt
```

### Active Enumeration (DNS Resolution + Brute-Forcing)
```bash
amass enum -active -d example.com -brute -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt -o amass_active.txt
```

### Visualizing Results
```bash
amass viz -d example.com -o amass_graph.html
```

!!! tip
    Amass supports dozens of passive data sources (Shodan, VirusTotal, SecurityTrails, etc.). Configure API keys in `~/.config/amass/config.yaml` to unlock their full potential.

---

## 3️⃣ recon-ng

**recon-ng** is a modular reconnaissance framework (similar to Metasploit) with a large library of modules for OSINT, DNS, WHOIS, and more.

### Starting recon-ng
```bash
recon-ng
```

### Basic Workflow
```bash
# Create a workspace for the target
[recon-ng] > workspaces create example_com

# Add the target domain
[recon-ng] > db insert domains
  domain (TEXT): example.com

# Search for available modules
[recon-ng] > marketplace search subdomains

# Install and load a module
[recon-ng] > marketplace install recon/domains-hosts/hackertarget
[recon-ng] > modules load recon/domains-hosts/hackertarget
[recon-ng] > run

# View discovered hosts
[recon-ng] > show hosts
```

### Useful Modules

| Module | Description |
|--------|-------------|
| `recon/domains-hosts/hackertarget` | Queries HackerTarget API for subdomains. |
| `recon/domains-hosts/certificate_transparency` | Queries CT logs. |
| `recon/hosts-hosts/resolve` | Resolves discovered hostnames to IPs. |
| `recon/domains-contacts/whois_pocs` | Extracts WHOIS contacts. |
| `reporting/html` | Generates an HTML report. |

---

## 4️⃣ reconftw

**reconftw** is a comprehensive, automated recon wrapper script that chains together dozens of tools (subfinder, amass, httpx, nuclei, etc.) into a single pipeline.

### Installation
```bash
git clone https://github.com/six2dez/reconftw.git
cd reconftw
./install.sh
```

### Running a Full Recon
```bash
./reconftw.sh -d example.com -r
```

reconftw runs the following stages automatically:
1. Subdomain enumeration (passive + active).
2. DNS resolution and live host detection.
3. Port scanning.
4. Web technology fingerprinting.
5. Web crawling and screenshot capture.
6. Vulnerability scanning (via Nuclei).

---

## 5️⃣ Building a Custom Pipeline (Bash)

You can chain individual tools together with a simple bash script:

```bash
#!/bin/bash
TARGET=$1
OUTPUT_DIR="recon_$TARGET"
mkdir -p "$OUTPUT_DIR"

echo "[*] Running subfinder..."
subfinder -d "$TARGET" -silent -o "$OUTPUT_DIR/subdomains.txt"

echo "[*] Running amass (passive)..."
amass enum -passive -d "$TARGET" -o "$OUTPUT_DIR/amass.txt" 2>/dev/null

echo "[*] Merging and deduplicating..."
cat "$OUTPUT_DIR/subdomains.txt" "$OUTPUT_DIR/amass.txt" | sort -u > "$OUTPUT_DIR/all_subs.txt"

echo "[*] Resolving live hosts..."
cat "$OUTPUT_DIR/all_subs.txt" | httpx -silent -status-code -title -o "$OUTPUT_DIR/live_hosts.txt"

echo "[*] Extracting wayback URLs..."
cat "$OUTPUT_DIR/all_subs.txt" | waybackurls | sort -u > "$OUTPUT_DIR/wayback.txt"

echo "[*] Running nuclei..."
cat "$OUTPUT_DIR/live_hosts.txt" | awk '{print $1}' | nuclei -silent -o "$OUTPUT_DIR/nuclei_results.txt"

echo "[+] Recon complete! Results saved to $OUTPUT_DIR/"
```

```bash
chmod +x recon.sh
./recon.sh example.com
```

---

## 6️⃣ Notifications & Monitoring

For continuous recon (e.g., bug bounty monitoring), set up notifications when new subdomains or changes are detected.

### `notify` (by ProjectDiscovery)
```bash
# Pipe results into notify to get alerts via Slack, Discord, Telegram, etc.
subfinder -d example.com | notify -provider-config notify-config.yaml
```

### Cron Job for Continuous Monitoring
```bash
# Run recon every 6 hours and diff the results
0 */6 * * * /path/to/recon.sh example.com && diff /path/to/old_subs.txt /path/to/new_subs.txt | notify
```

---

## 7️⃣ Defensive Recommendations

- **Monitor Your Attack Surface:** Use the same tools attackers use (Amass, subfinder) to discover your own exposed assets before they do.
- **Certificate Transparency Monitoring:** Use tools like [CertSpotter](https://sslmate.com/certspotter/) to get alerts when new certificates are issued for your domain.
- **Shadow IT Discovery:** Automated recon can uncover forgotten subdomains, development servers, or third-party services that your security team doesn't know about.

---

!!! warning
    **Automated recon can generate significant traffic. Always ensure you have explicit authorization and configure appropriate rate limits to avoid overwhelming target infrastructure.**
