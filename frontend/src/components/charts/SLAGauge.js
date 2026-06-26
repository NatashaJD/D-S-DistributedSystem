'use client';
import styles from './SLAGauge.module.css';

function getStatusColor(pct) {
  if (pct >= 150) return 'var(--color-critical)';
  if (pct >= 100) return 'var(--color-danger)';
  if (pct >= 75)  return 'var(--color-warning)';
  return 'var(--color-success)';
}

function getStatusLabel(pct) {
  if (pct >= 150) return 'Critical';
  if (pct >= 100) return 'Breached';
  if (pct >= 75)  return 'Warning';
  return 'On Track';
}

export default function SLAGauge({ percentage = 0, size = 140, label = 'SLA' }) {
  const clamped = Math.min(percentage, 200);
  const radius = (size - 22) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (clamped / 200) * circumference;
  const color = getStatusColor(percentage);
  const statusLabel = getStatusLabel(percentage);

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={radius}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="11" />
        {/* Glow track */}
        <circle cx={cx} cy={cy} r={radius}
          fill="none" stroke={color} strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity="0.2"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        {/* Main arc */}
        <circle cx={cx} cy={cy} r={radius}
          fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease' }}
        />
        {/* 75% threshold marker */}
        <circle cx={cx} cy={cy} r={radius}
          fill="none" stroke="rgba(245,166,35,0.3)" strokeWidth="2"
          strokeDasharray={`2 ${circumference - 2}`}
          strokeDashoffset={circumference - (75 / 200) * circumference}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className={styles.inner}>
        <span className={styles.pct} style={{ color }}>{Math.round(percentage)}%</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.status} style={{ color }}>{statusLabel}</span>
      </div>
    </div>
  );
}
