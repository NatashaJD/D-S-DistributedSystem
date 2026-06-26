'use client';

import { useEffect, useState } from 'react';
import styles from './FinancialKPIs.module.css';

function formatKES(value) {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
  return `KES ${value}`;
}

export default function FinancialKPIs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiBase}/api/v1/analytics/financial-kpis`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div className={styles.cardTitle}>Financial Impact</div>
      </div>
      <div className={styles.skeletonGrid}>
        {[1,2,3,4].map(i => <div key={i} className={styles.skeleton} />)}
      </div>
    </div>
  );

  if (!data) return null;

  const atRiskPct = data.at_risk_pct;
  const riskColor = atRiskPct > 30 ? '#E53E3E' : atRiskPct > 15 ? '#F58220' : '#00A878';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div>
          <div className={styles.cardTitle}>Financial Impact</div>
          <div className={styles.cardSub}>Revenue visibility · Avg contract KES {(data.avg_contract_value_kes / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <div className={styles.metricGrid}>

        {/* Revenue Collected */}
        <div className={`${styles.metricCard} ${styles.positive}`}>
          <div className={styles.metricIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className={styles.metricValue}>{formatKES(data.revenue_collected_kes)}</div>
          <div className={styles.metricLabel}>Revenue Collected</div>
          <div className={styles.metricSub}>From completed contracts</div>
        </div>

        {/* Revenue at Risk */}
        <div className={`${styles.metricCard} ${styles.danger}`}>
          <div className={styles.metricIcon} style={{ background: '#FEF2F2', color: '#E53E3E' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className={styles.metricValue} style={{ color: '#E53E3E' }}>{formatKES(data.revenue_at_risk_kes)}</div>
          <div className={styles.metricLabel}>Revenue at Risk</div>
          <div className={styles.metricSub} style={{ color: riskColor }}>
            {atRiskPct}% of collected revenue
          </div>
        </div>

        {/* SLA Penalty Exposure */}
        <div className={`${styles.metricCard} ${styles.warning}`}>
          <div className={styles.metricIcon} style={{ background: '#FFF7ED', color: '#F58220' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className={styles.metricValue} style={{ color: '#F58220' }}>{formatKES(data.sla_penalty_exposure_kes)}</div>
          <div className={styles.metricLabel}>SLA Penalty Exposure</div>
          <div className={styles.metricSub}>2% per week overdue</div>
        </div>

        {/* Recoverable */}
        <div className={`${styles.metricCard} ${styles.recover}`}>
          <div className={styles.metricIcon} style={{ background: '#E8FBF5', color: '#00A878' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <div className={styles.metricValue} style={{ color: '#00A878' }}>{formatKES(data.recoverable_revenue_kes)}</div>
          <div className={styles.metricLabel}>Recoverable Revenue</div>
          <div className={styles.metricSub}>If action taken within 48h</div>
        </div>

      </div>

      {/* Churn risk footer */}
      {data.customer_churn_risk_count > 0 && (
        <div className={styles.churnAlert}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <strong>{data.customer_churn_risk_count} accounts</strong> in critical stage for over 7 days. Immediate executive escalation required.
        </div>
      )}
    </div>
  );
}
