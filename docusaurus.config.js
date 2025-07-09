import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'My Cybersecurity Journey',
  tagline: "Documenting my path through OSCP, CRTP, and beyond. Notes, writeups, and resources for aspiring security professionals.",
  favicon: 'img/favicon.ico',
  
  url: 'https://elodvk.github.io',
  baseUrl: '/',
  organizationName: 'elodvk',
  projectName: 'elodvk.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        }, 
        blog: {
          blogTitle: 'OffSec Blog',
          blogDescription: 'A blog about everything cybersecurity',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
          postsPerPage: 1, // This will show only the latest post on the main blog page
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'elodvk',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          // This is the new dropdown menu for your certifications
          {
            type: 'dropdown',
            label: 'Certifications',
            position: 'left',
            items: [
              {
                label: 'PNPT Prep',
                // This links to the 'pnptSidebar' defined in sidebars.js
                type: 'docSidebar',
                sidebarId: 'pnptSidebar',
              },
              {
                label: 'OSCP Prep',
                // This links to the 'oscpSidebar'
                type: 'docSidebar',
                sidebarId: 'oscpSidebar',
              },
            ],
          },
          {
            label: 'Active Directory',
            type: 'docSidebar',
            sidebarId: 'adSidebar',
            position: 'left',
          },
          {
            label: 'Cheatsheets',
            type: 'docSidebar',
            sidebarId: 'cheatsheetsSidebar',
            position: 'left',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: '/about_me', label: 'About Me', position: 'left'},
          {
            href: 'https://github.com/elodvk',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Navigate',
            items: [
              { label: 'Docs', to: '/docs/intro', icon: 'fa-solid fa-book' },
              { label: 'Blog', to: '/blog', icon: 'fa-solid fa-pen-to-square' },
              { label: 'About Me', to: '/about_me', icon: 'fa-solid fa-user' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'Discord', href: '#', icon: 'fa-brands fa-discord' },
              { label: 'YouTube', href: '#', icon: 'fa-brands fa-youtube' },
              { label: 'Facebook', href: '#', icon: 'fa-brands fa-facebook' },
            ],
          },
          {
            title: 'Connect',
            items: [
              { label: 'GitHub', href: 'https://github.com/elodvk', icon: 'fa-brands fa-github' },
              { label: 'LinkedIn', href: '#', icon: 'fa-brands fa-linkedin' },
              { label: 'Twitter', href: '#', icon: 'fa-brands fa-x-twitter' },
              { label: 'Email', href: 'mailto:youremail@example.com', icon: 'fa-solid fa-envelope' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} elodvk`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
