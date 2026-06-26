'use client';
import { useEffect, useState } from 'react';
import styles from './KPICard.module.css';

function AnimatedNumber({ target, duration = 1400, suffix = '' }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCurrent(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{current.toLocaleString()}{suffix}</span>;
}

export default function KPICard({ title, value, suffix = '', icon, trend, trendLabel, variant = 'default', subtitle }) {
  const variantClass = {
    default: '',
    success: styles.variantSuccess,
    warning: styles.variantWarning,
    danger:  styles.variantDanger,
    primary: styles.variantPrimary,
  }[variant] || '';

  const trendUp = trend > 0, trendDown = trend < 0;

  return (
    <div className={`${styles.card} ${variantClass} card`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>
        <AnimatedNumber target={typeof value === 'number' ? value : parseFloat(value) || 0} suffix={suffix} />
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {trend !== undefined && (
        <div className={`${styles.trend} ${trendUp ? styles.trendUp : trendDown ? styles.trendDown : styles.trendFlat}`}>
          <span className={styles.trendArrow}>{trendUp ? '↑' : trendDown ? '↓' : '→'}</span>
          <span className={styles.trendLabel}>{Math.abs(trend)}% {trendLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}
