---
title: The PurpleSec Blog
description: Thoughts on cybersecurity, tool reviews, exam experiences, and updates on my learning journey.
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

{% for year, year_posts in archive.items() | sort(reverse=True) %}
### {{ year }}
<ul style="list-style: none; padding-left: 0;">
{% for post in year_posts %}
  <li style="margin-bottom: 0.5rem;">
    <span style="display: inline-block; width: 120px; color: var(--md-default-fg-color--light);">{{ post.date_str }}</span>
    <a href="{{ post.url }}"><strong>{{ post.title }}</strong></a>
  </li>
{% endfor %}
</ul>
{% endfor %}
