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
