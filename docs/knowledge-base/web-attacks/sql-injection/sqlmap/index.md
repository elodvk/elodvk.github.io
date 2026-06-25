---
title: 'SQLMap Overview'
description: 'What SQLMap is, how it works under the hood, what makes it the gold standard for automated SQL injection, and when you should (and should not) use it.'
icon: material/console
tags:
  - sqlmap
  - sql-injection
  - web-attacks
  - tools
---

# SQLMap Overview

## What Is SQLMap?

**SQLMap** is a free, open-source penetration testing tool written in Python that **automates the entire process** of detecting and exploiting SQL injection vulnerabilities. Think of it as your personal SQL injection expert that can:

1. **Detect** whether a parameter is injectable
2. **Fingerprint** the exact database management system (DBMS) and version
3. **Enumerate** databases, tables, columns, and dump their contents
4. **Escalate** from SQL injection to reading files, writing web shells, and executing operating system commands

!!! info "Why SQLMap Matters"

    Before SQLMap, exploiting SQL injection — especially blind injection — was an incredibly tedious, manual process. Extracting a single database name character-by-character via time-based blind injection could take hours by hand. SQLMap automates all of this, intelligently selecting the fastest extraction technique and handling edge cases that would trip up manual exploitation.

---

## How SQLMap Works Under the Hood

Understanding what SQLMap does internally will make you a **much** better operator. Let's walk through what happens when you run a basic command like:

```bash
sqlmap -u "http://target.com/page?id=1"
```

### Phase 1: Connection Test

SQLMap first makes a **normal request** to the target URL to:

- Verify the target is reachable
- Record the "baseline" response (content length, status code, page content)
- Detect the web technology stack (e.g., Apache, PHP, IIS, ASP.NET)

### Phase 2: Parameter Detection

SQLMap identifies all parameters that could be injectable:

- **URL parameters** — everything after `?` in the URL
- **POST body parameters** — from `--data`
- **Cookie values** — from `--cookie` or the request headers
- **HTTP headers** — User-Agent, Referer, etc. (at higher `--level` values)

### Phase 3: Injection Testing

For each parameter, SQLMap sends **hundreds of carefully crafted payloads** to determine:

1. **Is this parameter injectable?** — Does modifying it cause a different response?
2. **What type of injection works?** — UNION? Error-based? Blind? Stacked queries?
3. **What is the back-end DBMS?** — MySQL? MSSQL? PostgreSQL? Oracle? SQLite?

SQLMap uses a sophisticated **comparison algorithm** that goes beyond simple string matching. It calculates page similarity ratios, tracks content-length changes, and handles dynamic page elements like timestamps and CSRF tokens.

### Phase 4: Exploitation

Once injection is confirmed, SQLMap uses the **most efficient technique** available:

| Priority | Technique | Speed | Why |
|---|---|---|---|
| 1st | UNION query-based | ⚡ Fastest | Returns data directly in the response |
| 2nd | Error-based | ⚡ Fast | Leaks data through error messages |
| 3rd | Inline queries | ⚡ Fast | Embeds subqueries in existing queries |
| 4th | Boolean-based blind | 🐌 Slow | One bit of information per request |
| 5th | Time-based blind | 🐌🐌 Slowest | One bit per request + deliberate delays |
| 6th | Out-of-band | 🔄 Variable | Uses DNS/HTTP to exfiltrate (requires infrastructure) |

!!! tip "Why Speed Matters"

    Extracting a 32-character password hash via **UNION-based injection** takes exactly **1 request**. The same extraction via **time-based blind injection** takes roughly **32 × 7 = 224 requests** (binary search of 7 comparisons per character), each with a multi-second delay. That's the difference between 1 second and 20+ minutes.

---

