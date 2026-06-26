'use client';
import { useEffect, useState } from 'react';
import styles from './EnterpriseHealthScore.module.css';

function AnimatedScore({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let current = 0;
    const step = target / 60;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(Math.round(current * 10) / 10);
      if (current >= target) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [target]);
  return val.toFixed(0);
}

const GRADE_COLOR = { A: '#10D9A0', B: '#0077CC', C: '#F5A623', D: '#F58220', F: '#FF4D6A' };
const STATUS_LABEL = { healthy: 'Healthy', caution: 'Caution', at_risk: 'At Risk', critical: 'Critical' };

export default function EnterpriseHealthScore({ data, loading }) {
  if (loading || !data) {
    return <div className={`card ${styles.card}`}><div className="skeleton" style={{ height: 140 }} /></div>;
  }

  const { score, grade, status, trend, components } = data;
  const gradeColor = GRADE_COLOR[grade] || '#7B9EC0';

  // SVG ring params
  const R = 52, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`card ${styles.card}`}>
      {/* Left: ring gauge */}
      <div className={styles.gaugeSection}>
        <svg width="120" height="120" className={styles.ring}>
          <circle cx={cx} cy={cy} r={R} className={styles.ringTrack} />
          <circle
            cx={cx} cy={cy} r={R}
            className={styles.ringArc}
            style={{
              stroke: gradeColor,
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
              filter: `drop-shadow(0 0 8px ${gradeColor}88)`,
            }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 6} textAnchor="middle" className={styles.ringScore}>
            <AnimatedScore target={score} />
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" className={styles.ringLabel}>/100</text>
        </svg>
        <div className={styles.gradeRow}>
          <span className={styles.gradeBadge} style={{ color: gradeColor, borderColor: gradeColor + '44', background: gradeColor + '14' }}>
            Grade {grade}
          </span>
          <span className={styles.trendChip} style={{ color: trend >= 0 ? '#10D9A0' : '#FF4D6A' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        </div>
        <p className={styles.statusLabel} style={{ color: gradeColor }}>{STATUS_LABEL[status]}</p>
      </div>

      {/* Center: title + description */}
      <div className={styles.titleSection}>
        <p className={styles.overline}>ENTERPRISE HEALTH SCORE</p>
        <h3 className={styles.title}>Operational Intelligence Index</h3>
        <p className={styles.desc}>
          Composite score across SLA compliance, breach control, resolution speed, and workload balance.
          Benchmarked against operational targets.
        </p>
        <div className={styles.statusPill} style={{ background: gradeColor + '18', borderColor: gradeColor + '44' }}>
          <span className={styles.statusDot} style={{ background: gradeColor }} />
          <span style={{ color: gradeColor, fontWeight: 600 }}>{STATUS_LABEL[status]}</span>
          <span className={styles.statusSub}>reviewed in real time</span>
        </div>
      </div>

      {/* Right: component scores */}
      <div className={styles.components}>
        {(components || []).map(c => {
          const color = c.status === 'good' ? '#10D9A0' : c.status === 'warning' ? '#F5A623' : '#FF4D6A';
          return (
            <div key={c.label} className={styles.componentRow}>
              <div className={styles.componentHeader}>
                <span className={styles.componentLabel}>{c.label}</span>
                <span className={styles.componentScore} style={{ color }}>{c.score.toFixed(0)}</span>
              </div>
              <div className={styles.componentBar}>
                <div
                  className={styles.componentFill}
                  style={{ width: `${c.score}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
                />
              </div>
              <span className={styles.componentWeight}>{c.weight}% weight</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
