---
icon: material/transit-connection-variant
title: 'Pivoting, Tunneling & Port Forwarding'
description: 'Master the art of reaching unreachable networks — from SSH tunnels and SOCKS proxies to double pivots and protocol-level tunneling.'
hide:
  - toc
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Pivoting, Tunneling & Port Forwarding</h1>
<p class="ps-blog-masthead-sub">Breaching the perimeter is only the beginning. Learn to navigate segmented networks, chain tunnels through compromised hosts, and route your entire toolkit into networks you were never meant to reach.</p>
</div>

<div class="ps-fx-grid ps-reveal">

<a href="ssh-tunneling/" class="ps-fx-card">
<span class="ps-fx-index">01 / SSH & METERPRETER</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 9 8 12 2 12"/></svg></span>
<span class="ps-fx-title">SSH & Meterpreter Tunneling</span>
<span class="ps-fx-desc">Dynamic port forwarding, SOCKS tunneling, reverse SSH forwarding, and Meterpreter's autoroute and portfwd.</span>
<span class="ps-fx-arrow">Start tunneling →</span>
</a>

<a href="socat-redirection/" class="ps-fx-card">
<span class="ps-fx-index">02 / SOCAT</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg></span>
<span class="ps-fx-title">Socat Redirection</span>
<span class="ps-fx-desc">Bidirectional relays, reverse shell redirection, and bind shell forwarding with Socat.</span>
<span class="ps-fx-arrow">Redirect traffic →</span>
</a>

<a href="pivoting-tools/" class="ps-fx-card">
<span class="ps-fx-index">03 / PIVOTING TOOLS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>
<span class="ps-fx-title">Pivoting Tools</span>
<span class="ps-fx-desc">plink.exe for Windows SSH, Rpivot for web server pivoting, and Netsh port forwarding.</span>
<span class="ps-fx-arrow">Explore the arsenal →</span>
</a>

<a href="advanced-tunneling/" class="ps-fx-card">
<span class="ps-fx-index">04 / ADVANCED TUNNELING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
<span class="ps-fx-title">Advanced Tunneling</span>
<span class="ps-fx-desc">DNS tunneling with Dnscat2, SOCKS5 with Chisel, and ICMP tunneling with ptunnel-ng.</span>
<span class="ps-fx-arrow">Go deeper →</span>
</a>

<a href="double-pivots/" class="ps-fx-card">
<span class="ps-fx-index">05 / DOUBLE PIVOTS</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg></span>
<span class="ps-fx-title">Double Pivots</span>
<span class="ps-fx-desc">Multi-hop pivot scenarios and RDP tunneling with SocksOverRDP for deep network access.</span>
<span class="ps-fx-arrow">Chain the pivots →</span>
</a>

<a href="detection-prevention/" class="ps-fx-card">
<span class="ps-fx-index">06 / BLUE TEAM</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span>
<span class="ps-fx-title">Detection & Prevention</span>
<span class="ps-fx-desc">Blue team strategies for detecting tunneling traffic, anomaly analysis, and network hardening.</span>
<span class="ps-fx-arrow">Defend the network →</span>
</a>

</div>

---

## 🧭 Tool Deep Dives

The following guides provide comprehensive, tool-specific references. Use them alongside the technique pages above.

<div class="ps-fx-grid ps-reveal">
<a href="ligolo-ng/" class="ps-fx-card">
<span class="ps-fx-index">PIVOTING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
<span class="ps-fx-title">Ligolo-ng</span>
<span class="ps-fx-desc">Advanced, lightweight, and fast tunneling utilizing TUN interfaces.</span>
<span class="ps-fx-arrow">Read guide →</span>
</a>
<a href="proxychains/" class="ps-fx-card">
<span class="ps-fx-index">TUNNELING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
<span class="ps-fx-title">Proxychains</span>
<span class="ps-fx-desc">Force any TCP connection to flow through proxies like SOCKS4, SOCKS5 or HTTP.</span>
<span class="ps-fx-arrow">Read guide →</span>
</a>
<a href="ssh/" class="ps-fx-card">
<span class="ps-fx-index">PORT FORWARDING</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 9 8 12 2 12"/></svg></span>
<span class="ps-fx-title">SSH Tunneling</span>
<span class="ps-fx-desc">Local, remote, and dynamic port forwarding using native SSH functionality.</span>
<span class="ps-fx-arrow">Read guide →</span>
</a>
<a href="sshuttle/" class="ps-fx-card">
<span class="ps-fx-index">VPN</span>
<span class="ps-fx-icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg></span>
<span class="ps-fx-title">sshuttle</span>
<span class="ps-fx-desc">Transparent proxy server that works as a poor man's VPN.</span>
<span class="ps-fx-arrow">Read guide →</span>
</a>
</div>
