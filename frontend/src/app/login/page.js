'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../lib/roleConfig';
import styles from './page.module.css';

const RoleIcon = {
  executive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  regional: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  engineering: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  logistics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  service: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

const KENYA_BRANCHES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Eldoret',
  'Nakuru', 'Thika', 'Nyeri', 'Malindi',
  'Kisii', 'Meru', 'Kitale', 'Nanyuki',
];

const EAST_AFRICA = [
  { city: 'Kampala',      country: 'Uganda' },
  { city: 'Dar es Salaam', country: 'Tanzania' },
  { city: 'Addis Ababa', country: 'Ethiopia' },
  { city: 'Kigali',      country: 'Rwanda' },
  { city: 'Lusaka',      country: 'Zambia' },
  { city: 'Juba',        country: 'South Sudan' },
  { city: 'Djibouti',    country: 'Djibouti' },
];

const DEMO_ROLES = [
  {
    username: 'ceo',
    password: 'dayliff2024',
    display_role: 'Chief Executive Officer',
    iconKey: 'executive',
    description: 'Full enterprise visibility: all regions, all departments, financial KPIs',
    color: '#0F2A3F',
  },
  {
    username: 'coo',
    password: 'ops2024',
    display_role: 'Chief Operations Officer',
    iconKey: 'operations',
    description: 'Operational dashboard: SLA trends, bottleneck analysis, team performance',
    color: '#00AEEF',
  },
  {
    username: 'regional_manager',
    password: 'region2024',
    display_role: 'Regional Manager',
    iconKey: 'regional',
    description: 'Select your region to view branch-level operations and escalation queue',
    color: '#00A878',
    isRegional: true,
  },
  {
    username: 'sales_head',
    password: 'sales2024',
    display_role: 'Head of Sales',
    iconKey: 'sales',
    description: 'Sales funnel: inquiry pipeline, quotation SLAs, conversion metrics',
    color: '#F58220',
  },
  {
    username: 'engineering_head',
    password: 'eng2024',
    display_role: 'Head of Engineering',
    iconKey: 'engineering',
    description: 'Technical review pipeline: specs, approvals, engineering SLAs',
    color: '#7C3AED',
  },
  {
    username: 'logistics_head',
    password: 'dispatch2024',
    display_role: 'Head of Logistics',
    iconKey: 'logistics',
    description: 'Dispatch operations: delivery SLAs, regional coverage, supply chain',
    color: '#8B5CF6',
  },
  {
    username: 'aftersales_head',
    password: 'service2024',
    display_role: 'Head of After Sales',
    iconKey: 'service',
    description: 'Post-delivery service: maintenance requests, warranty, support SLAs',
    color: '#059669',
  },
  {
    username: 'finance_head',
    password: 'finance2024',
    display_role: 'Head of Finance',
    iconKey: 'finance',
    description: 'Financial operations: billing status, credit approvals, revenue metrics',
    color: '#DC2626',
  },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const cfg = getRoleConfig(user.role, user.scope);
      router.replace(cfg.home);
    }
  }, [user, loading, router]);

  async function handleRoleLogin(role) {
    if (role.isRegional) {
      setRegionPickerOpen(true);
      return;
    }
    setSelectedRole(role.username);
    setSigningIn(true);
    setError('');
    try {
      const userData = await login(role.username, role.password);
      const cfg = getRoleConfig(userData.role, userData.scope);
      router.replace(cfg.home);
    } catch (err) {
      setError(err.message);
      setSelectedRole(null);
      setSigningIn(false);
    }
  }

  async function handleRegionLogin(region) {
    const rmRole = DEMO_ROLES.find(r => r.isRegional);
    setSelectedRole(region);
    setSigningIn(true);
    setError('');
    try {
      const userData = await login(rmRole.username, rmRole.password, region);
      const cfg = getRoleConfig(userData.role, userData.scope);
      router.replace(cfg.home);
    } catch (err) {
      setError(err.message);
      setSelectedRole(null);
      setSigningIn(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070F1A' }}>
      <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
        <circle cx="12" cy="12" r="10" stroke="rgba(0,174,239,0.15)" strokeWidth="2.5"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#00AEEF" strokeWidth="2.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/>
        </path>
      </svg>
    </div>
  );

  return (
    <div className={styles.loginShell}>
      <div className={styles.loginPanel}>

        <div className={styles.logoRow}>
          <div className={styles.logoMark}>
            <span className={styles.logoEye}>1000</span>
            <span className={styles.logoEyes}>EYES</span>
          </div>
          <div className={styles.logoSub}>Davis &amp; Shirtliff · Operational Intelligence</div>
        </div>

        {regionPickerOpen ? (
          <div className={styles.regionPickerView}>
            <button
              className={styles.regionBackBtn}
              onClick={() => { setRegionPickerOpen(false); setError(''); setSelectedRole(null); setSigningIn(false); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to roles
            </button>

            <div>
              <h2 className={styles.regionPickerTitle}>Select Your Region</h2>
              <p className={styles.regionPickerSub}>
                Davis &amp; Shirtliff operates 12 Kenya branch locations and serves 7 East African markets.
                Select the region you manage.
              </p>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.regionGroup}>
              <div className={styles.regionGroupLabel}>Kenya Branches</div>
              <div className={styles.regionBtnGrid}>
                {KENYA_BRANCHES.map((region) => (
                  <button
                    key={region}
                    className={`${styles.regionBtn} ${selectedRole === region ? styles.regionBtnActive : ''}`}
                    onClick={() => handleRegionLogin(region)}
                    disabled={signingIn}
                  >
                    {selectedRole === region
                      ? <div className={styles.spinnerSm} />
                      : region
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.regionGroup}>
              <div className={styles.regionGroupLabel}>East Africa</div>
              <div className={styles.regionBtnGrid}>
                {EAST_AFRICA.map(({ city, country }) => (
                  <button
                    key={city}
                    className={`${styles.regionBtn} ${selectedRole === city ? styles.regionBtnActive : ''}`}
                    onClick={() => handleRegionLogin(city)}
                    disabled={signingIn}
                  >
                    {selectedRole === city ? (
                      <div className={styles.spinnerSm} />
                    ) : (
                      <>
                        <span>{city}</span>
                        <span className={styles.regionBtnCountry}>{country}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.heading}>Select your role to enter</h1>
            <p className={styles.sub}>
              This is a live demo platform. Choose a role to see the experience tailored to your function.
            </p>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.roleGrid}>
              {DEMO_ROLES.map((role) => (
                <button
                  key={role.username}
                  className={`${styles.roleCard} ${selectedRole === role.username ? styles.roleCardActive : ''}`}
                  onClick={() => handleRoleLogin(role)}
                  disabled={signingIn}
                  style={{ '--role-color': role.color }}
                >
                  <div className={styles.roleAvatar}>{RoleIcon[role.iconKey]}</div>
                  <div className={styles.roleInfo}>
                    <div className={styles.roleName}>{role.display_role}</div>
                    <div className={styles.roleDesc}>{role.description}</div>
                  </div>
                  {role.isRegional ? (
                    <div className={styles.roleChevron}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  ) : selectedRole === role.username ? (
                    <div className={styles.spinner} />
                  ) : null}
                </button>
              ))}
            </div>
          </>
        )}

        <div className={styles.footer}>
          <div className={styles.footerDot} />
          All data is simulated for demonstration purposes
          <div className={styles.footerDot} />
        </div>
      </div>

      <div className={styles.backdrop}>
        <div className={styles.backdropText}>
          <div className={styles.statLine}>300+ Active Service Requests</div>
          <div className={styles.statLine}>12 Kenya Locations · East Africa</div>
          <div className={styles.statLine}>Real-Time SLA Monitoring</div>
          <div className={styles.statLine}>AI-Powered Decision Intelligence</div>
        </div>
      </div>
    </div>
  );
}
