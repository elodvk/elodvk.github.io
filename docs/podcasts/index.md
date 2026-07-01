---
title: 'PurpleSec Podcasts'
description: 'Listen to deep dives into zero-days, enterprise defense strategies, and threat intelligence.'
hide:
  - navigation
  - toc
  - footer
---
{% set posts = get_podcast_posts() %}

<div class="ps-spotify-container">
<!-- Hero Section -->
<div class="ps-spotify-hero">
<div class="ps-spotify-hero-cover">
<img src="/assets/images/podcast_cover.png" alt="PurpleSec Podcasts">
</div>
<div class="ps-spotify-hero-info">
<span class="ps-spotify-hero-type">Podcast</span>
<h1 class="ps-spotify-hero-title">PurpleSec Deep Dives</h1>
<p class="ps-spotify-hero-desc">Deep dives into zero-days, enterprise defense strategies, and threat intelligence — straight from the lab.</p>
<div class="ps-spotify-hero-meta">
<span class="ps-spotify-author">PurpleSec</span>
<span class="ps-spotify-count">• {{ posts|length }} episodes</span>
</div>
</div>
</div>

<div class="ps-spotify-actions">
{% if posts %}
<button class="ps-spotify-play-all" onclick="window.location.href='{{ posts[0].url }}'">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
</button>
{% endif %}
</div>

<!-- Tracklist -->
<div class="ps-spotify-tracklist">
<div class="ps-spotify-tracklist-header">
<div class="ps-col-num">#</div>
<div class="ps-col-title">Title</div>
<div class="ps-col-date">Date Added</div>
<div class="ps-col-duration"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
</div>

<div class="ps-spotify-tracks">
{% for post in posts %}
<a href="{{ post.url }}" class="ps-spotify-track">
<div class="ps-col-num">
<span class="ps-track-num">{{ loop.index }}</span>
<svg class="ps-track-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
</div>
<div class="ps-col-title">
<div class="ps-track-name">{{ post.title }}</div>
<div class="ps-track-desc">{{ post.summary }}</div>
</div>
<div class="ps-col-date">{{ post.date_str }}</div>
<div class="ps-col-duration">{{ post.duration_str }}</div>
</a>
{% else %}
<div style="padding: 2rem; color: var(--md-default-fg-color--light);">No podcast episodes found.</div>
{% endfor %}
</div>
</div>
</div>
