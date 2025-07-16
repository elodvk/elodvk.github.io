---
title: "Discovering Email Addresses"
sidebar_position: 2
---

Finding valid email addresses is a cornerstone of passive reconnaissance. It's the primary method for targeting individuals in phishing campaigns and can reveal usernames and company-wide email patterns. This guide covers the essential tools, websites, and techniques to uncover email addresses.

---
## 1. Automated OSINT Tools 🤖

Automated tools are the most efficient way to gather emails. They query multiple public sources at once and aggregate the results.

### theHarvester

A staple in any pentester's toolkit, `theHarvester` is a command-line tool included in Kali Linux. It gathers emails, subdomains, employee names, and open ports from public sources like search engines and PGP key servers.

* **How it Works**: You provide a domain, and it queries sources like Google, Bing, Hunter.io, and more to find any associated email addresses.
* **Example Usage**:
    ```bash
    theharvester -d example.com -b all
    ```
    * `-d`: Specifies the target domain.
    * `-b`: Specifies the data source (e.g., `google`, `bing`, `hunter`, or `all`).

---
## 2. Specialised Websites and Services 🌐

Several web-based platforms are built specifically for finding professional email addresses. They often have free tiers that are perfect for targeted reconnaissance.

### Hunter.io

Hunter is one of the most popular and powerful services for finding email addresses. It crawls the web and indexes publicly available professional email addresses.

* **Objective**: To find email addresses associated with a specific company or professional.
* **Resources**:
    * **Domain Search**: You enter a company domain (e.g., `example.com`), and it returns known email addresses and the most common email pattern (e.g., `{first}.{last}@example.com`).
    * **Email Finder**: If you know a person's full name and the company they work for, Hunter can find their specific email address.
    * **Browser Extension**: A Chrome extension allows you to find emails for the website you're currently visiting.

### Other Notable Services

* **PhoneBook.cz**: Allows you to see all emails, subdomains, and URLs associated with a domain. It's a simple but powerful web-based tool.
* **VoilaNorbert**: Another popular service that finds corporate emails. You provide a name and a company domain.

---
## 3. Manual Search Engine Techniques (Google Dorking) 🕵️

Using advanced search operators, you can force search engines like Google to uncover email addresses that have been indexed in public documents and web pages.

* **Objective**: To find emails within specific file types or on particular websites.
* **Common Dorks for Email Discovery**:
    * Find emails on a specific website:
        ```
        site:example.com "email"
        ```
    * Search for specific file types that often contain email lists (like spreadsheets):
        ```
        site:example.com filetype:xls intext:"email"
        ```
    * Combine terms to find employee lists:
        ```
        filetype:pdf intext:"@example.com" "contact"
        ```
    * Find emails on social or code-sharing platforms:
        ```
        site:github.com "@example.com"
        ```

---
## 4. Social Media and Professional Networks 🧑‍💼

People often list their contact information publicly on professional networking sites.

* **LinkedIn**: The most valuable resource. While direct emails are often hidden, people may list them in their "Contact Info" section or even in their profile summary or posts. It's also the best place to find names and job titles to use with a tool like Hunter.io.
* **GitHub**: Developers frequently commit code with their email address in the commit logs. If a company has a public GitHub organization, you can inspect the commit history of its employees to find their emails.

---
## 5. Breach Databases 💥

While ethically grey and legally complex, checking public data breach dumps can reveal corporate email addresses and password patterns. This is an advanced technique and should be approached with caution.

* **Resource**: **`Have I Been Pwned?`** offers a domain search feature that allows administrators to see all email addresses from their domain that have appeared in publicly known data breaches. This is a legitimate service for defensive purposes but illustrates how breach data can be used.
