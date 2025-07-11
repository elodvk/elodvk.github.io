---
title: PrintNightmare (CVE-2021-1675)
sidebar_position: 2
---

In the summer of 2021, another vulnerability took the security world by storm, proving once again that the most mundane services can harbor the most critical flaws. This was **PrintNightmare (CVE-2021-34527, a variant of CVE-2021-1675)**, a flaw in the Windows Print Spooler service.

PrintNightmare allowed any low-privilege domain user to achieve **Remote Code Execution (RCE)** as `SYSTEM` on a Domain Controller, effectively going from zero to hero in a single step. The service designed to put ink on paper suddenly became the most effective way to compromise an entire domain.

Think of it like this: The kingdom's public announcement system (the Print Spooler) was designed to accept paper notices from anyone to be posted on the town board. The flaw was that you could hand the announcer a special notice written in disappearing ink that was actually a royal decree. The announcer, not checking the notice's authority and having the king's seal, would read it aloud, making your decree the law of the land.

---

### ## The "Why": A Flaw in Trusting "Drivers"

The **Windows Print Spooler** service (`spoolsv.exe`) is a decades-old component of Windows that manages printing jobs. For convenience, it has a feature that allows users, including remote users, to add new printer drivers.

The PrintNightmare vulnerability existed in the `RpcAddPrinterDriverEx()` function. This function was supposed to perform security checks to ensure that the user adding a driver had administrative privileges. However, a critical flaw in the logic allowed these checks to be bypassed.

This meant an attacker could connect to the Print Spooler service on a remote machine (like a Domain Controller) and tell it: "Hello, I have a new printer driver I'd like you to install." The attacker would point the service to a malicious DLL disguised as a driver. The Print Spooler service, running as `NT AUTHORITY\SYSTEM`, would dutifully fetch this malicious DLL and execute it with its own god-like privileges.

---

### ## The Heist: From Low-Privilege User to SYSTEM on a DC

The attack requires one thing: **valid credentials for any low-privilege domain user.** From there, the path to domain compromise is swift.

1.  **Craft a Malicious DLL:** The attacker creates a DLL payload. This is typically a simple reverse shell or a command to add a new user to the Domain Admins group. This DLL is the "printer driver."

2.  **Host the Malicious DLL:** The attacker places the DLL on a network share that the target machine (the Domain Controller) can access. This can even be an SMB share hosted on the attacker's own machine.

3.  **Run the Exploit Script:** The attacker uses a proof-of-concept script from their machine. The script connects to the Print Spooler service on the target DC using the low-privilege user's credentials.

4.  **Trick the Spooler:** The script calls the vulnerable `RpcAddPrinterDriverEx()` function and tells the DC, "Please install this new printer driver located at `\\attacker-machine\share\payload.dll`."

5.  **Achieve Remote Code Execution:** The Print Spooler service on the DC, believing this is a legitimate request, connects back to the attacker's share, downloads `payload.dll`, and executes it as `SYSTEM`.

At this point, the attacker's payload runs. If it was a reverse shell, the attacker now has a shell on the Domain Controller with the highest possible privileges. If the payload added a new user to the Domain Admins group, the attacker can now log in as a full-fledged Domain Admin. The game is over.

---

### ## Is It Still Relevant Today? Yes, on Unpatched Systems

Microsoft released patches for PrintNightmare in **July 2021**. The patch fixed the validation logic in the `RpcAddPrinterDriverEx()` function, ensuring that only administrators could install new drivers.

* **Is it relevant?** In any environment that is fully patched, **this attack will not work.**
* **Why know it?** Like ZeroLogon, PrintNightmare was a critical, widespread vulnerability. Understanding it is key for any security professional. On a pentest, if you discover a Domain Controller that is missing patches from mid-2021, this attack is a high-probability vector for compromise. The discovery of an unpatched, vulnerable Print Spooler service is in itself a critical finding.

---

### ## Mitigation: Taming the Printer

* **PATCH YOUR SYSTEMS:** Applying the security updates from July 2021 and later is the primary and most effective defense.
* **Disable the Print Spooler Service on Domain Controllers:** This is a **critical security best practice.** A Domain Controller has no business being a print server. Its job is to manage the domain. Disabling the Print Spooler service on all DCs entirely eliminates this attack surface. This can be done via Group Policy.
* **Restrict Point and Print:** Use Group Policy to configure the "Point and Print Restrictions" to prevent non-administrative users from being able to install any print drivers.
* **Monitor for Anomalies:** Monitor for unexpected DLLs being loaded by the `spoolsv.exe` process or for strange SMB connections originating from your Domain Controllers.