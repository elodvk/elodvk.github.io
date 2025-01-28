---
title: Kerberos Attacks
description: An in-depth look at Kerberos authentication protocol and its vulnerabilities.
image:
    path: /images/kerberos-attacks.png
    alt: Kerberos Authentication Protocol
---

# Overview of Kerberos Authentication

**Kerberos** is a network authentication protocol designed to allow users to authenticate themselves securely and access services once authentication is successful. It has been the default authentication protocol in **Windows Active Directory** networks since **Windows 2000** and is widely used in enterprise environments.

## **Key Characteristics of Kerberos**

### **1. Stateless Authentication Protocol**
- **Kerberos** is a **stateless** protocol, meaning that it does not rely on maintaining session information between requests. The protocol uses **tickets** to authenticate users without storing transaction states.
- This stateless nature enhances security and scalability, as the KDC (Key Distribution Center) doesn't need to remember every user's past interactions.

### **2. Ticket-Based Authentication**
- Kerberos operates through a **ticketing system** where users authenticate once and then receive **tickets** to access resources on the network.
- These **tickets** are issued by the **KDC**, which consists of two components:
  - **Authentication Service (AS)**
  - **Ticket Granting Service (TGS)**

### **3. Zero-Knowledge Proof Protocol**
- Kerberos is a **Zero-knowledge proof protocol**. This means that a user proves their identity to the system without actually transmitting sensitive information, like passwords, over the network.
- Instead of sending a password to authenticate, the user’s credentials are protected in the form of encrypted **tickets** that do not expose the password itself.

### **4. Ticket Granting and Validation**
- The **Ticket Granting Ticket (TGT)** acts as proof of the user's identity. Once a user has a valid **TGT**, they can request further **Service Tickets (ST)** for specific resources or services.
- The **TGS** verifies that the TGT is valid and issues service-specific tickets for the user, allowing access to various network resources without re-authenticating.

### **5. No Need to Transmit Passwords**
- One of the most significant advantages of Kerberos is that **user passwords are never transmitted over the network**.
- Instead of sending passwords in plaintext, the system uses **encrypted tickets** to ensure that sensitive information remains secure.

### **6. Trust Assumptions**
- Kerberos assumes that if a user has a valid **TGT**, they have already proven their identity to the **KDC**. Therefore, the **KDC** does not need to record or track past authentication transactions, simplifying the authentication process.

## **Summary of Kerberos Workflow:**
1. **User Authentication**: The user authenticates once to the **KDC** and receives a **Ticket Granting Ticket (TGT)**.
2. **Accessing Services**: The user uses the **TGT** to request **Service Tickets (ST)** from the **Ticket Granting Service (TGS)**.
3. **Granting Access**: The user presents the **ST** to the requested service, which grants access if the ticket is valid.

By ensuring that **passwords are never transmitted over the network** and by using **encrypted tickets** for authentication and access control, **Kerberos** greatly improves security in a networked environment.



# Library Access System - Ticket-Based Authentication Example

Imagine a university library system with a central authentication service that manages who can access various resources like books, journals, and computer terminals.

## 1. Request for Identity (TGT)

- A student wants to access the library's resources, so they first need to prove they are a legitimate member of the university.
- The student logs into a central authentication system (like a "library login page") using their university credentials (username and password).
- Upon successful authentication, the system issues a **Library Identity Card (TGT)**, which proves that the student is a registered user of the university library.

## 2. Request for Access to Resources (TGS or ST)

- Now that the student has their Library Identity Card (TGT), they want to access a specific library resource — for example, the online journal database.
- The student sends their TGT to the **Library Access Control System (TGS)** to request access to the journal database.
- The TGS checks the validity of the student’s TGT and issues a **Journal Access Ticket (ST)**, which is a temporary "permission slip" that allows the student to access the journal database for a limited time.

## 3. Accessing the Resource

- The student presents their **Journal Access Ticket (ST)** to the journal database system.
- The journal system validates the ticket and grants the student access to the online journals if the ticket is valid and the student has the proper permissions.

## Key Components:

