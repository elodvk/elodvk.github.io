---
title: "Cracking Protected Archives"
description: "How to extract hashes and crack passwords for protected ZIP, RAR, 7z, and other archive formats."
tags:
  - password-cracking
  - zip
  - rar
  - 7z
  - archives
  - john-the-ripper
  - hashcat
icon: material/key
---

# 🗜️ Cracking Protected Archives

Password-protected archives (ZIP, RAR, 7z) are frequently used by users to securely transfer or store sensitive files. When you encounter these during an engagement, you must extract the encryption hash from the archive header before you can attempt to crack the password.

---

## 1️⃣ ZIP Archives

ZIP files use various encryption methods, ranging from the weak legacy ZipCrypto to strong AES-256 encryption.

### Extraction
Use `zip2john` to extract the hash. It will automatically detect the encryption type used in the archive.

```bash
# Basic extraction
zip2john protected_data.zip > zip_hash.txt
```

!!! concept
    If the ZIP file contains many files, `zip2john` will try to extract hashes for all of them. You only need to crack **one** of these hashes, as the same password usually encrypts the entire archive. You can tell `zip2john` to target a specific file inside the archive using the `-o` flag to speed up the process.

### Cracking with John
```bash
john --wordlist=rockyou.txt zip_hash.txt
```

### Cracking with Hashcat
First, clean the hash by removing the filename prefix (e.g., `protected_data.zip:`).
Determine the Hashcat mode based on the hash string:
- If the hash contains `$pkzip2$`: Use `-m 17200` or `-m 17220` or `-m 17225` (Legacy PKZIP)
- If the hash contains `$zip2$*...*1*`: Use `-m 13600` (WinZip PBKDF2-HMAC-SHA1)

```bash
hashcat -m 13600 -a 0 cleaned_zip_hash.txt rockyou.txt
```

---

## 2️⃣ RAR Archives

RAR archives, especially RAR5, use strong AES encryption with a high number of iterations, making them very slow to crack. GPU acceleration with Hashcat is highly recommended.

### Extraction
Use `rar2john` to extract the hash.

```bash
rar2john confidential.rar > rar_hash.txt
```

### Cracking with John
```bash
john --wordlist=rockyou.txt rar_hash.txt
```

### Cracking with Hashcat
Clean the filename prefix from the text file. Determine the RAR version:
- RAR3: `-m 12500` (Length 16-64) or `-m 23800`
- RAR5: `-m 13000`

```bash
hashcat -m 13000 -a 0 cleaned_rar_hash.txt rockyou.txt
```

---

## 3️⃣ 7z Archives

7-Zip archives use AES-256 encryption with a massive number of hashing iterations (often 512,000 rounds of SHA-256). This makes 7z files **extremely slow** to crack. A dictionary attack with a small, highly targeted wordlist is usually the only viable approach unless the password is very weak.

### Extraction
Ensure you have the `7z2john.pl` script (it's often a Perl script in the John Jumbo installation).

```bash
perl /usr/share/john/7z2john.pl backups.7z > 7z_hash.txt
```

### Cracking with John
```bash
john --wordlist=rockyou.txt 7z_hash.txt
```

### Cracking with Hashcat
Clean the filename prefix. The Hashcat mode for 7-Zip is `11600`.

```bash
hashcat -m 11600 -a 0 cleaned_7z_hash.txt rockyou.txt
```

---

## 4️⃣ Known-Plaintext Attacks (ZIP Only)

If you have a password-protected ZIP archive, and you manage to obtain an **unencrypted, identical copy of just one file** that is inside that archive, you can perform a **Known-Plaintext Attack (KPA)**.

This attack exploits a weakness in legacy ZipCrypto (it does not work against AES-encrypted ZIPs). Tools like `bkcrack` can deduce the internal encryption keys without ever discovering the actual password.

### Using `bkcrack`

1. You have `encrypted.zip` (contains `secret.txt` and `public_logo.png`).
2. You find `public_logo.png` unencrypted on the company's website.
3. Zip the unencrypted logo using the same compression method (usually Deflate).
   ```bash
   zip unencrypted_logo.zip public_logo.png
   ```
4. Run `bkcrack` to find the internal keys.
   ```bash
   bkcrack -C encrypted.zip -c public_logo.png -P unencrypted_logo.zip -p public_logo.png
   ```
5. If successful, `bkcrack` outputs three keys. You can use these keys to extract `secret.txt` without the password.
   ```bash
   bkcrack -C encrypted.zip -c secret.txt -k <key1> <key2> <key3> -d extracted_secret.txt
   ```

---

!!! warning
    **Only attempt to crack archives you are authorized to access. Cracking stolen archives containing PII or proprietary data is illegal.**
