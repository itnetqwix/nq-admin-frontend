import { describe, expect, it } from 'vitest'
import { funnelRows } from './FunnelBars'

describe('funnelRows', () => {
  it('scales bars to the top step and reports step-to-step conversion', () => {
    const rows = funnelRows([
      { step: 'trainer_profile_viewed', users: 200 },
      { step: 'slot_selected', users: 100 },
      { step: 'booking_created', users: 25 }
    ])
    expect(rows.map(r => r.widthPct)).toEqual([100, 50, 13])
    expect(rows[0].conversion).toBeNull()
    expect(rows[1].conversion).toBe(0.5)
    expect(rows[2].conversion).toBe(0.25)
    expect(rows[1].label).toBe('Picked a time')
  })

  it('does not divide by zero when an earlier step is empty', () => {
    const rows = funnelRows([
      { step: 'a', users: 0 },
      { step: 'b', users: 5 }
    ])
    expect(rows[1].conversion).toBeNull()
  })

  it('keeps a tiny non-zero step visible and handles an empty funnel', () => {
    expect(funnelRows([{ step: 'a', users: 1000 }, { step: 'b', users: 1 }])[1].widthPct).toBe(2)
    expect(funnelRows([])).toEqual([])
    expect(funnelRows([{ step: 'a', users: 0 }])[0].widthPct).toBe(0)
  })
})
