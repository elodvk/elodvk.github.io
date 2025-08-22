---
title: "01 - Network Enumeration with Nmap"
---

## Enumeration

 `Enumeration` is the most critical part of all. The art, the difficulty, and the goal are not to gain access to our target computer. Instead, it is identifying all of the ways we could attack a target we must find.

 It is not just based on the tools we use. They will only do much good if we know what to do with the information we get from them. The tools are just tools, and tools alone should never replace our knowledge and our attention to detail. Here it is much more about actively interacting with the individual services to see what information they provide us and what possibilities they offer us.

 It is essential to understand how these services work and what syntax they use for effective communication and interaction with the different services.

 This phase aims to improve our knowledge and understanding of the technologies, protocols, and how they work and learn to deal with new information and adapt to our already acquired knowledge. Enumeration is collecting as much information as possible. The
 more information we have, the easier it will be for us to find vectors of attack.

Imagine the following situation:

Our partner is not at home and has misplaced our car keys. We call our partner and ask where the keys are. If we get an answer like "in the living room," it is entirely unclear and can take much time to find them there. However, what if our partner tells us something like "in the living room on the white shelf, next to the TV, in the third drawer"? As a result, it will be much easier to find them.

It's not hard to get access to the target system once we know how to do it. Most of the ways we can get access we can narrow down to the following two points:

 - Functions and/or resources that allow us to interact with the target and/or provide additional information.
 - Information that provides us with even more important information to access our target.

When scanning and inspecting, we look exactly for these two possibilities. Most of the information we get comes from misconfigurations or neglect of security for the respective services. Misconfigurations are either the result of ignorance or a wrong security mindset.

For example, if the administrator only relies on the firewall, Group Policy Objects (GPOs), and continuous updates, it is often not enough to secure the network.

`Enumeration is the key.`

That's what most people say, and they are right. However, it is too often misunderstood. Most people understand that they haven't tried all the tools to get the information they need. Most of the time, however, it's not the tools we haven't tried, but rather the fact that we don't know how to interact with the service and what's relevant. 

That's precisely the reason why so many people stay stuck in one spot and don't get ahead. Had these people invested a couple of hours learning more about the service, how it works, and what it is meant for, they would save a few hours or even days from reaching their goal and get access to the system.

`Manual enumeration` is a `critical` component. Many scanning tools simplify and accelerate the process. However, these cannot always bypass the security measures of the services. The easiest way to illustrate this is to use the following example:

Most scanning tools have a timeout set until they receive a response from the service. If this tool does not respond within a specific time, this service/port will be marked as closed, filtered, or unknown. In the last two cases, we will still be able to work with it. However, if a port is marked as closed and Nmap doesn't show it to us, we will be in a bad situation. This service/port may provide us with the opportunity to find a way to access the system. Therefore, this result can take much unnecessary time until we find it.

## Introduction to Nmap

Network Mapper ( `Nmap` ) is an open-source network analysis and security auditing tool written in C, C++, Python, and Lua. It is designed to scan networks and identify which hosts are available on the network using raw packets, and services and applications, including the name and version, where possible. It can also identify the operating systems and versions of these hosts. Besides other features, Nmap also offers scanning capabilities that can determine if packet filters, firewalls, or intrusion detection systems (IDS) are configured as needed.

---

## Use Cases

The tool is one of the most used tools by network administrators and IT security specialists. It is used to:

 - Audit the security aspects of networks
 - Simulate penetration tests
 - Check firewall and IDS settings and configurations
 - Types of possible connections
 - Network mapping
 - Response analysis
 - Identify open ports
 - Vulnerability assessment as well

---

## Nmap Architecture

Nmap offers many different types of scans that can be used to obtain various results about our targets. Basically, Nmap can be divided into the following scanning techniques:
 - Host discovery
 - Port scanning
 - Service enumeration and detection
 - OS detection
 - Scriptable interaction with the target service (Nmap Scripting Engine)

 ## Syntax

The syntax for Nmap is fairly simple and looks like this:

```shell
 nmap <scan types> <options> <target>
```

## Scan Techniques

Nmap offers many different scanning techniques, making different types of connections and using differently structured packets to send.

Here we can see all the scanning techniques Nmap offers:

