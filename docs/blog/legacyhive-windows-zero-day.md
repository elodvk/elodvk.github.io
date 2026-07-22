---
title: "LegacyHive: The Windows Zero-Day That Loads Another User's Registry Hive"
date: 2026-07-22
authors:
  - name: Bilash J. Shahi
    title: Cybersecurity Professional
    picture: https://avatars.githubusercontent.com/elodvk
    url: https://purplesec.org
tags:
  - Zero-Day
  - Windows
  - Privilege Escalation
  - Active Directory
  - Threat Intel
description: "Deep-dive into LegacyHive — the Windows User Profile Service zero-day released by Nightmare Eclipse on July 2026 Patch Tuesday that lets a standard user mount any other user's registry hive, including an administrator's."
image: blog/assets/legacyhive_hero.png
---

# LegacyHive: The Windows Zero-Day That Loads Another User's Registry Hive

<audio controls preload="metadata" style="width: 100%; margin: 1rem 0;">
  <source src="assets/LegacyHive_Windows_Zero_Day.m4a" type="audio/mp4">
  Your browser does not support the audio element.
</audio>

??? note "Podcast Transcript"

    **Host A:** Alright, let's talk about what might be the most interesting Windows zero-day drop of 2026 so far. It's called LegacyHive, and it came out on July 14th — literally the same day as Microsoft's Patch Tuesday.

    **Host B:** Right, and the timing was very intentional. The researcher behind it — Nightmare Eclipse, also known as Chaotic Eclipse — has been in this ongoing feud with Microsoft since April. They've been dropping zero-days before Microsoft can patch them, claiming the disclosure process broke down.

    **Host A:** So what exactly is LegacyHive? Give us the elevator pitch.

    **Host B:** In simple terms: if you're a standard user on a Windows machine, this exploit lets you trick Windows into loading another user's registry hive — potentially an administrator's — under your own session with full read and write access.

    **Host A:** That's... that's huge. The registry hive contains Run keys, COM registrations, application settings, cached data. If you can write to an admin's hive, you can plant persistence that fires the next time they log in.

    **Host B:** Exactly. And what makes it elegant is the target component. It's not some obscure third-party driver — it's the Windows User Profile Service, ProfSvc. That's a core system service that runs as SYSTEM and is responsible for loading user profiles on every single logon. It exists on every Windows box, desktop and server.

    **Host A:** Walk us through the mechanics. How does the exploit actually work?

    **Host B:** It's a three-step race condition. First, the attacker modifies their own Local AppData registry value — which they have legitimate write access to — and points it to a location in the NT Object Manager namespace. This is basically telling ProfSvc to look in the wrong place when it processes the attacker's profile.

    **Host A:** Okay, step one is just... repointing a path you already control.

    **Host B:** Right, no privilege escalation needed yet. Step two: the attacker creates a staging directory — randomly named, GUID-based — and puts a decoy hive file in it. Then they set an opportunistic lock, an oplock, on that decoy. When ProfSvc tries to open the file, the oplock fires and pauses the operation at a very precise moment.

    **Host A:** And that pause is the window for the race.

    **Host B:** Exactly. Step three: during that pause, the attacker swaps a symbolic link. The directory path that ProfSvc was traversing now points to the target user's profile directory — say, the local administrator. When the oplock releases and ProfSvc resumes, it follows the new link and loads the admin's UsrClass.dat hive. But it mounts it under the attacker's HKCU Software Classes. Game over.

    **Host A:** So the attacker now has the admin's registry subtree mapped into their own session. What can they do with it?

    **Host B:** Reading it gives you application data, Explorer history, saved paths, potentially cached credentials from poorly-written software. But writing is where it gets dangerous. You can plant Run keys, COM object hijacks, file association overrides — anything that executes when the admin logs in next. It's a privilege escalation waiting to happen.

    **Host A:** Now, the published PoC is reportedly stripped down. What's the difference between what's public and what the researcher claims to have?

    **Host B:** The public version has two limitations. One: it requires credentials for a second standard user — a "helper account." Two: it only loads UsrClass.dat, not the full NTUSER.DAT or other hives. Nightmare Eclipse explicitly said the full version needs no helper account and can load any hive. They stripped it down to prevent immediate weaponization while still proving the primitive works.

    **Host A:** Smart disclosure, in a way. Release the hard part — the race condition primitive — but don't hand over the full escalation chain.

    **Host B:** And the security community confirmed it works. Multiple independent researchers, the 0patch team, ThreatLocker — they all verified it runs on fully patched Windows 10, 11, Server 2016 through 2025.

    **Host A:** What about the defensive side? Any patches?

    **Host B:** No official Microsoft patch. No CVE assigned. Microsoft says they're investigating. But ACROS Security — the 0patch folks — released a free micropatch within three days. What it does is clever: it doesn't block the exploit mechanics. Instead, when the race succeeds, it redirects the load to a temporary user profile hive instead of the target admin's hive. The exploit "works" but loads nothing useful.

    **Host A:** So the attacker thinks they won, but they got an empty hive.

    **Host B:** Precisely. It's a dead-end redirect. No disruption to normal profile loading either.

    **Host A:** For detection — what should blue teams be watching for?

    **Host B:** A few things. First, creation of GUID-named directories under C-colon-backslash with Everyone Full Control ACLs. That's the staging directory. Second, ntuser.dat or UsrClass.dat files appearing outside of C Users paths. Third — and this is the strong signal — Sysmon or security event logs showing ProfSvc loading hives from non-standard paths. Event 4657 for registry value modifications on the Shell Folders key, and Event 4663 for object access on hive files in weird locations.

    **Host A:** And the MITRE ATT&CK mapping?

    **Host B:** T1546 for event-triggered execution if they plant persistence. T1574 for hijack execution flow via COM objects. And the initial technique itself would fall under T1068, exploitation for privilege escalation.

    **Host A:** Let's close with the bigger picture. What does this mean for organizations?

    **Host B:** The immediate action is: install the 0patch micropatch if you can. But the bigger lesson is about tiered administration. If your domain admins are logging into workstations where standard users also have sessions, LegacyHive gives those standard users a clean path to planting code in the admin's profile. This is exactly why the tiered access model exists. Admin accounts should only log into admin-tier systems.

    **Host A:** Don't let high-privilege accounts touch low-trust machines. We've been saying it for years, and LegacyHive is another reason why.

    **Host B:** And for red teamers — this is a beautiful post-compromise primitive. You land on a box, you see an admin has logged in before, and now you have a way to access their registry data or plant persistence without needing a traditional priv-esc exploit. No UAC bypass, no kernel exploit, just a logic flaw in how Windows loads profiles.

    **Host A:** Nightmare Eclipse strikes again. We'll keep watching for Microsoft's response. Thanks for breaking this down.

    **Host B:** Anytime. Stay patched — or at least micropatched.

