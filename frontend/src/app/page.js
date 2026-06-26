'use client';
import { useEffect, useState } from 'react';
import KPICard from '../components/charts/KPICard';
import SLAGauge from '../components/charts/SLAGauge';
import DeptHeatmap from '../components/charts/DeptHeatmap';
import TrendChart from '../components/charts/TrendChart';
import DeptPerformanceChart from '../components/charts/DeptPerformanceChart';
import EnterpriseHealthScore from '../components/intelligence/EnterpriseHealthScore';
import RootCausePulse from '../components/intelligence/RootCausePulse';
import ExecutiveRecommendations from '../components/intelligence/ExecutiveRecommendations';
import FinancialKPIs from '../components/intelligence/FinancialKPIs';
import ForecastPanel from '../components/intelligence/ForecastPanel';
import { useAPI } from '../hooks/useAPI';
import styles from './page.module.css';

function LoadingSkeleton() {
  return (
    <div className="grid-4" style={{ gap: '16px', marginBottom: '32px' }}>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 12 }} />)}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { data: kpis, loading: kpiLoading } = useAPI('/api/v1/analytics/kpis');
  const { data: heatmap } = useAPI('/api/v1/analytics/heatmap');
  const { data: regions } = useAPI('/api/v1/analytics/regions');
  const { data: healthScore, loading: healthLoading } = useAPI('/api/v1/analytics/health-score');
  const { data: rootCause, loading: rootLoading } = useAPI('/api/v1/analytics/root-cause');
  const { data: recommendations, loading: recsLoading } = useAPI('/api/v1/analytics/recommendations');

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.title}>Executive Overview</h2>
          <p className={styles.subtitle}>360° operational visibility across all departments</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.exportBtn} onClick={() => window.print()} title="Export dashboard as PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
          <div className={styles.liveTag}>
            <span className={styles.liveDot} />
            Live Data
          </div>
        </div>
      </div>

      {/* Enterprise Health Score */}
      <EnterpriseHealthScore data={healthScore} loading={healthLoading} />

      {/* Financial Intelligence Layer */}
      <div className={styles.sectionDivider}>
        <span className={styles.sectionLabel}>Financial Intelligence</span>
      </div>
      <div className={styles.intelligenceRow}>
        <FinancialKPIs />
        <ForecastPanel />
      </div>

      {/* Operational Intelligence Layer */}
      <div className={styles.sectionDivider}>
        <span className={styles.sectionLabel}>Root Cause & Actions</span>
      </div>
      <div className={styles.intelligenceRow}>
        <RootCausePulse data={rootCause} loading={rootLoading} />
        <ExecutiveRecommendations data={recommendations} loading={recsLoading} />
      </div>

      {/* ── Divider ─────────────────────────────── */}
      <div className={styles.sectionDivider}>
        <span className={styles.sectionLabel}>Operational Metrics</span>
      </div>

      {/* KPI Cards */}
      {kpiLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className={`grid-4 ${styles.kpiGrid}`}>
          <KPICard
            title="Total Requests"
            value={kpis?.total_requests || 0}
            variant="primary"
            trend={8}
          />
          <KPICard
            title="SLA Compliance"
            value={kpis?.sla_compliance_pct || 0}
            suffix="%"
            variant="success"
            trend={3}
          />
          <KPICard
            title="Active Breaches"
            value={kpis?.active_breaches || 0}
            variant="warning"
            subtitle="Require immediate attention"
          />
          <KPICard
            title="Critical Delays"
            value={kpis?.critical_delays || 0}
            variant="danger"
            subtitle="150%+ SLA consumed"
          />
        </div>
      )}

      <div className={`grid-4 ${styles.kpiGrid}`}>
        <KPICard
          title="Active Requests"
          value={kpis?.active_requests || 0}
          subtitle="Currently in pipeline"
        />
        <KPICard
          title="Completed"
          value={kpis?.completed_requests || 0}
          variant="success"
        />
        <KPICard
          title="This Month"
          value={kpis?.requests_this_month || 0}
        />
        <KPICard
          title="Avg Resolution"
          value={kpis?.avg_resolution_hours || 0}
          suffix="h"
          subtitle="Business hours"
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Trend Chart */}
        <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Request Volume & Compliance Trend</h3>
            <span className={styles.cardSub}>Last 6 months</span>
          </div>
          <TrendChart />
        </div>

        {/* SLA Gauge */}
        <div className={`card ${styles.chartCard} ${styles.gaugeCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Overall SLA</h3>
          </div>
          <div className={styles.gaugeWrapper}>
            <SLAGauge percentage={kpis?.sla_compliance_pct || 0} size={160} label="Compliance Rate" />
          </div>
          <div className={styles.gaugeStats}>
            {[
              { label: 'On Track', value: Math.round((kpis?.active_requests || 0) * 0.6), color: 'var(--color-success)' },
              { label: 'Warning', value: Math.round((kpis?.active_requests || 0) * 0.25), color: 'var(--color-warning)' },
              { label: 'Breached', value: kpis?.active_breaches || 0, color: 'var(--color-danger)' },
            ].map(s => (
              <div key={s.label} className={styles.gaugeStat}>
                <span className="sla-dot" style={{ background: s.color }} />
                <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className={styles.chartsRow}>
        <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Department Performance</h3>
            <span className={styles.cardSub}>Compliance rate by department</span>
          </div>
          <DeptPerformanceChart />
        </div>

        {/* Regional Breakdown */}
        <div className={`card ${styles.chartCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Regional Breakdown</h3>
          </div>
          <div className={styles.regionList}>
            {(regions || []).slice(0, 6).map(r => (
              <div key={r.region} className={styles.regionRow}>
                <span className={styles.regionName}>{r.region}</span>
                <div className={styles.regionBar}>
                  <div
                    className={styles.regionFill}
                    style={{
                      width: `${regions?.length ? (r.total_requests / Math.max(...(regions || []).map(x => x.total_requests))) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className={styles.regionCount}>{r.total_requests}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className={`card ${styles.chartCard}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Performance Heatmap</h3>
          <span className={styles.cardSub}>Department × Metric matrix</span>
        </div>
        <DeptHeatmap data={heatmap || []} />
      </div>
    </div>
  );
}
