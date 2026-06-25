---
title: 'Getting Started with SQLMap'
description: 'Install SQLMap, run your first scan, understand the interactive prompts, and learn the essential flags every operator needs to know.'
icon: material/rocket-launch
tags:
  - sqlmap
  - sql-injection
  - getting-started
---

# Getting Started with SQLMap

## Installation

### On Kali Linux / Parrot OS (Pre-installed)

SQLMap comes pre-installed on most penetration testing distributions. Verify it:

```bash
sqlmap --version
```

```text title="Expected Output"
        ___
       __H__
 ___ ___[']_____ ___ ___  {1.8.4#stable}
|_ -| . ["]     | .'| . |
|___|_  [)]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual
consent is illegal. It is the end user's responsibility to obey all applicable
local, state and federal laws. Developers assume no liability and are not 
responsible for any misuse or damage caused by this program

[*] Version: 1.8.4
```

### Manual Installation (Any OS)

```bash title="Clone from GitHub"
git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git sqlmap-dev
cd sqlmap-dev
python3 sqlmap.py --version
```

### Via pip

```bash
pip3 install sqlmap
```

### Via Package Manager

```bash title="Debian / Ubuntu"
sudo apt update && sudo apt install sqlmap
```

```bash title="Arch Linux"
sudo pacman -S sqlmap
```

```bash title="macOS (Homebrew)"
brew install sqlmap
```

---

## Your First Scan

Let's run SQLMap for the very first time. We'll use a deliberately vulnerable target to understand the workflow.

!!! example "Practice Target"

    For this guide, we'll use examples against a fictional target: `http://target.com/page.php?id=1`. In real engagements, you would use authorized targets. Great practice platforms include:

    - **DVWA** (Damn Vulnerable Web Application)
    - **SQLi Labs** by Audi-1
    - **Hack The Box** machines
    - **PortSwigger Web Security Academy**

### The Most Basic Command

```bash
sqlmap -u "http://target.com/page.php?id=1"
```

Let's break down exactly what happens when you run this:

---

## Understanding SQLMap's Interactive Prompts

When SQLMap runs, it asks you several questions. **Understanding these prompts is critical** — answering them wrong can waste hours or miss vulnerabilities entirely.

### Prompt 1: "it looks like the back-end DBMS is 'MySQL'. Do you want to skip test payloads specific for other DBMSes?"

```text
[10:42:21] [INFO] it looks like the back-end DBMS is 'MySQL'. Do you want to 
skip test payloads specific for other DBMSes? [Y/n]
```

**What this means:** SQLMap has detected evidence that the database is MySQL (e.g., from error messages, version strings, or specific behavior). It's asking if you want to skip payloads designed for MSSQL, PostgreSQL, Oracle, etc.

**What to answer:**

- **`Y` (Yes)** — Answer this in **most cases**. It saves significant time by only testing MySQL-specific payloads. Choose this when you're reasonably confident about the DBMS.
- **`n` (No)** — Choose this only when you're unsure about the DBMS type, or when the initial detection might be wrong (e.g., the app is behind a reverse proxy that adds misleading headers).

### Prompt 2: "for the remaining tests, do you want to include all tests for 'MySQL' extending provided level (1) and risk (1) values?"

```text
[10:42:22] [INFO] for the remaining tests, do you want to include all tests 
for 'MySQL' extending provided level (1) and risk (1) values? [Y/n]
```

**What this means:** SQLMap is asking if it should run **all MySQL-specific test payloads**, even those that normally require higher `--level` and `--risk` settings.

**What to answer:**

- **`Y` (Yes)** — This gives you the best detection rate. Answer `Y` unless you're worried about time or triggering alerts.
- **`n` (No)** — Stick with your current level/risk settings. Faster but may miss injection points.

### Prompt 3: "GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)?"

```text
[10:42:35] [INFO] GET parameter 'id' is vulnerable. Do you want to keep 
testing the others (if any)? [y/N]
```