Hours after Microsoft shipped its July 2026 Patch Tuesday bundle, the researcher known as **Nightmare Eclipse** (also going by Chaotic Eclipse) published a proof-of-concept exploit called **LegacyHive**. It targets a logic flaw in the Windows User Profile Service (`ProfSvc`) and allows a standard, low-privilege user to force Windows into loading another user's registry hive — including that of a local administrator — under their own profile with full read/write access.

No CVE has been assigned. No official patch exists. As of today, the vulnerability affects **every supported desktop and server version of Windows**, including systems fully updated with the July 2026 patches.

---

## What Is the Windows User Profile Service?

The **User Profile Service** (`ProfSvc`) is a core Windows system component that runs as `NT AUTHORITY\SYSTEM`. Its job is straightforward: when a user logs on, `ProfSvc` locates their profile directory, loads their registry hives (`NTUSER.DAT` and `UsrClass.dat`), and makes them accessible under `HKEY_CURRENT_USER`. When the user logs off, it unloads the hives and cleans up.

Each user profile contains:

| Hive File | Registry Path | Contains |
|-----------|--------------|----------|
| `NTUSER.DAT` | `HKCU` | Desktop settings, environment variables, software configs, Run keys |
| `UsrClass.dat` | `HKCU\Software\Classes` | File associations, COM class registrations, Explorer shell settings |

