---
title: IPv6 DNS Takeover via mitm6
sidebar_position: 4
---

You've poisoned local name resolution with Responder and relayed credentials with `ntlmrelayx`. You feel like a true network ninja. But what if I told you there's a way to force clients to talk to you without waiting for a user to make a typo? What if you could become the network's DNS server just by asking nicely?

Enter mitm6, a devastatingly clever attack that abuses a network's misplaced enthusiasm for IPv6. Instead of waiting for a single machine to get lost, `mitm6` tricks the entire Windows domain into using your machine as its primary DNS server. This isn't just setting up a fake pizza sign; this is replacing the city's official map with one where every road leads to your restaurant.

## Why This Even Works: The IPv6 Obsession

This attack exploits two fundamental truths about modern Windows environments:

1. **Windows LOVES IPv6**: By default, if a Windows machine has both an IPv4 and an IPv6 address, it will always prefer to use IPv6 for communication. It's the shiny new protocol, and Windows is all in.

2. **Networks are IPv6-Curious, Not IPv6-Ready**: Many organizations haven't fully implemented IPv6. They don't have a legitimate **DHCPv6 server** configured to hand out IPv6 addresses and DNS server settings.

This creates a dangerous gap. Windows machines periodically send out DHCPv6 requests, asking, "Is there an IPv6 network I can join?" On most networks, this question is met with silence. But what if someone were to answer?

That someone is us.

## The Heist: From Rogue DNS to Domain Dominance

The `mitm6` attack is a beautiful, two-part symphony of deception, usually played with `ntlmrelayx.py` as the second instrument.

1. **The Rogue Ambassador**: We start the `mitm6` tool. It immediately begins listening for those hopeful DHCPv6 requests from Windows clients on the network.

2. **The Generous Offer**: When a client (like a workstation or even a Domain Controller!) asks for an IPv6 configuration, `mitm6` springs into action. It replies with a valid-looking DHCPv6 response, giving the client a shiny new IPv6 address. But here's the poison pill: **it tells the client that the attacker's machine is the primary DNS server**.

3. **The DNS Takeover**: The Windows client, ecstatic to have joined the IPv6 future, gratefully accepts. Because Windows prefers IPv6, **it now sends all of its DNS queries to our attacker machine**.

4. **The Impersonation**: The client machine needs to do routine Active Directory things, like check for Group Policy updates. It asks our malicious DNS server, "Hey, what's the IP address for ``dc01.corp.local``?" We reply, "Oh, that's easy. The IP address is `[Our Attacker IPv6 Address]`."

5. **The Inevitable Authentication**: The client, none the wiser, attempts to authenticate to what it thinks is the Domain Controller. This authentication attempt flows directly to our machine.

6. **The Relay and The Kill**: This is where `ntlmrelayx.py` takes the stage. It catches this incoming authentication (often from the computer account itself, like `WKSTN01$`) and relays it to the actual Domain Controller. Since computer accounts are trusted members of the domain, this relayed authentication can be used to perform highly privileged actions against Active Directory, such as modifying its properties to grant us control over it.

The end result? We can use a normal workstation's authentication attempt to compromise the entire domain, often within minutes.

## Get Your Hands Dirty: The Command-Line Fu 🥋

This attack requires two terminals: one for `mitm6` and one for `ntlmrelayx.py`.

### Step 1: Run mitm6

The `mitm6` tool's job is to become the rogue DHCPv6/DNS server.

```shell
sudo mitm6 -d corp.local
```

 - `-d corp.local`: Specifies the target domain. `mitm6` will only respond to requests concerning this domain, which makes the attack more stable.

You'll immediately see clients on the network start receiving IPv6 addresses from you and your machine being set as their DNS server.

### Step 2: Run `ntlmrelayx.py` for the Relay

This is where the magic happens. We configure `ntlmrelayx` to listen on IPv6 and perform a sophisticated attack against Active Directory, like resource-based constrained delegation.

```shell
sudo ntlmrelayx.py -6 -t ldaps://dc01.corp.local -wh fakewpad.corp.local --delegate-access
```

 - `-6`: Tells `ntlmrelayx` to listen on IPv6, ready to catch the traffic from our victims.
 - `-t ldaps://dc01.corp.local`: Sets our target. We're targeting the Domain Controller over LDAPS (secure LDAP).
 - `-wh fakewpad.corp.local`: The "wpad host" option. This is a clever trick to trigger authentication from web browsers on the network, giving us more credentials to play with.
 - `--delegate-access`: This is the money flag. Instead of just dumping hashes, it attempts to modify Active Directory to delegate control of the targeted computer (our DC!) to the user account we relayed.

 Once a computer authenticates, you'll see `ntlmrelayx` perform its magic, and moments later, you'll have the power to impersonate any user on that Domain Controller. It's essentially game over for the domain.

## Fortification: Locking the IPv6 Door 🛡️

This attack is terrifyingly effective, but it only works because of specific configuration oversights.

1. **Disable IPv6 If You Don't Use It**: This is the simplest and most effective defense. If your organization has no business case for IPv6, disable it entirely via Group Policy to prevent clients from ever asking for an IPv6 address.

2. **Enable DHCPv6 Guard and RA Guard**: If you do use IPv6, your managed network switches have features designed specifically to stop this. **DHCPv6 Guard and RA (Router Advertisement)** Guard allow you to specify which switch ports are allowed to send DHCPv6 and router advertisement packets. This prevents a rogue device from acting as a server.

3. **Prefer IPv4 over IPv6**: While not a complete fix, you can use Group Policy to change Windows' default behavior and make it prefer IPv4. This makes the environment far less susceptible to this specific attack vector.

4. **Enable LDAP Signing and Channel Binding**: Just like with SMB, requiring digital signatures on LDAP traffic can help mitigate the final relay to the Domain Controller, making it harder for the attacker to manipulate Active Directory.

`mitm6` is a powerful reminder that sometimes the biggest vulnerabilities lie not in a single piece of software, but in the insecure interaction between protocols. Stay vigilant, and don't let the ghost of IPv6 haunt your network.