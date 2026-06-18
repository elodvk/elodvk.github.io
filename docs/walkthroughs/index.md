---
icon: lucide/monitor
title: 'Pwned Machines'
description: 'Detailed walkthroughs of Hack The Box machines.'
hide:
  - navigation
  - toc
---
{% set posts = get_walkthroughs() %}

<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Pwned Machines</h1>
<p class="ps-blog-masthead-sub">Full attack chains on retired Hack The Box machines — enumeration to root, every step documented.</p>
</div>

!!! info "Disclaimer"

    Writeups are only published for **retired machines** in accordance with Hack The Box's rules. No active machine solutions are shared here.

{% if posts %}
{% set feat = posts[0] %}
{% set img = feat.image %}
{% if img and not img.startswith('http') and not img.startswith('/') %}{% set img = '/walkthroughs/' + img %}{% endif %}

<div class="ps-spotlight-wrap">
<a href="/{{ feat.url }}" class="ps-spotlight ps-reveal-scale">
<div class="ps-spotlight-bar">
<span class="ps-terminal-dot ps-terminal-dot--red"></span>
<span class="ps-terminal-dot ps-terminal-dot--yellow"></span>
<span class="ps-terminal-dot ps-terminal-dot--green"></span>
<span class="ps-spotlight-bar-path">~/{{ feat.url }}</span>
</div>
<div class="ps-spotlight-body">
{% if img %}<div class="ps-spotlight-media" style="background-image: url('{{ img }}');"></div>{% endif %}
<div class="ps-spotlight-content">
<span class="ps-featured-badge">⬡ Latest Pwn</span>
<div class="ps-spotlight-title">{{ feat.title }}</div>
<div class="ps-spotlight-meta">
<span>📅 {{ feat.date_str }}</span>
<span>🖥️ {{ feat.os }}</span>
<span class="ps-diff--{{ feat.difficulty | lower }}">🔥 {{ feat.difficulty }}</span>
</div>
<div class="ps-spotlight-summary">{{ feat.summary }}</div>
<span class="ps-spotlight-cta">Read the writeup <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
</div>
</div>
</a>
</div>

{% set os_set = [] %}
{% set diff_set = [] %}
{% for post in posts %}
  {% if post.os and post.os != 'Unknown' and post.os not in os_set %}{% set _ = os_set.append(post.os) %}{% endif %}
  {% if post.difficulty and post.difficulty != 'Unknown' and post.difficulty not in diff_set %}{% set _ = diff_set.append(post.difficulty) %}{% endif %}
{% endfor %}
{% set diff_order = ['Easy', 'Medium', 'Hard', 'Insane'] %}

<div class="ps-blog-toolbar">
<span class="ps-blog-toolbar-label">// filter targets</span>
<div class="ps-tag-filter-bar" id="ps-tag-filter-bar">
<button class="ps-tag-filter ps-tag-active" data-tag="all">All</button>
{% for os in os_set %}
<button class="ps-tag-filter" data-tag="{{ os }}">{{ os }}</button>
{% endfor %}
{% for d in diff_order %}{% if d in diff_set %}
<button class="ps-tag-filter ps-diff-filter ps-diff--{{ d | lower }}" data-tag="{{ d }}">{{ d }}</button>
{% endif %}{% endfor %}
</div>
</div>

