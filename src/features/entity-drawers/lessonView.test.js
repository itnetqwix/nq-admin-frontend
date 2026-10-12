import { describe, expect, it } from 'vitest'
import { escrowTone, journeyChecklist, journeyHeadline, moneyRows, normalizeRttMs, qualityBand } from './lessonView'

describe('journeyChecklist', () => {
  it('lists every step in order and marks unreached ones as none', () => {
    const list = journeyChecklist({
      steps: [
        { step: 'recording', state: 'pending', title: 'Processing', createdAt: 't2' },
        { step: 'lesson', state: 'succeeded', createdAt: 't1' }
      ]
    })
    expect(list.map(s => s.step).slice(0, 4)).toEqual(['lesson_selection', 'lesson', 'participants', 'chat'])
    expect(list.find(s => s.step === 'lesson')).toMatchObject({ state: 'succeeded', tone: 'success' })
    expect(list.find(s => s.step === 'recording')).toMatchObject({ state: 'pending', tone: 'warning', title: 'Processing' })
    expect(list.find(s => s.step === 'chat')).toMatchObject({ state: 'none', tone: 'neutral', at: null })
  })

  it('appends steps the server adds later instead of hiding them', () => {
    const list = journeyChecklist({ steps: [{ step: 'brand_new_step', state: 'failed' }] })
    expect(list.at(-1)).toMatchObject({ step: 'brand_new_step', tone: 'danger' })
  })

  it('handles a missing journey', () => {
    expect(journeyChecklist(null)).toHaveLength(10)
  })
})

describe('journeyHeadline', () => {
  it('prioritises failures, then completion, then processing', () => {
    expect(journeyHeadline({ blocked: [1, 2], steps: [1] })).toEqual({ tone: 'danger', text: '2 steps failed or blocked' })
    expect(journeyHeadline({ blocked: [1], steps: [1] }).text).toBe('1 step failed or blocked')
    expect(journeyHeadline({ complete: true, blocked: [], steps: [1] }).tone).toBe('success')
    expect(journeyHeadline({ ended: true, pending: [1], blocked: [], steps: [1] })).toMatchObject({ tone: 'warning' })
    expect(journeyHeadline({ steps: [], blocked: [], pending: [] }).tone).toBe('neutral')
    expect(journeyHeadline({ steps: [1], blocked: [], pending: [] }).tone).toBe('info')
    expect(journeyHeadline(null)).toBeNull()
  })
})

describe('normalizeRttMs', () => {
  it('treats small values as seconds and larger as milliseconds', () => {
    expect(normalizeRttMs(0.085)).toBe(85)
    expect(normalizeRttMs(120)).toBe(120)
    expect(normalizeRttMs(120.4)).toBe(120)
  })
  it('returns null for missing, zero or non-numeric values', () => {
    for (const v of [null, undefined, 0, -1, 'x', NaN]) expect(normalizeRttMs(v)).toBeNull()
  })
})

describe('qualityBand', () => {
  it('uses the same 0-100 bands as the backend', () => {
    expect(qualityBand(90).label).toBe('Good')
    expect(qualityBand(75).label).toBe('Good')
    expect(qualityBand(60).label).toBe('Fair')
    expect(qualityBand(45).label).toBe('Fair')
    expect(qualityBand(44).label).toBe('Poor')
    expect(qualityBand(null).label).toBe('No data')
  })
})

describe('moneyRows', () => {
  it('formats the escrow breakdown and skips absent fields and zero surge', () => {
    const rows = moneyRows({
      escrow: { charge_total_minor: 11000, session_subtotal_minor: 10000, surge_minor: 0, trainee_platform_fee_minor: 500, trainer_net_minor: 8500, platform_fee_minor: 2500 }
    })
    const byLabel = Object.fromEntries(rows.map(r => [r.label, r]))
    expect(byLabel['Charged to trainee'].value).toBe('$110.00')
    expect(byLabel['Coach earns']).toMatchObject({ value: '$85.00', strong: true })
    expect(byLabel.Surge).toBeUndefined()
    expect(byLabel.Tax).toBeUndefined()
  })
  it('returns nothing without an escrow hold', () => {
    expect(moneyRows({ escrow: null })).toEqual([])
    expect(moneyRows(null)).toEqual([])
  })
})

describe('escrowTone', () => {
  it('maps hold status to a tone', () => {
    expect(escrowTone('released')).toBe('success')
    expect(escrowTone('disputed')).toBe('danger')
    expect(escrowTone('held')).toBe('info')
    expect(escrowTone('whatever')).toBe('neutral')
  })
})
