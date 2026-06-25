---
title: 'Handling SQLMap Errors'
description: 'Troubleshoot every common SQLMap error and failure scenario. Learn why scans fail and how to fix them systematically.'
icon: material/bug
tags:
  - sqlmap
  - troubleshooting
  - errors
---

# Handling SQLMap Errors

Every penetration tester has stared at a failing SQLMap scan wondering what went wrong. This section covers **every common error** and the exact steps to fix it.

---

## Connection Errors

### "connection timed out to the target URL"

```text
[CRITICAL] connection timed out to the target URL. sqlmap is going to retry the request(s)
```

**Root Cause:** SQLMap cannot reach the target server within the default timeout (30 seconds).

**Solutions:**

```bash title="Increase the timeout"
sqlmap -r request.txt --timeout=60
```

```bash title="Add retries"
sqlmap -r request.txt --timeout=60 --retries=5
```

```bash title="Check if you need a proxy/VPN"
# If the target is on an internal network:
sqlmap -r request.txt --proxy="http://your-vpn-proxy:8080"
```

**Checklist:**

- [ ] Is the target URL correct? (no typos)
- [ ] Is the target server running? (try `curl` or browser)
- [ ] Is your VPN/tunnel active? (for internal targets)
- [ ] Is a firewall blocking your IP?
- [ ] Are you behind a corporate proxy?

### "connection refused by the target URL"

```text
[CRITICAL] unable to connect to the target URL. sqlmap is going to retry the request(s)
```

**Root Cause:** The server is actively refusing connections on that port.

**Solutions:**

- Verify the correct port (80 vs 443 vs 8080)
- Check if the service uses HTTPS: try `https://` instead of `http://`
- Verify firewall rules aren't blocking your IP

### SSL/TLS Errors

```text
[CRITICAL] can't establish SSL connection
```

**Solutions:**

```bash title="Force a specific SSL version"
sqlmap -r request.txt --force-ssl
```

```bash title="Disable certificate verification (self-signed certs)"
# SQLMap doesn't verify SSL certs by default, but if you have issues:
sqlmap -r request.txt --force-ssl
```

---

## Detection Failures

### "all tested parameters do not appear to be injectable"

```text
[WARNING] GET parameter 'id' does not appear to be injectable
[CRITICAL] all tested parameters do not appear to be injectable. Try to 
increase values for '--level'/'--risk' options if you wish to perform more tests.
```

This is the **most common error** beginners encounter. Here's a systematic troubleshooting process:

#### Step 1: Increase Level and Risk

```bash title="Maximum detection coverage"
sqlmap -r request.txt --level=5 --risk=3
```

**What this changes:**

| Setting | Level 1 (default) | Level 5 (max) |
|---|---|---|
| GET/POST params | ✅ Tested | ✅ Tested |
| Cookie values | ❌ Skipped | ✅ Tested |
| User-Agent header | ❌ Skipped | ✅ Tested |
| Referer header | ❌ Skipped | ✅ Tested |
| Host header | ❌ Skipped | ✅ Tested |
| Number of payloads | ~100 | ~5000+ |

| Setting | Risk 1 (default) | Risk 3 (max) |
|---|---|---|
| AND-based tests | ✅ | ✅ |
| OR-based tests | ❌ | ✅ |
| UPDATE-based tests | ❌ | ✅ |
| Heavy time-based tests | ❌ | ✅ |

#### Step 2: Specify the DBMS

If you know (or suspect) the database type, tell SQLMap:

```bash
sqlmap -r request.txt --dbms=mysql
sqlmap -r request.txt --dbms=mssql
sqlmap -r request.txt --dbms=postgresql
```

This eliminates payloads for other DBMS types and focuses testing.

#### Step 3: Manually Specify the Injection Technique

```bash title="Only try blind techniques"
sqlmap -r request.txt --technique=BT
```

```bash title="Only try UNION-based"
sqlmap -r request.txt --technique=U
```

#### Step 4: Add Custom Prefix/Suffix

The application might wrap your input in a specific SQL context. You can tell SQLMap what comes before and after the injection point:

```bash title="If the value is inside single quotes"
sqlmap -r request.txt --prefix="'" --suffix="-- -"
```

```bash title="If the value is inside double quotes"
sqlmap -r request.txt --prefix='"' --suffix='-- -'
```

```bash title="If the value is inside parentheses"
sqlmap -r request.txt --prefix=")" --suffix="-- -"
```

#### Step 5: Check if the Parameter Is Actually Injectable

Go back to manual testing. In Burp Suite, try these payloads:

```text
id=1'          → Does it cause an error?
id=1 AND 1=1   → Same response as normal?
id=1 AND 1=2   → Different response?
id=1' AND '1'='1  → Same response as normal?
id=1' AND '1'='2  → Different response?
```

If none of these cause any observable difference, the parameter might genuinely not be injectable.

### "heuristic (basic) test shows that GET parameter 'id' might not be injectable"

```text
[WARNING] heuristic (basic) test shows that GET parameter 'id' might not be injectable
```

**What this means:** SQLMap sent a single quote (`'`) and didn't see an error or notable change in the response. This is a **heuristic**, not a definitive answer.

**What to do:** Continue the scan — the full test suite may still find injection:

```bash
sqlmap -r request.txt --level=5 --risk=3 --batch
```

---

## False Positives & False Negatives

### Dealing with False Positives

