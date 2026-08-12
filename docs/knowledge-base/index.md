---
icon: lucide/book-open
title: 'Knowledge Base'
description: 'Security playbooks, attack methodologies, and technical documentation for Active Directory and enterprise penetration testing.'
hide:
  - toc
---
<div class="ps-blog-masthead ps-reveal-scale">
<h1 class="ps-blog-masthead-title">Knowledge Base</h1>
<p class="ps-blog-masthead-sub">Battle-tested attack playbooks and methodologies — the offensive techniques that carry an engagement from the first packet to full domain dominance.</p>
</div>

<div class="ps-kb-controls ps-reveal">
  <div class="ps-kb-controls-title">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
    <span>Knowledge Base Categories (8 Categories)</span>
  </div>
  <div class="ps-kb-btn-group">
    <button class="ps-kb-btn" onclick="document.querySelectorAll('.ps-kb-accordion').forEach(el => el.setAttribute('open', 'true'))">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="7 11 12 6 17 11"/><polyline points="7 18 12 13 17 18"/></svg>
      Expand All
    </button>
    <button class="ps-kb-btn" onclick="document.querySelectorAll('.ps-kb-accordion').forEach(el => el.removeAttribute('open'))">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
      Collapse All
    </button>
  </div>
</div>

<div class="ps-kb-accordions ps-reveal">

  <!-- 01 / RECONNAISSANCE -->
  <details class="ps-kb-accordion" open>
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">01 / RECON</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            Reconnaissance
          </h2>
          <p class="ps-kb-desc">Network footprinting, port scanning, OSINT, and web surface enumeration to map the target infrastructure.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">23 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="reconnaissance/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Network Footprinting</h3>
          <div class="ps-kb-links">
            <a href="reconnaissance/network/smtp/" class="ps-kb-link-pill">SMTP</a>
            <a href="reconnaissance/network/imap-pop3/" class="ps-kb-link-pill">IMAP & POP3</a>
            <a href="reconnaissance/network/snmp/" class="ps-kb-link-pill">SNMP</a>
            <a href="reconnaissance/network/mysql/" class="ps-kb-link-pill">MySQL</a>
            <a href="reconnaissance/network/mssql/" class="ps-kb-link-pill">MSSQL</a>
            <a href="reconnaissance/network/oracle/" class="ps-kb-link-pill">Oracle TNS</a>
            <a href="reconnaissance/network/ipmi/" class="ps-kb-link-pill">IPMI</a>
            <a href="reconnaissance/network/dns/" class="ps-kb-link-pill">DNS</a>
            <a href="reconnaissance/network/nfs/" class="ps-kb-link-pill">NFS</a>
            <a href="reconnaissance/network/smb/" class="ps-kb-link-pill">SMB</a>
            <a href="reconnaissance/network/ftp/" class="ps-kb-link-pill">FTP</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Information Gathering - Web</h3>
          <div class="ps-kb-links">
            <a href="reconnaissance/web/" class="ps-kb-link-pill overview-pill">Web Recon Overview</a>
            <a href="reconnaissance/web/whois/" class="ps-kb-link-pill">WHOIS</a>
            <a href="reconnaissance/web/digging-dns/" class="ps-kb-link-pill">Digging DNS</a>
            <a href="reconnaissance/web/subdomain-bruteforcing/" class="ps-kb-link-pill">Subdomains</a>
            <a href="reconnaissance/web/dns-zone-transfers/" class="ps-kb-link-pill">Zone Transfers</a>
            <a href="reconnaissance/web/virtual-hosts/" class="ps-kb-link-pill">Virtual Hosts</a>
            <a href="reconnaissance/web/fingerprinting/" class="ps-kb-link-pill">Fingerprinting</a>
            <a href="reconnaissance/web/crawling/" class="ps-kb-link-pill">Crawling</a>
            <a href="reconnaissance/web/search-engine-discovery/" class="ps-kb-link-pill">Search Engines</a>
            <a href="reconnaissance/web/web-archives/" class="ps-kb-link-pill">Web Archives</a>
            <a href="reconnaissance/web/automating-recon/" class="ps-kb-link-pill">Automation</a>
            <a href="reconnaissance/web/certificate-transparency/" class="ps-kb-link-pill">CT Logs</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 02 / WEB ATTACKS -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">02 / WEB</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Web Attacks
          </h2>
          <p class="ps-kb-desc">File upload vulnerabilities, injection flaws, and deep dives into web application exploitation techniques.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">34 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="web-attacks/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">File Upload Attacks</h3>
          <div class="ps-kb-links">
            <a href="web-attacks/file-upload-attacks/" class="ps-kb-link-pill overview-pill">Overview</a>
            <a href="web-attacks/file-upload-attacks/fingerprinting/" class="ps-kb-link-pill">Fingerprinting</a>
            <a href="web-attacks/file-upload-attacks/absent-validation/" class="ps-kb-link-pill">Absent Validation</a>
            <a href="web-attacks/file-upload-attacks/weaponization/" class="ps-kb-link-pill">Weaponization</a>
            <a href="web-attacks/file-upload-attacks/client-side-validation/" class="ps-kb-link-pill">Client Validation</a>
            <a href="web-attacks/file-upload-attacks/blacklist-filters/" class="ps-kb-link-pill">Blacklists</a>
            <a href="web-attacks/file-upload-attacks/whitelist-filters/" class="ps-kb-link-pill">Whitelists</a>
            <a href="web-attacks/file-upload-attacks/type-filters/" class="ps-kb-link-pill">MIME Filters</a>
            <a href="web-attacks/file-upload-attacks/limited-uploads/" class="ps-kb-link-pill">Limited Uploads</a>
            <a href="web-attacks/file-upload-attacks/prevention/" class="ps-kb-link-pill">Prevention</a>
            <a href="web-attacks/file-upload-attacks/cheatsheet/" class="ps-kb-link-pill">Cheatsheet</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">SQL Injection</h3>
          <div class="ps-kb-links">
            <a href="web-attacks/sql-injection/" class="ps-kb-link-pill overview-pill">Theory Overview</a>
            <a href="web-attacks/sql-injection/subverting-logic/" class="ps-kb-link-pill">Logic Subversion</a>
            <a href="web-attacks/sql-injection/identifying-vulnerabilities/" class="ps-kb-link-pill">Discovery</a>
            <a href="web-attacks/sql-injection/in-band/" class="ps-kb-link-pill">In-Band SQLi</a>
            <a href="web-attacks/sql-injection/blind/" class="ps-kb-link-pill">Blind SQLi</a>
            <a href="web-attacks/sql-injection/out-of-band/" class="ps-kb-link-pill">Out-of-Band</a>
            <a href="web-attacks/sql-injection/advanced-exploitation/" class="ps-kb-link-pill">Advanced</a>
            <a href="web-attacks/sql-injection/waf-bypassing/" class="ps-kb-link-pill">WAF Bypass</a>
            <a href="web-attacks/sql-injection/cheatsheet/" class="ps-kb-link-pill">Cheatsheet</a>
            <a href="web-attacks/sql-injection/sqlmap/" class="ps-kb-link-pill overview-pill">SQLMap Guide</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Attacking with Ffuf</h3>
          <div class="ps-kb-links">
            <a href="web-attacks/ffuf/" class="ps-kb-link-pill overview-pill">Overview</a>
            <a href="web-attacks/ffuf/directory-fuzzing/" class="ps-kb-link-pill">Directory Fuzzing</a>
            <a href="web-attacks/ffuf/extension-fuzzing/" class="ps-kb-link-pill">Extensions</a>
            <a href="web-attacks/ffuf/page-fuzzing/" class="ps-kb-link-pill">Pages</a>
            <a href="web-attacks/ffuf/recursive-fuzzing/" class="ps-kb-link-pill">Recursive</a>
            <a href="web-attacks/ffuf/subdomain-fuzzing/" class="ps-kb-link-pill">Subdomains</a>
            <a href="web-attacks/ffuf/vhost-fuzzing/" class="ps-kb-link-pill">VHosts</a>
            <a href="web-attacks/ffuf/parameter-fuzzing-get/" class="ps-kb-link-pill">GET Params</a>
            <a href="web-attacks/ffuf/parameter-fuzzing-post/" class="ps-kb-link-pill">POST Params</a>
            <a href="web-attacks/ffuf/cheatsheet/" class="ps-kb-link-pill">Cheatsheet</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 03 / COMMON APPLICATIONS -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">03 / APPS</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            Attacking Common Applications
          </h2>
          <p class="ps-kb-desc">Targeting enterprise web apps, CMS platforms, WordPress, custom portals, and administrative suites.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">2 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Enterprise Applications</h3>
          <div class="ps-kb-links">
            <a href="attacking-common-applications/application-discovery-enumeration/" class="ps-kb-link-pill">App Discovery & Enumeration</a>
            <a href="attacking-common-applications/wordpress/" class="ps-kb-link-pill">Attacking WordPress</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 04 / CREDENTIAL ATTACKS -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">04 / CREDENTIALS</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Credential Attacks
          </h2>
          <p class="ps-kb-desc">Password cracking, credential hunting, Pass-the-Hash, Pass-the-Ticket, and dumping hashes from SAM/NTDS.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">27 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="credential-attacks/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Password Cracking</h3>
          <div class="ps-kb-links">
            <a href="credential-attacks/john-the-ripper/" class="ps-kb-link-pill">John the Ripper</a>
            <a href="credential-attacks/hashcat/" class="ps-kb-link-pill">Hashcat</a>
            <a href="credential-attacks/custom-wordlists-rules/" class="ps-kb-link-pill">Wordlists & Rules</a>
            <a href="credential-attacks/cracking-protected-files/" class="ps-kb-link-pill">Protected Files</a>
            <a href="credential-attacks/cracking-protected-archives/" class="ps-kb-link-pill">Archives</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Windows Credential Extraction</h3>
          <div class="ps-kb-links">
            <a href="credential-attacks/windows-auth-process/" class="ps-kb-link-pill">Windows Auth</a>
            <a href="credential-attacks/attacking-sam/" class="ps-kb-link-pill">SAM & SYSTEM</a>
            <a href="credential-attacks/attacking-lsass/" class="ps-kb-link-pill">Attacking LSASS</a>
            <a href="credential-attacks/attacking-credential-manager/" class="ps-kb-link-pill">Cred Manager</a>
            <a href="credential-attacks/attacking-ntds/" class="ps-kb-link-pill">NTDS.dit</a>
            <a href="credential-attacks/credential-hunting-windows/" class="ps-kb-link-pill">Cred Hunting</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Lateral Movement & Relay</h3>
          <div class="ps-kb-links">
            <a href="credential-attacks/pass-the-hash/" class="ps-kb-link-pill">Pass the Hash</a>
            <a href="credential-attacks/pass-the-ticket-windows/" class="ps-kb-link-pill">PtT (Windows)</a>
            <a href="credential-attacks/pass-the-ticket-linux/" class="ps-kb-link-pill">PtT (Linux)</a>
            <a href="credential-attacks/pass-the-certificate/" class="ps-kb-link-pill">Pass the Cert</a>
            <a href="credential-attacks/ntlm-coercion/" class="ps-kb-link-pill">NTLM Coercion</a>
            <a href="credential-attacks/ntlm-hash-theft/" class="ps-kb-link-pill">Hash Theft & Relay</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 05 / ACTIVE DIRECTORY -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">05 / ACTIVE DIRECTORY</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>
            Active Directory
          </h2>
          <p class="ps-kb-desc">The complete AD pentesting playbook: LLMNR poisoning, Kerberoasting, ADCS escalation, and Golden Tickets.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">31 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="active_directory/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Initial Access & Enumeration</h3>
          <div class="ps-kb-links">
            <a href="active_directory/Initial Attack Vectors/llmnr-poisioning/" class="ps-kb-link-pill">LLMNR Poisoning</a>
            <a href="active_directory/Initial Attack Vectors/smb-relay/" class="ps-kb-link-pill">SMB Relay</a>
            <a href="active_directory/Initial Attack Vectors/mitm6/" class="ps-kb-link-pill">mitm6</a>
            <a href="active_directory/Post-Compromise Enumeration/bloodhound/" class="ps-kb-link-pill">BloodHound</a>
            <a href="active_directory/Post-Compromise Enumeration/ldapdomaindump/" class="ps-kb-link-pill">ldapdomaindump</a>
            <a href="active_directory/Post-Compromise Enumeration/pingcastle/" class="ps-kb-link-pill">PingCastle</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Domain Exploitation & ADCS</h3>
          <div class="ps-kb-links">
            <a href="active_directory/Post Compromise Attacks/kerberoasting/" class="ps-kb-link-pill">Kerberoasting</a>
            <a href="active_directory/Post Compromise Attacks/gpp/" class="ps-kb-link-pill">GPP Attacks</a>
            <a href="active_directory/Post Compromise Attacks/token-impersonation/" class="ps-kb-link-pill">Token Impersonation</a>
            <a href="active_directory/Post Compromise Attacks/mimikatz-cred-dumping/" class="ps-kb-link-pill">Mimikatz</a>
            <a href="active_directory/adcs_attacks/ad-adcs-esc/" class="ps-kb-link-pill overview-pill">ADCS ESC Overview</a>
            <a href="active_directory/adcs_attacks/ad-adcs-golden-certificate/" class="ps-kb-link-pill">Golden Certificate</a>
            <a href="active_directory/Post Domain Compromise/golden-ticket/" class="ps-kb-link-pill">Golden Ticket</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 06 / EXPLOITATION FRAMEWORKS -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">06 / FRAMEWORKS</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Exploitation Frameworks
          </h2>
          <p class="ps-kb-desc">Mastering Metasploit, managing payloads with MSFVenom, handling sessions, and writing custom modules.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">13 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="exploitation-frameworks/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Metasploit Framework</h3>
          <div class="ps-kb-links">
            <a href="exploitation-frameworks/metasploit/msfconsole/" class="ps-kb-link-pill">MSFconsole</a>
            <a href="exploitation-frameworks/metasploit/modules/" class="ps-kb-link-pill">Modules</a>
            <a href="exploitation-frameworks/metasploit/targets/" class="ps-kb-link-pill">Targets</a>
            <a href="exploitation-frameworks/metasploit/payloads/" class="ps-kb-link-pill">Payloads</a>
            <a href="exploitation-frameworks/metasploit/encoders/" class="ps-kb-link-pill">Encoders</a>
            <a href="exploitation-frameworks/metasploit/databases/" class="ps-kb-link-pill">Databases</a>
            <a href="exploitation-frameworks/metasploit/plugins-mixins/" class="ps-kb-link-pill">Plugins & Mixins</a>
            <a href="exploitation-frameworks/metasploit/sessions-jobs/" class="ps-kb-link-pill">Sessions & Jobs</a>
            <a href="exploitation-frameworks/metasploit/meterpreter/" class="ps-kb-link-pill">Meterpreter</a>
            <a href="exploitation-frameworks/metasploit/writing-importing-modules/" class="ps-kb-link-pill">Module Writing</a>
            <a href="exploitation-frameworks/metasploit/msfvenom/" class="ps-kb-link-pill">MSFVenom</a>
            <a href="exploitation-frameworks/metasploit/firewall-ids-evasion/" class="ps-kb-link-pill">IDS/Evasion</a>
          </div>
        </div>
      </div>
    </div>
  </details>

  <!-- 07 / PIVOTING & TUNNELING -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">07 / PIVOTING</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M2 12h5"/><path d="M17 12h5"/><circle cx="12" cy="12" r="3"/><path d="M12 2v5"/><path d="M12 17v5"/><path d="m4.93 4.93 3.54 3.54"/><path d="m15.54 15.54 3.53 3.53"/><path d="m15.54 8.46 3.53-3.53"/><path d="m4.93 19.07 3.54-3.54"/></svg>
            Pivoting, Tunneling & Port Forwarding
          </h2>
          <p class="ps-kb-desc">SSH tunneling, SOCKS proxies, Socat relays, Chisel, DNS/ICMP tunneling, double pivots, and detection evasion.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">11 Topics</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="pivoting-tunneling/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Core Techniques</h3>
          <div class="ps-kb-links">
            <a href="pivoting-tunneling/ssh-tunneling/" class="ps-kb-link-pill">SSH & Meterpreter</a>
            <a href="pivoting-tunneling/socat-redirection/" class="ps-kb-link-pill">Socat Relays</a>
            <a href="pivoting-tunneling/pivoting-tools/" class="ps-kb-link-pill">Pivoting Tools</a>
            <a href="pivoting-tunneling/advanced-tunneling/" class="ps-kb-link-pill">Advanced Tunneling</a>
            <a href="pivoting-tunneling/double-pivots/" class="ps-kb-link-pill">Double Pivots</a>
            <a href="pivoting-tunneling/detection-prevention/" class="ps-kb-link-pill">Detection Evasion</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Tool Deep Dives</h3>
          <div class="ps-kb-links">
            <a href="pivoting-tunneling/ligolo-ng/" class="ps-kb-link-pill">Ligolo-ng</a>
            <a href="pivoting-tunneling/proxychains/" class="ps-kb-link-pill">Proxychains</a>
            <a href="pivoting-tunneling/ssh/" class="ps-kb-link-pill">SSH Tunneling</a>
            <a href="pivoting-tunneling/sshuttle/" class="ps-kb-link-pill">sshuttle</a>
          </div>
        </div>
  <!-- 08 / WINDOWS PRIVILEGE ESCALATION -->
  <details class="ps-kb-accordion">
    <summary class="ps-kb-summary">
      <div class="ps-kb-summary-left">
        <span class="ps-kb-index">08 / WIN PRIVESC</span>
        <div class="ps-kb-title-wrap">
          <h2 class="ps-kb-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Windows Privilege Escalation & Access Control
          </h2>
          <p class="ps-kb-desc">Windows access control architecture, tokens, SIDs, integrity levels, privilege mechanics, service hardening, and credential security.</p>
        </div>
      </div>
      <div class="ps-kb-summary-right">
        <span class="ps-kb-badge">14 Modules</span>
        <svg class="ps-kb-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </summary>
    <div class="ps-kb-body">
      <div style="margin-bottom: 0.8rem;">
        <a href="windows-privilege-escalation/" class="ps-kb-link-pill overview-pill">Category Overview →</a>
      </div>
      <div class="ps-kb-subgrid">
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Privileges & Groups</h3>
          <div class="ps-kb-links">
            <a href="windows-privilege-escalation/user-and-group-privileges/" class="ps-kb-link-pill">Quick Decision Guide</a>
            <a href="windows-privilege-escalation/seimpersonate-potato-attacks/" class="ps-kb-link-pill">SeImpersonate (Potato Attacks)</a>
            <a href="windows-privilege-escalation/sedebug-privilege/" class="ps-kb-link-pill">SeDebug (LSASS Dumping)</a>
            <a href="windows-privilege-escalation/sebackup-serestore/" class="ps-kb-link-pill">SeBackup & SeRestore</a>
            <a href="windows-privilege-escalation/setakeownership-seloaddriver/" class="ps-kb-link-pill">SeTakeOwnership & SeLoadDriver</a>
            <a href="windows-privilege-escalation/windows-group-privileges/" class="ps-kb-link-pill">Group Privileges (DnsAdmins, Server Ops)</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">OS & Services</h3>
          <div class="ps-kb-links">
            <a href="windows-privilege-escalation/os-and-service-hardening/" class="ps-kb-link-pill">Quick Decision Guide</a>
            <a href="windows-privilege-escalation/unquoted-service-paths/" class="ps-kb-link-pill">Unquoted Service Paths</a>
            <a href="windows-privilege-escalation/weak-service-permissions/" class="ps-kb-link-pill">Weak Service Permissions</a>
            <a href="windows-privilege-escalation/dll-hijacking/" class="ps-kb-link-pill">DLL Hijacking</a>
            <a href="windows-privilege-escalation/always-install-elevated-scheduled-tasks/" class="ps-kb-link-pill">AlwaysInstallElevated & Tasks</a>
            <a href="windows-privilege-escalation/uac-bypass/" class="ps-kb-link-pill">UAC Bypass</a>
            <a href="windows-privilege-escalation/kernel-exploits/" class="ps-kb-link-pill">Kernel Exploits</a>
          </div>
        </div>
        <div class="ps-kb-subcard">
          <h3 class="ps-kb-subheading">Credentials & Environment</h3>
          <div class="ps-kb-links">
            <a href="windows-privilege-escalation/credentials-and-environment-security/" class="ps-kb-link-pill">Quick Decision Guide</a>
            <a href="windows-privilege-escalation/credential-hunting/" class="ps-kb-link-pill">Credential Hunting</a>
            <a href="windows-privilege-escalation/restricted-environment-breakouts/" class="ps-kb-link-pill">Environment Breakouts</a>
            <a href="windows-privilege-escalation/tools-and-enumeration/" class="ps-kb-link-pill">Tools & Enumeration</a>
          </div>
        </div>
      </div>
    </div>
  </details>

</div>

!!! tip "Methodology Structure"

    Each playbook follows a consistent workflow:

    1. **Reconnaissance** — Port scanning, service and protocol enumeration
    2. **Foothold** — Initial access and exploitation
    3. **Privilege Escalation** — Escalating toward Domain Admin
    4. **Key Takeaways** — Detection, mitigation, and lessons learned
