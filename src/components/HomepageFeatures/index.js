import React from 'react';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Active Directory',
    icon: 'network',
    color: 'var(--ifm-color-primary)',
    description: (
      <>
        Deep dives into Active Directory exploitation, defense, and my notes for the CRTP certification.
      </>
    ),
  },
  {
    title: 'Windows Internals',
    icon: 'laptop',
    color: 'var(--ifm-color-success)',
    description: (
      <>
        Exploring the core of Windows for offensive and defensive security insights.
      </>
    ),
  },
  {
    title: 'CTF Writeups',
    icon: 'flag',
    color: 'var(--ifm-color-danger)',
    description: (
      <>
        Detailed walkthroughs and solutions for Capture The Flag challenges, primarily from Hack The Box.
      </>
    ),
  },
];

function Feature({title, icon, color, description}) {
  return (
    <div className={`col col--4 ${styles.featureColumn}`}>
      <div className={styles.featureCard}>
        <div className={styles.featureHeader}>
          <i data-lucide={icon} className={styles.featureIcon} style={{color: color}}></i>
          <h3 className={styles.featureTitle}>{title}</h3>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="content-section">
      <div className="container">
        <h2 className="section-title">Key Focus Areas</h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
