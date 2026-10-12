import { describe, expect, it } from 'vitest'
import { buildTrendOptions, valueFormatter } from './chartOptions'

const colors = { mode: 'dark', series: ['#6B8CFF', '#10C97A'], grid: 'rgba(255,255,255,0.08)', muted: '#94A3B8' }

describe('valueFormatter', () => {
  it('formats money compactly on axes and exactly in tooltips', () => {
    const f = valueFormatter('money')
    expect(f(5000000)).toBe('$50K')
    expect(f(123456, { exact: true })).toBe('$1,234.56')
  })
  it('formats ratios as percent, latency as ms and counts with separators', () => {
    expect(valueFormatter('pct')(0.0254)).toBe('2.5%')
    expect(valueFormatter('ms')(182.4)).toBe('182 ms')
    expect(valueFormatter('ms')(null)).toBe('—')
    expect(valueFormatter('count')(12345)).toBe('12,345')
    expect(valueFormatter()(7)).toBe('7')
  })
})

describe('buildTrendOptions', () => {
  it('uses literal colours for the current mode, never CSS variables', () => {
    const o = buildTrendOptions({ colors, categories: ['a'] })
    expect(o.colors).toEqual(['#6B8CFF', '#10C97A'])
    expect(o.theme.mode).toBe('dark')
    expect(o.tooltip.theme).toBe('dark')
    expect(JSON.stringify(o)).not.toContain('var(')
  })
  it('wires the formatter into the y axis and tooltip', () => {
    const o = buildTrendOptions({ colors, format: 'money' })
    expect(o.yaxis.labels.formatter(5000000)).toBe('$50K')
    expect(o.tooltip.y.formatter(123456)).toBe('$1,234.56')
  })
  it('only fills area charts with a gradient', () => {
    expect(buildTrendOptions({ colors, type: 'area' }).fill.type).toBe('gradient')
    expect(buildTrendOptions({ colors, type: 'bar' }).fill.type).toBeUndefined()
    expect(buildTrendOptions({ colors, type: 'bar' }).stroke.width).toBe(0)
  })
})
