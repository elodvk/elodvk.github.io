---
title: "Domain Enumeration with Bloodhound"
sidebar_position: 2
---

You've landed your initial foothold and have a set of domain credentials. It's time to trade in your paper map for a GPS. **BloodHound** is that GPS. It doesn't just list domain objects; it maps the complex web of relationships between them, showing you the hidden paths and secret passages that lead directly to Domain Admin.

This guide focuses on using the Python-based collector for the **BloodHound Community Edition (CE)**, and will dive into writing custom **Cypher queries** to uncover high-impact, non-default attack paths.

---

##  How It Works: The Collector and the Graph

BloodHound has two parts: the collector that grabs the data, and the GUI that visualizes it.

1.  **The Collector (`bloodhound-ce-python`):** This is your reconnaissance drone. It's a Python-based tool that uses your compromised credentials to query the Domain Controller over LDAP and other protocols. It gathers a massive amount of data on users, groups, computers, sessions, and permissions, then saves it as a set of JSON files.

2.  **The BloodHound GUI (Community Edition):** This is your command center. Powered by a Neo4j graph database, you import the JSON files from the collector into the GUI. It then builds an interactive map of the entire domain, allowing you to visually trace privilege relationships.

---

## Let's Go Hunting: The Practical Steps

### **Step 1: Install `bloodhound-ce-python`**

On your attacker machine (e.g., Kali Linux), install the community edition collector.

```bash
sudo apt install bloodhound-ce-python
```

### Step 2: Run The Collector

Using your compromised credentials, run the collector against a Domain Controller.

```shell
# Create a directory for your loot
mkdir bloodhound_loot
cd bloodhound_loot

# Run the collector
bloodhound-ce-python -u 'j.rice' -p 'Welcome@123' -d alpha.lab -ns 172.17.1.100 -c All --zip
```

Let's break that down:

 - `-u 'j.rice'`: The username.
 - `-p 'Welcome@123'`: The user's password.
 - `-d alpha.lab`: The target domain name.
 - `-ns 172.17.1.100`: The IP address of a Name Server / Domain Controller.
 - `-c All`: The collection method. All is recommended to get the most complete picture.
 - `--zip`: Zip the collected data. if this flag is not set, `bloodhound-python` will produce a set of JSON files (e.g., users.json, groups.json, computers.json, sessions.json).

### Step 3: Analyze the Loot

Open your BloodHound CE GUI. Drag and drop the generated `zip` file onto the interface. BloodHound will ingest the data and build the graph. Now you can use the "Analysis" tab to run built-in queries like "Find Shortest Paths to Domain Admins."

## Beyond the Defaults: Writing Custom Cypher Queries

The built-in queries are great, but the real power of BloodHound comes from writing your own queries in the **Cypher** language. Cypher is a query language for graphs, much like SQL is for relational databases.

Go to the "Raw Query" tab at the bottom of the BloodHound GUI to get started.

**Example 1: Abusing GenericAll / GenericWrite**
 - **Impact**: If a user or group you control has `GenericAll` or `GenericWrite` permissions on another user or group, you effectively own that object. You can reset its password or, if it's a group, add your own user to it. This is a direct privilege escalation vector.

 - **Custom Cypher Query**:
    ```
    // Find principals that have full control over the Domain Admins group
    MATCH (n)-[r:GenericAll|GenericWrite]->(g:Group)
    WHERE g.name = 'DOMAIN ADMINS@CORP.LOCAL'
    RETURN n.name AS Attacker, TYPE(r) AS Permission, g.name AS Target
    ```

**Example 2: msDS-KeyCredentialLink Abuse (Shadow Credentials)**
 - **Impact**: The `msDS-KeyCredentialLink` attribute is used for Windows Hello for Business. If you have write access to this attribute on an object (like a Domain Controller's computer account), you can add your own "shadow credential" to it. This allows you to authenticate as that object using your credential, completely bypassing its password. This is an incredibly stealthy escalation and persistence technique.

 - **Custom Cypher Query**:
    ```
    // Find principals who can create shadow credentials on Domain Controllers
    // The "WriteKeyCredentialLink" relationship is a custom one created by BloodHound
    MATCH (n)-[r:WriteKeyCredentialLink]->(c:Computer)
    WHERE c.name CONTAINS 'DC'
    RETURN n.name AS Attacker, c.name AS TargetComputer
    ```

**Example 3: Finding Unconstrained Delegation Machines**
 - **Impact**: When a computer is configured for Unconstrained Delegation, it caches the Kerberos Ticket-Granting Ticket (TGT) of any user who authenticates to it. If you compromise that computer and a Domain Admin connects via RDP, you can steal their TGT from memory (using Mimikatz) and use it to impersonate them anywhere in the domain.

 - **Custom Cypher Query**:
    ```shell
    // Find all computers with the dangerous Unconstrained Delegation flag set
    MATCH (c:Computer)
    WHERE c.unconstraineddelegation = true
    RETURN c.name AS VulnerableComputer, c.operatingsystem AS OS
    ```

By moving beyond the default queries and writing your own, you can tailor your analysis to the specific environment you're in, uncover non-obvious attack paths, and truly understand the intricate web of permissions that defines an Active Directory domain.