```shell
nmap --help
SCAN TECHNIQUES:
  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans
  -sU: UDP Scan
  -sN/sF/sX: TCP Null, FIN, and Xmas scans
  --scanflags <flags>: Customize TCP scan flags
  -sI <zombie host[:probeport]>: Idle scan
  -sY/sZ: SCTP INIT/COOKIE-ECHO scans
  -sO: IP protocol scan
  -b <FTP relay host>: FTP bounce scan
 <SNIP>
```

For example, the TCP-SYN scan ( -sS ) is one of the default settings unless we have defined otherwise and is also one of the most popular scan methods. This scan method makes it possible to scan several thousand ports per second. The TCP-SYN scan sends one packet with the SYN flag and, therefore, never completes the three-way handshake, which results in not establishing a full TCP connection to the scanned port.

 - If our target sends a `SYN-ACK` flagged packet back to us, Nmap detects that the port is `open`.
 - If the target responds with an `RST` flagged packet, it is an indicator that the port is `closed` .
 - If Nmap does not receive a packet back, it will display it as `filtered` . Depending on the firewall configuration, certain packets may be dropped or ignored by the firewall.

Let us take an example of such a scan.

```shell
nmap -sS 192.168.1.1 
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-04 11:47 EDT
Nmap scan report for 192.168.1.1
Host is up (0.0047s latency).
Not shown: 991 closed tcp ports (reset)
PORT    STATE    SERVICE
22/tcp  filtered ssh
23/tcp  filtered telnet
53/tcp  open     domain
80/tcp  open     http
139/tcp open     netbios-ssn
443/tcp open     https
445/tcp open     microsoft-ds
515/tcp open     printer
631/tcp open     ipp
MAC Address: 14:33:75:EE:2E:D0 (Zyxel Communications)

Nmap done: 1 IP address (1 host up) scanned in 1.39 seconds
```

In this example, we can see that we have seven different TCP ports open. In the first column, we see the number of the port. Then, in the second column, we see the service's status and then what kind of service it is.

## Host Discovery

When we need to conduct an internal penetration test for the entire network of a company, for example, then we should, first of all, get an overview of which systems are online that we can work with.

To actively discover such systems on the network, we can use various Nmap host discovery options. There are many options 
Nmap provides to determine whether our target is alive or not. The most effective host discovery method is to use **ICMP echo requests**, which we will look into.

It is always recommended to store every single scan. This can later be used for comparison, documentation, and reporting. After all, different tools may produce different results. Therefore it can be beneficial to distinguish which tool produces which results.

### Scan Network Range

```shell
nmap 192.168.1.0/24 -sn -oA tnet | grep for | cut -d" " -f5
192.168.1.1
192.168.1.8
192.168.1.10
192.168.1.5
```

| **Scanning Options** | **Description**                                                  |
|-----------------------|------------------------------------------------------------------|
| 192.168.1.0/24        | Target network range.                                            |
| -sn                   | Disables port scanning                                           |
| -oA                   | Stores the results in all formats starting with the name 'tnet'. |

This scanning method works only if the firewalls of the hosts allow it. Otherwise, we can use other scanning techniques to find out if the hosts are active or not. We will take a closer look at these techniques in "`Firewall and IDS Evasion`".

###  Scan IP List

During an internal penetration test, it is not uncommon for us to be provided with an IP list with the hosts we need to test. `Nmap` also gives us the option of working with lists and reading the hosts from this list instead of manually defining or typing them in.

Such a list could look something like this:

```shell
cat hosts.list 
192.168.1.8
192.168.1.10
192.168.1.5
```

If we use the same scanning technique on the predefined list, the command will look like this:

```shell
nmap -sn -oA tnet -iL hosts.list | grep for | cut -d" " -f5 
192.168.1.8
192.168.1.10
192.168.1.5
```

| **Scanning Options** | **Description**                                                  |
|-----------------------|------------------------------------------------------------------|
| -iL      |  Performs defined scans against targets in provided 'hosts.lst' list                                           |
| -sn                   | Disables port scanning                                           |
| -oA                   | Stores the results in all formats starting with the name 'tnet'. |

In this example, we see that only 3 of 3 hosts are active. Remember, this may mean that the other hosts ignore the default ICMP echo requests because of their firewall configurations.
Since Nmap does not receive a response, it marks those hosts as inactive.

### Scan Multiple IPs

It can also happen that we only need to scan a small part of a network. An alternative to the method we used last time is to specify multiple IP addresses.

