import { formatInt, formatMinor, formatPct } from 'src/utils/format'

/** How a series' values are shown on the axis and in tooltips. */
export function valueFormatter(format) {
  switch (format) {
    case 'money':
      // The API sends minor units; axis ticks use the compact form ($1.2K), tooltips the exact one.
      return (v, { exact = false } = {}) => formatMinor(v, { compact: !exact })
    case 'pct':
      return v => formatPct(v)
    case 'ms':
      return v => (v == null ? '—' : `${Math.round(v)} ms`)
    default:
      return v => formatInt(v)
  }
}

/**
 * ApexCharts options for a trend chart. Pure so it can be tested: colours come from
 * useChartColors() (real hex for the current mode) because Apex cannot resolve CSS variables.
 */
export function buildTrendOptions({ colors, categories = [], format = 'count', type = 'area', stacked = false }) {
  const fmt = valueFormatter(format)
  return {
    chart: {
      type,
      stacked,
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      animations: { enabled: true, easing: 'easeinout', speed: 350 }
    },
    theme: { mode: colors.mode },
    colors: colors.series,
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: type === 'bar' ? 0 : 2 },
    fill: type === 'area' ? { type: 'gradient', gradient: { opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 100] } } : { opacity: 1 },
    grid: { borderColor: colors.grid, strokeDashArray: 3, padding: { left: 8, right: 8 } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: colors.muted, fontSize: '11px' }, rotate: 0, hideOverlappingLabels: true }
    },
    yaxis: {
      labels: { style: { colors: colors.muted, fontSize: '11px' }, formatter: v => fmt(v) }
    },
    tooltip: { theme: colors.mode, y: { formatter: v => fmt(v, { exact: true }) } },
    legend: { show: false },
    states: { hover: { filter: { type: 'none' } } }
  }
}
