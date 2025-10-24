---
title: Gobuster
---

**Gobuster** is a fast and flexible command-line tool written in Go, used to brute-force:
- URIs (directories and files) on web servers
- DNS subdomains
- Virtual hosts
- S3 buckets
- Open directories in file systems

It is commonly used during web application enumeration to find hidden resources or endpoints.

---

## ⚙️ How Gobuster Works

Gobuster works by taking a **wordlist** and appending each word to the target URL or domain. It sends HTTP requests to check if each resource exists. It's multithreaded, making it much faster than traditional tools like `dirb`.

---

## 🚀 Basic Usage (Directory Scan)

```bash
gobuster dir -u <URL> -w <wordlist>
```

### ✅ Example:

```bash
gobuster dir -u http://192.168.1.100 -w /usr/share/wordlists/dirb/common.txt
```

This will scan the target URL for common directories/files.

---

## 🔧 Common Options

| Option            | Description                                         |
|-------------------|-----------------------------------------------------|
| `dir`             | Use directory/file brute-forcing mode              |
| `dns`             | Brute-force DNS subdomains                         |
| `vhost`           | Brute-force virtual hostnames                      |
| `s3`              | Brute-force S3 buckets                             |
| `-u`              | Target URL or domain                               |
| `-w`              | Path to wordlist                                   |
| `-t`              | Number of concurrent threads (default: 10)         |
| `-x`              | File extensions to append (e.g., `.php,.html`)     |
| `-o`              | Output results to file                             |
| `-q`              | Quiet mode (only shows results)                    |
| `-e`              | Show full URLs in output                           |
| `--timeout`       | Timeout per request                                |

---

## 🔍 Examples by Mode

### 📂 Directory Scan

```bash
gobuster dir -u http://example.com -w /path/to/wordlist.txt
```

### 🧠 With Extensions

```bash
gobuster dir -u http://example.com -w /usr/share/wordlists/dirb/common.txt -x php,html
```

### 🌐 Subdomain Scan

```bash
gobuster dns -d example.com -w /usr/share/wordlists/dns/namelist.txt
```

### 🏠 Virtual Host Scan

```bash
gobuster vhost -u http://example.com -w /usr/share/wordlists/vhosts.txt
```

---

## 📌 Pro Tips

- Use with Burp Suite to intercept suspicious or 403 responses.
- Combine Gobuster with `wfuzz` for parameter fuzzing.
- Use different status codes to identify potential hidden pages (e.g., 301, 403, 200).

---

## ⚠️ Limitations

- Does not support recursive directory discovery (yet).
- Can be blocked by WAFs and rate-limiting mechanisms.
- Wordlist quality directly impacts results.

---

## ✅ When to Use Gobuster

- To enumerate directories and files on a web server
- To discover subdomains of a target domain
- To check for hidden or sensitive resources during a web app pentest

---

## 💡 Pro Tip

Use Gobuster with well-known wordlists like those from `SecLists`, such as:
```bash
/usr/share/seclists/Discovery/Web-Content/common.txt
```

Combine it with `-x` for extension testing and `-t` for speed tuning.

---
