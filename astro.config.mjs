// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog'

// https://astro.build/config
export default defineConfig({
	site: 'https://elodvk.github.io',
	integrations: [
		starlight({
			plugins: [starlightBlog()],
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
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Welcome!', slug: 'guides/welcome' },
					],
				},
				//{
				//	label: 'Reference',
				//	autogenerate: { directory: 'reference' },
				//},
				{
					label: 'Open-source intelligence',
					autogenerate: { directory: 'osint' },
				},
				{
					label: 'Active Directory',
					autogenerate: { directory: 'active_directory' },
				},

			],
		}),
	],
});
