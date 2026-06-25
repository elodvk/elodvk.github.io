---
title: "Cracking Protected Files"
description: "How to extract hashes and crack passwords for protected documents, SSH keys, KeePass databases, and more."
tags:
  - password-cracking
  - office
  - pdf
  - keepass
  - john-the-ripper
  - hashcat
icon: material/file-hidden
---

# 📄 Cracking Protected Files

During an engagement, you will frequently encounter password-protected files: Office documents, PDFs, encrypted SSH private keys, and password manager databases (like KeePass). You cannot simply feed the raw file into Hashcat or John the Ripper. You must first **extract the hash** from the file using specialized utilities.

---

## 1️⃣ The Extraction Process (John's `*2john` Utilities)

John the Ripper Jumbo includes a suite of scripts designed to extract the password hash from various file formats. These scripts are typically found in `/usr/share/john/` or `/usr/sbin/` depending on your OS.

The general workflow is always:
1. Extract the hash from the file.
2. Save the extracted hash to a text file.
3. Crack the hash file using John or Hashcat.

---

## 2️⃣ Microsoft Office Documents (Word, Excel, PowerPoint)

Microsoft Office uses varying levels of encryption depending on the version (Office 97-2003 vs. Office 2007-2013 vs. Office 2016+). Modern versions use strong AES encryption with PBKDF2, making them very slow to crack.

### Extraction
```bash
# Use office2john.py to extract the hash
python3 /usr/share/john/office2john.py secret_financials.docx > office_hash.txt
```

### Cracking with John
```bash
john --wordlist=rockyou.txt office_hash.txt
```

### Cracking with Hashcat
Before using Hashcat, you must clean the `office_hash.txt` file. Open the file and **remove the filename and colon** at the beginning of the string.

```text
# Original office_hash.txt:
secret_financials.docx:$office$*2013*100000*256*16*...

# Cleaned hash for Hashcat:
$office$*2013*100000*256*16*...
```

Then, identify the Office version from the hash (e.g., `*2013*`) and find the corresponding Hashcat mode (`-m`):
- Office 2007: `-m 9400`
- Office 2010: `-m 9500`
- Office 2013: `-m 9600`

```bash
hashcat -m 9600 -a 0 cleaned_office_hash.txt rockyou.txt
```

---

## 3️⃣ PDF Documents

### Extraction
```bash
# Use pdf2john.pl
perl /usr/share/john/pdf2john.pl secure_doc.pdf > pdf_hash.txt
```

### Cracking
```bash
# With John
john --wordlist=rockyou.txt pdf_hash.txt

# With Hashcat (Clean the filename prefix first)
# PDF 1.4-1.6: -m 10500
# PDF 1.7 (Acrobat 10/11): -m 10600
hashcat -m 10500 -a 0 cleaned_pdf_hash.txt rockyou.txt
```

---

## 4️⃣ Encrypted SSH Private Keys (`id_rsa`)

If you find an `id_rsa` file that asks for a passphrase when you try to use it, you can attempt to crack the passphrase.

### Extraction
```bash
# Use ssh2john.py
python3 /usr/share/john/ssh2john.py id_rsa > ssh_hash.txt
```

### Cracking
```bash
# John handles this very well natively
john --wordlist=rockyou.txt ssh_hash.txt
```

!!! tip
    If you crack the SSH passphrase, you can use the key to authenticate:
    `ssh -i id_rsa user@target.com` (Enter the cracked passphrase when prompted).

---

## 5️⃣ KeePass Databases (`.kdbx`)

KeePass is a popular local password manager. If you exfiltrate a `.kdbx` file, cracking the master password gives you access to every credential stored inside. Modern KeePass uses Argon2 or AES-KDF, which are intentionally very slow to crack.

### Extraction
```bash
# Use keepass2john
keepass2john database.kdbx > keepass_hash.txt
```

### Cracking with John
```bash
john --wordlist=rockyou.txt keepass_hash.txt
```

### Cracking with Hashcat
Clean the file by removing the filename prefix, then use Hashcat mode `13400`:
```bash
hashcat -m 13400 -a 0 cleaned_keepass.txt rockyou.txt
```

---

## 6️⃣ Other Supported Formats

John the Ripper provides extraction scripts for dozens of other formats. You can find them by searching your system:

```bash
locate *2john
```

Some useful examples include:
- `zip2john` (ZIP archives)
- `rar2john` (RAR archives)
- `7z2john` (7z archives)
- `pfx2john` (.pfx / .p12 certificate files)
- `bitlocker2john` (BitLocker recovery passwords)
- `truecrypt_volume2john` (TrueCrypt / VeraCrypt volumes)

---

!!! warning
    **Attempting to crack protected files without explicit authorization is a violation of privacy and often illegal. Only crack files provided or approved within the scope of your engagement.**
