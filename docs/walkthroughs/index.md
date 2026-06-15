---
icon: lucide/monitor
title: 'Pwned Machines'
description: 'Detailed walkthroughs of Hack The Box machines.'
hide:
  - navigation
  - toc
---
# :lucide-monitor: Pwned Machines

Detailed walkthroughs of retired Hack The Box machines. Each writeup covers the full attack chain from enumeration to root.

!!! info "Disclaimer"

    Writeups are only published for **retired machines** in accordance with Hack The Box's rules. No active machine solutions are shared here.

{% set posts = get_walkthroughs() %}

## Latest Pwned Machines

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
  <button class="ps-tag-filter ps-tag-active" data-tag="all">All Machines</button>
  {% for tag in all_tags %}
  <button class="ps-tag-filter" data-tag="{{ tag }}">#{{ tag }}</button>
  {% endfor %}
</div>
{% endif %}

<div class="ps-blog-grid" id="ps-blog-grid">
{% for post in posts %}
  <a href="/{{ post.url }}" class="ps-blog-card {% if loop.index0 >= 9 %}is-hidden{% endif %}" data-tags="{{ post.tags | join(',') if post.tags else '' }}">
    <div class="ps-card-terminal-header">
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
      <span class="ps-card-term-btn"></span>
    </div>
    <div class="ps-blog-card-content">

      <div class="ps-blog-card-meta-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--ps-dark-text); opacity: 0.8;">
        <span class="ps-blog-card-read-time">
          {% if post.os | lower == 'windows' %}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: text-top;"><path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/></svg> {{ post.os }}
          {% elif post.os | lower == 'linux' %}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: text-top;"><path d="M220.8 123.3c1.1.2 2.1.6 2.9 1.1-.3-.6-.6-1.1-.8-1.7-.6.2-1.4.4-2.1.6zm215.1 270.6c0-70.5-23.7-93.5-31.5-104-5.3-7.2-22.3-30.8-31-41.2-12.7-15.3-15.2-15.3-20.7-32.9-4.8-15.4-8.7-37.4-12.7-56.1-6.1-28.1-13-59.5-27-77.9-10.7-14.1-28.5-27.1-43-34.9-18.7-10.1-42.3-17.7-65.7-18-20.5-.3-40.7 5.1-57 14-13.8 7.5-29 19.3-39 31.9-12.3 15.6-18.6 44.5-23.8 67.9-4.9 22-8.5 40.8-13.6 57-5.9 19.1-10 20.3-23.4 36.3-8.8 10.6-25.2 32.7-30.5 39.8-7.8 10.5-31.5 33.5-31.5 104 0 54.5 24 81.3 29.8 87 23.3 22.8 69.5 29.5 98.4 29.5 6.4 0 11.2-.4 14.3-.8 4.4 20.8 30.6 30 52 30h40.3c21.4 0 47.6-9.2 52-30 3.1.4 7.9.8 14.3.8 28.9 0 75.1-6.7 98.4-29.5 5.9-5.7 29.9-32.5 29.9-87zM161 247.3c0-11 6-20.4 13.9-20.4s14 9.4 14 20.4-6.3 20.4-14 20.4-13.9-9.4-13.9-20.4zm105.7 0c0-11 6.3-20.4 14-20.4s14 9.4 14 20.4-6.3 20.4-14 20.4-14-9.4-14-20.4zm-48.4 143.4h-10c-17.2 0-33.3-8.9-39.7-24.6-2.5-6.1-5-17.2-2.1-23.8 2.2-5 7.6-13.2 14.4-18.7 8.8-7.1 22.7-14.7 32.5-14.7 9.8 0 23.6 7.6 32.5 14.7 6.9 5.5 12.2 13.7 14.4 18.7 2.9 6.6.4 17.7-2.1 23.8-6.4 15.7-22.5 24.6-39.7 24.6z"/></svg> {{ post.os }}
          {% else %}
            ⚙️ {{ post.os | default('N/A', true) }}
          {% endif %}
          | 🔥 {{ post.difficulty }}
        </span>
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
*No machines published yet.*
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