```shell
nmap -sn -oA tnet 192.168.1.5 192.168.1.10| grep for | cut -d" " -f5

192.168.1.5
192.168.1.10
```

If these IP addresses are next to each other, we can also define the range in the respective octet.

```shell
nmap -sn -oA tnet 192.168.1.5-8| grep for | cut -d" " -f5

192.168.1.5
192.168.1.8
```

### Scan Single IP

Before we scan a single host for open ports and its services, we first have to determine if it is alive or not. For this, we can use the same method as before.

```shell
nmap 192.168.1.10 -sn -oA host
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-04 12:24 EDT
Nmap scan report for 192.168.1.10
Host is up (0.00024s latency).
MAC Address: B0:A4:60:05:55:50 (Intel Corporate)
Nmap done: 1 IP address (1 host up) scanned in 0.09 seconds
```

| **Scanning Options** | **Description**                                                  |
|-----------------------|------------------------------------------------------------------|
| 192.168.1.10     |   Performs defined scans against the target
| -sn                   | Disables port scanning                                           |
| -oA host                 | Stores the results in all formats starting with the name 'host'.|

If we disable port scan ( `-sn` ), Nmap automatically ping scan with `ICMP Echo Requests` ( `PE` ). Once such a request is sent, we usually expect an  `ICMP reply` if the pinging host is alive. The more interesting fact is that our previous scans did not do that because before Nmap could send an ICMP echo request, it would send an `ARP ping` resulting in an `ARP reply` . We can confirm this with the " `ARP--packet-trace` " option. To ensure that ICMP echo requests are sent, we also define the option ( `-PE` ) for this.

```shell
nmap 172.17.1.100 -sn -oA host -PE --packet-trace
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 01:37 EDT
SENT (0.0172s) ARP who-has 172.17.1.100 tell 172.17.1.12
RCVD (0.0175s) ARP reply 172.17.1.100 is-at 00:0C:29:16:3F:0B
NSOCK INFO [0.0800s] nsock_iod_new2(): nsock_iod_new (IOD #1)
NSOCK INFO [0.0810s] nsock_connect_udp(): UDP connection requested to 172.17.1.100:53 (IOD #1) EID 8
NSOCK INFO [0.0810s] nsock_read(): Read request from IOD #1 [172.17.1.100:53] (timeout: -1ms) EID 18
NSOCK INFO [0.0810s] nsock_iod_new2(): nsock_iod_new (IOD #2)
NSOCK INFO [0.0810s] nsock_connect_udp(): UDP connection requested to 8.8.8.8:53 (IOD #2) EID 24
NSOCK INFO [0.0810s] nsock_read(): Read request from IOD #2 [8.8.8.8:53] (timeout: -1ms) EID 34
NSOCK INFO [0.0810s] nsock_write(): Write request for 43 bytes to IOD #1 EID 43 [172.17.1.100:53]
NSOCK INFO [0.0810s] nsock_trace_handler_callback(): Callback: CONNECT SUCCESS for EID 8 [172.17.1.100:53]
NSOCK INFO [0.0810s] nsock_trace_handler_callback(): Callback: WRITE SUCCESS for EID 43 [172.17.1.100:53]
NSOCK INFO [0.0810s] nsock_trace_handler_callback(): Callback: CONNECT SUCCESS for EID 24 [8.8.8.8:53]
NSOCK INFO [0.0810s] nsock_trace_handler_callback(): Callback: READ SUCCESS for EID 18 [172.17.1.100:53] (43 bytes): >h...........100.1.17.172.in-addr.arpa.....
NSOCK INFO [0.0810s] nsock_read(): Read request from IOD #1 [172.17.1.100:53] (timeout: -1ms) EID 50
NSOCK INFO [0.0810s] nsock_iod_delete(): nsock_iod_delete (IOD #1)
NSOCK INFO [0.0810s] nevent_delete(): nevent_delete on event #50 (type READ)
NSOCK INFO [0.0810s] nsock_iod_delete(): nsock_iod_delete (IOD #2)
NSOCK INFO [0.0810s] nevent_delete(): nevent_delete on event #34 (type READ)
Nmap scan report for 172.17.1.100
Host is up (0.00026s latency).
MAC Address: 00:0C:29:16:3F:0B (VMware)
Nmap done: 1 IP address (1 host up) scanned in 0.11 seconds

```

