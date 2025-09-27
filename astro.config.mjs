// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightBlog from 'starlight-blog'
import starlightSidebarTopics from 'starlight-sidebar-topics'

export default defineConfig({
	site: 'https://elodvk.github.io',
	integrations: [
		starlight({
			plugins: [
				starlightBlog(),
				starlightSidebarTopics(
					[
						{
							label: 'Home',
							link: '/home/welcome',
							icon: 'open-book',
							items: ['home/welcome'],
						},
						{
							label: 'Opensource Intelligence',
							link: '/osint/email-discovery',
							icon: 'seti:firefox',
							items: [
								{ label: 'Opensource Intelligence', autogenerate: { directory: '/osint' } },
							],
						},
						{
							label: 'Active Directory',
							link: '/active_directory/getting-started',
							icon: 'seti:default',
							items: [
								{ label: 'Getting Started', items: ['active_directory/getting-started'] },
								{ label: 'Initial Attack Vectors', autogenerate: { directory: '/active_directory/01-Initial Attack Vectors' } },
								{ label: 'Post Compromise Enumeration', autogenerate: { directory: '/active_directory/02-Post-Compromise Enumeration' } },
								{ label: 'Post Compromise Attacks', autogenerate: { directory: '/active_directory/03-Post Compromise Attacks' } },
								{ label: 'Post Domain Compromise', autogenerate: { directory: '/active_directory/04-Post Domain Compromise' } },
							],
						},
						{
							label: 'Windows Privilege Escalation',
							link: '/win-priv-esc/getting-started',
							icon: 'seti:windows',
							items: [
								{ label: 'Getting Started', items: ['win-priv-esc/getting-started'] },
							],
						},
						{
							label: 'Linux Privilege Escalation',
							link: '/linux-priv-esc/getting-started',
							icon: 'linux',
							items: [
								{ label: 'Getting Started', items: ['win-priv-esc/getting-started'] },
							],
						},
						{
							label: 'Cheatsheets',
							link: '/cheatsheets/dirbuster',
							icon: 'seti:platformio',
							items: [
								{ label: 'Cheatsheets', autogenerate: { directory: '/cheatsheets' } },
							],
						},
						{
							label: 'Blog',
							link: '/blog/', // Explicitly add blog as a topic
							icon: 'pencil',
						},
					], {
					exclude: ['/docs/blog', '/docs/blog/**', '/blog', '/blog/**'], // Broaden exclusion
				}
				),
			],
			title: 'pentestpath',
			social: [{
				icon: 'github',
				label: 'GitHub',
				href: 'https://github.com/elodvk'
			}, {
				icon: 'linkedin',
				label: 'LinkedIn',
				href: 'https://www.linkedin.com/in/bilash-j-shahi/'
			}, {
				icon: 'youtube',
				label: 'Youtube',
				href: 'https://www.youtube.com/@elodvk'
			}
			],
		}),
	],
});