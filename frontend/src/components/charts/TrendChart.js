'use client';
import { useEffect, useRef } from 'react';
import { useChartData } from '../../hooks/useChartData';
import { DS_EXPORTING, DS_TOOLTIP, DS_CHART_BASE, DS_AXIS, DS_LEGEND } from './DSHighchartsTheme';

export default function TrendChart() {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const { data: trends, loading } = useChartData(
    '/api/v1/analytics/trends?months=6',
    'trends_6m',
    120_000
  );

  useEffect(() => {
    if (!trends || typeof window === 'undefined') return;

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

        const categories = (trends || []).map(d => d.period);
        const totalSeries = (trends || []).map(d => d.total || 0);
        const completedSeries = (trends || []).map(d => d.completed || 0);
        const breachedSeries = (trends || []).map(d => d.breached || 0);

        chartRef.current = Highcharts.chart(containerRef.current, {
          chart: {
            ...DS_CHART_BASE,
            type: 'areaspline',
            height: 260,
            margin: [10, 20, 30, 50],
          },
          title: { text: null },
          xAxis: {
            ...DS_AXIS,
            categories,
            crosshair: { color: 'rgba(0,174,239,0.12)', width: 1 },
          },
          yAxis: {
            ...DS_AXIS,
            title: { text: null },
            min: 0,
          },
          tooltip: {
            ...DS_TOOLTIP,
            shared: true,
          },
          legend: {
            ...DS_LEGEND,
            align: 'right',
            verticalAlign: 'top',
            floating: true,
            y: -4,
          },
          plotOptions: {
            areaspline: {
              fillOpacity: 0.12,
              lineWidth: 2,
              marker: { enabled: false, symbol: 'circle', radius: 4 },
              states: { hover: { lineWidth: 3 } },
            },
          },
          series: [
            {
              name: 'Total',
              data: totalSeries,
              color: '#00AEEF',
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, 'rgba(0,174,239,0.25)'],
                  [1, 'rgba(0,174,239,0)'],
                ],
              },
            },
            {
              name: 'Completed',
              data: completedSeries,
              color: '#00A878',
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, 'rgba(0,168,120,0.20)'],
                  [1, 'rgba(0,168,120,0)'],
                ],
              },
            },
            {
              name: 'Breached',
              data: breachedSeries,
              color: '#E53E3E',
              dashStyle: 'ShortDash',
              fillColor: 'transparent',
              lineWidth: 2,
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
  }, [trends]);

  return (
    <div>
      {loading && (
        <div style={{ height: 260, background: 'rgba(0,174,239,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: '90%', height: 200 }} />
        </div>
      )}
      <div ref={containerRef} style={{ display: loading ? 'none' : 'block' }} />
    </div>
  );
}
