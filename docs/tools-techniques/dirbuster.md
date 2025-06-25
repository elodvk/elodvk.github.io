---
title: DirBuster – GUI Web Directory Brute Forcing Tool
---

**DirBuster** is a multi-threaded Java application designed to brute-force directories and file names on web/application servers. It’s particularly useful during penetration tests to uncover hidden paths and sensitive files.

DirBuster is part of the **OWASP** project and comes pre-installed in distributions like **Kali Linux**.

---

## ⚙️ How DirBuster Works

DirBuster works by using a **wordlist** to send HTTP requests to the target server, attempting to discover:
- Hidden directories (e.g., `/admin/`, `/backup/`)
- Sensitive files (e.g., `config.php`, `db.sql`)
- Access control misconfigurations

It supports recursive brute-forcing and custom file extensions.

---

## 🖥️ How to Launch DirBuster

### From Terminal (Kali or Parrot OS)

```bash
dirbuster
```

### Manually (If not in PATH)

```bash
java -jar /path/to/DirBuster.jar
```

---

## 🪛 Basic Usage Steps

1. **Target URL**: Enter the base URL (e.g., `http://192.168.1.100`)
2. **Wordlist**: Choose a wordlist (e.g., from `/usr/share/wordlists/dirbuster/`)
3. **File Extensions**: Add common extensions (`.php`, `.html`, etc.)
4. **Threads**: Set the number of threads (10–50 is typical)
5. **Start Scan**: Click "Start" to begin brute-forcing

---

## 📂 Wordlist Options

Common wordlists for DirBuster:
- `/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt`
- `/usr/share/wordlists/dirb/common.txt`
- SecLists: `/usr/share/seclists/Discovery/Web-Content/`

---

## 📌 Features

| Feature                | Description                                            |
|------------------------|--------------------------------------------------------|
| GUI-Based              | User-friendly interface for real-time monitoring       |
| Recursive Scanning     | Automatically explores found directories               |
| File Extension Support | Allows appending file extensions during brute force    |
| Custom HTTP Headers    | Supports custom headers for advanced testing           |

---

## ✅ When to Use DirBuster

- During web application penetration tests
- When you want visual monitoring of brute-force attempts
- For recursive scanning of deeply nested directories

---

## ⚠️ Limitations

- **Slower than command-line tools** like Gobuster or ffuf
- **Noisy** – can easily trigger IDS/WAF alerts
- **Java-based** – can be less stable and more resource-intensive

---

## 💡 Tips & Tricks

- Use multiple wordlists (start small, then go deeper)
- Watch for response codes: `200`, `403`, `401`, `301`
- Combine with Burp Suite to manually probe interesting results
- Look out for default directories like `/admin/`, `/login/`, `/test/`, `/old/`

---

## 🧠 Alternative Tools

If you prefer CLI tools over GUI:
- [`gobuster`](https://github.com/OJ/gobuster)
- [`ffuf`](https://github.com/ffuf/ffuf)
- [`dirsearch`](https://github.com/maurosoria/dirsearch)

---

