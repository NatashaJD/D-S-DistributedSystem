'use client';
import { useEffect, useRef } from 'react';
import { useChartData } from '../../hooks/useChartData';
import { DS_EXPORTING, DS_TOOLTIP, DS_CHART_BASE, DS_AXIS } from '../charts/DSHighchartsTheme';
import styles from './ForecastPanel.module.css';

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      color: '#00A878', bg: '#E8FBF5' },
  medium:   { label: 'Medium Risk',   color: '#F59E0B', bg: '#FFFBEB' },
  high:     { label: 'High Risk',     color: '#F58220', bg: '#FFF7ED' },
  critical: { label: 'Critical Risk', color: '#E53E3E', bg: '#FEF2F2' },
};

const DIR_LABEL = {
  worsening: 'Intervention required',
  improving: 'Keep momentum',
  stable:    'Monitor closely',
};

const DIR_ARROW = {
  worsening: '↘',
  improving: '↗',
  stable:    '→',
};

export default function ForecastPanel() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { data, loading } = useChartData(
    '/api/v1/analytics/forecast',
    'forecast_30d',
    120_000
  );

  useEffect(() => {
    if (!data || typeof window === 'undefined') return;

    const risk = RISK_CONFIG[data.risk_level] || RISK_CONFIG.medium;

    import('highcharts').then(({ default: Highcharts }) => {
      Promise.all([
        import('highcharts/modules/exporting'),
        import('highcharts/modules/export-data'),
        import('highcharts/modules/offline-exporting'),
      ]).then(([Exp, ExpData, Offline]) => {
        try { Exp.default(Highcharts); } catch {}
        try { ExpData.default(Highcharts); } catch {}
        try { Offline.default(Highcharts); } catch {}

        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }

        if (!containerRef.current) return;

        const points = data.chart_data || [];
        const categories = points.map(p => p.period);
        const actualBars = points.map(p => p.actual_compliance !== null ? parseFloat(p.actual_compliance.toFixed(1)) : null);
        const actualLine = points.map(p => p.actual_compliance !== null ? parseFloat(p.actual_compliance.toFixed(1)) : null);
        const forecastLine = points.map(p => p.predicted_compliance !== null ? parseFloat(p.predicted_compliance.toFixed(1)) : null);

        chartRef.current = Highcharts.chart(containerRef.current, {
          chart: {
            ...DS_CHART_BASE,
            height: 155,
            margin: [8, 8, 30, 42],
            zooming: { type: 'x' },
          },
          title: { text: null },
          xAxis: {
            ...DS_AXIS,
            categories,
          },
          yAxis: {
            ...DS_AXIS,
            title: { text: null },
            min: 0,
            max: 100,
            plotLines: [{
              value: 80,
              color: '#00A878',
              dashStyle: 'ShortDash',
              width: 1.5,
              label: {
                text: 'Target 80%',
                align: 'right',
                style: { color: '#00A878', fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace" },
              },
            }],
          },
          tooltip: {
            ...DS_TOOLTIP,
            shared: true,
            valueSuffix: '%',
            formatter() {
              const pts = this.points.filter(p => p.y !== null);
              if (!pts.length) return '';
              const lines = pts.map(p => `<span style="color:${p.series.color}">●</span> ${p.series.name}: <b>${p.y !== null ? p.y + '%' : 'N/A'}</b>`);
              return `<b>${this.x}</b><br>${lines.join('<br>')}`;
            },
          },
          legend: {
            itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '10px' },
            y: -4,
          },
          plotOptions: {
            series: { animation: { duration: 500 } },
          },
          series: [
            {
              type: 'column',
              name: 'Actual',
              data: actualBars,
              color: 'rgba(0,174,239,0.25)',
              borderColor: 'rgba(0,174,239,0.4)',
              borderWidth: 1,
              borderRadius: 3,
              enableMouseTracking: false,
              showInLegend: false,
            },
            {
              type: 'spline',
              name: 'Actual',
              data: actualLine,
              color: '#00AEEF',
              lineWidth: 2.5,
              marker: { radius: 3, fillColor: '#00AEEF', enabled: true },
              connectNulls: false,
            },
            {
              type: 'spline',
              name: 'Forecast',
              data: forecastLine,
              color: risk.color,
              lineWidth: 2.5,
              dashStyle: 'ShortDash',
              marker: { radius: 5, fillColor: risk.color, lineWidth: 2, lineColor: '#fff', enabled: true },
              connectNulls: false,
            },
          ],
          credits: { enabled: false },
          exporting: {
            ...DS_EXPORTING,
            chartOptions: { title: { text: '30-Day SLA Compliance Forecast' } },
          },
        });
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className="skeleton" style={{ height: 280, borderRadius: 8 }} />
      </div>
    );
  }
  if (!data) return null;

  const risk = RISK_CONFIG[data.risk_level] || RISK_CONFIG.medium;
  const arrow = DIR_ARROW[data.trend_direction] || '→';
  const lastPeriod = data.chart_data?.[data.chart_data.length - 1]?.period;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
              <path d="M3 3v18h18"/><path d="M7 16l5-8 4 4 3-6"/>
            </svg>
          </div>
          <div>
            <div className={styles.title}>30-Day Forecast</div>
            <div className={styles.sub}>Linear trend extrapolation · {data.confidence} confidence</div>
          </div>
        </div>
        <div className={styles.riskBadge} style={{ background: risk.bg, color: risk.color }}>
          {risk.label}
        </div>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metric}>
          <div className={styles.metricValue} style={{ color: risk.color }}>
            {data.next_30_days_compliance_pct}%
          </div>
          <div className={styles.metricLabel}>Predicted Compliance</div>
        </div>
        <div className={styles.metricDivider} />
        <div className={styles.metric}>
          <div className={styles.metricValue} style={{ color: '#E53E3E' }}>
            {data.next_30_days_breach_count}
          </div>
          <div className={styles.metricLabel}>Predicted Breaches</div>
        </div>
        <div className={styles.metricDivider} />
        <div className={styles.metric}>
          <div className={`${styles.metricValue} ${data.trend_direction === 'worsening' ? styles.trendDown : styles.trendUp}`}>
            {arrow} {Math.abs(data.trend_slope_per_month).toFixed(1)}%/mo
          </div>
          <div className={styles.metricLabel}>Trend Slope</div>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <div ref={containerRef} />
      </div>

      <div className={styles.footer}>
        <span className={styles.footerNote}>
          Based on 6-month historical trend · Next period: {lastPeriod}
        </span>
        <span className={styles.footerAction} style={{ color: risk.color }}>
          {DIR_LABEL[data.trend_direction] || 'Monitor closely'}
        </span>
      </div>
    </div>
  );
}
