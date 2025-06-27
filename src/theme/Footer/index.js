import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
import FooterLayout from '@theme/Footer/Layout';
import Link from '@docusaurus/Link';

// --- Font Awesome Setup ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faBook, 
  faPenToSquare, 
  faUser, 
  faEnvelope 
} from '@fortawesome/free-solid-svg-icons';
import { 
  faDiscord, 
  faYoutube, 
  faFacebook, 
  faGithub, 
  faLinkedin, 
  faXTwitter 
} from '@fortawesome/free-brands-svg-icons';

library.add(
  faBook, 
  faPenToSquare, 
  faUser, 
  faEnvelope, 
  faDiscord, 
  faYoutube, 
  faFacebook, 
  faGithub, 
  faLinkedin, 
  faXTwitter
);
// --- End Font Awesome Setup ---

/**
 * Renders a single link item with an icon.
 */
function FooterLinkItem({ item }) {
  const { to, href, label, icon, ...props } = item;
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : { to };

  const parseIcon = (iconString) => {
    if (!iconString) return null;
    const parts = iconString.split(' ');
    if (parts.length < 2) return null;
    let prefix;
    switch (parts[0]) {
      case 'fa-solid':
        prefix = 'fas';
        break;
      case 'fa-brands':
        prefix = 'fab';
        break;
      case 'fa-regular':
        prefix = 'far';
        break;
      default:
        return null;
    }
    const iconName = parts[1].replace('fa-', '');
    return [prefix, iconName];
  };

  const iconProps = parseIcon(icon);

  return (
    <Link className="footer__link-item" {...linkProps} {...props}>
      {iconProps && <FontAwesomeIcon icon={iconProps} style={{ width: '16px', marginRight: '8px' }} />}
      {label}
    </Link>
  );
}


/**
 * The main swizzled Footer component.
 * It has been corrected to build the multi-column layout directly.
 */
function Footer() {
  const { footer } = useThemeConfig();
  if (!footer) {
    return null;
  }
  const { copyright, links, logo, style } = footer;

  return (
    <FooterLayout
      style={style}
      links={
        links &&
        links.length > 0 && (
          <div className="row footer__links">
            {links.map((linkItem, i) => (
              <div key={i} className="col footer__col">
                <h4 className="footer__title">{linkItem.title}</h4>
                <ul className="footer__items clean-list">
                  {linkItem.items.map((item, key) =>
                    item.html ? (
                      <li
                        key={key}
                        className="footer__item"
                        dangerouslySetInnerHTML={{
                          __html: item.html,
                        }}
                      />
                    ) : (
                      <li key={item.href || item.to} className="footer__item">
                        <FooterLinkItem item={item} />
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        )
      }
      logo={logo && <FooterLogo logo={logo} />}
      copyright={copyright && <FooterCopyright copyright={copyright} />}
    />
  );
}

export default React.memo(Footer);
