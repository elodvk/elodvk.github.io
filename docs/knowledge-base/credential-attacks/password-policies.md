---
title: "Password Policies"
description: "Designing and enforcing effective password policies to defend against modern password attacks."
tags:
  - password-attacks
  - defense
  - password-policy
  - nist
---

# 🛡️ Password Policies

Throughout this section, we've explored how attackers crack hashes, spray passwords, and abuse stored credentials. The primary defense against these attacks is a strong, mathematically sound, and user-friendly **Password Policy**.

Historically, password policies have been counterproductive (e.g., forcing 90-day rotations, which leads to `Spring2024!`, `Summer2024!`). Modern password policies rely on guidelines set by organizations like NIST (National Institute of Standards and Technology).

---

## 1️⃣ The NIST Guidelines (SP 800-63B)

The NIST Digital Identity Guidelines revolutionized password policies. If an organization is not following these guidelines, they are likely more vulnerable to attack.

### Core Recommendations:

1. **Remove periodic password expiration:** Do not force users to change their passwords every 30, 60, or 90 days. Users hate this and will predictably increment numbers (e.g., `Password1` -> `Password2`). Passwords should only be changed if there is evidence of compromise.
2. **Remove arbitrary complexity requirements:** Do not require a mix of upper, lower, numbers, and symbols. This leads to predictable substitutions (`P@ssw0rd!`). Instead, encourage long passphrases.
3. **Screen against known breached passwords:** This is the most critical defense against credential stuffing. When a user creates a new password, check it against a database of known compromised passwords (like HaveIBeenPwned) and reject it if found.
4. **Increase minimum length:** Require at least 8 characters, but strongly encourage 15+ character passphrases.
5. **Allow all printable characters:** Users should be able to use spaces and emojis in their passwords to create memorable passphrases (e.g., `my dog loves eating shoes!`).

---

## 2️⃣ Enforcing Policies in Active Directory

Active Directory allows you to enforce password policies across the domain using Group Policy Objects (GPOs).

### Fine-Grained Password Policies (FGPP)
Historically, AD only allowed one password policy per domain. FGPP allows you to assign different policies to different groups.
- **Standard Users:** 12-character minimum, no expiration.
- **Domain Admins:** 20-character minimum, strict lockout thresholds.

### Defending Against Password Spraying
Password spraying relies on staying below the account lockout threshold.
- **Lockout Threshold:** Set to a reasonable number (e.g., 10 attempts). Setting it too low (e.g., 3) allows attackers to intentionally lock out the entire company (Denial of Service).
- **Lockout Observation Window:** How long failed attempts are remembered.
- **Lockout Duration:** How long the account stays locked (e.g., 30 minutes).

### Banning Weak Passwords
Active Directory does not natively support checking against breached password lists. You must use third-party tools (like Entra ID Password Protection or solutions from Specops) to implement custom dictionary blocks (e.g., blocking `CompanyName2024!`).

---

## 3️⃣ Multi-Factor Authentication (MFA)

A strong password policy is irrelevant if the password is stolen via a phishing attack or captured by a keylogger. **MFA is the single most effective control against credential compromise.**

However, not all MFA is equal:

| MFA Type | Security Level | Vulnerable to |
|----------|----------------|---------------|
| **SMS / Text Message** | Low | SIM swapping, SS7 interception, Phishing |
| **Authenticator Apps (TOTP)** | Medium | Phishing (Attacker proxies the code) |
| **Push Notifications (e.g., Duo)** | Medium | MFA Fatigue (Attacker spams requests until the user clicks 'Approve') |
| **FIDO2 / WebAuthn (YubiKey)** | High (Phishing-Resistant) | Physical theft of the key |

!!! tip
    Whenever possible, organizations should migrate to phishing-resistant MFA (like FIDO2 security keys) for high-privilege accounts.

---

## 4️⃣ The Human Element

Even the best technical policies fail if users don't understand *why* they exist.

- **Encourage Passphrases:** Teach users that length beats complexity. `correct horse battery staple` is mathematically harder to crack than `Tr0ub4dour&3` and much easier to remember.
- **Provide Password Managers:** If you expect users to have unique, strong passwords for every internal service, you must provide them with an enterprise password manager (like Bitwarden or 1Password).

---

!!! warning
    **A password policy is a balancing act.** If you make the policy too restrictive, users will write their passwords on sticky notes attached to their monitors, effectively negating the entire security control.
