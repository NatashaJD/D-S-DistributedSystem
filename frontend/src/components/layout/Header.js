'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

const PageIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  copilot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

const PAGE_META = {
  '/':           { title: 'Executive Dashboard',  iconKey: 'dashboard',   sub: 'Real-time operational overview' },
  '/operations': { title: 'Operations Center',    iconKey: 'operations',  sub: 'Live request tracking' },
  '/analytics':  { title: 'Analytics & Insights', iconKey: 'analytics',   sub: 'Trends, KPIs, and performance' },
  '/copilot':    { title: 'AI Copilot',            iconKey: 'copilot',     sub: 'Gemini-powered natural language queries' },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { connected } = useWebSocket((msg) => {
    if (msg.type === 'sla_alert' || msg.type === 'sla_refresh') {
      if (msg.type === 'sla_alert') setAlerts(prev => [msg, ...prev].slice(0, 5));
    }
  });

  const isRequestDetail = pathname.startsWith('/request/');
  const meta = isRequestDetail
    ? { title: 'Request Detail', iconKey: 'request', sub: 'Journey timeline and event log' }
    : (PAGE_META[pathname] || PAGE_META['/']);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.pageIcon}>{PageIcons[meta.iconKey]}</div>
        <div>
          <h1 className={styles.pageTitle}>{meta.title}</h1>
          <span className={styles.pageSub}>{meta.sub}</span>
        </div>
      </div>

      <div className={styles.right}>
        {alerts.length > 0 && (
          <button
            className={styles.alertBtn}
            onClick={() => setAlerts([])}
            title={`${alerts.length} SLA alerts: click to dismiss`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className={styles.alertCount}>{alerts.length}</span>
          </button>
        )}

        <div className={`${styles.liveChip} ${connected ? styles.connected : styles.disconnected}`}>
          <span className={styles.liveDot} />
          <span>{connected ? 'Live' : 'Reconnecting'}</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.userArea} onClick={() => setShowUserMenu(v => !v)}>
          <div className={styles.userAvatar}>{user?.avatar || 'U'}</div>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.display_role}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="6 9 12 15 18 9"/>
          </svg>

          {showUserMenu && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuHeader}>
                <div className={styles.userMenuName}>{user?.name}</div>
                <div className={styles.userMenuRole}>{user?.display_role}</div>
                <div className={styles.userMenuScope}>Scope: {user?.scope === 'all' ? 'All Regions' : user?.scope}</div>
              </div>
              <button
                className={styles.logoutBtn}
                onClick={(e) => { e.stopPropagation(); logout(); router.replace('/login'); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.accentLine} />
    </header>
  );
}
