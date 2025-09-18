// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog'
import starlightImageZoom from 'starlight-image-zoom'
import starlightSidebarTopics from 'starlight-sidebar-topics'


// https://astro.build/config
export default defineConfig({
	site: 'https://elodvk.github.io',
	integrations: [
		starlight({
			plugins: [
				starlightBlog(),
				starlightImageZoom(),
				starlightSidebarTopics(
					[
						{
							label: 'Guides',
							link: '/guides/welcome',
							icon: 'open-book',
							items: ['guides/welcome'],
						},
						{
							label: 'Opensource Intelligence',
							link: '/osint/email-discovery',
							icon: 'seti:firefox',
							items: [
								{ label: 'OSINT', autogenerate: { directory: '/osint' } },
							],
						},
						{
							label: 'Active Directory',
							link: '/active_directory/getting-started',
							icon: 'seti:powershell',
							items: [
								{ label: 'Getting Started', items: ['active_directory/getting-started'] },
								{ label: 'Initial Attack Vectors', autogenerate: { directory: '/active_directory/01-Initial Attack Vectors' } },
								{ label: 'Post Compromise Enumeration', autogenerate: { directory: '/active_directory/02-Post-Compromise Enumeration' } },
								{ label: 'Post Compromise Attacks', autogenerate: { directory: '/active_directory/03-Post Compromise Attacks' } },
								{ label: 'Post Domain Compromise', autogenerate: { directory: '/active_directory/04-Post Domain Compromise' } },
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
			title: 'elodvk',
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
