'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './RoleSwitcher.module.css';

const ROLES = [
  {
    id: 'executive',
    label: 'Executive',
    desc: 'Full system access',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    id: 'ops_manager',
    label: 'Operations',
    desc: 'Operational oversight',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
  {
    id: 'regional_manager',
    label: 'Regional Mgr',
    desc: 'Cross-branch analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    id: 'sales_engineer',
    label: 'Sales',
    desc: 'Sales pipeline view',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'engineering_officer',
    label: 'Engineering',
    desc: 'Technical review view',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    id: 'logistics_officer',
    label: 'Logistics',
    desc: 'Dispatch and delivery',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    id: 'aftersales_officer',
    label: 'After Sales',
    desc: 'Service and support',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
  },
  {
    id: 'finance_officer',
    label: 'Finance',
    desc: 'Billing and payments',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

export function useRole() {
  const [role, setRole] = useState('executive');
  useEffect(() => {
    const saved = localStorage.getItem('dayliff_role');
    if (saved) setRole(saved);
  }, []);
  const changeRole = (r) => {
    setRole(r);
    localStorage.setItem('dayliff_role', r);
    window.dispatchEvent(new CustomEvent('rolechange', { detail: r }));
  };
  return { role, changeRole };
}

export default function RoleSwitcher() {
  const { role, changeRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const current = ROLES.find(r => r.id === role) || ROLES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        <span className={styles.icon}>{current.icon}</span>
        <span className={styles.label}>{current.label}</span>
        <svg className={`${styles.chevron} ${open ? styles.open : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>Switch Role</div>
          {ROLES.map(r => (
            <button
              key={r.id}
              className={`${styles.option} ${r.id === role ? styles.active : ''}`}
              onClick={() => { changeRole(r.id); setOpen(false); }}
            >
              <span className={styles.optIcon}>{r.icon}</span>
              <div className={styles.optText}>
                <span className={styles.optLabel}>{r.label}</span>
                <span className={styles.optDesc}>{r.desc}</span>
              </div>
              {r.id === role && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" className={styles.check}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
