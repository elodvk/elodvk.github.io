---
icon: lucide/monitor
title: Hack The Box Writeups
description: Detailed walkthroughs of Hack The Box machines.
tags:
  - HTB
  - Writeup
---

# :lucide-monitor: Hack The Box Writeups

Detailed walkthroughs of retired Hack The Box machines. Each writeup covers the full attack chain from enumeration to root.

!!! info "Disclaimer"

    Writeups are only published for **retired machines** in accordance with Hack The Box's rules. No active machine solutions are shared here.

## Machines

*Writeups coming soon — stay tuned!* :rocket:

---

!!! note "Methodology"

    My general approach for each box:

    ```bash
    # Initial scan
    nmap -sCV -p- -oA scans/initial <target>

    # Web enumeration
    gobuster dir -u http://<target> -w /usr/share/wordlists/dirb/common.txt

    # Always check for low-hanging fruit
    searchsploit <service> <version>
    ```