| Scanning Options  | Description                                                      |
|-------------------|------------------------------------------------------------------|
| 172.17.1.100    | Performs defined scans against the target                        |
| -sn               | Disables port scanning.                                          |
| -oA host          | Stores the results in all formats starting with the name 'host'  |
| -PE               | Performs the ping scan by using 'ICMP Echo requests' against the |
| --packet-trace    | Shows all packets sent and received                              |


Another way to determine why Nmap has our target marked as "alive" is with the " `--reason` " option.

```shell
nmap 172.17.1.100 -sn -oA host -PE --reason      
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 01:38 EDT
Nmap scan report for 172.17.1.100
Host is up, received arp-response (0.00057s latency).
MAC Address: 00:0C:29:16:3F:0B (VMware)
Nmap done: 1 IP address (1 host up) scanned in 0.16 seconds
```

| Scanning Options  | Description                                                      |
|-------------------|------------------------------------------------------------------|
| 172.17.1.100     | Performs defined scans against the target                        |
| -sn               | Disables port scanning.                                          |
| -oA host          | Stores the results in all formats starting with the name 'host'  |
| -PE               | Performs the ping scan by using 'ICMP Echo requests' against the |
| --reason    | Displays the reason for specific result                            |

We see here that `Nmap` does indeed detect whether the host is alive or not through the `ARP request` and `ARP reply` alone. To disable ARP requests and scan our target with the desired `ICMP echo requests`, we can disable ARP pings by setting the " `disable-arp-ping` " option. Then we can scan out target again and look at the packets sent and recieved.

```shell
nmap 172.17.1.100 -sn -oA host -PE --packet-trace --disable-arp-ping
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 01:38 EDT
SENT (0.0093s) ICMP [172.17.1.12 > 172.17.1.100 Echo request (type=8/code=0) id=59144 seq=0] IP [ttl=51 id=32978 iplen=28 ]
RCVD (0.0099s) ICMP [172.17.1.100 > 172.17.1.12 Echo reply (type=0/code=0) id=59144 seq=0] IP [ttl=128 id=56367 iplen=28 ]
NSOCK INFO [0.0440s] nsock_iod_new2(): nsock_iod_new (IOD #1)
NSOCK INFO [0.0440s] nsock_connect_udp(): UDP connection requested to 172.17.1.100:53 (IOD #1) EID 8
NSOCK INFO [0.0440s] nsock_read(): Read request from IOD #1 [172.17.1.100:53] (timeout: -1ms) EID 18
NSOCK INFO [0.0440s] nsock_iod_new2(): nsock_iod_new (IOD #2)
NSOCK INFO [0.0440s] nsock_connect_udp(): UDP connection requested to 8.8.8.8:53 (IOD #2) EID 24
NSOCK INFO [0.0440s] nsock_read(): Read request from IOD #2 [8.8.8.8:53] (timeout: -1ms) EID 34
NSOCK INFO [0.0440s] nsock_write(): Write request for 43 bytes to IOD #1 EID 43 [172.17.1.100:53]
NSOCK INFO [0.0440s] nsock_trace_handler_callback(): Callback: CONNECT SUCCESS for EID 8 [172.17.1.100:53]
NSOCK INFO [0.0440s] nsock_trace_handler_callback(): Callback: WRITE SUCCESS for EID 43 [172.17.1.100:53]
NSOCK INFO [0.0440s] nsock_trace_handler_callback(): Callback: CONNECT SUCCESS for EID 24 [8.8.8.8:53]
NSOCK INFO [0.0450s] nsock_trace_handler_callback(): Callback: READ SUCCESS for EID 18 [172.17.1.100:53] (43 bytes): Z............100.1.17.172.in-addr.arpa.....
NSOCK INFO [0.0450s] nsock_read(): Read request from IOD #1 [172.17.1.100:53] (timeout: -1ms) EID 50
NSOCK INFO [0.0450s] nsock_iod_delete(): nsock_iod_delete (IOD #1)
NSOCK INFO [0.0450s] nevent_delete(): nevent_delete on event #50 (type READ)
NSOCK INFO [0.0450s] nsock_iod_delete(): nsock_iod_delete (IOD #2)
NSOCK INFO [0.0450s] nevent_delete(): nevent_delete on event #34 (type READ)
Nmap scan report for 172.17.1.100
Host is up (0.00073s latency).
MAC Address: 00:0C:29:16:3F:0B (VMware)
Nmap done: 1 IP address (1 host up) scanned in 0.08 seconds
```

