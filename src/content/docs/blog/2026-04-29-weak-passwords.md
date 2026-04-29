---
title: "Importance of strong password policy"
date: 2026-04-29
tags:
  - Hashcat
---


Let's say Tony Stark's password is `Stark1!`. It is a 7 character long password, consists of uppercase, lowercase letters, numbers and special characters.

How long does it take to crack this password using hashcat?

Let's try to crack this password using hashcat.

We know the password policy of the organization is:

- Minimum 7 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Now, let's try to crack this password using hashcat. Let's say that we specifically want to try passwords which start with an uppercase letter, continue with four lowercase letters, a digit, and then a symbol. The resulting hashcat mask would be `?u?l?l?l?l?d?s`



```shell
┌──(elodvk㉿kali)-[~]
└─$ hashcat -m 1000 -a 3 7555C1E433BB52013F6732C55566D0C6 ?u?l?l?l?l?d?s

7555c1e433bb52013f6732c55566d0c6:Stark1!                  
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 1000 (NTLM)
Hash.Target......: 7555c1e433bb52013f6732c55566d0c6
Time.Started.....: Wed Apr 29 14:14:03 2026 (1 sec)
Time.Estimated...: Wed Apr 29 14:14:04 2026 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Mask.......: ?u?l?l?l?l?d?s [7]
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:   121.6 MH/s (3.88ms) @ Accel:256 Loops:1024 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests (total), 1/1 (100.00%) Digests (new)
Progress.........: 117510144/3920854080 (3.00%)
Rejected.........: 0/117510144 (0.00%)
Restore.Point....: 6656/223080 (2.98%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1024 Iteration:0-1024
Candidate.Engine.: Device Generator
Candidates.#1....: Marew6. -> Tkabd1!
Hardware.Mon.#1..: Util: 97%

Started: Wed Apr 29 14:13:58 2026
Stopped: Wed Apr 29 14:14:05 2026

```

Within seconds the password was creacked. 

Now, let's say we only the password policy and instead of using the method above, we want to try every combination of password which is 7 char in length and consists of uppercase, lowercase letters, numbers and special characters. The resulting hashcat mask would be `?a?a?a?a?a?a?a`

```shell
┌──(elodvk㉿kali)-[~]
└─$ hashcat -m 1000 -a 3 7555C1E433BB52013F6732C55566D0C6 ?a?a?a?a?a?a?a

7555c1e433bb52013f6732c55566d0c6:Stark1!                  
                                                          
Session..........: hashcat
Status...........: Cracked
Hash.Mode........: 1000 (NTLM)
Hash.Target......: 7555c1e433bb52013f6732c55566d0c6
Time.Started.....: Wed Apr 29 14:14:03 2026 (1 sec)
Time.Estimated...: Wed Apr 29 14:14:04 2026 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Mask.......: ?u?l?l?l?l?d?s [7]
Guess.Queue......: 1/1 (100.00%)
Speed.#1.........:   121.6 MH/s (3.88ms) @ Accel:256 Loops:1024 Thr:1 Vec:8
Recovered........: 1/1 (100.00%) Digests (total), 1/1 (100.00%) Digests (new)
Progress.........: 117510144/3920854080 (3.00%)
Rejected.........: 0/117510144 (0.00%)
Restore.Point....: 6656/223080 (2.98%)
Restore.Sub.#1...: Salt:0 Amplifier:0-1024 Iteration:0-1024
Candidate.Engine.: Device Generator
Candidates.#1....: Marew6. -> Tkabd1!
Hardware.Mon.#1..: Util: 97%

Started: Wed Apr 29 14:13:58 2026
Stopped: Wed Apr 29 14:14:05 2026

```