- **Library Identity Card (TGT)**: A proof of the student's identity issued by the central authentication system. This allows the student to request access to specific resources.
- **Library Access Control System (TGS)**: The system that validates the TGT and issues temporary access tickets (Service Tickets) for specific resources.
- **Journal Access Ticket (ST)**: A temporary ticket that grants the student access to the journal database for a specific period.

## Why is this useful?

- The student doesn’t need to log in separately to each library system they want to use. After logging in once and receiving the TGT, they can request access to different resources without having to authenticate again.
- The journal database system doesn't need to store the student’s password or directly authenticate them; it simply validates the access ticket.

This example simplifies the concept of secure authentication and resource access while maintaining privacy and efficiency for both the student and the library system.

# Kerberos Benefits

Despite the discussions around Kerberos attacks and the potential risks of the **Golden Ticket** attack, it's important to understand that Kerberos offers several significant advantages over older authentication protocols like SMB/NTLM.

## **1. Protection Against Pass-The-Hash Attacks**
Before Kerberos, authentication was primarily done through protocols like **SMB** or **NTLM**, where the user's password hash was stored in memory after authentication. This posed a significant risk:
- If an attacker managed to compromise a target machine and steal the **NTLM hash**, they could perform a **Pass-The-Hash** attack to access any resources the user had access to.

### **Kerberos Advantage:**
- **Kerberos tickets** do not contain the user's password, significantly reducing the risk of these types of attacks. The tickets specify the machine that the user can access, meaning attackers cannot simply steal and reuse the ticket to gain unauthorized access.

## **2. Mitigating the "Double Hop" Problem**
When accessing remote machines via **WinRM** (Windows Remote Management), older non-Kerberos protocols like NTLM can lead to the **Double Hop Problem**:
- With **NTLM**, the authentication session is tied to the password hash stored in memory, and if an attacker compromises a machine, they can potentially access other machines the same user has access to, without re-authenticating.
  
### **Kerberos Advantage:**
- **Kerberos** requires explicit authentication for each machine the user wishes to access, and there is no password stored in memory. This means that even if an attacker compromises one machine, they cannot easily use it to hop to other machines without proper re-authentication. This makes it more secure for remote access.

## **3. Pass-The-Ticket Attack**
While **Kerberos** is not entirely immune to attacks, such as **Pass-The-Ticket**, it offers a distinct set of limitations compared to **Pass-The-Hash**:
- **Pass-The-Ticket** allows an attacker to use stolen Kerberos tickets to impersonate the victim user. However, the attacker is restricted to accessing only the resources the victim has authenticated against.
- Additionally, Kerberos tickets have a **lifetime** limit, meaning the attacker has a limited time window to exploit the ticket before it expires.

### **Kerberos Advantage:**
- Unlike NTLM, which can lead to prolonged access if a password hash is stolen, Kerberos tickets are temporary and time-limited, reducing the window of opportunity for an attacker.

## **Summary of Kerberos Benefits**
- **Reduced risk of Pass-The-Hash attacks**: No passwords or password hashes are stored in memory.
- **Stronger security for remote access**: Authentication must happen for each individual machine, limiting unauthorized access.
- **Time-limited tickets**: Attackers have a limited timeframe to exploit any stolen tickets.
- **Granular access control**: Tickets specify the exact machines and resources the user can access.

While Kerberos is not without its vulnerabilities, particularly in the case of **Pass-The-Ticket**, its benefits in terms of security, especially in modern environments, far outweigh older methods like NTLM.

# Why Kerberos?

### **What is Kerberos used for?**

The Kerberos protocol is widely adopted for its central role in providing **secure authentication** in a networked environment. Let's explore its key benefits:

## **1. Centralized Authentication**

One of the primary reasons for using Kerberos is to **centralize authentication**. This means that services don't need to store or manage the credentials of every individual user. Instead:

- **Single point of authentication**: Users authenticate once with a central entity, the **Key Distribution Center (KDC)**, which is responsible for maintaining an up-to-date list of all users.
- **Simplifies user management**: In environments where users are frequently updated (e.g., password changes, user additions, or deletions), having every service maintain the status of all users would be extremely complex and prone to errors.
- **Reduces redundancy**: Since only the KDC needs to manage user credentials, all other services can rely on it for authentication without needing to store passwords themselves.

### **Example**: 
When a user changes their password or a new user is added, the update only needs to occur in the KDC, simplifying the overall process for administrators.

## **2. Eliminating Password Transmission Over the Network**

Another major advantage of Kerberos is that it allows users to **authenticate without sending passwords over the network**. Instead of transmitting sensitive data like a password each time the user accesses a service, Kerberos uses **tickets**:

- **No password transmission**: When users authenticate, they receive a **Ticket Granting Ticket (TGT)**, which they can use to access resources without needing to send a password.
- **Improved security**: This helps protect against attacks where an attacker intercepts communications between the client and the server, such as **man-in-the-middle (MITM)** or **on-path attacks**. Since passwords are not sent over the network, they are less likely to be intercepted.

### **Example**: 
If an attacker were to intercept network traffic between a user and a service, they would not be able to capture the user's password because Kerberos uses encrypted tickets instead of plaintext passwords.

## **Summary of Kerberos Benefits**

- **Centralized authentication**: Simplifies user management and reduces the complexity of maintaining credentials across multiple services.
- **Improved security**: By eliminating the need to transmit passwords over the network, Kerberos helps mitigate risks from **man-in-the-middle** and **on-path attacks**.
- **Efficient and scalable**: Kerberos is highly efficient for environments where user information is regularly updated, reducing the risk of outdated user credentials.

Kerberos is a robust authentication protocol that enhances both security and administrative efficiency in large, complex network environments.

# High-Level Overview of Kerberos

Kerberos uses **secret keys** and a **ticketing mechanism** to authenticate users and grant them access to services. In an **Active Directory** environment, these secret keys are typically the **passwords** (or hashed versions of them) for different user accounts.

### **How a User Accesses a Service with Kerberos**

1. **Requesting the Ticket Granting Ticket (TGT)**  
   - The process starts when the user requests a ticket from the **Key Distribution Center (KDC)**, proving their identity (authentication).
   - The KDC issues a **Ticket Granting Ticket (TGT)**, which serves as the user's **identity card**.  
   - The **TGT** contains crucial information about the user, such as:
     - **Name**
     - **Date of account creation**
     - **Security information**
     - **Group memberships**
   - The **TGT** is usually valid for a limited period, typically a few hours.  
   - This **TGT** is then used for all further requests to the KDC.

2. **Requesting the Ticket Granting Service (TGS) Ticket**  
   - Once the user has their **TGT**, they will present it to the KDC every time they need to access a specific service.
   - The **KDC** verifies the **TGT**'s validity and checks that it has not been tampered with.
   - If everything is valid, the KDC issues a **Ticket Granting Service (TGS)** ticket, also known as a **Service Ticket (ST)**.  
   - The **TGS ticket** contains the user's information, which is a copy of the data from the **TGT**.

3. **Accessing the Service Using the TGS Ticket**  
   - Now that the user has a **TGS ticket**, they will present it to the service they want to access.
   - The service validates the **TGS ticket** and checks its validity.
   - If the ticket is valid, the service reads the user’s information in the ticket to determine if the user has the necessary permissions to access the requested service.
   - Ultimately, it is the **service** that checks whether the user is authorized to access its resources.

### **Summary of the Kerberos Process:**

1. **TGT Request**: The user authenticates to the KDC and receives a **Ticket Granting Ticket (TGT)**, which acts as the user’s identity card.
2. **TGS Ticket Request**: The user presents the **TGT** to the KDC when trying to access specific services. The KDC verifies the TGT and issues a **TGS ticket** (Service Ticket).
3. **Access the Service**: The user presents the **TGS ticket** to the service. The service validates the ticket and grants access based on the user's permissions.

The use of **tickets** ensures that the user’s credentials are not transmitted over the network, offering better security and reducing the risk of **man-in-the-middle** attacks.


