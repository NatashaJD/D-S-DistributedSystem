'use client';
import { useEffect, useRef } from 'react';
import { useAPI } from '../../hooks/useAPI';
import { useChartData } from '../../hooks/useChartData';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../lib/roleConfig';
import { DS_EXPORTING, DS_TOOLTIP, DS_CHART_BASE, DS_AXIS } from '../../components/charts/DSHighchartsTheme';
import styles from './page.module.css';

const DEPT_COLORS = {
  Sales: '#00AEEF',
  Engineering: '#7C3AED',
  Quotations: '#F5A623',
  Logistics: '#00A878',
};

let _hcReady = null;

function loadHighcharts() {
  if (_hcReady) return _hcReady;
  _hcReady = import('highcharts').then(({ default: Highcharts }) =>
    Promise.all([
      import('highcharts/modules/exporting'),
      import('highcharts/modules/export-data'),
      import('highcharts/modules/offline-exporting'),
    ]).then(([Exp, ExpData, Offline]) => {
      try { Exp.default(Highcharts); } catch {}
      try { ExpData.default(Highcharts); } catch {}
      try { Offline.default(Highcharts); } catch {}
      return Highcharts;
    })
  );
  return _hcReady;
}

function useHighcharts(containerRef, buildOptions, deps) {
  const chartRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadHighcharts().then((Highcharts) => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      if (containerRef.current) {
        const opts = buildOptions(Highcharts);
        if (opts) chartRef.current = Highcharts.chart(containerRef.current, opts);
      }
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function TrendLineChart({ data }) {
  const ref = useRef(null);
  useHighcharts(ref, () => {
    if (!data) return null;
    const categories = data.map(d => d.period);
    return {
      chart: { ...DS_CHART_BASE, type: 'line', height: 280, margin: [10, 20, 30, 44] },
      title: { text: null },
      xAxis: { ...DS_AXIS, categories },
      yAxis: { ...DS_AXIS, title: { text: null }, min: 0 },
      tooltip: { ...DS_TOOLTIP, shared: true },
      legend: { itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '11px' } },
      plotOptions: { line: { marker: { radius: 4, enabled: true }, lineWidth: 2.5 } },
      series: [
        { name: 'Total',     data: data.map(d => d.total || 0),     color: '#00AEEF' },
        { name: 'Completed', data: data.map(d => d.completed || 0), color: '#00A878' },
        { name: 'Breached',  data: data.map(d => d.breached || 0),  color: '#E53E3E', dashStyle: 'ShortDash' },
      ],
      credits: { enabled: false },
      exporting: { ...DS_EXPORTING, chartOptions: { title: { text: '6-Month Request Trends' } } },
    };
  }, [data]);
  return <div ref={ref} />;
}

function DeptRadarChart({ data }) {
  const ref = useRef(null);
  useHighcharts(ref, () => {
    if (!data || !data.length) return null;
    const categories = data.map(d => d.department);
    return {
      chart: { ...DS_CHART_BASE, polar: true, type: 'line', height: 280, margin: [30, 20, 30, 20] },
      title: { text: null },
      xAxis: {
        categories,
        tickmarkPlacement: 'on',
        lineWidth: 0,
        labels: { style: { color: '#3D6480', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '11px' } },
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0,
        max: 100,
        labels: { style: { color: '#3D6480', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px' } },
        gridLineColor: 'rgba(0,174,239,0.12)',
      },
      tooltip: { ...DS_TOOLTIP, shared: true, valueSuffix: '' },
      legend: { itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '11px' } },
      plotOptions: { line: { lineWidth: 1.5, marker: { radius: 3 }, fillOpacity: 0.1, pointPlacement: 'on' } },
      series: [
        { name: 'Compliance %', data: data.map(d => parseFloat(d.compliance_rate.toFixed(1))),                        color: '#00AEEF',  type: 'area' },
        { name: 'Throughput',   data: data.map(d => Math.min(d.throughput || d.completed_stages, 100)),               color: '#00A878',  type: 'area' },
        { name: 'SLA Health',   data: data.map(d => Math.max(0, 100 - d.avg_sla_percentage)),                         color: '#F58220',  type: 'area' },
      ],
      credits: { enabled: false },
      exporting: { ...DS_EXPORTING, chartOptions: { title: { text: 'Department Multi-Metric Radar' } } },
    };
  }, [data]);
  return <div ref={ref} />;
}

function StageTimeChart({ data }) {
  const ref = useRef(null);
  useHighcharts(ref, () => {
    if (!data || !data.length) return null;
    return {
      chart: { ...DS_CHART_BASE, type: 'bar', height: 260, margin: [10, 30, 20, 100] },
      title: { text: null },
      xAxis: {
        categories: data.map(d => d.stage),
        labels: { style: { color: '#3D6480', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px' } },
        lineWidth: 0,
        tickWidth: 0,
      },
      yAxis: { ...DS_AXIS, title: { text: null }, min: 0 },
      tooltip: { ...DS_TOOLTIP, shared: true, valueSuffix: ' hrs' },
      legend: { itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '11px' } },
      plotOptions: { bar: { borderRadius: 3, groupPadding: 0.12 } },
      series: [
        { name: 'Avg Hours', data: data.map(d => parseFloat((d.avg_hours || 0).toFixed(1))), color: '#00AEEF' },
        { name: 'Max Hours', data: data.map(d => parseFloat((d.max_hours || 0).toFixed(1))), color: '#F58220' },
      ],
      credits: { enabled: false },
      exporting: { ...DS_EXPORTING, chartOptions: { title: { text: 'Processing Time by Stage' } } },
    };
  }, [data]);
  return <div ref={ref} />;
}

function RegionalChart({ data }) {
  const ref = useRef(null);
  const sorted = data ? [...data].sort((a, b) => b.total_requests - a.total_requests) : [];
  useHighcharts(ref, () => {
    if (!sorted.length) return null;
    return {
      chart: { ...DS_CHART_BASE, type: 'column', height: 260, margin: [10, 20, 50, 44] },
      title: { text: null },
      xAxis: {
        ...DS_AXIS,
        categories: sorted.map(d => d.region),
        labels: { rotation: -30, style: { color: '#3D6480', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px' } },
      },
      yAxis: { ...DS_AXIS, title: { text: null }, min: 0 },
      tooltip: { ...DS_TOOLTIP, shared: true },
      legend: { itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '11px' } },
      plotOptions: {
        column: { stacking: 'normal', borderRadius: 0 },
        series: { groupPadding: 0.1 },
      },
      series: [
        { name: 'Completed',   data: sorted.map(d => d.completed   || 0), color: '#00A878' },
        { name: 'In Progress', data: sorted.map(d => d.in_progress || 0), color: '#00AEEF' },
        { name: 'Delayed',     data: sorted.map(d => d.delayed     || 0), color: '#E53E3E' },
      ],
      credits: { enabled: false },
      exporting: { ...DS_EXPORTING, chartOptions: { title: { text: 'Regional Request Breakdown' } } },
    };
  }, [sorted.length]);
  return <div ref={ref} />;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const roleConfig = getRoleConfig(user?.role, user?.scope);

  const { data: trends, loading: trendLoading } = useChartData('/api/v1/analytics/trends?months=6', 'analytics_trends_6m', 120_000);
  const { data: depts } = useAPI('/api/v1/analytics/departments');
  const { data: stages } = useAPI('/api/v1/analytics/stages');
  const { data: regions } = useAPI('/api/v1/analytics/regions');

  const scopedDepts = roleConfig.defaultDeptFilter
    ? (depts || []).filter(d => d.department === roleConfig.defaultDeptFilter)
    : (depts || []);

  const subtitleScope = roleConfig.scopeType
    ? `${roleConfig.scopeDisplay} view`
    : 'All departments and regions';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Analytics &amp; Insights</h2>
          <p className={styles.subtitle}>{subtitleScope} - historical trends, performance, and stage analysis</p>
        </div>
        {roleConfig.scopeType && (
          <div className={styles.scopeBadge}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {roleConfig.scopeDisplay}
          </div>
        )}
      </div>

      {/* Dept compliance summary - filtered for scoped roles */}
      <div className="grid-4">
        {(scopedDepts.length > 0 ? scopedDepts : (depts || [])).map(d => (
          <div key={d.department} className={`card ${styles.statCard}`}>
            <div className={styles.statLabel}>{d.department}</div>
            <div className={styles.statValue} style={{ color: DEPT_COLORS[d.department] }}>
              {d.compliance_rate.toFixed(1)}<span className={styles.statUnit}>%</span>
            </div>
            <div className={styles.statSub}>Compliance</div>
          </div>
        ))}
      </div>

      {/* Trend line + Radar */}
      <div className={styles.chartsRow}>
        <div className={`card ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Monthly Request Trends</h3>
            <span className={styles.cardSub}>6-month view</span>
          </div>
          {trendLoading
            ? <div className="skeleton" style={{ height: 280, borderRadius: 6 }} />
            : <TrendLineChart data={trends} />
          }
        </div>
        <div className={`card ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Department Radar</h3>
            <span className={styles.cardSub}>Multi-metric comparison</span>
          </div>
          <DeptRadarChart data={depts} />
        </div>
      </div>

      {/* Stage processing + Regional */}
      <div className={styles.chartsRow}>
        <div className={`card ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Processing Time by Stage</h3>
            <span className={styles.cardSub}>Business hours</span>
          </div>
          <StageTimeChart data={stages} />
        </div>
        <div className={`card ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Regional Breakdown</h3>
            <span className={styles.cardSub}>Requests by region</span>
          </div>
          <RegionalChart data={regions} />
        </div>
      </div>

      {/* Department detail table */}
      <div className="card" style={{ padding: 'var(--sp-xl)' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Department Performance Details</h3>
          <span className={styles.cardSub}>{(depts || []).length} departments</span>
        </div>
        <table className={styles.deptTable}>
          <thead>
            <tr>
              {['Department', 'Total Stages', 'Completed', 'Breached', 'Avg SLA %', 'Compliance'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(depts || []).map(d => (
              <tr key={d.department} className={roleConfig.defaultDeptFilter === d.department ? styles.highlightRow : ''}>
                <td style={{ fontWeight: 700, color: DEPT_COLORS[d.department] }}>{d.department}</td>
                <td>{d.total_stages}</td>
                <td style={{ color: 'var(--color-success)' }}>{d.completed_stages}</td>
                <td style={{ color: 'var(--color-danger)' }}>{d.breached_stages}</td>
                <td>{d.avg_sla_percentage.toFixed(1)}%</td>
                <td style={{ color: d.compliance_rate >= 80 ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>
                  {d.compliance_rate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
