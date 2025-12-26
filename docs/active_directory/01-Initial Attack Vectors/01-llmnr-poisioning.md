---
title: LLMNR & NBT-NS Poisioning
description: LLMNR & NBT-NS Poisioning.
---

So, you're a pentester. You've landed on a client's internal network, your Kali terminal is glowing, and you're wondering, "What's the quickest way to get some credentials around here?" Before you start firing off complex exploits, let's talk about listening. Specifically, listening for the desperate, misguided cries of Windows machines that have lost their way.

Welcome to the wonderful world of **LLMNR and NBT-NS poisoning**, the lowest-hanging fruit on many internal networks and an attacker's best friend. It’s less of a sophisticated "hack" and more like putting up a fake "Free Pizza" sign and waiting for hungry people to show up.

---

## A Trip Down Memory Lane 📜

To understand why this attack is so beautifully effective, we need to hop in our Delorean and travel back in time.

### NBT-NS: The Dinosaur
In the ancient days before DNS was the undisputed king of name resolution, networks were smaller, more intimate places. **NetBIOS Name Service (NBT-NS)** was born in this era. Its job was simple: if a computer wanted to find another computer on the local network (e.g., `\\FILESERVER`), but its map (the WINS server or local `lmhosts` file) was useless, it would just shout its request to everyone on the local network segment. Think of it as walking into a party and yelling, "Has anyone seen Dave?" It's inefficient, but in a small room, it works.

### LLMNR: The Slightly Younger, Not-Much-Smarter Sibling
Fast forward a bit. Microsoft, realizing that yelling on a network wasn't ideal but still wanting a fallback for when DNS fails, created **Link-Local Multicast Name Resolution (LLMNR)**. It's the modern, IPv6-friendly successor to NBT-NS. It's a bit more "organized" since it uses multicast instead of broadcast, but the principle is identical: when DNS says "I don't know," the computer turns to its local network peers and asks, "Hey guys, any of you know where `\\FILESARVER` is?"

The fatal flaw in both of these protocols? **They trust the answer from *anyone* who replies first.** And that's where we, the pentesters, come in.

---

## The Attack: How We Turn Chatter into Shells 💻

The attack flow is deliciously simple and preys on a single, common event: **a user mistyping a server name.**

1.  **The Typo:** An employee, fueled by their third coffee of the morning, wants to access the finance share. They open Windows Explorer and type `\\finannce` instead of `\\finance`.

2.  **DNS Says "Nope":** The computer first does the sensible thing and asks the DNS server, "Hey, what's the IP for `\\finannce`?" The DNS server, being a stickler for spelling, correctly replies, "Never heard of it. Go away."

3.  **The Desperate Shout:** Now, instead of giving the user an error, Windows helpfully falls back to the old ways. It sends out an LLMNR/NBT-NS broadcast to the entire local subnet: **"HELLO EVERYONE! I CAN'T FIND `\\finannce`! DOES ANYONE KNOW WHERE IT IS?"**

4.  **Our Malicious Reply:** Our trusty tool, **Responder**, which has been quietly listening on the network, sees this desperate plea. It immediately shoots back a reply: **"YES! I AM `\\finannce`! YOU FOUND ME! MY IP IS [Attacker's IP Address]. PLEASE, AUTHENTICATE TO ME!"**

5.  **The Gullible Victim:** The user's computer, thrilled to have found its destination, immediately tries to authenticate to our machine to access the share. In doing so, it sends us the user's **NTLMv2 hash**.

**BOOM.** We've just caught a username and a password hash without sending a single malicious packet unprompted. The network served it to us on a silver platter.

---

## Let's Get Hacking: Using Responder

The go-to tool for this attack is `Responder` by Laurent Gaffie. It's included in Kali Linux and is incredibly easy to use.

### Step 1: Fire up Responder

Open your terminal and run Responder. You need to tell it which network interface to listen on.

```shell
sudo responder -I eth0 -v
```

 - `sudo`: Responder needs root privileges to listen on privileged ports.
 - `-I eth0`: Tells Responder to listen on the `eth0` interface. Use `ifconfig` or `ip a` to find your network interface name.
 - `-v`: Verbose mode. This shows you all the action as it happens.

Now, you wait. The screen will sit there, poised and listening...

### Step 2: The Magic Happens

When a user makes a typo, your screen will light up with beautiful, beautiful text.

```shell
[+] LLMNR Poisoned answer sent to 192.168.1.132 for name filesharre
[+] NTLMv2-SSP Hash Captured:

ASchneider::CORP:1122334455667788:C33D8018A49A13506FBEA92736E5632A:[...]
  User              : ASchneider
  Domain            : CORP
  NTLMv2 Hash       : C33D8018A49A13506FBEA92736E5632A...
  IP Address        : 192.168.1.132
  Hostname          : DESKTOP-A5B4C3
```

**Look at that!** We have a username, a domain, and most importantly, a hash. We didn't even have to break a sweat.

## Step 3: Crack That Hash! 🔑

Now that you have the hash, it's time to crack it. We use a tool like `Hashcat` for this. Save the full hash line into a file named `hash.txt`.

The format for an NTLMv2 hash in Hashcat is mode `5600`.

```shell
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

 - `-m 5600`: Specifies the hash mode is NTLMv2.
 - `hash.txt`: The file containing the hash you captured.
 - `/usr/share/wordlists/rockyou.txt`: A common password list. If the user's password is "Password123", this will find it in seconds.


 If you're lucky and the user has a weak password, Hashcat will serve it up to you. You now have a valid domain username and password. Game over.

#### Pro-Tip: Relaying vs. Cracking

Sometimes, you don't even need to crack the hash! An even more powerful technique is **SMB Relaying**. Instead of cracking the hash, you take the incoming authentication attempt and "relay" it to another machine on the network. If the user (`ASchneider`) is a local administrator on another server, you can use their relayed credentials to instantly get a shell on that server. But that's a story for another day!


## How to Banish the Gremlins: Mitigation 🛡️

As responsible pentesters, we must tell our clients how to fix this mess.

1. **DISABLE, DISABLE, DISABLE**: This is the big one. These protocols are relics. For 99% of modern corporate networks with a functioning DNS, they are completely unnecessary.

  - **Disable LLMNR**: This can be done easily via Group Policy (GPO):
  `Computer Configuration > Administrative Templates > Network > DNS Client > Turn off multicast name resolution` -> Set to Enabled.

  - **Disable NBT-NS**: This is a bit trickier as it's a network adapter setting. It can be done via DHCP or manually, but the easiest way is to push a script to set the registry key. The setting is found under:
  `Network Adapter Properties > IPv4 > Advanced > WINS > Disable NetBIOS over TCP/IP`.

2. **Network Segmentation**: Don't let workstations and servers live on the same flat network. If a user on the guest Wi-Fi can poison requests for a domain controller, you have bigger problems. Segmenting the network limits the "blast radius" of these broadcast/multicast requests.

3. **Require SMB Signing**: This is a GPO setting that cryptographically signs SMB traffic, which prevents SMB relaying attacks. It directly counters the "pro-tip" I mentioned earlier.

So go forth, listen to the network's whispers, and find those credentials. Just remember to tell your clients how to silence the chatty, gullible gremlins for good. Happy hunting!