---
title: 'The PurpleSec Blog'
description: 'Thoughts on cybersecurity, tool reviews, exam experiences, and updates on my learning journey.'
hide:
  - navigation
  - toc
---
# The PurpleSec Blog

Welcome to my cybersecurity blog where I share deep dives, exam reviews, and offensive security research.

{% set posts = get_blog_posts() %}

## Latest Posts

{% if posts %}
{% set all_tags = [] %}
{% for post in posts %}
  {% if post.tags %}
    {% for tag in post.tags %}
      {% if tag not in all_tags %}
        {% set _ = all_tags.append(tag) %}
      {% endif %}
    {% endfor %}
  {% endif %}
{% endfor %}

{% if all_tags %}
<div class="ps-tag-filter-bar" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem;">
  <button class="ps-tag-filter ps-tag-active" data-tag="all">All Posts</button>
  {% for tag in all_tags %}
  <button class="ps-tag-filter" data-tag="{{ tag }}">#{{ tag }}</button>
  {% endfor %}
</div>
{% endif %}

<div class="ps-blog-grid" id="ps-blog-grid">
{% for post in posts %}
  <a href="{{ post.url }}" class="ps-blog-card {% if loop.index0 >= 9 %}is-hidden{% endif %}" data-tags="{{ post.tags | join(',') if post.tags else '' }}">
    <div class="ps-card-terminal-header">
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
    </div>
    <div class="ps-blog-card-content">

      <div class="ps-blog-card-meta-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--ps-dark-text); opacity: 0.8;">
        <span class="ps-blog-card-read-time">🕓 {{ post.read_time }} min read</span>
        {% if post.tags %}
        <div class="ps-blog-card-tags" style="display: flex; gap: 0.5rem;">
          {% for tag in post.tags[:2] %}
          <span class="ps-blog-card-tag" style="color: var(--ps-accent);">#{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
      </div>
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
{% if posts | length > 9 %}
<div class="ps-blog-load-more-container" style="text-align: center; margin-top: 2rem;">
  <button id="ps-load-more-btn" class="md-button md-button--primary">Load More Posts</button>
</div>
{% endif %}
{% else %}
*No blog posts published yet.*
{% endif %}

---

## Archive

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
      <div class="ps-term-cmd">[root@purplesec ~]# ls -l /var/log/archive/</div>
      <div class="ps-term-feed" style="max-height: none; overflow-y: visible;">
      {% for year, year_posts in archive.items() | sort(reverse=True) %}
        <div class="ps-archive-year">
          <div class="ps-archive-year-header" data-year="{{ year }}" style="color: var(--ps-accent); font-weight: bold; margin: 1.5rem 0 0.5rem; font-family: 'JetBrains Mono', monospace; cursor: pointer;">
            drwxr-xr-x {{ year }} <span class="ps-archive-toggle" style="font-size: 0.8em; opacity: 0.8;">{% if loop.index0 == 0 %}[-]{% else %}[+]{% endif %}</span>
          </div>
          <div class="ps-archive-year-content {% if loop.index0 > 0 %}is-hidden{% endif %}" id="archive-{{ year }}">
            {% for post in year_posts %}
              <a href="{{ post.url }}" class="ps-term-feed-item" style="padding-left: 1rem;">
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
