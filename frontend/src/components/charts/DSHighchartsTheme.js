'use client';
/**
 * Davis & Shirtliff Highcharts theme.
 * Applies IBM Plex Sans/Mono, D&S cyan palette, and exporting.
 * Import and call applyDSTheme(Highcharts) once before rendering any chart.
 */

export const DS_COLORS = ['#00AEEF', '#F58220', '#00A878', '#7C3AED', '#F5A623', '#E53E3E', '#0090C9'];

export const DS_EXPORTING = {
  enabled: true,
  fallbackToExportServer: false,
  buttons: {
    contextButton: {
      menuItems: [
        'downloadPNG',
        'downloadPDF',
        'downloadSVG',
        'separator',
        'downloadCSV',
        'downloadXLS',
      ],
      symbol: 'menu',
      symbolStrokeWidth: 2,
      theme: {
        fill: '#fff',
        stroke: 'rgba(0,174,239,0.3)',
        r: 6,
        states: {
          hover: { fill: '#00AEEF', stroke: '#0090C9' },
          select: { fill: '#0090C9' },
        },
      },
    },
  },
};

export const DS_TOOLTIP = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(0,174,239,0.25)',
  borderRadius: 8,
  borderWidth: 1,
  shadow: { color: 'rgba(15,42,63,0.12)', blur: 12 },
  style: {
    color: '#0F2A3F',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '12px',
  },
};

export const DS_CHART_BASE = {
  backgroundColor: '#FFFFFF',
  style: { fontFamily: "'IBM Plex Sans', sans-serif" },
  animation: { duration: 600, easing: 'easeInOut' },
};

export const DS_AXIS = {
  gridLineColor: 'rgba(0,174,239,0.10)',
  lineColor: 'rgba(0,174,239,0.15)',
  tickColor: 'rgba(0,174,239,0.15)',
  labels: {
    style: {
      color: '#3D6480',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '11px',
    },
  },
  title: {
    style: { color: '#3D6480', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '11px' },
  },
};

export const DS_LEGEND = {
  itemStyle: {
    color: '#3D6480',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '11px',
    fontWeight: '400',
  },
  itemHoverStyle: { color: '#0F2A3F' },
};

export function applyDSTheme(Highcharts) {
  if (!Highcharts || typeof Highcharts.setOptions !== 'function') return;
  Highcharts.setOptions({
    colors: DS_COLORS,
    chart: DS_CHART_BASE,
    title: {
      style: {
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontWeight: '700',
        color: '#0F2A3F',
        fontSize: '14px',
      },
    },
    subtitle: {
      style: { fontFamily: "'IBM Plex Sans', sans-serif", color: '#3D6480', fontSize: '11px' },
    },
    xAxis: DS_AXIS,
    yAxis: DS_AXIS,
    legend: DS_LEGEND,
    tooltip: DS_TOOLTIP,
    credits: { enabled: false },
    exporting: DS_EXPORTING,
  });
}
