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

<div class="ps-content-wrap">

<!-- ===== QUICK NAV CARDS ===== -->
<div class="ps-mh-grid ps-mh-grid--4 ps-mh-hero-cards ps-reveal">
  <a href="walkthroughs/" class="ps-mh-card">
    <span class="ps-mh-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg></span>
    <span class="ps-mh-card-title">Offensive Ops</span>
    <span class="ps-mh-card-desc">Full-chain adversary emulation — recon to privilege escalation, modeled on real-world TTPs.</span>
    <span class="ps-mh-card-link">Browse pwns →</span>
  </a>
  <a href="writeups/active_directory/" class="ps-mh-card">
    <span class="ps-mh-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/></svg></span>
    <span class="ps-mh-card-title">Active Directory</span>
    <span class="ps-mh-card-desc">Kerberoasting, NTLM relay, ADCS abuse, delegation, and DCSync — the domain-compromise paths that matter.</span>
    <span class="ps-mh-card-link">Explore techniques →</span>
  </a>
  <a href="blog/" class="ps-mh-card">
    <span class="ps-mh-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></span>
    <span class="ps-mh-card-title">Defense & Research</span>
    <span class="ps-mh-card-desc">Attacker tradecraft turned into detections, hardening baselines, and SIEM logic for blue teams.</span>
    <span class="ps-mh-card-link">Read the blog →</span>
  </a>
  <a href="certifications/" class="ps-mh-card">
    <span class="ps-mh-card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></span>
    <span class="ps-mh-card-title">Certifications</span>
    <span class="ps-mh-card-desc">Honest exam debriefs and study notes for PNPT, OSCP, CPTS, and CISSP — what actually shows up.</span>
    <span class="ps-mh-card-link">View credentials →</span>
  </a>
</div>

<!-- ===== STATS ===== -->
<div class="ps-mh-stats ps-reveal" id="ps-stats-section">
  <div class="ps-mh-stat">
    <div class="ps-mh-stat-num"><span data-count="15">0</span>+</div>
    <div class="ps-mh-stat-label">HTB Machines Pwned</div>
  </div>
  <div class="ps-mh-stat">
    <div class="ps-mh-stat-num"><span data-count="25">0</span>+</div>
    <div class="ps-mh-stat-label">AD Attack Techniques</div>
  </div>
  <div class="ps-mh-stat">
    <div class="ps-mh-stat-num"><span data-count="15">0</span>+</div>
    <div class="ps-mh-stat-label">Research Articles</div>
  </div>
  <div class="ps-mh-stat">
    <div class="ps-mh-stat-num"><span data-count="10">0</span>+</div>
    <div class="ps-mh-stat-label">Years In The Field</div>
  </div>
</div>

<!-- ===== FEATURED ===== -->
{% if posts %}
{% set feat = posts[0] %}
{% set img = feat.image %}
{% if img and not img.startswith('http') and not img.startswith('/') %}{% set img = '/' + img %}{% endif %}
<div class="ps-mh-head ps-reveal">
  <span class="ps-mh-head-eyebrow">Latest Drop</span>
  <h2>Featured Intel</h2>
  <p>Freshly published from the research desk.</p>
</div>
<a href="blog/{{ feat.url }}" class="ps-mh-feat ps-reveal-scale">
  {% if img %}<div class="ps-mh-feat-media" style="background-image: url('{{ img }}');"></div>{% endif %}
  <div class="ps-mh-feat-body">
    <span class="ps-mh-feat-badge">Latest Post</span>
    <div class="ps-mh-feat-title">{{ feat.title }}</div>
    <div class="ps-mh-feat-meta">
      <span>{{ feat.date_str }}</span>
      <span>{{ feat.read_time }} min read</span>
      {% if feat.tags %}<span>#{{ feat.tags[0] }}</span>{% endif %}
    </div>
    <div class="ps-mh-feat-summary">{{ feat.summary }}</div>
    <span class="ps-mh-feat-link">Read full analysis →</span>
  </div>
</a>
{% endif %}

<!-- ===== RECENT POSTS ===== -->
{% if posts %}
<div class="ps-mh-head ps-reveal">
  <span class="ps-mh-head-eyebrow">From the blog</span>
  <h2>Recent Posts</h2>
  <p>Writeups and research notes, newest first.</p>
</div>
<div class="ps-mh-recent ps-reveal">
  {% for post in posts[:7] %}<a href="blog/{{ post.url }}" class="ps-mh-recent-item"><span class="ps-mh-recent-date">{{ post.date_obj.strftime('%b %d, %Y') }}</span><span class="ps-mh-recent-title">{{ post.title }}</span></a>{% endfor %}
  <div class="ps-mh-recent-foot"><a href="blog/">View all posts →</a></div>
