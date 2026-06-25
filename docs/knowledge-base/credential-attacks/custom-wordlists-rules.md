---
title: "Writing Custom Wordlists and Rules"
description: "How to create targeted wordlists and transformation rules to drastically improve password cracking success rates."
tags:
  - password-cracking
  - wordlists
  - rules
  - cewl
  - hashcat
  - john
icon: material/key
---

# 📝 Writing Custom Wordlists and Rules

While massive general-purpose wordlists like `rockyou.txt` are great starting points, they often fail against organizations with strict password policies or unique corporate cultures. The most successful password cracking campaigns rely on **custom, highly targeted wordlists** combined with **effective rule sets**.

---

## 1️⃣ Generating Targeted Wordlists

A targeted wordlist includes terms relevant to the target organization: company names, product names, local sports teams, internal project codenames, and industry jargon.

### Using `cewl` (Custom Word List generator)
`cewl` is a Ruby app that crawls a given URL to a specified depth and returns a list of words which can then be used for password crackers.

```bash
# Crawl example.com to a depth of 2, keep words at least 5 chars long, save to list.txt
cewl -d 2 -m 5 -w list.txt https://www.example.com

# Include email addresses found during the crawl
cewl -d 2 -m 5 -e --email_file emails.txt -w list.txt https://www.example.com
```

### Expanding with Known Formats
Organizations often enforce specific formats (e.g., `SeasonYear!`, `CompanyMonthYear`). You can generate these using tools like `crunch` or simple bash scripting.

```bash
# Using crunch to generate 8-character passwords with specific character sets
# min-len max-len charset -o output
crunch 8 8 abcdefghijklmnopqrstuvwxyz0123456789 -o custom.txt

# Bash loop for Seasonal Passwords
for season in Spring Summer Autumn Fall Winter; do
  for year in 2022 2023 2024; do
    echo "${season}${year}!" >> seasonal.txt
    echo "${season}${year}@" >> seasonal.txt
  done
done
```

---

## 2️⃣ Understanding Cracking Rules

Rules instruct Hashcat or John the Ripper to transform words from your wordlist before hashing them. Instead of trying just `password`, a rule might make the cracker try `Password`, `p4ssw0rd`, `password123`, and `Password!`.

### The Value of Rules
If you have a wordlist of 100 targeted company terms, applying the Hashcat `best64.rule` (which contains 64 transformations) turns your list into 6,400 highly probable password guesses.

---

## 3️⃣ Hashcat Rule Syntax

Hashcat rules use a specific syntax. Here are some of the most common and useful rule commands:

| Rule | Description | Example (Input: `password`) |
|------|-------------|----------------------------|
| `:` | Do nothing (keep original word) | `password` |
| `l` | Convert all to lowercase | `password` |
| `u` | Convert all to uppercase | `PASSWORD` |
| `c` | Capitalize the first letter | `Password` |
| `r` | Reverse the word | `drowssap` |
| `$x` | Append character 'x' to the end | `passwordx` |
| `^x` | Prepend character 'x' to the beginning | `xpassword` |
| `[ ` | Delete the first character | `assword` |
| `] ` | Delete the last character | `passwor` |
| `so0`| Substitute 'o' with '0' | `passw0rd` |

### Chaining Rules
Rules can be chained together on a single line to perform multiple transformations sequentially.

`c $1 $2 $3 $!`
- `c` : Capitalize -> `Password`
- `$1` : Append 1 -> `Password1`
- `$2` : Append 2 -> `Password12`
- `$3` : Append 3 -> `Password123`
- `$!` : Append ! -> `Password123!`

---

## 4️⃣ Writing Custom Rules

You can create your own `.rule` file to target specific password policies you've discovered.

1. **Create a file:** `custom.rule`
2. **Add rules (one per line):**

```text
# custom.rule
:
c
c $2 $0 $2 $4
c $2 $0 $2 $4 $!
c $!
so0
so0 si1
```

3. **Apply the custom ruleset in Hashcat:**
```bash
hashcat -m 1000 -a 0 hashes.txt company_terms.txt -r custom.rule
```

---

## 5️⃣ Recommended Existing Rulesets

Before writing your own complex rules, explore the excellent rulesets created by the community. These are usually found in `/usr/share/hashcat/rules/` on Kali Linux.

| Ruleset | Speed | Description |
|---------|-------|-------------|
| `best64.rule` | Very Fast | The 64 most common transformations. Always run this first. |
| `OneRuleToRuleThemAll` | Fast | A highly optimized custom ruleset by NotSoSecure. Excellent balance of speed and hit rate. |
| `dive.rule` | Slow | Extremely comprehensive. Runs over 100,000 transformations. Good for overnight cracking. |
| `KoreLogic` | Medium | Rulesets developed by KoreLogic Security, heavily focused on common enterprise password patterns. |

---

!!! tip
    **Methodology:** The most efficient cracking methodology is generally:
    1. Fast hashes (MD5, NTLM): Huge dictionary + complex rules (e.g., `rockyou.txt` + `dive.rule`).
    2. Slow hashes (bcrypt, yescrypt): Small, targeted dictionary + fast rules (e.g., `cewl_list.txt` + `best64.rule`).
