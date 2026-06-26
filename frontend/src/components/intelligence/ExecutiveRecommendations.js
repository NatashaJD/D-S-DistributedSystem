'use client';
import { useState, useEffect } from 'react';
import styles from './ExecutiveRecommendations.module.css';

const PRIORITY_CONFIG = {
  critical: { color: '#E53E3E', label: 'Critical', dot: '#E53E3E' },
  high:     { color: '#F58220', label: 'High',     dot: '#F58220' },
  medium:   { color: '#00AEEF', label: 'Medium',   dot: '#00AEEF' },
};

const STORAGE_KEY = 'dayliff_actioned_recs';

function loadActioned() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveActioned(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ExecutiveRecommendations({ data, loading }) {
  const [actioned, setActioned] = useState({});
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    setActioned(loadActioned());
  }, []);

  function handleAction(rec, index) {
    const key = `${rec.title}_${rec.area}`;
    if (actioned[key]) return; // already actioned

    setActioning(index);
    setTimeout(() => {
      const next = { ...actioned, [key]: { timestamp: new Date().toISOString(), actor: 'current_user' } };
      setActioned(next);
      saveActioned(next);
      setActioning(null);

      // Fire-and-forget to backend
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://dayliff-1000-eyes-api-production.up.railway.app';
      fetch(`${apiBase}/api/v1/analytics/recommendations/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: rec.title, area: rec.area, priority: rec.priority }),
      }).catch(() => {});
    }, 600);
  }

  if (loading || !data?.length) {
    return (
      <div className={`card ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Executive Recommendations</h3>
            <p className={styles.sub}>Data-driven actions for leadership</p>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10, marginTop: 12 }} />
        ))}
      </div>
    );
  }

  const actionedCount = Object.keys(actioned).length;

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
        </div>
        <div>
          <h3 className={styles.title}>Executive Recommendations</h3>
          <p className={styles.sub}>Data-driven actions for leadership</p>
        </div>
        {actionedCount > 0 && (
          <div className={styles.actionedBadge}>
            {actionedCount} actioned
          </div>
        )}
      </div>

      <div className={styles.list}>
        {data.map((rec, i) => {
          const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium;
          const key = `${rec.title}_${rec.area}`;
          const isActioned = !!actioned[key];
          const isActioning = actioning === i;

          return (
            <div
              key={i}
              className={`${styles.rec} ${isActioned ? styles.recActioned : ''}`}
              style={{ borderLeftColor: cfg.color }}
            >
              <div className={styles.recHeader}>
                <span className={styles.priorityBadge} style={{ color: cfg.color, background: cfg.color + '14', borderColor: cfg.color + '40' }}>
                  <span className={styles.priorityDot} style={{ background: cfg.dot }} />
                  {cfg.label}
                </span>
                <span className={styles.areaChip}>{rec.area}</span>
                <span className={styles.metricChip}>{rec.metric}</span>
                <div style={{ flex: 1 }} />
                {isActioned ? (
                  <span className={styles.actionedChip}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Actioned
                  </span>
                ) : (
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleAction(rec, i)}
                    disabled={isActioning}
                  >
                    {isActioning ? (
                      <span className={styles.btnSpinner} />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        Mark Actioned
                      </>
                    )}
                  </button>
                )}
              </div>

              <h4 className={styles.recTitle}>{rec.title}</h4>

              <p className={styles.insight}>
                <span className={styles.insightLabel}>Insight: </span>
                {rec.insight}
              </p>

              {!isActioned && (
                <div className={styles.actionBox}>
                  <span className={styles.actionLabel}>→ Recommended Action</span>
                  <p className={styles.actionText}>{rec.action}</p>
                </div>
              )}

              {isActioned && (
                <div className={styles.actionedBox}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Action recorded at {new Date(actioned[key].timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
