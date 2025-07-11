---
title: "The Complete Active Directory Pentest Methodology 👑"
sidebar_position: 5
---

An Active Directory (AD) penetration test is a simulation of a real-world adversary who has gained an initial foothold on your internal network. It requires a blend of structured techniques and creative thinking. The goal is to identify and exploit vulnerabilities to ultimately achieve "Domain Dominance" and provide actionable recommendations to strengthen security. This methodology provides a framework, but remember to **think outside the box**, as every environment is unique.

***

### ## Phase 0: Scoping and Rules of Engagement (RoE)

This is the most critical phase. Before a single packet is sent, the entire engagement must be clearly defined and agreed upon with the client.

#### **Scope Definition**
The scope explicitly defines the playground.

* **In-Scope:**
    * The target Active Directory domain(s) (e.g., `corp.local`).
    * The IP address ranges of the internal corporate network.
    * The starting assumption: typically, an unauthenticated machine connected to an access-layer network port.

* **Not in Scope (Examples):**
    * Other domains in the forest or external trusts unless specified.
    * Cloud environments (Azure AD, AWS) unless explicitly part of the scope.
    * Physical attacks, tailgating, or direct social engineering of employees.

#### **What To Do vs. What Not To Do**
These are the ground rules that separate a pentest from a crime.

* **What To Do (The "Do's"):**
    * **Do** stay strictly within the agreed-upon scope.
    * **Do** meticulously document every command, its output, and the timestamp.
    * **Do** attempt to escalate privileges to the highest level (Domain Admin).
    * **Do** report a critical vulnerability to your point of contact immediately.

* **What Not To Do (The "Don'ts"):**
    * **Do Not** perform Denial of Service (DoS) attacks. Taking down a Domain Controller is not a valid finding.
    * **Do Not** exfiltrate sensitive data (PII, IP). The finding is that you *can*, not that you *did*. Prove access with screenshots of file listings.
    * **Do Not** install persistent backdoors or rootkits. The goal is to *identify* persistence mechanisms, not deploy them.
    * **Do Not** change or delete passwords. Use compromised credentials, but do not alter them.

You must have a signed "Letter of Authorization" before proceeding.

***

### ## Phase 1: Initial Access & Network Reconnaissance

You've just plugged into the network. You have an IP address but no credentials. Your first objective is to gain a foothold. This phase combines passive listening with active probing.

#### **Technique 1: Network Poisoning (The Daily Start)**
Your first action of the day should be to start your network poisoning tools. This is your primary method for catching credentials.

* **Tools:** `Responder` (Passive/Active), `mitm6` (Active)
* **How it Works:**
    * **Responder:** Passively listens for user typos (`\\fileservr`) and captures NTLMv2 hashes.
    * **mitm6:** Actively takes over IPv6 DNS to intercept authentication traffic for relaying with `ntlmrelayx.py`.
* **Pro-Tip: Generate Traffic:** While `Responder` is listening, run safe, non-intrusive `nmap` scans against the network. This can cause services and devices to perform name resolution, increasing your chances of catching a hash.
    ```bash
    # Terminal 1: Start listening
    sudo responder -I eth0 -v

    # Terminal 2: Generate traffic by scanning for common ports
    nmap -sV -p 80,443,445,3389 192.168.1.0/24
    ```

#### **Technique 2: Low-Hanging Web Fruit**
While you wait for network poisoning to yield results, pivot your strategy. Look for web applications inside the network.

* **How it Works:** Scan the internal network for open HTTP/S ports to identify web servers. Tools like `EyeWitness` or `Aquatone` can automate this by taking screenshots of discovered web pages.
* **Look for Default Credentials:** Once you find a login page, try to access it with default credentials. This is often highly successful. Common targets include:
    * **Printers:** (e.g., admin/admin, admin/password)
    * **CI/CD Tools:** Jenkins, GitLab (often have default setups)
    * **Network Appliances:** Routers, Switches, Firewalls
    * **Other Services:** Tomcat Manager, internal wikis (Confluence), etc.

A successful login here can provide credentials that might be reused elsewhere, or even a way to get a shell on the server.

***

### ## Phase 2: Situational Awareness & Attack Path Mapping

Now that you have credentials (from a cracked hash) or a foothold (from a weak web password), you must map the domain.

* **Objective:** Enumerate users, groups, computers, and permissions to visualize attack paths.
* **Primary Tool:** **BloodHound**
* **How it Works:** Run the BloodHound collector (SharpHound) from a compromised host or with your new credentials. Load the data into the BloodHound GUI.
* **What to Expect:** BloodHound provides a graphical map of your target environment. Run queries like "Find shortest path to Domain Admins" to see exactly which users and computers you need to compromise. This is your roadmap.

![A sample BloodHound graph showing an attack path](https://i.imgur.com/rT3b4yK.png)
*A sample BloodHound graph showing the shortest path to Domain Admins.*

***

### ## Phase 3: Privilege Escalation & Lateral Movement

With your map from BloodHound, you execute the core loop of the pentest: escalating privileges and moving across the network.

* **Objective:** Compromise accounts and machines of increasing importance.
* **Key Techniques (guided by BloodHound findings):**
    * **Kerberoasting:** Find service accounts and crack their password hashes offline.
    * **Abusing Weak ACLs/GPO Permissions:** Use misconfigured permissions to add yourself to privileged groups.
    * **Delegation Attacks (Pass-Back):** Abuse Kerberos delegation to impersonate privileged users.
    * **Credential Dumping:** Use tools like `Mimikatz` on machines where you have local admin rights to dump more credentials from memory.

***

### ## Phase 4: Domain Dominance

This is the checkmate. You have escalated privileges to the point where you can take over the entire domain.

* **Objective:** Gain complete control over Active Directory.
* **Primary Techniques:**
    * **DCSync:** Use an account with replication rights to request all password hashes from a Domain Controller.
    * **Golden Ticket:** Use the `krbtgt` account hash obtained from a DCSync attack to forge Kerberos tickets, granting you ultimate power over the domain.

***

### ## Phase 5: Reporting and Documentation 📝

A pentest without a good report is just noise. This is where you provide value to the client.

* **Note-Taking:** Keep meticulous, timestamped notes and screenshots of every step and finding.
* **Report Structure:**
    1.  **Executive Summary:** A high-level, non-technical summary for management, focusing on business risk.
    2.  **Technical Narrative:** A step-by-step story of your attack chain, from initial access to domain dominance.
    3.  **Vulnerabilities & Remediation:** A detailed section for each finding, including:
        * **Title and Severity**
        * **Description** of the vulnerability.
        * **Evidence** (your redacted screenshot).
        * **Business Impact**.
        * **Detailed, Step-by-Step Remediation Advice**.