We have already mentioned in the " `Learning Process ,`" and at the beginning of this module, it is essential to pay attention to details. An ICMP echo request can help us determine if our target is alive and identify its system. More strategies about host discovery can be found at:

https://nmap.org/book/host-discovery-strategies.htm

---

## Host and Port Scanning

It is essential to understand how the tool we use works and how it performs and processes the different functions. We will only understand the results if we know what they mean and how they are obtained. Therefore we will take a closer look at and analyze some of the scanning methods.

After we have found out that our target is alive, we want to get a more accurate picture of the system. The information we need includes:

 - Open ports and its services
 - Service versions
 - Information that the services provided
 - Operating system

 There are a total of 6 different states for a scanned port we can obtain:

| **State**  | **Description**                                                                                                                                                                                           |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| open       | This indicates that the connection to the scanned port has been   established. These connections can be TCP connections, UDP datagrams as well   as SCTP associations.                                    |
| closed     | When the port is shown as closed, the TCP protocol indicates that the   packet we received back contains an RST flag. This scanning method can also   be used to determine if our target is alive or not. |
| filtered   | Nmap cannot correctly identify whether the scanned port is open or closed   because either no response is returned from the target for the port or we get   an error code from the target.                |
| unfiltered | This state of a port only occurs during the TCP-ACK scan and means that   the port is accessible, but it cannot be determined whether it is open or   closed.                                             |
| `open      | filtered`                                                                                                                                                                                                 |
| `closed    | filtered`                                                                                                                                                                                                 |

---

## Discovering Open TCP Ports

By default, `Nmap` scans the top 1000 TCP ports with the SYN scan ( `-sS` ). This SYN scan is set only to default when we run it as root because of the socket permissions required to create raw TCP packets. Otherwise, the TCP scan ( -sT ) is performed by default. This means that if we do not define ports and scanning methods, these parameters are set automatically.

We can define the ports one by one ( `-p 22,25,80,139,445` ), by range ( `-p 22-445` ), by top ports ( `--top-ports=10` ) from the Nmap database that have been signed as most frequent, by scanning all ports ( `-p-` ) but also by defining a fast port scan, which contains top 100 ports ( `-F` ).


###  Scanning Top 10 TCP Ports


```shell
sudo nmap 172.17.1.100 --top-ports=10
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 02:16 EDT
Nmap scan report for 172.17.1.100
Host is up (0.0013s latency).

PORT     STATE    SERVICE
21/tcp   filtered ftp
22/tcp   filtered ssh
23/tcp   filtered telnet
25/tcp   filtered smtp
80/tcp   filtered http
110/tcp  filtered pop3
139/tcp  open     netbios-ssn
443/tcp  filtered https
445/tcp  open     microsoft-ds
3389/tcp closed   ms-wbt-server

Nmap done: 1 IP address (1 host up) scanned in 1.36 seconds
```

| **Scanning Options** | **Description**                                                        |
|----------------------|------------------------------------------------------------------------|
| 172.17.1.100         | Scans the specified target.                                            |
| --top-ports=10       | Scans the specified top ports that have been defined as most frequent. |

We see that we only scanned the top 10 TCP ports of our target, and state accordingly. If we trace the packets `Nmap` sends, we will see the `RST` flag on  `TCP port 3389` that our target sends back to us. To have a clear view of the SYN scan, we disable the ICMP echo requests ( -Pn ), DNS resolution ( -n ), and ARP ping scan (--disable-arp-ping ).

### Nmap - Trace the Packets

```shell
sudo nmap 172.17.1.100 -p3389 --packet-trace -Pn -n --disable-arp-ping
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 02:19 EDT
SENT (0.0461s) TCP 172.18.1.11:33179 > 172.17.1.100:3389 S ttl=58 id=27692 iplen=44  seq=3187128378 win=1024 <mss 1460>
RCVD (0.0467s) TCP 172.17.1.100:3389 > 172.18.1.11:33179 RA ttl=64 id=0 iplen=40  seq=0 win=0 
Nmap scan report for 172.17.1.100
Host is up (0.00066s latency).

PORT     STATE  SERVICE
3389/tcp closed ms-wbt-server

Nmap done: 1 IP address (1 host up) scanned in 0.08 seconds
```

