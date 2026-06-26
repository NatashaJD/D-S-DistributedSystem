'use client';
import { useEffect, useRef } from 'react';
import { DS_EXPORTING, DS_TOOLTIP, DS_CHART_BASE } from './DSHighchartsTheme';

const METRIC_LABELS = {
  compliance_rate: 'Compliance %',
  avg_sla_pct:     'Avg SLA %',
  breach_count:    'Breaches',
  throughput:      'Throughput',
};

export default function DeptHeatmap({ data = [] }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data.length || typeof window === 'undefined') return;

    import('highcharts').then(({ default: Highcharts }) => {
      Promise.all([
        import('highcharts/modules/heatmap'),
        import('highcharts/modules/exporting'),
        import('highcharts/modules/export-data'),
        import('highcharts/modules/offline-exporting'),
      ]).then(([Heatmap, Exp, ExpData, Offline]) => {
        try { Heatmap.default(Highcharts); } catch {}
        try { Exp.default(Highcharts); } catch {}
        try { ExpData.default(Highcharts); } catch {}
        try { Offline.default(Highcharts); } catch {}

        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }

        if (!containerRef.current) return;

        const departments = [...new Set(data.map(d => d.department))];
        const metrics = [...new Set(data.map(d => d.metric))];

        const seriesData = data.map(cell => ({
          x: metrics.indexOf(cell.metric),
          y: departments.indexOf(cell.department),
          value: cell.value,
          level: cell.level,
          name: `${cell.department} / ${METRIC_LABELS[cell.metric] || cell.metric}`,
        }));

        chartRef.current = Highcharts.chart(containerRef.current, {
          chart: {
            ...DS_CHART_BASE,
            type: 'heatmap',
            height: Math.max(160, departments.length * 44 + 60),
            marginTop: 10,
            marginBottom: 40,
          },
          title: { text: null },
          xAxis: {
            categories: metrics.map(m => METRIC_LABELS[m] || m),
            labels: {
              style: { color: '#3D6480', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px' },
            },
            lineWidth: 0,
            tickWidth: 0,
          },
          yAxis: {
            categories: departments,
            title: null,
            reversed: false,
            labels: {
              style: { color: '#3D6480', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px' },
            },
            gridLineWidth: 0,
          },
          colorAxis: {
            min: 0,
            max: 150,
            stops: [
              [0,    '#00A878'],
              [0.5,  '#F5A623'],
              [0.8,  '#F58220'],
              [1.0,  '#E53E3E'],
            ],
            labels: {
              style: { color: '#3D6480', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px' },
            },
          },
          legend: {
            align: 'right',
            layout: 'vertical',
            verticalAlign: 'top',
            y: 10,
            symbolHeight: 180,
          },
          tooltip: {
            ...DS_TOOLTIP,
            formatter() {
              return `<b>${this.point.name}</b><br/>Value: <b>${this.point.value.toFixed(1)}</b>`;
            },
          },
          series: [{
            name: 'Dept Performance',
            data: seriesData,
            dataLabels: {
              enabled: true,
              color: '#0F2A3F',
              style: {
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                fontWeight: '600',
                textOutline: 'none',
              },
              formatter() { return this.point.value.toFixed(1); },
            },
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.6)',
          }],
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
  }, [data]);

  if (!data.length) return null;

  return <div ref={containerRef} />;
}
