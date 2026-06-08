# PurpleSec

[![Documentation](https://github.com/elodvk/elodvk.github.io/actions/workflows/docs.yml/badge.svg)](https://github.com/elodvk/elodvk.github.io/actions/workflows/docs.yml)

**PurpleSec** is a platform for offensive and defensive cybersecurity writeups, Hack The Box walkthroughs, certification prep (OSCP/CPTS/PNPT/CISSP), and a security blog by Bilash J. Shahi.

Live Site: [https://purplesec.org/](https://purplesec.org/)

## Content Overview
- **Writeups**: Hack The Box, Active Directory, Initial Attack Vectors, Post-Compromise Enumeration & Attacks, and Post Domain Compromise.
- **Certifications**: Guides and prep for OSCP, CPTS, PNPT, and CISSP.
- **Blog**: Security-related posts and insights.

## Local Development Setup

To run this site locally, ensure you have Python 3 installed.

1. **Clone the repository**
   ```bash
   git clone https://github.com/elodvk/elodvk.github.io.git
   cd elodvk.github.io
   ```

2. **Set up a virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install zensical
   ```

4. **Serve the site locally**
   ```bash
   zensical serve
   ```
   The site will be available locally (usually at `http://127.0.0.1:8000`).

5. **Build the site**
   ```bash
   zensical build --clean
   ```

## Deployment

This site is automatically built and deployed to GitHub Pages via GitHub Actions (`.github/workflows/docs.yml`) on every push to the `main` or `master` branch.
