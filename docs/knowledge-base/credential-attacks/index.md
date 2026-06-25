---
icon: material/shield-key
title: 'Credential Attacks'
description: 'Methodologies for extracting, dumping, and cracking credentials and hashes.'
hide:
  - toc
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Credential Attacks</h1>
<p class="ps-blog-masthead-sub">From offline cracking to lateral movement, these methodologies cover extracting, dumping, and reusing credentials.</p>
</div>

<div class="ps-fx-grid ps-reveal">
<a href="john-the-ripper.md" class="ps-fx-card">
<span class="ps-fx-index">CRACKING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m15 14-6 6"/><path d="m20.5 8.5-7-7"/><path d="M12 18h2v2h-2z"/><path d="M7 13h2v2H7z"/></svg></span>
<span class="ps-fx-title">John the Ripper</span>
<span class="ps-fx-desc">Offline password cracking, rules, and formats.</span>
<span class="ps-fx-arrow">Start cracking →</span>
</a>

<a href="hashcat.md" class="ps-fx-card">
<span class="ps-fx-index">CRACKING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
<span class="ps-fx-title">Hashcat</span>
<span class="ps-fx-desc">GPU-accelerated cracking and optimization techniques.</span>
<span class="ps-fx-arrow">Start cracking →</span>
</a>

<a href="attacking-sam.md" class="ps-fx-card">
<span class="ps-fx-index">DUMPING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span>
<span class="ps-fx-title">Attacking SAM & SYSTEM</span>
<span class="ps-fx-desc">Extracting local NTLM hashes.</span>
<span class="ps-fx-arrow">Dump hashes →</span>
</a>

<a href="attacking-lsass.md" class="ps-fx-card">
<span class="ps-fx-index">MEMORY</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
<span class="ps-fx-title">Attacking LSASS</span>
<span class="ps-fx-desc">Extracting cleartext credentials and tickets from memory.</span>
<span class="ps-fx-arrow">Dump memory →</span>
</a>

<a href="pass-the-hash.md" class="ps-fx-card">
<span class="ps-fx-index">LATERAL MOVEMENT</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg></span>
<span class="ps-fx-title">Pass the Hash</span>
<span class="ps-fx-desc">Moving laterally using NTLM hashes.</span>
<span class="ps-fx-arrow">Move laterally →</span>
</a>
</div>
