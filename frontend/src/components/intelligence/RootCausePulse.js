'use client';
import styles from './RootCausePulse.module.css';

const SEVERITY_COLOR = {
  critical: '#FF4D6A',
  warning: '#F5A623',
  normal: '#10D9A0',
};

const SEVERITY_LABEL = {
  critical: 'Critical',
  warning: 'Warning',
  normal: 'On Track',
};

export default function RootCausePulse({ data, loading }) {
  if (loading || !data?.length) {
    return (
      <div className={`card ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Root Cause Analysis</h3>
            <p className={styles.sub}>Why bottlenecks are occurring</p>
          </div>
        </div>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10, marginTop: 12 }} />)}
      </div>
    );
  }

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <h3 className={styles.title}>Root Cause Analysis</h3>
          <p className={styles.sub}>Why bottlenecks are occurring</p>
        </div>
      </div>

      <div className={styles.list}>
        {data.map((item) => {
          const color = SEVERITY_COLOR[item.severity] || '#7B9EC0';
          return (
            <div key={item.department} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.deptRow}>
                  <span className={styles.severityDot} style={{ background: color }} />
                  <span className={styles.deptName}>{item.department}</span>
                  <span className={styles.severityBadge} style={{ color, borderColor: color + '44', background: color + '12' }}>
                    {SEVERITY_LABEL[item.severity]}
                  </span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metric} style={{ color }}>{item.avg_sla_pct.toFixed(0)}% SLA</span>
                  <span className={styles.metricSub}>{item.breach_rate}% breach rate</span>
                </div>
              </div>

              <div className={styles.factors}>
                {item.factors.map((f) => (
                  <div key={f.cause} className={styles.factor}>
                    <div className={styles.factorHeader}>
                      <span className={styles.factorName}>{f.cause}</span>
                      <span className={styles.factorPct} style={{ color }}>{f.percentage}%</span>
                    </div>
                    <div className={styles.factorBar}>
                      <div
                        className={styles.factorFill}
                        style={{ width: `${f.percentage}%`, background: color, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
