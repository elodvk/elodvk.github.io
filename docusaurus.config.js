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
        // We now configure docs here, as we are using a single docs instance
        docs: {
          sidebarPath: './sidebars.js',
        }, 
        blog: {
          blogTitle: 'OffSec Blog',
          blogDescription: 'A blog about everything cybersecurity',
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
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
          // This item links to the 'pnptSidebar' defined in sidebars.js
          {
            type: 'docSidebar',
            sidebarId: 'pnptSidebar',
            position: 'left',
            label: 'PNPT Prep',
          },
          // This item links to the 'oscpSidebar'
          {
            type: 'docSidebar',
            sidebarId: 'oscpSidebar',
            position: 'left',
            label: 'OSCP Prep',
          },
          // This item links to the 'adSidebar'
          {
            type: 'docSidebar',
            sidebarId: 'adSidebar',
            position: 'left',
            label: 'Active Directory',
          },
          // This item links to the 'cheatsheetsSidebar'
          {
            type: 'docSidebar',
            sidebarId: 'cheatsheetsSidebar',
            position: 'left',
            label: 'Cheatsheets',
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
        // Your footer config remains the same
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
