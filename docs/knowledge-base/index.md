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
<a href="reconnaissance/" class="ps-fx-card">
<span class="ps-fx-index">01 / RECON</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
<span class="ps-fx-title">Reconnaissance</span>
<span class="ps-fx-desc">Network footprinting, port scanning, OSINT, and web surface enumeration to map the target infrastructure.</span>
<span class="ps-fx-arrow">Start the recon →</span>
</a>

<a href="web-attacks/" class="ps-fx-card">
<span class="ps-fx-index">02 / WEB</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>
<span class="ps-fx-title">Web Attacks</span>
<span class="ps-fx-desc">File upload vulnerabilities, injection flaws, and deep dives into web application exploitation techniques.</span>
<span class="ps-fx-arrow">Exploit the web →</span>
</a>

<a href="credential-attacks/" class="ps-fx-card">
<span class="ps-fx-index">03 / CREDENTIALS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
<span class="ps-fx-title">Credential Attacks</span>
<span class="ps-fx-desc">Password cracking, credential hunting, Pass-the-Hash, Pass-the-Ticket, and dumping hashes from SAM/NTDS.</span>
<span class="ps-fx-arrow">Crack the hashes →</span>
</a>

<a href="active_directory/" class="ps-fx-card">
<span class="ps-fx-index">04 / ACTIVE DIRECTORY</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg></span>
<span class="ps-fx-title">Active Directory</span>
<span class="ps-fx-desc">The complete AD pentesting playbook: LLMNR poisoning, Kerberoasting, ADCS escalation, and Golden Tickets.</span>
<span class="ps-fx-arrow">Own the domain →</span>
</a>

<a href="exploitation-frameworks/" class="ps-fx-card">
<span class="ps-fx-index">05 / FRAMEWORKS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
<span class="ps-fx-title">Exploitation Frameworks</span>
<span class="ps-fx-desc">Mastering Metasploit, managing payloads with MSFVenom, handling sessions, and writing custom modules.</span>
<span class="ps-fx-arrow">Load the modules →</span>
</a>

<a href="tool-guides/" class="ps-fx-card">
<span class="ps-fx-index">06 / TOOLS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>
<span class="ps-fx-title">Tool Guides</span>
<span class="ps-fx-desc">Deep dives into pivoting, tunneling, and utility tools like Ligolo-ng, Proxychains, and SSH forwarding.</span>
<span class="ps-fx-arrow">Master the tools →</span>
</a>
</div>

!!! tip "How every writeup is structured"

    Each playbook follows a consistent flow so you always know where to look:

    1. **Reconnaissance** — Port scanning, service and protocol enumeration
    2. **Foothold** — Initial access and exploitation
    3. **Privilege Escalation** — Escalating toward Domain Admin
    4. **Key Takeaways** — Detection, mitigation, and lessons learned