Sometimes SQLMap reports injection when there isn't one. This is more common with:

- Unstable pages (dynamic content, ads, timestamps)
- Redirections that happen to match the comparison
- Applications that return the same page regardless of input

**How to verify:**

```bash title="Use --string to specify what a TRUE response looks like"
sqlmap -r request.txt --string="Welcome, admin"
```

```bash title="Use --not-string for FALSE responses"
sqlmap -r request.txt --not-string="No results found"
```

```bash title="Use --code to match HTTP status codes"
sqlmap -r request.txt --code=200    # TRUE = 200 OK
```

### Dealing with False Negatives

SQLMap says "not injectable" but you know it is:

```bash title="Nuclear option: maximum testing"
sqlmap -r request.txt \
  --level=5 \
  --risk=3 \
  --dbms=mysql \
  --technique=BEUSTQ \
  --tamper=space2comment \
  --threads=1 \
  --time-sec=10 \
  --flush-session
```

---

## WAF/IPS Detection

### "heuristics detected that the target is protected by some kind of WAF/IPS"

```text
[WARNING] heuristics detected that the target is protected by some kind of 
WAF/IPS
```

**What this means:** SQLMap detected patterns consistent with a WAF blocking its requests. This could be Cloudflare, ModSecurity, AWS WAF, etc.

**Solutions:**

```bash title="Identify the specific WAF"
sqlmap -r request.txt --identify-waf
```

```bash title="Use tamper scripts to bypass"
sqlmap -r request.txt --tamper=space2comment,between,randomcase
```

See the [Bypassing Web Application Protections](bypassing-protections.md) section for detailed WAF evasion techniques.

### Requests Being Blocked (403 Forbidden)

```text
[WARNING] target URL responded with status code 403 (Forbidden). 
sqlmap is going to retry the request
```

**Solutions:**

```bash title="Randomize the User-Agent"
sqlmap -r request.txt --random-agent
```

```bash title="Add a delay between requests"
sqlmap -r request.txt --delay=2    # 2 seconds between requests
```

```bash title="Use random delays"
sqlmap -r request.txt --randomize=1-3    # Random delay 1-3 seconds
```

---

## Session and State Issues

### "possible integer casting detected"

```text
[WARNING] possible integer casting detected (e.g., "1 AND 1=1" would become 
"1") at the back-end
```

**What this means:** The application converts your input to an integer before using it in a query. Injected SQL text is stripped.

**Solutions:**

- This parameter is likely **not injectable** with standard string-based payloads
- Try **arithmetic-based tests**: The parameter might be injectable with numeric operations
- Move on to testing other parameters

### "target URL content is NOT stable"

Already covered in the [Output Description](output-description.md) section, but to recap:

```bash title="Tell SQLMap what a TRUE page looks like"
sqlmap -r request.txt --string="Results found"
```

```bash title="Use text-only comparison (ignore HTML tags)"
sqlmap -r request.txt --text-only
```

```bash title="Use title-only comparison"
sqlmap -r request.txt --titles
```

### Stale/Wrong Results from Cache

```bash title="Start completely fresh"
sqlmap -r request.txt --flush-session
```

```bash title="Re-run data queries but keep injection info"
sqlmap -r request.txt --fresh-queries
```

---

## Performance Issues

### Scan Running Extremely Slowly

**Possible causes and fixes:**

```bash title="Use more threads"
sqlmap -r request.txt --threads=10
```

```bash title="Limit to faster techniques only"
sqlmap -r request.txt --technique=UE    # Union + Error only (fast)
```

```bash title="Skip time-based testing"
sqlmap -r request.txt --technique=BEUS   # Everything except Time-based
```

```bash title="Optimize for speed"
sqlmap -r request.txt -o
# Equivalent to: --predict-output --keep-alive --null-connection --threads=3
```

### Scan Taking Too Long on Blind Injection

Blind injection is inherently slow. Speed it up:

```bash title="Increase threads for blind extraction"
sqlmap -r request.txt --threads=10
```

```bash title="Reduce the time delay for time-based blind"
sqlmap -r request.txt --time-sec=2    # Default is 5 seconds
```

!!! warning "Don't Set `--time-sec` Too Low"

    If you set `--time-sec` too low (e.g., 1 second), SQLMap may confuse normal network latency with an intentional delay, leading to **false positives**. Keep it at 2-3 seconds minimum.

---

## Systematic Troubleshooting Checklist

When SQLMap isn't working, run through this checklist:

- [ ] **Connection:** Can you reach the target? (`curl -v <URL>`)
- [ ] **Authentication:** Does the request include valid session cookies/tokens?
- [ ] **Request format:** Is the Content-Type correct? (URL-encoded vs JSON vs XML)
- [ ] **Correct parameter:** Are you testing the right parameter? (`-p param`)
- [ ] **Injection point:** Does manual testing confirm injectable behavior?
- [ ] **Level/Risk:** Have you tried `--level=5 --risk=3`?
- [ ] **DBMS:** Have you specified `--dbms`?
- [ ] **WAF:** Is a WAF blocking payloads? (`--identify-waf`)
- [ ] **Cache:** Have you flushed the session? (`--flush-session`)
- [ ] **Technique:** Have you tried limiting/expanding techniques? (`--technique`)
- [ ] **Prefix/Suffix:** Does the injection context need custom prefix/suffix?
- [ ] **Verbose output:** Run with `-v 3` or higher to see what's happening
