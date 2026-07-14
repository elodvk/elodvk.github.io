---
title: "Parameter Fuzzing — POST"
description: "Discover hidden POST parameters using ffuf and curl — Content-Type handling, form data vs JSON bodies, and method comparison."
date: 2026-07-14
tags:
  - Ffuf
  - Web Attacks
  - Fuzzing
  - Reconnaissance
---

# Parameter Fuzzing — POST

## Why POST Parameters Are Different

POST parameters live in the **request body**, not the URL. This makes them:

- **Invisible in logs** — POST bodies aren't typically logged by proxies or access logs
- **Harder to discover** — no URL history, no browser cache, no referrer leakage
- **More powerful** — POST endpoints often handle writes (create, update, delete)
- **Better hidden** — developers hide sensitive functionality behind POST-only routes

The technique is fundamentally the same as GET fuzzing, but you need to specify the HTTP method, body format, and Content-Type header.

---

## Basic POST Parameter Fuzzing

### Form-Encoded Body (Default)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://SERVER_IP:PORT/admin/admin.php -X POST \
     -d "FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded" -fs 0
```

**Breakdown:**

| Flag | Purpose |
|---|---|
| `-X POST` | Set the HTTP method to POST |
| `-d "FUZZ=key"` | Request body (FUZZ replaces the parameter name) |
| `-H "Content-Type: ..."` | Tell the server how to parse the body |
| `-fs 0` | Filter empty responses (server ignoring unknown params) |

### Curl Equivalent

```shell
curl -s -X POST http://10.10.10.5:8080/admin/admin.php \
     -d "id=key" -H "Content-Type: application/x-www-form-urlencoded"
```

---

## Practical Walkthrough

### Step 1: Baseline the POST Endpoint

```shell
# Empty POST request
curl -s -X POST http://10.10.10.5:8080/admin/admin.php | wc -c
# Output: 0 (empty response)

# POST with a random parameter
curl -s -X POST http://10.10.10.5:8080/admin/admin.php -d "fakeparam=test" | wc -c
# Output: 0 (still empty — server ignores unknown params)
```

The endpoint returns 0 bytes for unknown/missing parameters. Real parameters will generate content.

### Step 2: Fuzz

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded" -fs 0

________________________________________________

 :: Method           : POST
 :: URL              : http://10.10.10.5:8080/admin/admin.php
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt
 :: Header           : Content-Type: application/x-www-form-urlencoded
 :: Data             : FUZZ=key
 :: Filter           : Response size: 0
 :: Threads          : 40
________________________________________________

id                      [Status: 200, Size: 768, Words: 142, Lines: 23, Duration: 51ms]
```

### Step 3: Verify with Curl

```shell
curl -s -X POST http://10.10.10.5:8080/admin/admin.php -d "id=key"
# Returns content — the 'id' parameter is accepted

curl -s -X POST http://10.10.10.5:8080/admin/admin.php -d "id=1"
# Might return a specific record
```

---

## JSON Body Fuzzing

Modern APIs often expect JSON. Adjust the Content-Type and body format:

### Fuzzing JSON Parameter Names

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://SERVER_IP:PORT/api/endpoint -X POST \
     -d '{"FUZZ":"value"}' -H "Content-Type: application/json" -fs 0
```

### Curl Equivalent

```shell
curl -s -X POST http://10.10.10.5:8080/api/endpoint \
     -H "Content-Type: application/json" \
     -d '{"username":"value"}'
```

### Fuzzing JSON Values

```shell
ffuf -w /tmp/values.txt:FUZZ \
     -u http://SERVER_IP:PORT/api/endpoint -X POST \
     -d '{"role":"FUZZ"}' -H "Content-Type: application/json" -fs 24
```

!!! warning "JSON Syntax"
    Ensure your FUZZ placeholder maintains valid JSON. If values in your wordlist contain quotes or special characters, they'll break the JSON structure. For simple wordlists (alphanumeric), this isn't an issue. For complex payloads, use ffuf's URL encoding or pre-process your wordlist.

---

## Comparing GET vs. POST Approaches

Every POST parameter can potentially also be tested as GET (some applications accept both). Here's how to convert between the two:

### GET Request (ffuf)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php?FUZZ=key -fs 2453
```

### GET Request (curl)

```shell
curl -s "http://10.10.10.5:8080/admin/admin.php?id=key"
```

