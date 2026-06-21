# PurpleSec — Cybersecurity Research & Enterprise Defense

[![Documentation](https://github.com/elodvk/elodvk.github.io/actions/workflows/docs.yml/badge.svg)](https://github.com/elodvk/elodvk.github.io/actions/workflows/docs.yml)

**PurpleSec** is the official portfolio, research blog, and operational knowledge base of **Bilash J. Shahi**, a Senior Cybersecurity Engineer with 10+ years of experience across enterprise defense, cloud infrastructure, and offensive security research. 

This repository houses the source code and Markdown content for the live site at: **[https://purplesec.org/](https://purplesec.org/)**

## 🎯 Content Overview

*   **Cyber Range Walkthroughs:** Highly detailed, professional write-ups for Hack The Box (HTB) machines and Pro Labs. Includes advanced exploitation chains and custom operational tools.
*   **Active Directory Tradecraft:** Guides detailing ADCS abuse, Kerberoasting, NTLM relaying, DCSync, and other domain-compromise paths.
*   **Security Research (Blog):** Deep dives into emerging zero-days (e.g., the Nightmare Eclipse campaign), detection engineering, and enterprise hardening.
*   **Certifications:** Debriefs and study strategies for PNPT, OSCP, CPTS, and CISSP.

## ✨ Site Features

The PurpleSec site is built on [Zensical](https://github.com/elodvk/zensical) (a specialized MkDocs theme framework) and features a heavily customized, interactive frontend:

*   **Text-to-Speech (TTS) Engine:** A native Web Speech API integration that allows users to listen to blog posts and walkthroughs with intelligent filtering of raw code and terminal syntax.
*   **Password-Protected Walkthroughs:** Active HTB machines and sensitive documents are AES-encrypted at build time using a custom Python script (`encrypt_pages.py`), requiring a dynamic flag to unlock.
*   **Interactive Hacker Aesthetic:** Features a custom minimal Material-v3 UI with sleek dark mode, dynamic glitch effects, glowing cards, and an interactive landing page terminal.
*   **Dynamic Assets:** Automatic Mermaid.js diagram zooming, custom browser/terminal window frames, and automatic RSS feed generation.

## 🛠️ Local Development Setup

To run this site locally, you need Python 3 installed.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/elodvk/elodvk.github.io.git
    cd elodvk.github.io
    ```

2.  **Set up a virtual environment**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
    ```

3.  **Install dependencies**
    ```bash
    pip install zensical
    # Additional requirements if modifying Python scripts:
    pip install pycryptodome beautifulsoup4 lxml
    ```

4.  **Serve the site locally**
    ```bash
    zensical serve
    ```
    The site will be available with live-reloading at `http://127.0.0.1:8000`.

5.  **Build the site**
    ```bash
    zensical build --clean
    ```

## 🚀 Deployment

The site employs a continuous deployment (CD) pipeline. On every push to the `main` branch, a GitHub Actions workflow (`.github/workflows/docs.yml`) is triggered to securely build the static files, run the encryption post-processor, and deploy the final build to GitHub Pages.

## ⚖️ Copyright & License

**© 2026 Bilash J. Shahi (PurpleSec). All Rights Reserved.**

This repository and all of its contents—including but not limited to the source code, custom Python scripts, Markdown files, UI design, and aesthetic theme—are the proprietary property of Bilash J. Shahi. 

**This project is NOT open-source.** 

You may **not** copy, clone, distribute, reproduce, or create derivative works from this repository without explicit, prior written permission. This explicitly includes copying the site's design, theme, or custom features for your own use. Please see the `LICENSE` file for full details.

---
*Defense informs offense. Offense informs defense.*
