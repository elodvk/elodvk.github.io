---
title: 'IMAP & POP3 Footprinting'
description: 'A comprehensive guide on footprinting and enumerating IMAP and POP3 email services using tools like netcat, nmap, metasploit, openssl, and hydra.'
tags: ['enumeration', 'imap', 'pop3', 'footprinting', 'reconnaissance', 'nmap', 'hydra']
---

# 📧 IMAP & POP3 Footprinting

While SMTP is used for sending mail, **IMAP** (Internet Message Access Protocol) and **POP3** (Post Office Protocol 3) are used for retrieving mail. These services are prime targets during external and internal reconnaissance because they act as direct gateways to user inboxes.

Footprinting these services involves grabbing banners to identify the underlying software, enumerating supported authentication capabilities, and attempting password spraying or brute-forcing to gain unauthorized access.

- **IMAP Ports:** 143 (Plaintext/STARTTLS), 993 (IMAPS/SSL)
- **POP3 Ports:** 110 (Plaintext/STARTTLS), 995 (POP3S/SSL)

---

## 1. Banner Grabbing & Capabilities

The first step is connecting to the service to grab its banner and request its capabilities. The capabilities list is crucial because it reveals the supported authentication methods (e.g., `AUTH=PLAIN`, `AUTH=LOGIN`, `CRAM-MD5`).

### Using Netcat (Plaintext Ports)

You can use `nc` to connect directly to the unencrypted ports (110 and 143).

**POP3 (Port 110):**
```bash
nc -nv 10.10.10.25 110
```
*Wait for the banner, then type `CAPA` to list capabilities:*
```text
+OK POP3 server ready
CAPA
+OK Capability list follows
TOP
USER
SASL PLAIN LOGIN
.
```

**IMAP (Port 143):**
```bash
nc -nv 10.10.10.25 143
```
*Wait for the banner, then type `a1 CAPABILITY` to list capabilities:*
```text
* OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE AUTH=PLAIN] Dovecot ready.
a1 CAPABILITY
* CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE AUTH=PLAIN
a1 OK Pre-login capabilities listed, post-login capabilities have more.
```

### Using OpenSSL (Encrypted Ports)

Modern servers heavily rely on SSL/TLS over ports 993 (IMAPS) and 995 (POP3S). `netcat` won't work here because it doesn't handle the SSL handshake; you must use `openssl`.

**IMAP over SSL (Port 993):**
```bash
openssl s_client -connect 10.10.10.25:993 -crlf
```

**POP3 over SSL (Port 995):**
```bash
openssl s_client -connect 10.10.10.25:995 -crlf
```
*Once connected via `openssl`, you can issue the exact same `CAPA` or `a1 CAPABILITY` commands as you would in plaintext.*

### Manual Login

Once connected to the service (whether via `nc` or `openssl`), you can attempt to log in manually if you have credentials or want to test a default password.

**POP3 Login Sequence:**
```text
USER admin
+OK
PASS P@ssw0rd!
+OK Logged in.
```

**IMAP Login Sequence:**
```text
a1 LOGIN admin P@ssw0rd!
a1 OK Logged in.
```
*(Note: In IMAP, every command must be prefixed with a unique alphanumeric tag, usually `a1`, `a2`, etc. The server responds using the same tag.)*

### Common Commands

Once logged in, you can interact with the server using standard protocol commands.

**IMAP Commands**

| Command | Description |
| :--- | :--- |
| `1 LOGIN username password` | User's login. |
| `1 LIST "" *` | Lists all directories. |
| `1 CREATE "INBOX"` | Creates a mailbox with a specified name. |
| `1 DELETE "INBOX"` | Deletes a mailbox. |
| `1 RENAME "ToRead" "Important"` | Renames a mailbox. |
| `1 LSUB "" *` | Returns a subset of names from the set of names that the User has declared as being active or subscribed. |
| `1 SELECT INBOX` | Selects a mailbox so that messages in the mailbox can be accessed. |
| `1 UNSELECT INBOX` | Exits the selected mailbox. |
| `1 FETCH <ID> all` | Retrieves data associated with a message in the mailbox. |
| `1 CLOSE` | Removes all messages with the Deleted flag set. |
| `1 LOGOUT` | Closes the connection with the IMAP server. |

**POP3 Commands**

| Command | Description |
| :--- | :--- |
| `USER username` | Identifies the user. |
| `PASS password` | Authentication of the user using its password. |
| `STAT` | Requests the number of saved emails from the server. |
| `LIST` | Requests from the server the number and size of all emails. |
| `RETR id` | Requests the server to deliver the requested email by ID. |
| `DELE id` | Requests the server to delete the requested email by ID. |
| `CAPA` | Requests the server to display the server capabilities. |
| `RSET` | Requests the server to reset the transmitted information. |
| `QUIT` | Closes the connection with the POP3 server. |

---

## 2. Automated Discovery (Nmap)

Nmap provides excellent built-in scripts for both version detection and enumeration of IMAP and POP3 services.

### Version and Capability Detection
A standard version and script scan will automatically attempt to pull banners and capabilities.
```bash
nmap -sV -sC -p 110,143,993,995 10.10.10.25
```

### Targeted NSE Scripts
If you want to run specific enumeration scripts without a full scan:
```bash
# Extract IMAP capabilities
nmap -p143,993 --script imap-capabilities <target>

# Extract POP3 capabilities
nmap -p110,995 --script pop3-capabilities <target>
```

---

## 3. Authentication & Brute-Forcing

Because IMAP and POP3 are strictly authentication-focused protocols (unlike SMTP which allows open connections for mail routing), they are frequently targeted for password spraying or brute-forcing if no rate limiting is applied.

### Using Hydra
Hydra is a fast and flexible login cracker that supports both protocols.

**Brute-force IMAP:**
```bash
hydra -L users.txt -P passwords.txt <target> imap
```

**Brute-force POP3:**
```bash
hydra -L users.txt -P passwords.txt <target> pop3
```

*(Note: If targeting the SSL ports, append `s` to the protocol, e.g., `imaps` or `pop3s`)*

### Using Metasploit
The Metasploit Framework contains auxiliary modules designed specifically for identifying valid credentials on these services.

```bash
msfconsole
use auxiliary/scanner/imap/imap_login
use auxiliary/scanner/pop3/pop3_login
set RHOSTS 10.10.10.25
set USER_FILE users.txt
set PASS_FILE passwords.txt
run
```

---

## 4. Limitations & Defensive Countermeasures

### Attacker Limitations
1. **Rate Limiting / Fail2Ban:** Aggressive scanning or brute-forcing will almost certainly trigger intrusion prevention systems or account lockouts, resulting in an IP ban or a denial of service for the legitimate user.
2. **Multi-Factor Authentication (MFA):** Even if valid credentials are discovered via brute-force, modern enterprise environments typically enforce MFA, rendering the credentials useless for IMAP/POP3 access unless legacy authentication is explicitly allowed.

### Defensive Mitigations
If you are defending a network, implement the following:
- **Disable Legacy Protocols:** If possible, disable IMAP and POP3 entirely in favor of modern API-based access (e.g., Microsoft Graph API) that natively supports MFA and conditional access.
- **Implement Rate Limiting & Account Lockouts:** Prevent rapid, sequential login attempts from a single IP to defeat brute-forcing.
- **Require Strong Authentication & Encryption:** Enforce IMAPS (993) and POP3S (995). Disable plaintext authentication mechanisms (`AUTH PLAIN`) over non-TLS connections to prevent credential sniffing.
