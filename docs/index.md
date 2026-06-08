---
title: PurpleSec — Cybersecurity Writeups & Documentation
description: Offensive and defensive security writeups, Hack The Box walkthroughs, and certification preparation guides by Bilash J. Shahi.
template: home.html
hide:
  - navigation
  - toc
  - path
  - title
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

## What You'll Find Here { .ps-section-title }

<div class="ps-section-divider"></div>

<p class="ps-section-subtitle">Deep-dive security content organized for both learning and quick reference.</p>

</div>

<div class="grid cards ps-reveal" markdown>

-   :lucide-monitor:{ .lg .middle } **Hack The Box Writeups**

    ---

    Step-by-step machine walkthroughs covering enumeration, exploitation, and privilege escalation from Easy to Insane difficulty.

    [:octicons-arrow-right-24: Browse HTB Writeups](writeups/htb/index.md)

-   :lucide-network:{ .lg .middle } **Active Directory Attacks**

    ---

    Complete AD attack paths — from LLMNR poisoning and Kerberoasting to Golden Ticket attacks and full domain compromise.

    [:octicons-arrow-right-24: Explore AD Techniques](writeups/active_directory/index.md)

-   :lucide-award:{ .lg .middle } **Certification Prep**

    ---

    Study notes, resources, and experience reports for PNPT, OSCP, CPTS, and CISSP certifications.

    [:octicons-arrow-right-24: View Cert Guides](certifications/index.md)

-   :lucide-pen-line:{ .lg .middle } **Blog & Insights**

    ---

    Thoughts on cybersecurity, tool reviews, exam experiences, and updates on my learning journey.

    [:octicons-arrow-right-24: Read the Blog](blog/index.md)

</div>

<!-- ===== FEATURED POST ===== -->

<div class="ps-reveal" markdown>

## Latest from the Blog { .ps-section-title }

<div class="ps-section-divider"></div>

</div>

{% set posts = get_blog_posts() %}
{% if posts %}
<div class="ps-blog-grid">
{% for post in posts[:3] %}
<a href="blog/{{ post.url }}" class="ps-blog-card ps-reveal ps-stagger-{{ loop.index }}">
<div class="ps-card-terminal-header">
  <span class="ps-card-term-btn"></span>
  <span class="ps-card-term-btn"></span>
  <span class="ps-card-term-btn"></span>
</div>
<div class="ps-blog-card-content">
<div class="ps-blog-card-title">{{ post.title }}</div>
<div class="ps-blog-card-summary">{{ post.summary }}</div>
<div class="ps-blog-card-footer">
<div class="ps-blog-card-author">
{% set author = post.authors[0] if post.authors else none %}
{% if author %}
{% if author.picture %}
<img src="{{ author.picture }}" alt="{{ author.name | default('Author') }}">
{% else %}
<div class="ps-blog-card-author-initial">{{ (author.name | default('A'))[0] }}</div>
{% endif %}
<div class="ps-blog-card-author-info">
<span class="ps-blog-card-author-name">{{ author.name | default('Author') }}</span>
<span class="ps-blog-card-date">{{ post.date_str }}</span>
</div>
{% else %}
<div class="ps-blog-card-author-info">
<span class="ps-blog-card-date">{{ post.date_str }}</span>
</div>
{% endif %}
</div>
<div class="ps-blog-card-read-more">
Read <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
</div>
</div>
</div>
</a>
{% endfor %}
</div>
<div style="text-align: center; margin-top: 2rem;" class="ps-reveal">
<a href="blog/" class="md-button md-button--primary">View All Posts</a>
</div>
{% endif %}

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
<div style="font-size: 2rem;">🛡️</div>
<div class="ps-cert-name">PNPT</div>
<div class="ps-cert-full">Practical Network Penetration Tester</div>
<div class="ps-cert-status ps-cert-status--certified">✅ Certified</div>
</div>
</div>

<div class="ps-cert-card ps-reveal ps-stagger-2" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="font-size: 2rem;">⚔️</div>
<div class="ps-cert-name">OSCP</div>
<div class="ps-cert-full">Offensive Security Certified Professional</div>
<div class="ps-cert-status ps-cert-status--progress">🔄 In Progress</div>
</div>
</div>

<div class="ps-cert-card ps-reveal ps-stagger-3" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="font-size: 2rem;">🎯</div>
<div class="ps-cert-name">CPTS</div>
<div class="ps-cert-full">Certified Penetration Testing Specialist</div>
<div class="ps-cert-status ps-cert-status--progress">🔄 In Progress</div>
</div>
</div>

<div class="ps-cert-card ps-reveal ps-stagger-4" markdown>
<div class="ps-cert-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
</div>
<div class="ps-cert-card-inner" markdown>
<div style="font-size: 2rem;">📖</div>
<div class="ps-cert-name">CISSP</div>
<div class="ps-cert-full">Certified Information Systems Security Professional</div>
<div class="ps-cert-status ps-cert-status--preparing">📚 Preparing</div>
</div>
</div>

</div>

<!-- Attack matrix removed -->

<!-- ===== QUOTE SECTION ===== -->

</div>

<div class="ps-quote ps-reveal-scale" markdown>

> *"The quieter you become, the more you are able to hear."*

<div class="ps-quote-attr">— BackTrack Linux</div>

</div>

</div>
