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
{% set posts = get_blog_posts() %}

<div class="ps-content-wrap" markdown>

<!-- ===== STATS ===== -->
<div class="ps-stats ps-reveal" id="ps-stats-section">
<div class="ps-stat-card ps-stagger-1">
<div class="ps-stat-number"><span data-count="15">0</span><span class="ps-stat-suffix">+</span></div>
<div class="ps-stat-label">HTB Machines Pwned</div>
</div>
<div class="ps-stat-card ps-stagger-2">
<div class="ps-stat-number"><span data-count="25">0</span><span class="ps-stat-suffix">+</span></div>
<div class="ps-stat-label">AD Attack Techniques</div>
</div>
<div class="ps-stat-card ps-stagger-3">
<div class="ps-stat-number"><span data-count="15">0</span><span class="ps-stat-suffix">+</span></div>
<div class="ps-stat-label">Research Articles</div>
</div>
<div class="ps-stat-card ps-stagger-4">
<div class="ps-stat-number"><span data-count="7">0</span><span class="ps-stat-suffix">+</span></div>
<div class="ps-stat-label">Years In The Field</div>
</div>
</div>

<!-- ===== OPERATIONAL FOCUS ===== -->
<div class="ps-reveal" markdown>

## Operational Focus { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Four disciplines, one mission — attack to understand, defend to endure.</p>

</div>

<div class="ps-fx-grid ps-reveal">
<a href="walkthroughs/" class="ps-fx-card">
<span class="ps-fx-index">01 / OFFENSE</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg></span>
<span class="ps-fx-title">Offensive Operations</span>
<span class="ps-fx-desc">Full-chain adversary emulation — recon, initial access, lateral movement, and privilege escalation modeled on real-world TTPs.</span>
<span class="ps-fx-arrow">Browse pwns →</span>
</a>
<a href="writeups/active_directory/" class="ps-fx-card">
<span class="ps-fx-index">02 / IDENTITY</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/></svg></span>
<span class="ps-fx-title">Active Directory</span>
<span class="ps-fx-desc">Kerberoasting, NTLM relay, ADCS abuse, delegation attacks, and DCSync — the domain-compromise paths that matter, end to end.</span>
<span class="ps-fx-arrow">Explore techniques →</span>
</a>
<a href="blog/" class="ps-fx-card">
<span class="ps-fx-index">03 / DEFENSE</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></span>
<span class="ps-fx-title">Defensive Engineering</span>
<span class="ps-fx-desc">Translating attacker tradecraft into detections, hardening baselines, and SIEM logic so blue teams catch it before the crown jewels.</span>
<span class="ps-fx-arrow">Read research →</span>
</a>
<a href="certifications/" class="ps-fx-card">
<span class="ps-fx-index">04 / CREDENTIALS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>
<span class="ps-fx-title">Certifications</span>
<span class="ps-fx-desc">Battle-tested study notes and honest exam debriefs for PNPT, OSCP, CPTS, and CISSP — what to study, and what actually shows up.</span>
<span class="ps-fx-arrow">View credentials →</span>
</a>
</div>

<!-- ===== FEATURED INTEL ===== -->
{% if posts %}
{% set feat = posts[0] %}
{% set img = feat.image %}
{% if img and not img.startswith('http') and not img.startswith('/') %}{% set img = '/' + img %}{% endif %}

<div class="ps-reveal" markdown>

## Featured Intel { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Freshly published from the research desk.</p>

</div>

<div class="ps-spotlight-wrap">
<a href="blog/{{ feat.url }}" class="ps-spotlight ps-reveal-scale">
<div class="ps-spotlight-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
<span class="ps-spotlight-bar-path">~/blog/{{ feat.url }}</span>
</div>
<div class="ps-spotlight-body">
{% if img %}<div class="ps-spotlight-media" style="background-image: url('{{ img }}');"></div>{% endif %}
<div class="ps-spotlight-content">
<span class="ps-featured-badge">⬡ Latest Drop</span>
<div class="ps-spotlight-title">{{ feat.title }}</div>
<div class="ps-spotlight-meta">
<span>📅 {{ feat.date_str }}</span>
<span>🕓 {{ feat.read_time }} min read</span>
{% if feat.tags %}<span>#{{ feat.tags[0] }}</span>{% endif %}
</div>
<div class="ps-spotlight-summary">{{ feat.summary }}</div>
<span class="ps-spotlight-cta">Read full analysis <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
</div>
</div>
</a>
</div>
{% endif %}