## SQLMap's Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        SQLMap                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Request    │  │  Detection   │  │  Fingerprint   │  │
│  │   Handler    │  │   Engine     │  │    Engine      │  │
│  │             │  │              │  │                │  │
│  │ • HTTP/HTTPS │  │ • 6 SQLi     │  │ • DBMS type    │  │
│  │ • Proxy      │  │   techniques │  │ • Version      │  │
│  │ • Auth       │  │ • Comparison │  │ • Privileges   │  │
│  │ • Cookies    │  │   algorithm  │  │ • Configuration│  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Enumeration │  │    Takeover   │  │    Tamper      │  │
│  │   Engine    │  │    Engine     │  │    Scripts     │  │
│  │             │  │              │  │                │  │
│  │ • Databases  │  │ • File R/W   │  │ • WAF bypass   │  │
│  │ • Tables     │  │ • OS shell   │  │ • Encoding     │  │
│  │ • Columns    │  │ • Meterpreter│  │ • Obfuscation  │  │
│  │ • Data dump  │  │ • Registry   │  │ • Filter evasion│ │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Session Management                   │    │
│  │  • SQLite database per target                     │    │
│  │  • Caches injection points, DBMS info, and data   │    │
│  │  • Resumes interrupted scans automatically        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Supported Database Management Systems

SQLMap supports **every major DBMS** you'll encounter in real-world engagements:

| DBMS | Full Support | Notes |
|---|---|---|
| MySQL | ✅ | Most common target. Full support including UDF injection |
| MariaDB | ✅ | MySQL fork — same techniques apply |
| Microsoft SQL Server | ✅ | Includes `xp_cmdshell` for OS access |
| PostgreSQL | ✅ | Includes `COPY FROM PROGRAM` for OS access |
| Oracle | ✅ | Includes Java stored procedures |
| SQLite | ✅ | Common in mobile apps and embedded systems |
| IBM DB2 | ✅ | Enterprise environments |
| Microsoft Access | ✅ | Legacy systems |
| Firebird | ✅ | Less common |
| SAP MaxDB | ✅ | SAP environments |
| Sybase | ✅ | Legacy enterprise |
| Informix | ✅ | IBM legacy |
| HSQLDB | ✅ | Java applications |
| H2 | ✅ | Java applications |
| MonetDB | ✅ | Analytics databases |
| Apache Derby | ✅ | Java applications |
| Amazon Redshift | ✅ | Cloud data warehouses |
| Vertica | ✅ | Analytics |
| Mckoi | ✅ | Rare |
| Presto | ✅ | Distributed SQL |
| Altibase | ✅ | High-performance |
| MimerSQL | ✅ | Swedish DBMS |
| CrateDB | ✅ | IoT/time-series |
| Greenplum | ✅ | MPP database |
| Drizzle | ✅ | MySQL fork |
| Apache Ignite | ✅ | In-memory |
| Cubrid | ✅ | Open-source |
| InterSystems Caché | ✅ | Healthcare |
| IRIS | ✅ | InterSystems |
| eXtremeDB | ✅ | Embedded |
| FrontBase | ✅ | macOS |

---

## Supported Injection Techniques

SQLMap supports **six different injection techniques**, identified by the letters `BEUSTQ`:

### B — Boolean-Based Blind

SQLMap sends payloads that make the query return either `TRUE` or `FALSE`, then observes whether the page content changes. By asking a series of yes/no questions about the data, SQLMap reconstructs values one character at a time.

**When SQLMap uses it:** Almost always available. This is the most universal technique.

**Example payload:**
```sql
' AND ORD(MID((SELECT IFNULL(CAST(schema_name AS NCHAR),0x20) 
FROM INFORMATION_SCHEMA.SCHEMATA LIMIT 0,1),1,1))>64 AND 'abc'='abc
```

### E — Error-Based

SQLMap injects payloads that cause the database to throw an error message containing the data we want. The injected SQL forces the DBMS to evaluate a subquery and include its result in the error text.

**When SQLMap uses it:** When the application displays database error messages to the user.

