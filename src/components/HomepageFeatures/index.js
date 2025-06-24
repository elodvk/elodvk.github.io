import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Explore Ethical Hacking',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Dive into the mindset of an attacker. Learn offensive security techniques, from reconnaissance to exploitation, to find and fix vulnerabilities before they are exploited.

      </>
    ),
  },
  {
    title: 'Master Defensive Strategies',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Strengthen your defenses with blue team tactics. We cover everything from threat intelligence and incident response to hardening systems and securing networks.
      </>
    ),
  },
  {
    title: 'Access Tools & Resources',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Get hands-on with a curated library of cybersecurity tools, guides, and cheat sheets. Go ahead and explore our resources on <code>Nmap</code>, <code>Wireshark</code>, <code>Metasploit</code>, and more.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