| **Scanning Options** | **Description**                      |
|----------------------|--------------------------------------|
| 172.17.1.100         | Scans the specified target.          |
| -p3389               | Scans only the specified port.       |
| --packet-trace       | Shows all packets sent and received. |
| -n                   | Disables DNS resolution.             |
| --disable-arp-ping   | Disable ARP ping.                    |

We can see from the SENT line that we ( `172.18.1.11` ) sent a TCP packet with the `SYN` flag ( `S` ) to our target ( 172.17.1.100 ). In the next `RCVD` line, we can see that the targe responds with a TCP packet containing the `RST` and `ACK` flags ( `RA` ). `RST` and `ACK` flags ( `RA` ) are used to acknowledge receipt of the TCP packet ( `ACK` ) and to end the TCP session ( `RST` ).


#### Request

| **Message**              | **Description**                                                                                  |
|--------------------------|--------------------------------------------------------------------------------------------------|
| SENT (0.0461s)           | Indicates the SENT operation of Nmap, which sends a packet to the target.                        |
| TCP                      | Shows the protocol that is being used to interact with the target port.                          |
| 172.18.1.11:33179        | Represent our IPv4 address and the source port, which will be used by Nmap to send the packets.  |
| 172.17.1.100:3389        | Shows the target IPv4 address and the target port.                                               |
| S                        | SYN flag of the send TCP packet.                                                                 |
| ttl=58 id=27692 iplen=44  seq=3187128378 win=1024... | Additional TCP Header paramters.                                                                 |


#### Response

| **Message**          | **Description**                                                                     |
|----------------------|-------------------------------------------------------------------------------------|
| RCVD (0.0467s)       | Indicates a received packet from the target.                                        |
| TCP                  | Shows the protocol that is being used.                                              |
| 172.17.1.100:3389    | Represents target's IPv4 address and the source port, which will be used to reply.  |
| 172.18.1.11:33179    | Shows our IPv4 address and the port that will be replied to.                        |
| RA                   | RST and ACK flags of the sent TCP packet.                                           |
| ttl=64 id=0 iplen=40... | Additional TCP Header paramters.                                                    |


###  Connect Scan

The Nmap TCP Connect Scan ( `-sT` ) uses the TCP three-way handshake to determine if a specific port on a target host is open or closed. The scan sends an `SYN` packet to the target port and waits for a response. It is considered open if the target port responds with an `SYN-ACK` packet and closed if it responds with an `RST` packet.

The `Connect` scan (also known as a full TCP connect scan) is highly accurate because it completes the three-way TCP handshake, allowing us to determine the exact state of a port (open, closed, or filtered). However, it is not the most stealthy. In fact, the Connect scan is one of the least stealthy techniques, as it fully establishes a connection, which creates logs on most systems and is easily detected by modern IDS/IPS solutions. That said, the Connect scan can still be useful in certain situations, particularly when accuracy is a priority, and the goal is to map the network without causing significant disruption to services. Since the scan fully establishes a TCP connection, it interacts cleanly with services, making it less likely to cause service errors or instability compared to more intrusive scans. While it is not the most stealthy method, it is sometimes considered a more "polite" scan because it behaves like a normal client connection, thus having minimal impact on the target services.

It is also useful when the target host has a personal firewall that drops incoming packets but allows outgoing packets. In this case, a Connect scan can bypass the firewall and accurately determine the state of the target ports. However, it is important to note that the Connect scan is slower than other types of scans because it requires the scanner to wait for a response from the target after each packet it sends, which could take some time if the target is busy or unresponsive.

Scans like the SYN scan (also known as a half-open scan) are generally considered more stealthy because they do not complete the full handshake, leaving the connection incomplete after sending the initial SYN packet. This minimizes the chance of triggering connection logs while still gathering port state information. Advanced IDS/IPS systems, however, have adapted to detect even these subtler techniques.

#### Connect Scan on TCP Port 389

```shell
sudo nmap 172.17.1.100 -p389 --packet-trace -Pn -n --disable-arp-ping --reason -sT
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-05 03:09 EDT
CONN (0.0233s) TCP localhost > 172.17.1.100:389 => Operation now in progress
CONN (0.0254s) TCP localhost > 172.17.1.100:389 => Connected
Nmap scan report for 172.17.1.100
Host is up, received user-set (0.0022s latency).

PORT    STATE SERVICE REASON
389/tcp open  ldap    syn-ack

Nmap done: 1 IP address (1 host up) scanned in 0.03 seconds
```
