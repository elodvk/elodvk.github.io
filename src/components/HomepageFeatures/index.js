import React from 'react';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

const FeatureList = [
  {
    title: 'Active Directory',
    icon: 'network',
    color: 'var(--ifm-color-primary)',
    link: '/docs/category/active-directory',
    description: (
      <>
        Deep dives into Active Directory exploitation, defense, and my notes for the CRTP certification.
      </>
    ),
  },
  {
    title: 'CTF Writeups',
    icon: 'flag',
    color: 'var(--ifm-color-danger)',
    link: '',
    description: (
      <>
        Detailed walkthroughs and solutions for Capture The Flag challenges, primarily from Hack The Box.
      </>
    ),
  },
  {
    title: 'Windows Internals',
    icon: 'laptop',
    color: 'var(--ifm-color-success)',
    link: '',
    description: (
      <>
        Exploring the core of Windows for offensive and defensive security insights.
      </>
    ),
  },
  {
    title: 'Red Teaming',
    icon: 'swords',
    color: '#f59e0b',
    link: '',
    description: (
      <>
        Notes and TTPs covering adversary emulation, C2 frameworks, and advanced attack techniques.
      </>
    ),
  },
  {
    title: 'Cloud Security',
    icon: 'cloud',
    color: '#8b5cf6',
    link: '',
    description: (
      <>
        Exploring the security landscape of cloud environments like AWS, Azure, and GCP.
      </>
    ),
  },
  {
    title: 'Threat Modeling',
    icon: 'shield-alert',
    color: '#ec4899',
    link: '',
    description: (
      <>
        Strategies and frameworks for proactively identifying and mitigating potential security threats.
      </>
    ),
  },
];

function Feature({title, icon, color, description, link}) {
  return (
    // This div is no longer a Docusaurus column, it's just a container for our card
    <div>
      <Link to={link} className={styles.featureLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureHeader}>
            <i data-lucide={icon} className={styles.featureIcon} style={{color: color}}></i>
            <h3 className={styles.featureTitle}>{title}</h3>
          </div>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="content-section">
      <div className="container">
        <h2 className="section-title">Key Focus Areas</h2>
        {/* We now use our custom grid class instead of the default 'row' */}
        <div className={styles.featureGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
