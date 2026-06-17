---
title: 'PurpleSec — Cybersecurity Research & Enterprise Defense'
description: 'Enterprise defense strategies, advanced Active Directory attack paths, Hack The Box walkthroughs, and cybersecurity research by Bilash J. Shahi (PurpleSec).'
template: home.html
hide:
  - navigation
  - toc
  - path
  - title
  - footer
---
<!-- ===== STATS SECTION ===== -->
<div class="ps-content-wrap" markdown>

<div class="ps-stats ps-reveal" id="ps-stats-section" markdown>

<div class="ps-stat-card ps-stagger-1" markdown>
<div class="ps-stat-number">15+</div>
<div class="ps-stat-label">AD Techniques</div>
</div>

<div class="ps-stat-card ps-stagger-2" markdown>
<div class="ps-stat-number">4</div>
<div class="ps-stat-label">Cert Tracks</div>
</div>

<div class="ps-stat-card ps-stagger-3" markdown>
<div class="ps-stat-number">PNPT</div>
<div class="ps-stat-label">Certified ✅</div>
</div>

<div class="ps-stat-card ps-stagger-4" markdown>
<div class="ps-stat-number">HTB</div>
<div class="ps-stat-label">Active Player</div>
</div>

</div>

<!-- ===== MAIN CONTENT SECTIONS ===== -->

<div class="ps-reveal" markdown>

## Knowledge Base & Security Research { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Deep-dive technical articles and operational methodologies organized for immediate reference.</p>

</div>

<div class="grid cards ps-reveal" markdown>

-   :lucide-monitor:{ .lg .middle } **Hack The Box Writeups**

    ---

    Comprehensive machine walkthroughs covering initial access, enumeration, custom exploitation, and privilege escalation vectors from Easy to Insane difficulty.

    [:octicons-arrow-right-24: Browse HTB Writeups](walkthroughs/index.md)

-   :lucide-network:{ .lg .middle } **Active Directory Attacks**

    ---

    In-depth analysis of Active Directory vulnerabilities, detailing attack paths like Kerberoasting, NTLM relaying, and DCSync for full domain compromise.

    [:octicons-arrow-right-24: Explore AD Techniques](writeups/active_directory/index.md)

-   :lucide-award:{ .lg .middle } **Certification Prep**

    ---

    Curated study guides, methodology notes, and exam experiences for industry-leading certifications including PNPT, OSCP, CPTS, and CISSP.

    [:octicons-arrow-right-24: View Cert Guides](certifications/index.md)

-   :lucide-pen-line:{ .lg .middle } **Blog & Insights**

    ---

    Thoughts on enterprise defense, threat hunting, infrastructure security, and the latest developments in the cybersecurity landscape.

    [:octicons-arrow-right-24: Read the Blog](blog/index.md)

</div>

<!-- ===== TERMINAL DASHBOARD (BLOG & QUOTES) ===== -->

<div class="ps-terminal-dashboard ps-reveal">
<!-- Left Terminal: Blog Feed -->
<div class="ps-dashboard-terminal">
<div class="ps-card-terminal-header">
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
</div>
<div class="ps-dashboard-terminal-content">
<div class="ps-term-cmd">[root@purplesec ~]# tail -f /var/log/latest.log</div>
{% set posts = get_blog_posts() %}
{% if posts %}
<div class="ps-term-feed">
{% for post in posts %}
<a href="blog/{{ post.url }}" class="ps-term-feed-item">
<span class="ps-term-feed-date">[{{ post.date.strftime('%b %d, %Y') }}]</span>
<span class="ps-term-feed-title">{{ post.title }}</span>
</a>
{% endfor %}
</div>
{% endif %}
<div class="ps-term-cursor">_</div>
</div>
</div>


</div>

<!-- ===== CERTIFICATION PROGRESS ===== -->

<div class="ps-reveal" markdown>

## Certification Journey { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Tracking my path through the industry's most recognized security certifications.</p>

</div>

<div class="ps-cert-grid" markdown>

<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-1" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/tcmsecurity.png" alt="TCM Security" style="max-height: 100%;"></div>
<div class="ps-cert-name">PNPT</div>
<div class="ps-cert-full">Practical Network Penetration Tester</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-2" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/anthropic.svg" alt="Anthropic" style="max-height: 100%;"></div>
<div class="ps-cert-name">Anthropic</div>
<div class="ps-cert-full">Claude Code in Action</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-3" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/securiti.svg" alt="Securiti" style="max-height: 100%;"></div>
<div class="ps-cert-name">Securiti</div>
<div class="ps-cert-full">AI Security & Governance</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-4" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/microsoft.png" alt="Microsoft" style="max-height: 100%;"></div>
<div class="ps-cert-name">AZ-104</div>
<div class="ps-cert-full">Azure Administrator Associate</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-1" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/microsoft.png" alt="Microsoft" style="max-height: 100%;"></div>
<div class="ps-cert-name">SC-300</div>
<div class="ps-cert-full">Identity and Access Administrator</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

</div>

<!-- ===== QUOTES SECTION ===== -->
<div class="ps-terminal-dashboard ps-reveal">
<!-- Right Terminal: Quote Carousel -->
<div class="ps-dashboard-terminal">
<div class="ps-card-terminal-header">
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
</div>
<div class="ps-dashboard-terminal-content ps-quote-terminal">
<div class="ps-quote ps-reveal-scale" id="ps-quote-carousel">
<div class="ps-quote-slides">
<div class="ps-quote-slide active" markdown>

> *"The quieter you become, the more you are able to hear."*

<div class="ps-quote-attr">— BackTrack Linux</div>

</div>
<div class="ps-quote-slide" markdown>

> *"Given enough eyeballs, all bugs are shallow."*

<div class="ps-quote-attr">— Linus Torvalds</div>

</div>
<div class="ps-quote-slide" markdown>

> *"Amateurs hack systems, professionals hack people."*

<div class="ps-quote-attr">— Bruce Schneier</div>

</div>
</div>

<div class="ps-quote-controls">
<button class="ps-quote-btn" id="ps-quote-prev" aria-label="Previous quote">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
</button>
<div class="ps-quote-indicators" id="ps-quote-dots">
<span class="ps-quote-dot active" data-index="0"></span>
<span class="ps-quote-dot" data-index="1"></span>
<span class="ps-quote-dot" data-index="2"></span>
</div>
<button class="ps-quote-btn" id="ps-quote-next" aria-label="Next quote">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
</button>
</div>
</div>
</div>
</div>
</div>

<!-- Attack matrix removed -->



</div>
