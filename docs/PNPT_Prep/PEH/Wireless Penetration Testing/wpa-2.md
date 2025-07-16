---
title: "Cracking WPA2-PSK: The Art of Stealing Airwaves"
sidebar_position: 1
---

You're on a physical pentest engagement. You're sitting in the parking lot, and the corporate Wi-Fi network is calling to you. It's protected by WPA2-PSK, which means there's a single password (a pre-shared key) for everyone. If you can get that password, you can get on the internal network.

This is where the classic **WPA2 Handshake Capture Attack** comes in. The goal is simple: we will force a device to connect to the Wi-Fi network, capture the encrypted "handshake" that happens when it connects, and then take that handshake offline to crack the password.

Think of it like this: The Wi-Fi password is a secret passphrase. When a new device wants to join the network, it and the Wi-Fi router exchange a series of coded messages (the handshake) to prove they both know the passphrase, without ever saying it out loud. We're going to use a special microphone to record those coded messages. Then, we'll take that recording back to our lab and try every passphrase we can think of until our version of the coded message matches the recording.

---

## The "Why": The Four-Way Handshake

The security of WPA2-PSK relies on a process called the **Four-Way Handshake**. When a device connects, four packets are exchanged to generate a unique encryption key for that session. This key is derived from a few things, including the Wi-Fi network's name (SSID) and, most importantly, the Wi-Fi password (the PSK).

The vulnerability isn't in the encryption itself, which is strong. The vulnerability is that we can **capture this handshake** from the air. The handshake contains all the necessary information for us to launch an **offline brute-force attack**. We can guess a password, run it through the same key derivation function, and see if our result matches what we captured. If it does, we've found the password.

---

## The Heist: A Walkthrough with the Aircrack-ng Suite

For this attack, you'll need a Linux machine (like Kali Linux) and a wireless network adapter that supports **monitor mode**. The go-to toolset is the legendary **Aircrack-ng suite**.

### **Step 1: Put Your Wi-Fi Card in Monitor Mode**

First, you need to turn your Wi-Fi card from a client into a promiscuous listener that can sniff all Wi-Fi traffic in the air.

```bash
# 1. Identify your wireless interface (e.g., wlan0)
sudo iwconfig

# 2. Start monitor mode using airmon-ng
sudo airmon-ng start wlan0

# 3. A new interface, like wlan0mon, will be created. Use this for the next steps.

```

### Step 2: Find Your Target Network

Now, use `airodump-ng` to scan the air for all nearby Wi-Fi networks.

```shell
# Listen on your monitor mode interface
sudo airodump-ng wlan0mon

```

You'll see a list of all networks, their BSSID (the MAC address of the router), their channel, and their ESSID (the human-readable network name). Find your target network, and note its **BSSID** and **channel**.

### Step 3: Capture the Handshake

Now, run `airodump-ng` again, but this time, focus only on your target's channel and save the captured packets to a file.

```shell
# -c [channel]: The channel your target network is on.
# --bssid [BSSID]: The MAC address of the target router.
# -w [filename]: The file to write the capture to (will create capture.cap).
sudo airodump-ng -c 6 --bssid 00:1A:2B:3C:4D:5E -w capture wlan0mon
```

This screen will now show you all the clients connected to that specific network. To get the handshake, a device needs to connect or reconnect. You can either wait for someone to come into the office and connect, or you can force the issue.


### Step 4: Force a Reconnection (The Deauth Attack)

Open a new terminal. We'll use `aireplay-ng` to send a "deauthentication" packet to a connected client. This packet spoofs the router and politely tells the client's device to disconnect. The device will then automatically try to reconnect, performing a new four-way handshake for us to capture.

```shell
# -0 2: The type of deauth attack (0) and to send 2 packets.
# -a [router_bssid]: The BSSID of the router.
# -c [client_bssid]: The BSSID of a connected client, taken from the airodump-ng window.
sudo aireplay-ng -0 2 -a 00:1A:2B:3C:4D:5E -c AA:BB:CC:DD:EE:FF wlan0mon
```

If successful, you will see a message in your original `airodump-ng `window: WPA handshake: `00:1A:2B:3C:4D:5E`. You have now captured the handshake in your capture-01.cap file. You can stop the capture (Ctrl+C).

## The Cracking Process with Hashcat

Now we take the `.cap` file and crack it offline.

### Step 1: Convert the Capture File

Hashcat requires the handshake to be in a specific format (`.hccapx` or `.22000`). You can use the hcxpcapngtool utility to convert it.

```shell
# Convert the .cap file to the hashcat format
hcxpcapngtool -o handshake.hc22000 capture-01.cap
```

### Step 2: Crack with Hashcat

Now, use Hashcat to perform a dictionary attack against the converted handshake file. The hash mode for WPA2 is **22000**.

```shell
# -m 22000 is the mode for WPA2-PSK
hashcat -m 22000 handshake.hc22000 /usr/share/wordlists/rockyou.txt
```

Hashcat will now try every password in `rockyou.txt`. If the network's password is in that list, Hashcat will find it and display it. If not, you'll need a bigger and better wordlist.

## Mitigation

 - **USE A STRONG, LONG PASSWORD.** This is the only defense against this attack. Since the attack is an offline brute-force, its success is entirely dependent on the strength of the password. A weak, dictionary-based password will be cracked in minutes. A long (15+ character), complex, and random password will be practically impossible to crack.