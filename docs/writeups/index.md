---
icon: lucide/book-open
title: 'Knowledge Base'
description: 'Security playbooks, attack methodologies, and technical documentation for Active Directory and enterprise penetration testing.'
hide:
  - toc
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Knowledge Base</h1>
<p class="ps-blog-masthead-sub">Battle-tested attack playbooks and methodologies — the offensive techniques that carry an engagement from the first packet to full domain dominance.</p>
</div>

<div class="ps-fx-grid ps-reveal">
<a href="active_directory/" class="ps-fx-card">
<span class="ps-fx-index">00 / PRIMER</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg></span>
<span class="ps-fx-title">Active Directory Primer</span>
<span class="ps-fx-desc">Start here — what AD pentesting is, why it matters, the lab setup, and the core tooling you'll lean on across every phase.</span>
<span class="ps-fx-arrow">Read the intro →</span>
</a>
<a href="active_directory/Initial%20Attack%20Vectors/llmnr-poisioning/" class="ps-fx-card">
<span class="ps-fx-index">01 / FOOTHOLD</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M13 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M5 12h9M9 8l-4 4 4 4"/></svg></span>
<span class="ps-fx-title">Initial Attack Vectors</span>
<span class="ps-fx-desc">LLMNR poisoning, SMB relay, and mitm6 — capturing credentials and relaying authentication to land that first foothold.</span>
<span class="ps-fx-arrow">Get the foothold →</span>
</a>
<a href="active_directory/Post-Compromise%20Enumeration/bloodhound/" class="ps-fx-card">
<span class="ps-fx-index">02 / RECON</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
<span class="ps-fx-title">Post-Compromise Enumeration</span>
<span class="ps-fx-desc">Map the domain with BloodHound, ldapdomaindump, and PingCastle — surfacing the shortest path to Domain Admin.</span>
<span class="ps-fx-arrow">Map the domain →</span>
</a>
<a href="active_directory/Post%20Compromise%20Attacks/kerberoasting/" class="ps-fx-card">
<span class="ps-fx-index">03 / ESCALATE</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg></span>
<span class="ps-fx-title">Post-Compromise Attacks</span>
<span class="ps-fx-desc">Kerberoasting, hash dumping &amp; cracking, token impersonation, GPP, and Mimikatz — turning a foothold into privilege.</span>
<span class="ps-fx-arrow">Escalate access →</span>
</a>
<a href="active_directory/adcs_attacks/ad-adcs-esc/" class="ps-fx-card">
<span class="ps-fx-index">04 / CERTIFICATES</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>
<span class="ps-fx-title">ADCS Attacks (ESC1–ESC15)</span>
<span class="ps-fx-desc">The complete AD Certificate Services abuse catalogue — every ESC technique plus the Golden Certificate, broken down.</span>
<span class="ps-fx-arrow">Abuse the PKI →</span>
</a>
<a href="active_directory/Post%20Domain%20Compromise/golden-ticket/" class="ps-fx-card">
<span class="ps-fx-index">05 / DOMINANCE</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7z"/><path d="M5 20h14"/></svg></span>
<span class="ps-fx-title">Domain Dominance</span>
<span class="ps-fx-desc">Dumping NTDS.dit and forging Golden Tickets — establishing total, persistent control over the domain.</span>
<span class="ps-fx-arrow">Own the domain →</span>
</a>
<a href="web_vulnerabilities/file_upload/" class="ps-fx-card">
<span class="ps-fx-index">06 / WEB EXPLOITS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></span>
<span class="ps-fx-title">Web Vulnerabilities</span>
<span class="ps-fx-desc">Deep dives into web application attack vectors, including File Upload abuse, Filter bypasses, and Web Fuzzing with Ffuf.</span>
<span class="ps-fx-arrow">Explore web attacks →</span>
</a>
<a href="methodology/practice-machines/" class="ps-fx-card">
<span class="ps-fx-index">07 / ROADMAPS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></span>
<span class="ps-fx-title">Methodology &amp; Practice</span>
<span class="ps-fx-desc">A comprehensive list of practice machines to hone your skills for certifications and real-world engagements.</span>
<span class="ps-fx-arrow">View the roadmap →</span>
</a>
</div>

!!! tip "How every writeup is structured"

    Each playbook follows a consistent flow so you always know where to look:

    1. **Reconnaissance** — Port scanning, service and protocol enumeration
    2. **Foothold** — Initial access and exploitation
    3. **Privilege Escalation** — Escalating toward Domain Admin
    4. **Key Takeaways** — Detection, mitigation, and lessons learned
