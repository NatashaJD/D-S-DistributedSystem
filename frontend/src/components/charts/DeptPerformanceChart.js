'use client';
import { useEffect, useRef } from 'react';
import { useChartData } from '../../hooks/useChartData';
import { DS_EXPORTING, DS_TOOLTIP, DS_CHART_BASE, DS_AXIS } from './DSHighchartsTheme';

export default function DeptPerformanceChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { data: metrics, loading } = useChartData(
    '/api/v1/analytics/departments',
    'dept_metrics',
    60_000
  );

  useEffect(() => {
    if (!metrics || typeof window === 'undefined') return;

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

        const categories = (metrics || []).map(d => d.department);
        const complianceSeries = (metrics || []).map(d => parseFloat((d.compliance_rate || 0).toFixed(1)));
        const avgSlaSeries = (metrics || []).map(d => parseFloat((d.avg_sla_percentage || 0).toFixed(1)));

        chartRef.current = Highcharts.chart(containerRef.current, {
          chart: {
            ...DS_CHART_BASE,
            type: 'column',
            height: 240,
            margin: [10, 20, 30, 50],
          },
          title: { text: null },
          xAxis: {
            ...DS_AXIS,
            categories,
            crosshair: true,
          },
          yAxis: {
            ...DS_AXIS,
            title: { text: null },
            min: 0,
            max: 150,
            plotLines: [{
              color: 'rgba(0,168,120,0.5)',
              dashStyle: 'Dash',
              value: 100,
              width: 1.5,
              label: {
                text: 'SLA Limit',
                align: 'right',
                style: { color: '#00A878', fontSize: '9px', fontFamily: "'IBM Plex Mono', monospace" },
              },
            }],
          },
          tooltip: {
            ...DS_TOOLTIP,
            shared: true,
            valueSuffix: '%',
          },
          legend: {
            itemStyle: { color: '#3D6480', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px' },
          },
          plotOptions: {
            column: {
              borderRadius: 4,
              groupPadding: 0.1,
              dataLabels: { enabled: false },
            },
          },
          series: [
            {
              name: 'Compliance %',
              data: complianceSeries,
              color: '#00AEEF',
            },
            {
              name: 'Avg SLA %',
              data: avgSlaSeries,
              color: '#F58220',
            },
          ],
          credits: { enabled: false },
          exporting: DS_EXPORTING,
        });
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [metrics]);

  return (
    <div>
      {loading && (
        <div style={{ height: 240 }} className="skeleton" />
      )}
      <div ref={containerRef} style={{ display: loading ? 'none' : 'block' }} />
    </div>
  );
}
