# BadSuccessor: The Windows Server 2025 dMSA Exploit That Shook Active Directory

[section:Introduction]

Welcome back everyone. Today we're covering one of the biggest Active Directory vulnerabilities of 2025. It's called BadSuccessor, CVE-2025-53779, and if you run Windows Server 2025 domain controllers, you need to know about this.

[pause:1.5]

Here's the short version. A researcher at Akamai found a design flaw in Microsoft's new delegated Managed Service Account feature that lets any authenticated user with basic directory permissions achieve full domain compromise in minutes. No password cracking. No brute force. No lateral movement. Just a few LDAP attribute changes and the KDC hands you the keys to the kingdom.

[pause:1.5]

And when Microsoft saw it, they classified it as moderate severity. The security community was not happy about that. Let's dig in.

[pause:2]

[section:Background]

## The History of Service Accounts — A Saga of Pain

To understand why BadSuccessor matters, you need to understand how we got here. Windows service accounts have been a security disaster for decades.

[pause:1]

In the dark ages, before 2008, everyone ran services under standard user accounts. You'd create svc underscore sqlserver, set a password, configure the service, and then forget about it for five years until the password expired at 3 AM on a Saturday and everything broke. The same password was shared across dozens of servers. Mimikatz could pull it from memory in seconds.

[pause:1]

Then Microsoft gave us standalone Managed Service Accounts in 2008 R2. Automatic password rotation. 240-character passwords. Great. But they only worked on a single server.

[pause:1]

Then Group Managed Service Accounts in 2012. Finally worked across multiple servers. But now any host authorized to retrieve the password could read it from the directory. Compromise one host, get the service account for free.

[pause:1]

And all of them were still vulnerable to Kerberoasting. Any authenticated user requests a service ticket, cracks it offline, and you've got the password hash. This has been one of the most common privilege escalation paths in AD for over a decade.

[pause:1.5]

Microsoft needed something fundamentally new. And that's where dMSA comes in.

[pause:2]

[section:The Vulnerability]

## What Microsoft Built — And How It Broke

With Windows Server 2025, Microsoft introduced the delegated Managed Service Account. The big innovation was eliminating the password retrieval primitive entirely. Instead of hosts reading the password from the directory, the KDC mediates everything. The dMSA authenticates, the KDC verifies authorization, and issues a ticket. Nobody ever sees the raw keys except the KDC itself.

[pause:1]

Sounds great in theory. But there's a migration feature. Because organizations have hundreds of legacy service accounts that can't be replaced overnight. So dMSA supports seamless migration. You create a new dMSA, link it to the old account, and the KDC starts issuing tickets that carry the old account's identity.

[pause:1]

Two LDAP attributes control this. msDS-ManagedAccountPrecededByLink, which points to the legacy account being superseded. And msDS-DelegatedMSAState, which tracks whether the migration is in progress or completed.

[pause:1.5]

The design assumption was that only authorized administrators would ever modify these attributes. And that assumption was catastrophically wrong.

[pause:2]

[section:The Exploit]

## How the Attack Actually Works

Here's the attack. It's almost embarrassingly simple.

[pause:1]

Step one. Find an OU where you have CreateChild permissions. According to Akamai's research, 91 percent of enterprise environments have at least one non-admin user with this permission somewhere. It's incredibly common. Help desk accounts, provisioning systems, old delegation from years ago that nobody cleaned up.

[pause:1]

Step two. Create a new dMSA object in that OU. Because you created it, Active Directory gives you full control over it automatically. That's just how AD works.

[pause:1]

Step three. Set the msDS-ManagedAccountPrecededByLink attribute to point at the Domain Admin account. Set msDS-DelegatedMSAState to 2, which means migration completed.

[pause:1]

Step four. Request a TGT for your rogue dMSA.

[pause:1]

Step five. And this is where the magic happens. The KDC reads your dMSA, sees the completed migration link pointing at the Administrator account, fetches the Administrator's security context, builds a PAC with the Administrator's SIDs and keys, and hands you a TGT that carries full Domain Admin privileges.

