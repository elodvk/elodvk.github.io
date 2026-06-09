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


<div class="ps-blog-grid">
{% for post in posts %}
  <a href="{{ post.url }}" class="ps-blog-card">
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
        <div style="color: var(--ps-accent); font-weight: bold; margin: 1.5rem 0 0.5rem; font-family: 'JetBrains Mono', monospace;">drwxr-xr-x {{ year }}</div>
        {% for post in year_posts %}
          <a href="{{ post.url }}" class="ps-term-feed-item" style="padding-left: 1rem;">
            <span class="ps-term-feed-date">[{{ post.date.strftime('%b %d') }}]</span>
            <span class="ps-term-feed-title">{{ post.title }}</span>
          </a>
        {% endfor %}
      {% endfor %}
      </div>
      <div class="ps-term-cursor" style="margin-top: 1.5rem;">_</div>
    </div>
  </div>
</div>