**What this means:** SQLMap found that the `id` parameter is injectable! Now it's asking if you want to continue testing other parameters (if the URL has multiple parameters).

**What to answer:**

- **`N` (No)** — In most cases, one confirmed injection point is enough to proceed with exploitation.
- **`y` (Yes)** — Choose this if you want a comprehensive assessment of all parameters, especially useful in security audits.

### Prompt 4: "do you want to exploit this SQL injection to confirm it?"

```text
[10:42:38] [INFO] testing MySQL >= 5.0.12 AND time-based blind
[10:42:38] [INFO] do you want to exploit this SQL injection to confirm it? [Y/n]
```

**What this means:** SQLMap has detected what appears to be a valid injection, and wants to verify it by actually extracting a small piece of data.

**What to answer:**

- **`Y` (Yes)** — Always. This confirms the vulnerability is real and exploitable.

---

## The `--batch` Flag

If you're tired of answering prompts (or running automated scans), the `--batch` flag tells SQLMap to **use the default answer for every prompt**:

```bash
sqlmap -u "http://target.com/page.php?id=1" --batch
```

!!! tip "When to Use `--batch`"

    - **Automated scanning** — when you need to scan many targets without babysitting
    - **Time-sensitive engagements** — when you need quick results
    - **Reproducible scans** — default answers ensure consistent behavior

    **When NOT to use `--batch`:** When you need precise control over the scan, or when you want to understand what SQLMap is doing at each step (learning!).

---

## Essential Flags Every Operator Must Know

Here are the flags you'll use in **every single SQLMap session**:

### Target Specification

```bash title="Test a URL with GET parameter"
sqlmap -u "http://target.com/page.php?id=1"
```

```bash title="Test specific POST data"
sqlmap -u "http://target.com/login.php" --data="username=admin&password=test"
```

```bash title="Load a full HTTP request from a file (BEST METHOD)"
sqlmap -r request.txt
```

!!! success "The `-r` Flag Is Your Best Friend"

    The single most important thing to learn: **always use `-r` with a saved HTTP request from Burp Suite**. This captures the exact headers, cookies, session tokens, and body that the application expects. We'll cover this in detail in the [Running on HTTP Requests](http-requests.md) section.

### Verbosity

The `-v` flag controls how much information SQLMap shows you:

```bash title="Show injection payloads (extremely useful for learning)"
sqlmap -u "http://target.com/page.php?id=1" -v 3
```

| Level | Flag | What You See |
|---|---|---|
| 0 | `-v 0` | Errors only. Silent mode. |
| 1 | `-v 1` | **Default.** Info messages and warnings. |
| 2 | `-v 2` | Debug messages. Shows internal decision-making. |
| 3 | `-v 3` | **Every injection payload.** Great for learning what SQLMap actually sends. |
| 4 | `-v 4` | Full HTTP requests. |
| 5 | `-v 5` | Full HTTP request + response headers. |
| 6 | `-v 6` | Full HTTP request + response headers + body. Most verbose. |

!!! tip "Learning Tip"

    When you're learning, **always use `-v 3`**. Seeing the actual payloads SQLMap sends is the fastest way to understand SQL injection. You'll start recognizing the patterns and eventually be able to construct them manually.

### Output Directory

By default, SQLMap stores results in `~/.sqlmap/output/<target>/`. You can change this:

```bash
sqlmap -u "http://target.com/page.php?id=1" --output-dir="./results/"
```

### Flushing Session

SQLMap caches results. If you want to start fresh:

```bash title="Clear all cached data for this target"
sqlmap -u "http://target.com/page.php?id=1" --flush-session
```

```bash title="Re-run queries even if cached"
sqlmap -u "http://target.com/page.php?id=1" --fresh-queries
```

---

## The SQLMap Wizard

If you're a complete beginner, SQLMap has a built-in wizard that walks you through the process step-by-step:

```bash
sqlmap --wizard
```