<!-- ===== LATEST DISPATCHES (terminal feed) ===== -->
{% if posts %}
<div class="ps-reveal" markdown>

## Latest Dispatches { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Every writeup and research note, newest first.</p>

</div>

<div class="ps-terminal-dashboard ps-reveal">
<div class="ps-dashboard-terminal">
<div class="ps-card-terminal-header">
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
<span class="ps-card-term-btn"></span>
</div>
<div class="ps-dashboard-terminal-content">
<div class="ps-term-cmd">[root@purplesec ~]# tail -f /var/log/latest.log</div>
<div class="ps-term-feed">
{% for post in posts %}<a href="blog/{{ post.url }}" class="ps-term-feed-item"><span class="ps-term-feed-date">[{{ post.date_obj.strftime('%b %d, %Y') }}]</span><span class="ps-term-feed-title">{{ post.title }}</span></a>{% endfor %}
</div>
<div class="ps-term-cursor">_</div>
</div>
</div>
</div>
{% endif %}

<!-- ===== CERTIFICATIONS ===== -->
<div class="ps-reveal" markdown>

## Certifications & Credentials { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Validation that the methodology holds up under pressure — from offensive certs to cloud and identity.</p>

</div>

<div class="ps-cert-grid">
<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-1">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/tcmsecurity.png" alt="TCM Security" style="max-height: 100%;"></div>
<div class="ps-cert-name">PNPT</div>
<div class="ps-cert-full">Practical Network Penetration Tester</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>
<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-2">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/anthropic.svg" alt="Anthropic" style="max-height: 100%;"></div>
<div class="ps-cert-name">Anthropic</div>
<div class="ps-cert-full">Claude Code in Action</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>
<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-3">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/securiti.svg" alt="Securiti" style="max-height: 100%;"></div>
<div class="ps-cert-name">Securiti</div>
<div class="ps-cert-full">AI Security & Governance</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>
<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-4">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/microsoft.png" alt="Microsoft" style="max-height: 100%;"></div>
<div class="ps-cert-name">AZ-104</div>
<div class="ps-cert-full">Azure Administrator Associate</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>
<div class="ps-cert-card ps-cert-card--certified ps-reveal ps-stagger-1">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/microsoft.png" alt="Microsoft" style="max-height: 100%;"></div>
<div class="ps-cert-name">SC-300</div>
<div class="ps-cert-full">Identity and Access Administrator</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>
<div class="ps-cert-card ps-cert-card--progress ps-reveal ps-stagger-2">
<div class="ps-cert-bar"><span class="ps-terminal-dot ps-terminal-dot--red"></span><span class="ps-terminal-dot ps-terminal-dot--yellow"></span><span class="ps-terminal-dot ps-terminal-dot--green"></span></div>
<div class="ps-cert-card-inner">
<div style="height: 2rem; display: flex; align-items: center; justify-content: center;"><img src="/assets/images/certs/offsec.svg" alt="OffSec" style="max-height: 100%;"></div>
<div class="ps-cert-name">OSCP</div>
<div class="ps-cert-full">Offensive Security Certified Professional</div>
<div class="ps-cert-status ps-cert-status--progress">⟳ In Progress</div>
</div>
</div>
</div>

<!-- ===== QUOTES ===== -->
<div class="ps-terminal-dashboard ps-reveal">
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
<div class="ps-quote-slide" markdown>

> *"There are two types of companies: those that have been hacked, and those that don't yet know they have been hacked."*

<div class="ps-quote-attr">— John Chambers</div>

</div>
<div class="ps-quote-slide" markdown>

> *"Offense informs defense. Defense informs offense."*

<div class="ps-quote-attr">— The Purple Team Creed</div>

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
<span class="ps-quote-dot" data-index="3"></span>
<span class="ps-quote-dot" data-index="4"></span>
</div>
<button class="ps-quote-btn" id="ps-quote-next" aria-label="Next quote">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
</button>
</div>
</div>
</div>
</div>
</div>

<!-- ===== CLOSING CTA ===== -->
<div class="ps-home-cta ps-reveal-scale" markdown>

### Let's talk security. { .ps-cta-title }

Building something, breaking something, or hardening something? I'm always up for a sharp conversation on offensive tradecraft, detection engineering, or where the industry is heading next.

<div class="ps-cta-actions">
<a href="contact/" class="ps-btn ps-btn-primary">Get in Touch</a>
<a href="https://www.linkedin.com/in/bilash-j-shahi" target="_blank" rel="noopener" class="ps-btn ps-btn-secondary">Connect on LinkedIn</a>
</div>

</div>

</div>