**Example payload:**
```sql
' AND (SELECT 2801 FROM(SELECT COUNT(*),CONCAT((SELECT 
MID((IFNULL(CAST(schema_name AS NCHAR),0x20)),1,54) FROM 
INFORMATION_SCHEMA.SCHEMATA LIMIT 0,1),FLOOR(RAND(0)*2))x 
FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a) AND 'abc'='abc
```

### U — UNION Query-Based

SQLMap appends a `UNION SELECT` statement to the original query to add extra rows to the result set. The injected data appears directly in the page output.

**When SQLMap uses it:** When the application renders SQL query results in the page (e.g., product listings, search results).

**Example payload:**
```sql
' UNION ALL SELECT NULL,CONCAT(0x716b7a7a71,IFNULL(CAST(schema_name 
AS NCHAR),0x20),0x7162716a71),NULL FROM INFORMATION_SCHEMA.SCHEMATA-- -
```

### S — Stacked Queries

SQLMap terminates the current query with a semicolon and appends an entirely new SQL statement. This allows **any SQL operation**, including `INSERT`, `UPDATE`, `DELETE`, and even administrative commands.

**When SQLMap uses it:** When the application's database connector supports multiple statements (common with MSSQL, PostgreSQL; rare with MySQL + PHP).

**Example payload:**
```sql
'; INSERT INTO users (username,password) VALUES ('hacker','owned')-- -
```

### T — Time-Based Blind

Similar to Boolean-based, but instead of observing page content changes, SQLMap injects a conditional time delay. If the condition is true, the response is delayed; otherwise, it returns immediately.

**When SQLMap uses it:** Last resort — when the page gives no visible difference between TRUE and FALSE conditions.

**Example payload:**
```sql
' AND (SELECT 5765 FROM (SELECT(SLEEP(5)))a) AND 'abc'='abc
```

### Q — Inline Queries

SQLMap embeds a subquery inside the original query in place of a value. This technique is rarer but useful in specific contexts.

**Example payload:**
```sql
SELECT (SELECT password FROM users WHERE username='admin')
```

---

## When to Use SQLMap

### ✅ Use SQLMap When:

- You've confirmed or strongly suspect SQL injection exists
- You need to **enumerate databases and dump data** efficiently
- You're dealing with **blind injection** that would take hours manually
- You need to **escalate to OS access** through SQL injection
- You're conducting an **authorized penetration test** with proper scope

### ❌ Don't Use SQLMap When:

- You haven't manually verified the injection point first
- The target is out of scope or you lack authorization
- You're in a **CTF or exam** that requires manual exploitation
- The application has aggressive rate limiting (SQLMap can trigger lockouts)
- You need **stealth** — SQLMap is extremely noisy by default

!!! warning "A Common Beginner Mistake"

    Many beginners point SQLMap at a URL and hope for the best. **This almost never works.** The most effective approach is to:

    1. **Manually identify** the injection point using Burp Suite or browser testing
    2. **Capture the exact HTTP request** that triggers the injection
    3. **Feed that specific request** to SQLMap using the `-r` flag

    We'll cover this workflow in detail in the next sections.

---

## What You'll Learn in This Series

This multi-part guide will take you from zero to expert SQLMap usage:

| Section | What You'll Learn |
|---|---|
| **Getting Started** | Installation, your first scan, understanding prompts |
| **Output Description** | Reading and interpreting SQLMap's output |
| **Running on HTTP Requests** | Working with Burp, POST data, cookies, and headers |
| **Handling Errors** | Troubleshooting common issues |
| **Attack Tuning** | Level, risk, techniques, prefix/suffix customization |
| **Database Enumeration** | Extracting databases, tables, columns, and data |
| **Advanced Enumeration** | Schema dumps, conditional filtering, search, pivot |
| **Advanced Usage** | Second-order SQLi, CSRF tokens, custom injection points |
| **Bypassing Protections** | WAF evasion, tamper scripts, chunked encoding |
| **OS Exploitation** | File read/write, OS shell, Meterpreter, registry |