These hives are protected by NTFS permissions — a standard user cannot open another user's `NTUSER.DAT` directly. But `ProfSvc` operates at SYSTEM level, so it can load any hive from any profile. LegacyHive exploits the gap between what `ProfSvc` *intends* to load and what it *actually* loads.

---

## How LegacyHive Works

The exploit chains three Windows primitives into a single path-resolution race condition:

### 1. Local AppData Registry Value Manipulation

The attacker modifies their own `Local AppData` registry value (which they have write access to) to point to a location in the **NT Object Manager namespace** rather than the filesystem. This redirects where `ProfSvc` looks for hive files when it processes the attacker's profile.

### 2. Opportunistic Lock (Oplock) on a Decoy File

The attacker places a decoy hive file in a staging directory (created with permissive DACLs — `GENERIC_ALL` to Everyone) and sets an **opportunistic lock** on it. When `ProfSvc` (running as SYSTEM) attempts to open this file, the oplock fires and pauses the operation at a precise moment.

### 3. Symbolic Link Swap (TOCTOU Race)

During the oplock pause, the attacker replaces the directory junction or symbolic link that `ProfSvc` is traversing, redirecting it to the **target user's profile directory**. When the oplock is released and `ProfSvc` resumes, it follows the now-swapped link and loads the target user's hive — mounting it under the attacker's `HKCU\Software\Classes` (the `UsrClass.dat` mount point).

```text
Standard User Session                    ProfSvc (SYSTEM)
─────────────────────                    ────────────────
1. Modify Local AppData value ──────────►
2. Create staging dir + decoy hive       
3. Set oplock on decoy ─────────────────► Opens decoy file...
                                          ┌─── OPLOCK FIRES ───┐
4. Swap symlink → target profile ───────► │  (paused)          │
                                          └───── RELEASED ─────┘
                                          Follows swapped link ──► Loads ADMIN's UsrClass.dat
                                          Mounts under attacker's HKCU\Software\Classes
5. Read/modify admin registry data ◄─────
```

### What the Attacker Gains

Once the target hive is mounted, the attacker can:

- **Read** application settings, cached credentials, saved paths, and forensic artifacts from another user's profile
- **Write** registry values that execute on the target user's next logon (Run keys, COM hijacks, file associations)
- **Escalate privileges** by planting payloads that fire when the administrator logs in

!!! danger "The Stripped PoC vs. the Full Exploit"
    The published PoC is intentionally limited: it requires a second standard-user credential ("helper account") and only loads the `UsrClass.dat` hive. Nightmare Eclipse stated that the unrestricted version requires no additional credentials and can load **any hive** (`NTUSER.DAT`, SAM, SYSTEM, etc.). The hard primitive — the path-resolution race — is the publicly released part.

---

## Prerequisites and Limitations

| Requirement | Detail |
|-------------|--------|
| Local access | Attacker must already have code execution on the target machine |
| Standard user credentials | The published PoC needs credentials for a "helper" account (any non-target standard user) |
| Target profile must exist | The target user (e.g., administrator) must have logged in at least once (profile directory exists) |
| Physical/RDP session | Requires an interactive logon context for the race to trigger |
| Not remotely exploitable | Cannot be triggered over the network without a prior foothold |

This makes LegacyHive a **post-compromise local privilege escalation** tool — valuable in red team engagements and lateral movement scenarios, but not suitable for mass internet exploitation.

