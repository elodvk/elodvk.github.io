---
title: Nikto
---

**Nikto** is an open-source web server scanner written in Perl. It is designed to identify potential vulnerabilities, misconfigurations, outdated software, and insecure files or scripts on web servers.

Nikto performs comprehensive tests against web servers for:
- Dangerous files/CGIs
- Outdated server software
- Insecure HTTP headers
- Common configuration issues

---

## ⚙️ How Nikto Works

Nikto uses a database of known vulnerabilities and scan signatures. It sends crafted HTTP requests to the target server and analyzes the responses to identify issues.

It is **not stealthy** — it's fast and noisy, meaning it can be easily detected by intrusion detection/prevention systems.

---

## 🚀 Basic Usage

```bash
nikto -h <target>
```

### ✅ Example:

```bash
nikto -h http://192.168.1.100
```

Scans the target web server for vulnerabilities.

---

## 🔧 Common Options

| Option        | Description                                                 |
|---------------|-------------------------------------------------------------|
| `-h`          | Host to scan (IP or URL)                                    |
| `-p`          | Port to scan (default: 80 for HTTP)                         |
| `-ssl`        | Force SSL connection (useful for HTTPS on non-443 ports)    |
| `-Tuning`     | Tune the scan type (e.g., files, robots.txt, etc.)          |
| `-o`          | Output results to file                                      |
| `-Format`     | Output format: `csv`, `txt`, `xml`, etc.                    |
| `-Display`    | Customize output verbosity                                  |
| `-timeout`    | Set request timeout                                         |
| `-evasion`    | Attempt evasion techniques to avoid WAFs                    |

### 🔧 Example: Scan HTTPS on custom port with output

```bash
nikto -h https://example.com -p 8443 -o scan_results.txt -Format txt
```

---

## 📌 Scan Tuning

Use the `-Tuning` option to focus on specific types of tests. Values include:

| Code | Scan Type                  |
|------|----------------------------|
| 0    | File Upload                |
| 1    | Interesting Files          |
| 2    | Misconfigurations          |
| 3    | Information Disclosure     |
| 4    | Injection Vulns (e.g., XSS)|
| 5    | Remote File Retrieval      |
| 6    | Denial of Service          |
| 7    | Remote Execution           |
| 8    | Command Execution          |
| 9    | SQL Injection              |

Example:
```bash
nikto -h http://192.168.1.100 -Tuning 123
```
This scans for interesting files, misconfigurations, and info disclosure.

---

## ⚠️ Limitations of Nikto

- Not stealthy — easily detectable
- Can produce false positives
- Does not exploit vulnerabilities, only detects
- Can be slow on large servers with many endpoints

---

## ✅ When to Use Nikto

- Reconnaissance and enumeration during penetration testing
- Quick scans for common vulnerabilities in web apps
- Checking default and dangerous files (like `/phpinfo.php`, `/admin/`, etc.)

---

## 💡 Pro Tip

Run Nikto in combination with tools like **Nmap**, **Gobuster**, and **Burp Suite** for better coverage and correlation of results.
