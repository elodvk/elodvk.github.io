---
title: "Passive Reconnaissance"
sidebar_position: 1
---

Passive reconnaissance is the art of gathering intelligence about a target from publicly available sources without directly engaging or alerting them. The goal is to build a detailed operational picture before launching any active scanning or exploitation.

---
## Location Information 🗺️

Understanding the physical layout of a target's facility is crucial for planning red team operations, from social engineering attempts to physical intrusion tests.

### 1. Satellite Images

High-resolution satellite imagery provides a bird's-eye view of the target facility, revealing critical details long before you set foot near the property.

* **Objective**: To map the perimeter, identify key infrastructure, and pinpoint potential points of entry or weakness.
* **Tools**: `Google Maps`, `Google Earth`, `Bing Maps`.
* **Information Gained**:
    * **Perimeter Security**: Location of fences, gates, and potential blind spots.
    * **Access Control**: Identify vehicle entry points, guard shacks, and employee/visitor parking lots.
    * **Surveillance**: Spotting visible security cameras on the building's exterior.
    * **Key Locations**: Pinpointing entrances, loading docks, break areas, and executive offices.

### 2. Drone Recon (The Passive Approach)

While flying your own drone is **active** reconnaissance, you can often find pre-existing drone footage that others have made public.

* **Objective**: To find high-quality, low-altitude aerial video or photos of the target.
* **Sources**: `YouTube`, `Vimeo`, stock footage websites, and social media posts from employees or visitors who may have flown a personal drone nearby.
* **Information Gained**:
    * **Roof Access**: Identifying HVAC units, hatches, and other potential entry points on the roof.
    * **Security Patrols**: Observing guard patterns or vehicle routes if captured in the footage.
    * **Line of Sight**: Understanding what is visible from different angles around the property.

### 3. Building Layout

You can often piece together a building's internal and external layout without ever going inside.

* **Objective**: To understand the flow of the building, locate sensitive areas, and identify security mechanisms.
* **Sources**:
    * **Public Records**: Searching for publicly filed building permits or architectural plans.
    * **Marketing Materials**: Company websites often have virtual tours, photo galleries, or videos that reveal the lobby, office spaces, and more.
    * **Employee Photos**: As detailed below, photos posted by employees can reveal immense detail about the interior.
* **Information Gained**:
    * **Access Control**: Location of **badge readers**, security desks, and keycard-protected doors.
    * **Employee congregation spots**: Identifying **break areas**, cafeterias, or smoking areas which are ideal for social engineering.
    * **Security Presence**: Pinpointing the location of internal security cameras and guard posts.
    * **Perimeter Details**: Getting a closer look at **fencing**, gates, and locks.

---
## Job Information 🧑‍💼

The employees of a company are often the weakest link. Gathering detailed information about them is essential for phishing, vishing, and impersonation attacks.

### 1. Employee Details

The goal is to build a comprehensive employee directory to map out the organizational structure.

* **Objective**: To identify key personnel, their roles, and contact information.
* **Sources**: `LinkedIn` (the primary source), the company's own "Team" or "About Us" pages, professional networking sites, and data from previous breaches.
* **Information Gained**:
    * **Names and Job Titles**: Identifying high-value targets like System Administrators, HR personnel, or C-level executives.
    * **Contact Info**: Finding corporate email addresses and sometimes phone numbers.
    * **Organizational Structure**: Determining who reports to whom (**managers**) to craft more believable phishing emails (e.g., an email that appears to come from a manager to their direct report).

### 2. Picture Analysis

Photos voluntarily posted by employees are a goldmine of intelligence.

* **Objective**: To extract sensitive information from images posted on public social media profiles or in news articles.
* **Sources**: `LinkedIn`, `Facebook`, `Instagram`, `Twitter`, company blogs, and press releases.
* **Information Gained**:
    * **Badge Photos**: A high-resolution profile picture can often reveal the entire layout and design of a company ID badge, making forgery much easier.
    * **Desk Photos**: An employee's picture of their desk can reveal the computer model, operating system, applications they use, sticky notes with passwords, and even their phone extension.
    * **Ambient Information**: Photos from inside the office can show the type of computers used, network ports, whiteboard notes, and internal posters or documents.
    * **EXIF Data**: The metadata embedded in an image file can sometimes contain GPS coordinates, revealing exactly where the photo was taken.