---

## Affected Systems

According to independent testing by multiple researchers (including the 0patch team), LegacyHive works on:

- Windows 10 (all supported builds, including 22H2 with July 2026 patches)
- Windows 11 (23H2, 24H2 with July 2026 patches)
- Windows Server 2016, 2019, 2022, 2025

The vulnerability has existed for an undetermined amount of time — likely years, given that it targets a fundamental behavior of `ProfSvc` that hasn't changed across Windows generations.

---

## The Researcher: Nightmare Eclipse

Nightmare Eclipse (Chaotic Eclipse) has been in an escalating dispute with Microsoft since at least April 2026, releasing zero-day exploits before Microsoft could patch them. The researcher claims Microsoft's vulnerability disclosure process broke down, citing unresponsive MSRC coordination and disagreements over severity classification.

Prior disclosures include **RoguePlanet** (a privilege escalation flaw patched in the July 2026 Patch Tuesday, after prior public disclosure in June). There is speculation in the security community that the researcher is a former Microsoft engineer, based on the depth of kernel-level knowledge demonstrated across their exploits.

LegacyHive was released on **July 14, 2026** — the same day as Patch Tuesday — as a deliberate statement that Microsoft's existing patches did not address it.

---

## Detection and Monitoring

While no official signatures exist yet, defenders can watch for these indicators:

### Event Log Indicators

