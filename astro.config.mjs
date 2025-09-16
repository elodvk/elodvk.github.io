// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://elodvk.github.io',
	integrations: [
		starlight({
			title: 'elodvk',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
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