[pause:1.5]

At no point does the KDC check whether you had any authority over the Administrator account. It just trusts the attribute. It's a pure logic flaw. No memory corruption. No race condition. Just the KDC blindly trusting LDAP attributes that any low-privilege user can write.

[pause:1.5]

From there it's game over. Pass the ticket. DCSync. Golden ticket. Full domain compromise.

[pause:2]

[section:Response]

## Microsoft's Response — And Why Everyone Was Angry

So Akamai reports this to Microsoft before publishing. And Microsoft's response is to classify it as moderate severity. Not critical. Not high. Moderate. And they decline to issue an emergency patch.

[pause:1]

Their reasoning was that it requires an authenticated domain account, requires CreateChild permissions which aren't default for standard users, and only affects environments with Server 2025 DCs. Technically true. Practically meaningless.

[pause:1]

The community pointed out that 91 percent of environments have the required permissions in place. That the attack is simpler than Kerberoasting, which ransomware operators already use daily. That calling this moderate is like calling a loaded gun pointed at your domain controller a minor concern because you have to pull the trigger yourself.

[pause:1.5]

Microsoft eventually patched it in August 2025 Patch Tuesday. The fix adds an authorization check, verifying that whoever set up the migration link actually had write access to the target account. Simple fix. Should have been there from the start.

[pause:2]

[section:Ouroboros]

## The Ouroboros Technique — It Gets Worse After Patching

But here's the twist. Researchers at Huntress published a follow-up finding in October 2025 called Ouroboros. Even on fully patched domain controllers, the dMSA mechanism can still be weaponized for persistence.

[pause:1]

The trick is creating a self-sustaining loop. You plant a shadow credential on the dMSA so it can authenticate with a certificate. Then you write the dMSA's own SID into its msDS-GroupMSAMembership attribute. Now the dMSA authorizes itself. It authenticates as itself, authorizes itself to access the predecessor's keys, gets the ticket, and the loop closes.

[pause:1]

The patch validates authorization at setup time. But Ouroboros manipulates attributes that are checked during ongoing authentication, not initial configuration. The patch doesn't retroactively validate existing dMSA objects.

[pause:1.5]

What this means is that patching alone is not sufficient. You have to actively audit all existing dMSA objects for malicious configurations. If an attacker exploited BadSuccessor before you patched, they may have already planted an Ouroboros loop that will survive indefinitely.

[pause:2]

[section:Detection and Mitigation]

## What You Should Be Doing Right Now

Detection first. You need directory service change auditing enabled on all DCs. Event ID 5137 for dMSA object creation. Event ID 5136 for modifications to the migration attributes. Correlate creation followed by attribute modification within five minutes and you've likely caught an exploitation attempt.

[pause:1]

For mitigation. Number one, audit and remove unnecessary CreateChild permissions on your OUs. Run Akamai's scanner. Export the results. Remove or replace overly broad delegations.

[pause:1]

Number two, if you're not actively using dMSAs, restrict their creation. Lock it down to Domain Admins only.

[pause:1]

Number three, implement tiered administration. Even if someone exploits this, if your Tier 0 assets are properly isolated, the blast radius is contained.

[pause:1]

And number four, patch immediately. The fix is in KB5063878 for Server 2025. But remember, it has to be on ALL domain controllers. One unpatched DC is all an attacker needs.

[pause:2]

[section:Closing]

## Final Thoughts

BadSuccessor is a textbook example of a design flaw that's worse than any buffer overflow. No exploit code needed. No shellcode. No memory corruption. Just a misplaced trust assumption in how the KDC processes LDAP attributes.

[pause:1]

It's also a case study in responsible disclosure gone sideways. Akamai publishing without a patch. Microsoft downplaying severity. The community caught in the middle. And then the Ouroboros technique proving that even the eventual patch wasn't enough.

[pause:1.5]

If you're running Windows Server 2025, you need to patch, audit your dMSA objects, review your OU permissions, and implement detection rules. Don't wait on this one. Thanks for listening, and I'll catch you next time.