### POST Request (ffuf)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded" -fs 0
```

### POST Request (curl)

```shell
curl -s -X POST http://10.10.10.5:8080/admin/admin.php \
     -d "id=key" -H "Content-Type: application/x-www-form-urlencoded"
```

### POST JSON (ffuf)

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/endpoint -X POST \
     -d '{"FUZZ":"value"}' -H "Content-Type: application/json" -fs 0
```

### POST JSON (curl)

```shell
curl -s -X POST http://10.10.10.5:8080/api/endpoint \
     -H "Content-Type: application/json" \
     -d '{"username":"value"}'
```

---

## When to Use Which Method

| Scenario | Use GET | Use POST |
|---|---|---|
| URL-visible pages (no forms) | ✓ | |
| Login forms / authentication | | ✓ |
| API endpoints | ✓ (read) | ✓ (write) |
| File upload handlers | | ✓ |
| Search functionality | ✓ | Sometimes |
| State-changing actions | | ✓ |
| Hidden admin functions | ✓ and ✓ | (try both) |

!!! tip "Always Try Both"
    Many PHP applications accept parameters from both `$_GET` and `$_POST` (via `$_REQUEST`). If GET fuzzing finds something, also test it via POST — and vice versa. The application might respond differently.

---

## Multi-Parameter POST Fuzzing

When you already know one parameter and want to find additional ones:

```shell
# Known: 'id' parameter works. Find companions.
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "id=1&FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded" -fs 768
```

For JSON:

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/users -X POST \
     -d '{"id":1,"FUZZ":"value"}' -H "Content-Type: application/json" -fs 156
```

---

## Content-Type Reference

| Content-Type | Body Format | Use Case |
|---|---|---|
| `application/x-www-form-urlencoded` | `key=value&key2=value2` | HTML forms (default) |
| `application/json` | `{"key":"value"}` | REST APIs, modern apps |
| `multipart/form-data` | Boundary-separated fields | File uploads |
| `text/xml` / `application/xml` | `<root><key>value</key></root>` | SOAP, legacy APIs |

!!! info "Content-Type Matters"
    If you don't set the correct Content-Type, the server may not parse your body at all. Always check what the application expects (inspect existing requests in browser DevTools or Burp).

---

## PUT/PATCH/DELETE Methods

The same technique works for other HTTP methods:

```shell
# PUT request (update operations)
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/user/1 -X PUT \
     -d '{"FUZZ":"value"}' -H "Content-Type: application/json" -fs 0

# PATCH request (partial update)
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/user/1 -X PATCH \
     -d '{"FUZZ":"value"}' -H "Content-Type: application/json" -fs 0

# Curl equivalents
curl -s -X PUT http://10.10.10.5:8080/api/user/1 \
     -H "Content-Type: application/json" -d '{"role":"admin"}'

curl -s -X PATCH http://10.10.10.5:8080/api/user/1 \
     -H "Content-Type: application/json" -d '{"isAdmin":true}'
```

---

## Authentication Headers

Many POST endpoints require authentication. Include tokens/cookies:

```shell
# With cookie
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/admin/admin.php -X POST \
     -d "FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded" \
     -H "Cookie: session=abc123def456" -fs 0

# With Bearer token
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ \
     -u http://10.10.10.5:8080/api/admin -X POST \
     -d '{"FUZZ":"value"}' -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOi..." -fs 0

# Curl equivalent with cookie
curl -s -X POST http://10.10.10.5:8080/admin/admin.php \
     -d "id=1" -H "Cookie: session=abc123def456"
```

---

!!! success "Revision Recap"
    - POST parameter fuzzing uses `-X POST -d "FUZZ=value"` with an appropriate `Content-Type`
    - **Form-encoded**: `-d "FUZZ=key" -H "Content-Type: application/x-www-form-urlencoded"`
    - **JSON**: `-d '{"FUZZ":"value"}' -H "Content-Type: application/json"`
    - Always establish a baseline (what does the endpoint return for unknown params?)
    - Filter with `-fs 0` (if empty responses are the default) or `-fs <baseline_size>`
    - **Try both GET and POST** — many apps accept parameters via either method
    - Include auth headers (`Cookie`, `Authorization`) when fuzzing authenticated endpoints
    - Every ffuf POST command has a curl equivalent for manual verification

---

➡️ **Next:** [Value Fuzzing](value-fuzzing.md) — brute-force parameter values for exploitation
