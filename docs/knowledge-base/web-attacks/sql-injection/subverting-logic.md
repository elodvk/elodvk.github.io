---
title: 'Subverting Query Logic & Using Comments'
description: 'How to fundamentally alter database queries using logical operators and comments to bypass authentication and alter data flow.'
icon: material/source-branch
tags:
  - sql-injection
  - logic-subversion
  - comments
---

# Subverting Query Logic & Using Comments

At the core of many SQL injection attacks—especially authentication bypasses—is the concept of **subverting the query logic**. By injecting specific logical operators and using comments, an attacker can completely alter the original intent of a database query.

---

## Subverting Query Logic

Web applications often use database queries to make authorization decisions. For example, a login script might check if a given username and password exist in the database.

```sql title="Typical Login Query"
SELECT * FROM users WHERE username = 'USER_INPUT' AND password = 'PASSWORD_INPUT'
```

If the query returns a row, the application logs the user in. If it returns nothing, the login fails.

### The `OR 1=1` Classic

The most famous logical subversion uses the `OR` operator combined with a tautology (a statement that is always true, like `1=1`).

If an attacker inputs `admin' OR 1=1 --` into the username field, the query becomes:

```sql title="Injected Query"
SELECT * FROM users WHERE username = 'admin' OR 1=1 --' AND password = '...'
```

**How the database evaluates this:**
1. Is `username = 'admin'`? (Maybe true, maybe false).
2. `OR`
3. Is `1=1`? (Always true).
4. Because of the `OR`, if *either* side is true, the entire `WHERE` clause evaluates to `TRUE` for every single row in the `users` table.
5. The `--` comment symbol ignores the rest of the query (the password check).

The query returns **all users**, and the application typically logs the attacker in as the first user returned (usually the administrator).

### Logical Operators

You aren't limited to `OR 1=1`. Many logical structures can subvert queries:

*   **Tautologies:** `OR 'a'='a'`, `OR 2>1`, `OR ""=""`
*   **Logical ANDs:** `admin' AND 1=1 --` (Ensures the first part is true, useful for blind SQLi testing).
*   **Logical Negation:** `admin' AND NOT 1=2 --`

### Bypassing Application Logic Beyond Login

Subverting logic isn't just for logins. Imagine an application that shows only public articles:

```sql title="Original Query"
SELECT title, body FROM articles WHERE status = 'public' AND id = [USER_INPUT]
```

If the user inputs `5 OR status = 'private'`, the query becomes:

```sql title="Injected Query"
SELECT title, body FROM articles WHERE status = 'public' AND id = 5 OR status = 'private'
```

Due to operator precedence (or lack of parentheses), this might return the public article with ID 5, **AND** all private articles in the database.

---

## Using Comments

Comments are the unsung heroes of SQL injection. They serve two critical purposes:

1.  **Neutralizing the Original Query:** They truncate the developer's original query, preventing syntax errors caused by injected quotes or leftover clauses (like `AND password = '...'`).
2.  **WAF Evasion:** They can be used to obfuscate payloads and hide from Web Application Firewalls (as seen in the [WAF Bypassing](waf-bypassing.md) section).

### Types of Comments

Different Database Management Systems (DBMS) use different syntax for comments:

| DBMS | Single-Line Comment | Multi-Line / Inline Comment |
| :--- | :--- | :--- |
| **MySQL / MariaDB** | `-- ` (Must be followed by a space) or `#` | `/* comment */` |
| **MSSQL** | `--` | `/* comment */` |
| **PostgreSQL** | `--` | `/* comment */` |
| **Oracle** | `--` | `/* comment */` |
| **SQLite** | `--` | `/* comment */` |

### Neutralizing the Trailing Query

When you inject a quote `'` to break out of a string, you leave a dangling quote at the end of the query.

```sql title="Broken Query"
SELECT * FROM users WHERE username = 'admin' OR 1=1' AND password = '...'
-- Notice the unbalanced quote after 1=1
```

If you submit this, the database will throw a syntax error, and the exploit will fail. You must "fix" the syntax. The easiest way is to comment out the rest of the query.

```sql title="Fixed Query with Comment"
SELECT * FROM users WHERE username = 'admin' OR 1=1 --' AND password = '...'
```

Now, the database engine simply ignores everything after the `--`.

#### The MySQL Space Gotcha

In MySQL, the `--` comment sequence **must** be followed by a space, or a control character like a newline. If you inject `admin' OR 1=1--` into a web form, the browser might strip the trailing space, causing the attack to fail.

**Solutions:**
1.  Use the `#` symbol instead (MySQL specific): `admin' OR 1=1#`
2.  Add a random character after the space to ensure the space isn't trimmed: `admin' OR 1=1-- -`

### Inline Comments for Obfuscation

Inline comments `/* */` don't truncate the query; they comment out a specific section *within* the query.

```sql title="Inline Comment Injection"
SELECT * FROM users WHERE username = 'admin' /* AND role='user' */ AND password = '...'
```

More importantly, inline comments can replace spaces, which is incredibly useful when WAFs block payloads containing spaces or specific keywords.

```sql title="Space Replacement"
SELECT/**/*/**/FROM/**/users/**/WHERE/**/username/**/=/**/'admin'
```
