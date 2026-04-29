// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';


// https://astro.build/config
export default defineConfig({
	site: 'https://elodvk.github.io',
	integrations: [
		starlight({
			title: 'PurpleSec',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://avatars.githubusercontent.com/elodvk' }],
			plugins: [
				starlightBlog({
					authors: {
						elodvk: {
							name: 'Bilash J. Shahi',
							title: 'Cybersecurity enthusiast',
							picture: "https://avatars.githubusercontent.com/elodvk",
							url: 'https://github.com/elodvk',
						},
					},
				}),
			],

			customCss: ['./src/styles/custom.css'],

			sidebar: [
				{
					label: 'Active Directory',
					items: [
						{ label: 'Getting Started', slug: 'active_directory' },
						{
							label: 'Initial Attack Vectors',
							items: [
								{ label: 'LLMNR & NBT-NS Poisioning', slug: 'active_directory/initial-attack-vectors/llmnr-poisioning' },
								{ label: 'SMB Relay Attack', slug: 'active_directory/initial-attack-vectors/smb-relay' },
								{ label: 'IPv6 DNS Takeover via mitm6', slug: 'active_directory/initial-attack-vectors/mitm6' },
							],
						},
						{
							label: 'Post Compromise Enumeration',
							items: [
								{ label: 'Domain Enumeration with Bloodhound', slug: 'active_directory/post-compromise-enumeration/bloodhound' },
								{ label: 'Domain Enumeration with ldapdomaindump', slug: 'active_directory/post-compromise-enumeration/ldapdomaindump' },
								{ label: 'Domain Enumeration with PingCastle', slug: 'active_directory/post-compromise-enumeration/pingcastle' },
							],
						},
						{
							label: 'Post Compromise Attacks',
							items: [
								{ label: 'Dumping & Cracking Hashes', slug: 'active_directory/post-compromise-attacks/dumping--cracking-hashes' },
								{ label: 'GPP & cPassword', slug: 'active_directory/post-compromise-attacks/gpp' },
								{ label: 'Kerberoasting 🔥', slug: 'active_directory/post-compromise-attacks/kerberoasting' },
								{ label: 'LNK File Attacks', slug: 'active_directory/post-compromise-attacks/lnk-file-attacks' },
								{ label: 'Credential Dumping with Mimikatz', slug: 'active_directory/post-compromise-attacks/mimikatz-cred-dumping' },
								{ label: 'Token Impersonation', slug: 'active_directory/post-compromise-attacks/token-impersonation' },
							],
						},
						{
							label: 'Post Domain Compromise',
							items: [
								{ label: 'Dumping the NTDS.dit', slug: 'active_directory/post-domain-compromise/dump-ntdsdit' },
								{ label: 'Golden Ticket', slug: 'active_directory/post-domain-compromise/golden-ticket' },
							],
						},
						{
							label: 'Important AD Attacks',
							items: [
								{ label: 'Pass the Hash', slug: 'active_directory/imp_attacks/pth' },
							],
						},
					],
				},
			],
		}),
	],
});
