'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../lib/roleConfig';
import Sidebar from './Sidebar';
import Header from './Header';

const PUBLIC_PATHS = ['/login'];

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }
    if (user && !isPublic) {
      const roleConfig = getRoleConfig(user.role, user.scope);
      if (!roleConfig.canAccess(pathname)) {
        router.replace(roleConfig.home);
      }
    }
  }, [user, loading, isPublic, pathname, router]);

  if (isPublic) return <>{children}</>;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
          <circle cx="12" cy="12" r="10" stroke="rgba(0,174,239,0.15)" strokeWidth="2.5"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#00AEEF" strokeWidth="2.5" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/>
          </path>
        </svg>
        <span style={{ fontSize: 12, color: '#3D6480', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.5px' }}>LOADING</span>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
