'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DayliffIcon } from './DayliffLogo';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../lib/roleConfig';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Executive',
    sublabel: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/operations',
    label: 'Operations',
    sublabel: 'Live Tracker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    sublabel: 'Trends & KPIs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    href: '/copilot',
    label: 'AI Copilot',
    sublabel: 'Gemini 2.5',
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2a10 10 0 1 0 10 10"/>
        <path d="M12 6v6l4 2"/>
        <circle cx="18" cy="6" r="3" fill="currentColor" opacity="0.3"/>
        <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleConfig = getRoleConfig(user?.role, user?.scope);

  const visibleItems = NAV_ITEMS.filter(item => roleConfig.navPaths.includes(item.href));

  return (
    <aside className={styles.sidebar}>
      {/* Wave decoration */}
      <div className={styles.waveBg} aria-hidden="true">
        <svg viewBox="0 0 256 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60 Q32 40 64 60 Q96 80 128 60 Q160 40 192 60 Q224 80 256 60 L256 0 L0 0 Z" fill="rgba(0,119,204,0.07)"/>
          <path d="M0 80 Q32 60 64 80 Q96 100 128 80 Q160 60 192 80 Q224 100 256 80 L256 120 L0 120 Z" fill="rgba(0,84,166,0.04)"/>
        </svg>
      </div>

      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <DayliffIcon size={40} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoProduct}>1000 Eyes</span>
          <span className={styles.logoBrand}>Davis &amp; Shirtliff</span>
        </div>
      </div>

      <div className={styles.logoDivider} />

      {/* Navigation */}
      <nav className={styles.nav}>
        <span className={styles.navLabel}>Navigation</span>
        {visibleItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.accent ? styles.accentItem : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <div className={styles.navText}>
                <span className={styles.navItemLabel}>{item.label}</span>
                <span className={styles.navItemSub}>{item.sublabel}</span>
              </div>
              {isActive && <span className={styles.activeBar} />}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Scope indicator for non-global roles */}
      {roleConfig.scopeType && (
        <div className={styles.scopePill}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          <span>{roleConfig.scopeLabel}</span>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>All systems operational</span>
        </div>
        <div className={styles.footerTagline}>know H₂Ow through experience</div>
      </div>
    </aside>
  );
}
