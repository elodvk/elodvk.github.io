# BadSuccessor — Snoop Dogg Style

[section:Introduction]

Yo what's good everybody, it's ya boy coming at you with another episode and today we talkin about some real gangsta stuff in the Active Directory world. We got a vulnerability called BadSuccessor. CVE-2025-53779. And let me tell you, this thing is smoother than a Cadillac on Crenshaw.

[pause:2]

Some researcher over at Akamai, homie named Yuval Gordon, found a way to take over an entire Windows domain. And he didn't need no fancy zero-day exploit. No buffer overflow. No kernel bug. Just a few LDAP attributes and the KDC straight up handed him the keys like a valet at a five-star hotel. Fo shizzle.

[pause:1.5]

Now Microsoft, they looked at this and said it was moderate severity. Moderate! Man, that's like calling a drive-by a minor inconvenience. The whole security community was heated. Let me break it down for you.

[pause:2]

[section:Background]

## Service Accounts Through the Years — A Long Strange Trip

Aight so check it. To understand why this is a big deal, you gotta know the history. Windows service accounts been a mess since day one, cuz.

[pause:1]

Back in the day, before 2008, everybody was running services under regular old user accounts. You'd make an account called svc underscore sql, slap a password on it, and forget about it for years. Same password on every server. Mimikatz could pull that thing from memory faster than I can roll a... you know what, let's keep it professional.

[pause:1.5]

Then Microsoft dropped standalone Managed Service Accounts. Automatic password rotation. Cool. But they only worked on one server. Then Group Managed Service Accounts in 2012. Works across multiple servers. But any authorized host could read the password from the directory. And all of em were still getting Kerberoasted. Any user on the domain could request a ticket and crack it offline. That's like leaving your car running in Compton.

[pause:1.5]

So Microsoft needed something new. Something fresh. And they came up with the delegated Managed Service Account in Windows Server 2025. The dMSA. And it was supposed to be the answer to everything. The KDC handles all the keys, nobody else touches em. Beautiful idea. Beautiful.

[pause:1]

But it had a migration feature. And that's where things went sideways.

[pause:2]

[section:The Exploit]

## How This Thing Works — Smooth Criminal Style

Now listen up cuz this is the good part. The dMSA has this feature where you can link it to an old service account. Like a succession plan. The old account retires, the dMSA takes over. Two LDAP attributes control this. One says who you're replacing. The other says whether the migration is done.

[pause:1]

The design assumed only admins would touch these attributes. Man, you know what happens when you assume.

[pause:1.5]

Here's the play. Step one, find an OU where you got CreateChild permissions. Akamai says 91 percent of environments got at least one spot where a regular user can create objects. Ninety-one percent! That's basically everybody.

[pause:1]

Step two, create yourself a dMSA in that OU. AD automatically gives you full control over anything you create. That's just how it works.

[pause:1]

Step three, and this is where it gets real gangsta. You set the predecessor link to point at the Domain Admin account. Then you set the state to completed. You're telling the KDC, yo, I'm the new Domain Admin now. Migration's done. Hook me up.

[pause:1.5]

Step four, request a TGT. And the KDC, bless its heart, reads your dMSA, sees the completed migration, fetches the Domain Admin's entire security context, builds a PAC with all the admin's privileges, and hands it to you. No questions asked. No ID check. No verification whatsoever.

[pause:1]

It's like walking into a bank, pointing at the CEO's office, saying I'm his replacement, and the bank just hands you the vault keys. That's BadSuccessor, baby.

[pause:1.5]

After that? Pass the ticket. DCSync. Golden ticket. Full domain compromise. Game over. The whole domain is yours like it's 1993 and you just went platinum.

[pause:2]

[section:Microsoft Response]

## Microsoft's Response — They Tripped

So when Akamai told Microsoft about this, what did Microsoft do? They called it moderate severity. Moderate! And said they'd get around to patching it eventually. No rush.

[pause:1]

The community went off. Akamai pointed out that 91 percent of environments are vulnerable out of the box. SpecterOps said this is easier than Kerberoasting, which ransomware gangs already use every single day. Semperis told customers to treat it as critical no matter what Microsoft says.

[pause:1.5]

Microsoft eventually patched it in August 2025. The fix is simple. The KDC now checks whether the person who set up the migration link actually had write access to the target account. That's it. One authorization check. Should have been there from the start.

[pause:1]

But wait, there's more. Researchers at Huntress found that even after patching, you can still abuse dMSAs for persistence with something called the Ouroboros technique. The dMSA authorizes itself in a loop. Patch don't stop it if the attacker was already in before you patched. You gotta audit every dMSA object manually.

[pause:2]

[section:What To Do]

## What You Need to Do — Real Talk

Aight so here's the game plan if you running Windows Server 2025.

[pause:1]

First, patch everything. KB5063878. Every single domain controller. One unpatched DC and the whole thing is exploitable.

[pause:1]

Second, run Akamai's scanner and find every OU where non-admins have CreateChild permissions. Clean that up. Most of those delegations are from years ago and nobody remembers why they're there.

[pause:1]

Third, if you ain't using dMSAs, lock down creation to Domain Admins only.

[pause:1]

Fourth, enable directory service change auditing. Watch for Event ID 5137, that's dMSA creation. Watch for 5136, that's attribute changes. If you see both within five minutes from the same user, something's going down.

[pause:1.5]

And fifth, audit every existing dMSA in your environment for the Ouroboros technique. Check for self-referencing msDS-GroupMSAMembership and shadow credentials. If you find one, delete it immediately and investigate how it got there.

[pause:2]

[section:Closing]

## Wrapping It Up

BadSuccessor is what happens when you trust LDAP attributes without verifying who wrote em. No exploit code needed. No shellcode. No memory corruption. Just a logic flaw that lets any low-privilege user become Domain Admin in about two minutes flat.

[pause:1]

Patch your stuff. Audit your permissions. Watch your logs. And remember, in Active Directory, trust is the most dangerous thing you can give away.

[pause:1.5]

That's the episode, y'all. Stay safe out there. And if your domain gets popped because you didn't patch, don't come crying to me. I tried to warn you. Peace. Deuces.