```text title="Wizard Output"
[*] starting wizard interface

Please enter full target URL (-u): http://target.com/page.php?id=1
POST data (--data, default: None): 
Injection difficulty (--level/--risk). Please choose:
[1] Normal (default)
[2] Medium
[3] Hard
> 1
Enumeration (--banner/--current-user/--current-db/--is-dba). Please choose:
[1] Basic (default)
[2] Intermediate
[3] All
> 1

sqlmap is running, please wait..
```

!!! note "The Wizard is Only for Getting Started"

    The wizard is a great way to run your first scan, but you'll quickly outgrow it. Real engagements require the flexibility of the full command-line interface.

---

## Understanding Session Management

One of SQLMap's most powerful features is its **automatic session management**. Here's how it works:

### How Sessions Work

Every time you scan a target, SQLMap creates a **SQLite database** at:

```
~/.sqlmap/output/<target_hostname>/session.sqlite
```

This session file stores:

- Detected injection points
- DBMS fingerprint information
- Enumerated data (databases, tables, columns)
- Dumped data
- All previous results

### Why Sessions Matter

If your scan gets interrupted (network issue, you press Ctrl+C, your VPN drops), you can simply **re-run the exact same command** and SQLMap will resume where it left off:

```bash title="First run — gets interrupted at 50%"
sqlmap -u "http://target.com/page.php?id=1" --dump
# Ctrl+C after partial dump

# Re-run the EXACT SAME command — SQLMap picks up where it left off:
sqlmap -u "http://target.com/page.php?id=1" --dump
```

```text title="Session Resume Output"
[10:45:12] [INFO] resuming back-end DBMS 'mysql'
[10:45:12] [INFO] using stored session data
[10:45:12] [INFO] resuming injection point 'GET parameter id'
```

### Session Management Commands

```bash title="Clear session and start fresh"
sqlmap -u "http://target.com/page.php?id=1" --flush-session
```

```bash title="Re-run queries but keep injection info"
sqlmap -u "http://target.com/page.php?id=1" --fresh-queries
```

```bash title="Purge ALL SQLMap data (nuclear option)"
sqlmap --purge
```

!!! warning "When to Flush Sessions"

    Flush your session when:

    - The target application has changed (updated, patched)
    - You're getting stale or incorrect results
    - You've changed your attack approach (different parameter, different technique)
    - You switched from HTTP to HTTPS or vice versa

---

## Putting It All Together: A Complete First Scan

Here's a realistic first scan with all the essential flags:

```bash title="A Well-Configured First Scan"
sqlmap -u "http://target.com/page.php?id=1" \
  -v 3 \                    # Show payloads (for learning)
  --batch \                 # Auto-answer prompts
  --banner \                # Get DBMS version banner
  --current-user \          # Get current database user
  --current-db \            # Get current database name
  --is-dba \                # Check if user has admin privileges
  --threads=5               # Use 5 concurrent threads
```

What this command does:

1. Tests the `id` parameter for SQL injection
2. Shows you every payload it sends (`-v 3`)
3. Automatically answers all prompts (`--batch`)
4. Once injection is confirmed, gathers reconnaissance info
5. Uses 5 threads for faster extraction

**Expected output flow:**

```text
[INFO] testing connection to the target URL
[INFO] testing if the target URL content is stable
[INFO] target URL content is stable
[INFO] testing if GET parameter 'id' is dynamic
[INFO] GET parameter 'id' appears to be dynamic
[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable
[INFO] testing for SQL injection on GET parameter 'id'
...
[INFO] GET parameter 'id' is 'MySQL >= 5.0.12 AND time-based blind' injectable
...
[INFO] the back-end DBMS is MySQL
banner: '8.0.30'
current user: 'webapp@localhost'
current database: 'ecommerce'
current user is DBA: False
```

Now you know the target is running **MySQL 8.0.30**, the database user is **webapp** (not a DBA), and the current database is **ecommerce**. From here, you can proceed to enumerate the database structure, which we'll cover in the [Database Enumeration](database-enumeration.md) section.