| Source | Event | Significance |
|--------|-------|-------------|
| `Microsoft-Windows-User Profile Service/Operational` | Unusual hive load events | ProfSvc loading hives outside normal logon flow |
| `Security` | Event 4657 (Registry value modified) | Changes to `Local AppData` path under `HKCU\...\User Shell Folders` |
| `Security` | Event 4663 (Object access) | SYSTEM accessing hive files in unusual directories (GUID-named folders under `C:\`) |
| `Sysmon` | Event 11 (File created) | `ntuser.dat` or `UsrClass.dat` created in staging directories |
| `Sysmon` | Event 12/13 (Registry) | Modification of shell folder paths, unexpected `NtLoadKeyEx` activity |

### Behavioral Indicators

- Creation of a randomly-named GUID directory under `C:\` with overly permissive ACLs (`Everyone: GENERIC_ALL`)
- `ntuser.dat` / `UsrClass.dat` files appearing outside of `C:\Users\<username>\` paths
- Symbolic link or junction creation pointing from a GUID directory to another user's profile
- `ProfSvc` loading hives from non-standard paths

### Sigma Rule (Community)

SOC Prime published a community Sigma rule targeting the key telemetry (oplock setup + symlink swap + hive load from a non-profile path). Monitor your SIEM for updated rule packs.

---

## Mitigation

### Official Status

As of July 22, 2026: **No official Microsoft patch.** Microsoft has acknowledged the report and is investigating. No CVE has been assigned.

### 0patch Micropatch (Free, Unofficial)

[ACROS Security](https://0patch.com) released a free micropatch within days of disclosure. According to their CEO Mitja Kolsek:

> "With 0patch enabled, the exploit still seems to work, but it loads a temporary user profile hive instead of that from the target user. Loading a temporary user profile hive is of no use to the attacker."

The micropatch redirects the exploit to a dead-end (temporary profile hive) without breaking normal profile loading. It's available for:

- Windows 10 (v1803 through 22H2)
- Windows 11 (23H2, 24H2)
- Windows Server 2016, 2019, 2022, 2025

### Hardening Recommendations

| Action | Effectiveness | Effort |
|--------|:---:|:---:|
| Install 0patch micropatch | ✅ Blocks the exploit | Low |
| Restrict interactive logon to sensitive systems | High | Medium |
| Monitor for unusual hive loads (Sysmon + SIEM rules) | Detection only | Medium |
| Remove unnecessary local accounts (reduce helper-account availability) | Reduces attack surface | Low |
| Enable Credential Guard (protects NTLM hashes in SAM/SYSTEM hives) | Limits post-exploitation value | Medium |
| Restrict local admin logons to workstations (tiered access model) | Reduces target hive value | High |

---

## Implications for Red Teams and Defenders

### For Red Teams

LegacyHive is a **privilege escalation primitive** — a building block. In its public form it's useful for:

1. **Reading admin registry data** — cached paths, software configurations, saved credentials in application hives
2. **Planting persistence** — writing Run keys or COM hijacks into an admin's hive that execute on their next logon
3. **Credential harvesting** — if the full (unrestricted) version is developed, loading SAM/SYSTEM hives would yield local account password hashes

Combined with an initial foothold (phishing, service exploit, etc.), this converts a low-privilege shell into admin-level registry access without triggering UAC or needing a traditional privilege escalation exploit.

### For Defenders

The key lesson: **perimeter security is not enough.** Post-compromise, assume attackers will chain primitives like LegacyHive to escalate. Defense-in-depth matters:

- Tiered administration (don't log admin accounts into workstations)
- LAPS or unique local admin passwords per machine
- Monitoring for unusual ProfSvc behavior
- Rapid patching when Microsoft eventually releases a fix

---

## Timeline

| Date | Event |
|------|-------|
| April 2026 | Nightmare Eclipse begins public dispute with Microsoft over disclosure handling |
| June 2026 | **RoguePlanet** privilege escalation disclosed publicly |
| July 8, 2026 | Microsoft patches RoguePlanet in July Patch Tuesday |
| July 14, 2026 | **LegacyHive** PoC released hours after Patch Tuesday |
| July 15, 2026 | Independent researchers confirm exploit works on fully patched systems |
| July 17, 2026 | ACROS Security / 0patch releases free micropatch |
| July 22, 2026 | No official Microsoft patch or CVE assigned |

---

## Key Takeaways

1. **LegacyHive is a local privilege escalation** via a race condition in the Windows User Profile Service. It is not remotely exploitable.
2. **All supported Windows versions are affected** — desktop and server, fully patched as of July 2026.
3. **The public PoC is deliberately limited** — the full exploit (any hive, no helper account) exists but wasn't released.
4. **No official patch exists.** The 0patch micropatch is the only available fix.
5. **Post-compromise value is high** — in environments where admins log into shared workstations, this is a clean privilege escalation path.
6. **Detection is possible** via Sysmon, Event 4657/4663, and behavioral monitoring for unusual hive loads and symlink races.

---

## References

- [BleepingComputer — Windows LegacyHive zero-day flaw gets free, unofficial patches](https://www.bleepingcomputer.com/news/security/windows-legacyhive-zero-day-flaw-gets-free-unofficial-patches/)
- [The Hacker News — Researcher Drops New Windows Zero-Day PoC Hours After Microsoft Patch Tuesday](https://thehackernews.com/2026/07/researcher-drops-new-windows-zero-day.html)
- [Security Affairs — Chaotic Eclipse Unveils LegacyHive Exploit](https://securityaffairs.com/195418/hacking/chaotic-eclipse-unveils-legacyhive-exploit-affecting-fully-patched-windows-systems.html)
- [SOC Prime — LegacyHive: The Windows User Profile Service Bug](https://socprime.com/active-threats/legacyhive-the-windows-user-profile-service-bug-that-loads-another-users-registry-hive-nightmare/)
- [ThreatLocker — Video demo and analysis of LegacyHive](https://www.threatlocker.com/blog/legacyhive-video-demo-and-analysis-of-windows-0-day-from-nightmareeclipse)
- [SecurityWeek — Nightmare Eclipse Drops LegacyHive Windows Zero-Day](https://www.securityweek.com/nightmare-eclipse-drops-legacyhive-windows-zero-day/)

*Content was rephrased for compliance with licensing restrictions. All facts sourced from the publications linked above.*
