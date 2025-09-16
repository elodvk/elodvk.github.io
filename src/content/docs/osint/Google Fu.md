---
title: Google Fu
---


**Google Fu** (also known as Google Hacking or Google Dorking) is the skill of using Google's advanced search operators to find information that is not readily available through simple keyword searches. For a red teamer, it's one of the most powerful and essential passive reconnaissance techniques. You can uncover sensitive documents, login pages, vulnerable servers, and configuration files without ever sending a single packet to the target's systems.

---
## Key Search Operators ⚙️

The power of Google Fu comes from combining a few key operators to filter and refine your search results.

### `site:`
Restricts your search to a single website or domain. This is the most fundamental operator for targeted reconnaissance.

* **Example**: Find all pages on the `example.com` website that mention the word "login".
    ```
    site:example.com intext:login
    ```

### `filetype:`
Filters results to a specific file extension. This is incredibly useful for finding documents that were never intended to be public.

* **Example**: Find all PDF files on `example.com`.
    ```
    site:example.com filetype:pdf
    ```
* **Commonly sought filetypes**: `pdf`, `xls`, `xlsx`, `doc`, `docx`, `txt`, `log`, `sql`, `cfg`

### `inurl:`
Searches for specific text within the URL of a page. This helps find specific pages like admin portals or login forms.

* **Example**: Find any URL on `example.com` that contains the word "admin".
    ```
    site:example.com inurl:admin
    ```

### `intitle:`
Searches for specific text within the title of a web page.

* **Example**: Find pages with "index of" in their title, which often reveals open directory listings.
    ```
    intitle:"index of"
    ```

### `intext:`
Searches for specific text within the body content of a web page. This is more specific than a standard search.

* **Example**: Find pages on a specific site that contain the phrase "password reset".
    ```
    site:example.com intext:"password reset"
    ```

---
## Combining Operators for Powerful Queries 🧩

The real magic happens when you chain these operators together.

### Find Login Pages
Combine `site`, `inurl`, and `intitle` to find potential administration portals.

```
site:target.com inurl:login | intitle:login | inurl:admin
```

### Discover Sensitive Documents
Combine `site`, `filetype`, and `intext` to hunt for internal documents, spreadsheets with employee data, or configuration files.

```
site:target.com filetype:xls intext:username
site:target.com filetype:sql "password"
site:target.com filetype:log "error"
```

### Find Open Directory Listings
An "index of" search reveals server directories that are not protected, giving you access to raw file listings.

```
site:target.com intitle:"index of /"

```

### Uncover Error Messages
Error messages can leak information about the software, versions, and paths used on a web server.

```
site:target.com "SQL syntax error" | "fatal error"
```

---
## The Google Hacking Database (GHDB) 📚

You don't always have to create these queries from scratch. The **Google Hacking Database (GHDB)** is a curated database of thousands of Google Dorks created by the security community. It's an invaluable resource for finding dorks that uncover specific vulnerabilities, technologies, and sensitive data.

* **Hosted by Exploit-DB**: You can browse the GHDB to find dorks categorized by the type of information they reveal.
* **Categories Include**:
    * Footholds
    * Files Containing Usernames
    * Sensitive Directories
    * Web Server Detection
    * Vulnerable Files
    * Error Messages

Before starting any reconnaissance, checking the GHDB for pre-made dorks related to your target's technology stack (e.g., "WordPress", "Joomla", "Apache") can save you a significant amount of time.