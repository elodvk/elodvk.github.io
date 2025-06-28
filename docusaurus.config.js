import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  // No need for the 'stylesheets' array here, we'll use headTags
  title: 'Zero to Shell',
  tagline: "Deconstructing threats, sharing knowledge. A practical collection of notes and techniques for the modern security professional.",
  favicon: 'img/favicon.ico',
  future: {
    v4: true,
  },

  url: 'https://elodvk.github.io',
  baseUrl: '/',

  organizationName: 'elodvk',
  trailingSlash: false,
  projectName: 'elodvk.github.io',
  deploymentBranch: 'gh-pages',

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
          postsPerPage: 1,
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
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
      headTags: [
        {
          tagName: 'link',
          attributes: {
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
          },
        },
      ],
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'elodvk',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'documentsSidebar',
            position: 'left',
            label: 'Docs',
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
              { label: 'Docs', to: '/docs/category/active-directory-1', icon: 'fa-solid fa-book' },
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
        additionalLanguages: ['powershell', 'bash', 'shell-session', 'json', 'python'],
      },
    }),
};

export default config;
