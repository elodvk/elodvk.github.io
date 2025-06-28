import React, { useEffect } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Head from '@docusaurus/Head';
import useGlobalData from '@docusaurus/useGlobalData';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className="hero hero--primary">
      <div className="container">
        <div className="row" style={{alignItems: 'center'}}>
          <div className="col col--7">
            <h1 className="hero__title">{siteConfig.title}</h1>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            {/* The inline style here has been adjusted to fix the alignment */}
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <Link
                className="button button--primary button--lg"
                to="/docs/category/active-directory">
                Explore Notes 🚀
              </Link>
               <Link
                className="button button--secondary button--lg"
                to="/blog">
                Latest Writeups
              </Link>
            </div>
          </div>
          <div className="col col--5">
            <div className="hero-visual-container">
               <i data-lucide="terminal-square" className="hero-shield-icon"></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function LatestBlogPosts() {
  const globalData = useGlobalData();
  const blogPluginData = globalData['docusaurus-plugin-content-blog']?.default;
  
  if (!blogPluginData || blogPluginData.posts.length === 0) {
    return (
      <section className="content-section">
        <div className="container">
            <h2 className="section-title">Latest Writeups</h2>
            <p style={{textAlign: 'center'}}>No recent posts to display. Check back soon!</p>
        </div>
      </section>
    );
  }
  
  const recentPosts = blogPluginData.posts.slice(0, 3);
  
  return (
    <section className="content-section">
      <div className="container">
          <h2 className="section-title">Latest Writeups</h2>
          <div className="row">
              {recentPosts.map(({ metadata }, idx) => (
                  <div key={idx} className="col col--4 margin-bottom--lg">
                      <div className="card card--full-height">
                          <div className="card__header">
                              {metadata.tags.length > 0 && (
                                <span style={{color: 'var(--ifm-color-primary)', fontWeight: 'bold', fontSize: '0.875rem', marginBottom: '0.5rem'}}>
                                  {metadata.tags[0].label}
                                </span>
                              )}
                              <h3>{metadata.title}</h3>
                          </div>
                          <div className="card__body">
                              <p>{metadata.description}</p>
                          </div>
                          <div className="card__footer">
                              <Link to={metadata.permalink} className="button button--secondary button--block">Read More</Link>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </section>
  );
}

const ToolsOfTheTrade = [
    { name: 'Kali Linux', icon: 'gem' },
    { name: 'Python', icon: 'code' },
    { name: 'Burp Suite', icon: 'bug' },
    { name: 'Nmap', icon: 'scan' },
    { name: 'Metasploit', icon: 'bomb' },
    { name: 'Obsidian', icon: 'notebook-pen' },
];


export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.lucide) {
        window.lucide.createIcons();
    }
  }, []);

  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="A website focused on cybersecurity, with an emphasis on Active Directory, Windows systems, and CTF challenges.">
      <Head>
        <script src="https://unpkg.com/lucide@latest"></script>
      </Head>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <LatestBlogPosts />

        <section className="content-section">
          <div className="container">
            <h2 className="section-title">My Arsenal</h2>
            <div className="arsenal-container">
              {ToolsOfTheTrade.map((tool) => (
                <div key={tool.name} className="arsenal-tool">
                  <i data-lucide={tool.icon} style={{width: '48px', height: '48px'}}></i>
                  <span>{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}