<div class="ps-blog-grid" id="ps-blog-grid">
{% for post in posts[1:] %}
{% set cimg = post.image %}
{% if cimg and not cimg.startswith('http') and not cimg.startswith('/') %}{% set cimg = '/walkthroughs/' + cimg %}{% endif %}
<a href="/{{ post.url }}" class="ps-blog-card {% if loop.index0 >= 8 %}is-hidden{% endif %}" data-tags="{{ post.os }},{{ post.difficulty }}{% if post.tags %},{{ post.tags | join(',') }}{% endif %}">
<div class="ps-blog-card-media{% if not cimg %} ps-blog-card-media--fallback{% endif %}"{% if cimg %} style="background-image: url('{{ cimg }}');"{% endif %}>
{% if post.os and post.os != 'Unknown' %}<span class="ps-blog-card-cat">🖥️ {{ post.os }}</span>{% endif %}
<span class="ps-blog-card-readtime ps-diff--{{ post.difficulty | lower }}">🔥 {{ post.difficulty }}</span>
</div>
<div class="ps-blog-card-content">
<div class="ps-blog-card-title">{{ post.title }}</div>
<div class="ps-blog-card-summary">{{ post.summary }}</div>
<div class="ps-blog-card-footer">
<div class="ps-blog-card-author">
{% set author = post.authors[0] if post.authors else none %}
{% if author and author.picture %}<img src="{{ author.picture }}" alt="{{ author.name | default('Author') }}">{% elif author %}<div class="ps-blog-card-author-initial">{{ (author.name | default('A'))[0] }}</div>{% endif %}
<div class="ps-blog-card-author-info">
{% if author %}<span class="ps-blog-card-author-name">{{ author.name | default('Author') }}</span>{% endif %}
<span class="ps-blog-card-date">{{ post.date_str }}</span>
</div>
</div>
<div class="ps-blog-card-read-more">Read <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
</div>
</div>
</a>
{% endfor %}
</div>
<div class="ps-blog-empty" id="ps-blog-empty" style="display:none;">
<span class="ps-blog-empty-cmd">[root@purplesec ~]# nmap -sV ./targets/ | grep "open"</span>
<span class="ps-blog-empty-msg">No machines found matching this filter.</span>
</div>
{% if posts | length > 9 %}
<div class="ps-blog-load-more-container" style="text-align: center; margin-top: 2.5rem;">
<button id="ps-load-more-btn" class="md-button md-button--primary">Load More Machines</button>
</div>
{% endif %}
{% else %}
*No machines published yet.*
{% endif %}

<div class="ps-section-divider" style="margin: 3.5rem auto 2rem;"></div>

{% set archive = {} %}
{% for post in posts %}
  {% if post.year not in archive %}
    {% set _ = archive.update({post.year: []}) %}
  {% endif %}
  {% set _ = archive[post.year].append(post) %}
{% endfor %}

<div class="ps-terminal-dashboard ps-reveal">
  <div class="ps-dashboard-terminal">
    <div class="ps-card-terminal-header">
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
    </div>
    <div class="ps-dashboard-terminal-content">
      <div class="ps-term-cmd">[root@purplesec ~]# ls -l /var/log/pwned/archive/</div>
      <div class="ps-term-feed" style="max-height: none; overflow-y: visible;">
      {% for year, year_posts in archive.items() | sort(reverse=True) %}
        <div class="ps-archive-year">
          <div class="ps-archive-year-header" data-year="{{ year }}" style="color: var(--ps-accent); font-weight: bold; margin: 1.5rem 0 0.5rem; font-family: 'JetBrains Mono', monospace; cursor: pointer;">
            drwxr-xr-x {{ year }} <span class="ps-archive-toggle" style="font-size: 0.8em; opacity: 0.8;">{% if loop.index0 == 0 %}[-]{% else %}[+]{% endif %}</span>
          </div>
          <div class="ps-archive-year-content {% if loop.index0 > 0 %}is-hidden{% endif %}" id="archive-{{ year }}">
            {% for post in year_posts %}
              <a href="/{{ post.url }}" class="ps-term-feed-item" style="padding-left: 1rem;">
                <span class="ps-term-feed-date">[{{ post.date_obj.strftime('%b %d') }}]</span>
                <span class="ps-term-feed-title">{{ post.title }}</span>
              </a>
            {% endfor %}
          </div>
        </div>
      {% endfor %}
      </div>
      <div class="ps-term-cursor" style="margin-top: 1.5rem;">_</div>
    </div>
  </div>
</div>