</div>
{% endif %}

<!-- ===== CERTIFICATIONS ===== -->
<div class="ps-mh-head ps-reveal">
  <span class="ps-mh-head-eyebrow">Credentials</span>
  <h2>Certifications</h2>
  <p>Validation that the methodology holds up under pressure.</p>
</div>
<div class="ps-mh-grid ps-mh-certs ps-reveal">
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/tcmsecurity.png" alt="TCM Security"></div>
    <div class="ps-mh-cert-name">PNPT</div>
    <div class="ps-mh-cert-full">Practical Network Penetration Tester</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--ok">Certified</div>
  </div>
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/anthropic.svg" alt="Anthropic"></div>
    <div class="ps-mh-cert-name">Anthropic</div>
    <div class="ps-mh-cert-full">Claude Code in Action</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--ok">Certified</div>
  </div>
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/securiti.svg" alt="Securiti"></div>
    <div class="ps-mh-cert-name">Securiti</div>
    <div class="ps-mh-cert-full">AI Security & Governance</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--ok">Certified</div>
  </div>
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/microsoft.png" alt="Microsoft"></div>
    <div class="ps-mh-cert-name">AZ-104</div>
    <div class="ps-mh-cert-full">Azure Administrator Associate</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--ok">Certified</div>
  </div>
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/microsoft.png" alt="Microsoft"></div>
    <div class="ps-mh-cert-name">SC-300</div>
    <div class="ps-mh-cert-full">Identity and Access Administrator</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--ok">Certified</div>
  </div>
  <div class="ps-mh-cert">
    <div class="ps-mh-cert-logo"><img src="/assets/images/certs/offsec.svg" alt="OffSec"></div>
    <div class="ps-mh-cert-name">OSCP</div>
    <div class="ps-mh-cert-full">Offensive Security Certified Professional</div>
    <div class="ps-mh-cert-status ps-mh-cert-status--wip">In Progress</div>
  </div>
</div>

<!-- ===== QUOTE ===== -->
<div class="ps-mh-head ps-reveal">
  <span class="ps-mh-head-eyebrow">Ethos</span>
  <h2>Words to Hack By</h2>
</div>
<div class="ps-mh-quote ps-reveal-scale" id="ps-quote-carousel">
  <div class="ps-quote-slides">
    <div class="ps-quote-slide active"><blockquote>"The quieter you become, the more you are able to hear."</blockquote><div class="ps-quote-attr">— BackTrack Linux</div></div>
    <div class="ps-quote-slide"><blockquote>"Given enough eyeballs, all bugs are shallow."</blockquote><div class="ps-quote-attr">— Linus Torvalds</div></div>
    <div class="ps-quote-slide"><blockquote>"Amateurs hack systems, professionals hack people."</blockquote><div class="ps-quote-attr">— Bruce Schneier</div></div>
    <div class="ps-quote-slide"><blockquote>"There are two types of companies: those that have been hacked, and those that don't yet know they have been hacked."</blockquote><div class="ps-quote-attr">— John Chambers</div></div>
    <div class="ps-quote-slide"><blockquote>"Offense informs defense. Defense informs offense."</blockquote><div class="ps-quote-attr">— The Purple Team Creed</div></div>
  </div>
  <div class="ps-quote-controls">
    <button class="ps-quote-btn" id="ps-quote-prev" aria-label="Previous quote"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="ps-quote-indicators" id="ps-quote-dots">
      <span class="ps-quote-dot active" data-index="0"></span>
      <span class="ps-quote-dot" data-index="1"></span>
      <span class="ps-quote-dot" data-index="2"></span>
      <span class="ps-quote-dot" data-index="3"></span>
      <span class="ps-quote-dot" data-index="4"></span>
    </div>
    <button class="ps-quote-btn" id="ps-quote-next" aria-label="Next quote"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
  </div>
</div>

<!-- ===== CLOSING CTA ===== -->
<div class="ps-mh-cta ps-reveal-scale">
  <h3>Let's talk security.</h3>
  <p>Building something, breaking something, or hardening something? I'm always up for a sharp conversation on offensive tradecraft, detection engineering, or where the industry is heading next.</p>
  <div class="ps-mh-cta-actions">
    <a href="contact/" class="md-button md-button--primary">Get in Touch</a>
    <a href="https://www.linkedin.com/in/bilash-j-shahi" target="_blank" rel="noopener" class="md-button">Connect on LinkedIn</a>
  </div>
</div>

</div>
