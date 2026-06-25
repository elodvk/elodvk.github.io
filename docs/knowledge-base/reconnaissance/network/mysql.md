---
title: "MySQL Databases"
description: "Techniques and tools to discover, enumerate, and assess MySQL database instances."
tags:
  - enumeration
  - mysql
  - footprinting
  - reconnaissance
  - nmap
  - sqlmap
---

# 🐬 MySQL Footprinting

MySQL is a widely deployed relational database server. Open MySQL instances can expose valuable information such as version, configuration, users, and even data, making them high‑value targets during the reconnaissance phase.

---

## 1. Service Discovery

- **Port scanning** – MySQL defaults to TCP **3306**. Use a fast scan to locate open MySQL ports.
  ```bash
  nmap -p 3306 --open <target>
  ```
- **Banner grabbing** – Simple TCP connection can reveal the server version.
  ```bash
  nc -v <target> 3306
  ```
  Expected output example:
  ```
  220 MySQL Server 5.7.31-0ubuntu0.18.04.1 Logue  
  ```
- **Nmap NSE script** – `mysql-info` extracts version and authentication methods.
  ```bash
  nmap -p 3306 -sV --script mysql-info --script-args mysqluser=robin,mysqlpass=robin <target>
  ```

---

## 2. Version & Configuration Enumeration

| Tool | Description | Example |
|------|-------------|---------|
| `nmap -sV --script=mysql-info` | Retrieves MySQL version, supported auth plugins, and some configuration variables. | `nmap -p 3306 -sV --script mysql-info 10.10.10.5` |
| `mysql -h <host> -u <user> -p -e "SELECT VERSION();"` | Direct client query (requires valid credentials or anonymous access). | `mysql -h 10.10.10.5 -u root -p -e "SELECT VERSION();"` |
| `sqlmap -u "http://target/page.php?id=1" --banner` | Pulls version information via error‑based or boolean‑based SQL injection. | `sqlmap -u http://example.com/item.php?id=1 --banner` |


## 2.1 Direct MySQL Commands

Common interactive commands using the MySQL client:

```bash
# Show databases
mysql -h <host> -u <user> -p -e "SHOW DATABASES;"

# List tables in a specific database
mysql -h <host> -u <user> -p -D <database> -e "SHOW TABLES;"

# Describe a table structure
mysql -h <host> -u <user> -p -D <database> -e "DESCRIBE <table>;"

# Select data from a table (limit 10 rows)
mysql -h <host> -u <user> -p -D <database> -e "SELECT * FROM <table> LIMIT 10;"

# Export a table to a CSV file
mysql -h <host> -u <user> -p -D <database> -e "SELECT * FROM <table> INTO OUTFILE '/tmp/<table>.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"
```

These commands require appropriate privileges; use the `--skip-column-names` flag for cleaner output when scripting.

---

## 3. Credential Brute‑Force

- **Hydra** – Parallelized password guessing.
  ```bash
  hydra -L users.txt -P pass.txt mysql://<target>
  ```
- **Ncrack** – Faster for large wordlists.
  ```bash
  ncrack -p 3306 <target> -U users.txt -P pass.txt
  ```

!!! tip
    Combine with `--timeout 5` to avoid hanging on filtered hosts.

---

## 4. Database & User Enumeration

| Tool | NSE Script | Example |
|------|------------|---------|
| `nmap --script=mysql-databases` | Lists databases the server reports. | `nmap -p 3306 --script mysql-databases 10.10.10.5` |
| `nmap --script=mysql-users` | Retrieves MySQL user accounts (may require auth). | `nmap -p 3306 --script mysql-users 10.10.10.5` |
| `sqlmap --dump -D <db>` | Dumps tables after successful login or injection. | `sqlmap -u http://site.com/item.php?id=1 -D testdb --dump` |

---

## 5. Privilege Escalation & Lateral Movement

1. **OS information** – Query server variables.
   ```sql
   SELECT @@hostname, @@version_comment;
   ```
2. **Read MySQL configuration** – If the MySQL user has FILE privilege:
   ```sql
   SELECT LOAD_FILE('/etc/mysql/my.cnf');
   ```
3. **Metasploit modules**
   - `auxiliary/scanner/mysql/mysql_login` – Brute‑force login with credential list.
   - `exploit/linux/mysql/mysql_udf_payload` – Uploads a user‑defined function to gain remote code execution.

---

## 6. Defensive Recommendations (Quick Checklist)

- Disable remote root login.
- Enforce strong, unique passwords for all accounts.
- Restrict inbound traffic to trusted IPs via firewall.
- Keep MySQL patched to the latest stable release.
- Disable the `FILE` privilege for non‑admin users.
- Use TLS/SSL for client connections.

---

## 7. References & Further Reading

- MySQL Official Documentation – Security Guidelines: https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html
- Nmap NSE MySQL scripts: https://nmap.org/nsedoc/scripts/mysql-*.html
- OWASP Testing Guide – Database Security: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Testing_for_Configuration_and_Deployment_Management
- sqlmap Project: https://github.com/sqlmapproject/sqlmap

---

*All commands should be executed only against systems you own or have explicit permission to test. Unauthorized probing of MySQL services is illegal and may trigger security alerts.*
