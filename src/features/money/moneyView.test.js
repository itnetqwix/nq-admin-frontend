import { describe, expect, it } from 'vitest'
import { disputeUrgency, liabilityRows, moneyTrend, overviewTiles, reasonLabel, revenueRows } from './moneyView'

describe('disputeUrgency', () => {
  it('is loudest for an open dispute with no evidence and a near or past deadline', () => {
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: -2 })).toMatchObject({ tone: 'danger', label: 'Overdue by 2d', rank: 0 })
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: 0 })).toMatchObject({ tone: 'danger', label: 'Due today' })
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: 2 })).toMatchObject({ tone: 'danger', label: 'Due in 2d' })
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: 4 })).toMatchObject({ tone: 'warning' })
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: 12 })).toMatchObject({ tone: 'neutral', label: 'Due in 12d' })
  })

  it('calms down once evidence is submitted, even close to the deadline', () => {
    expect(disputeUrgency({ state: 'open', evidence_submitted: true, evidenceDaysLeft: 1 })).toMatchObject({ tone: 'info', label: 'Evidence submitted' })
  })

  it('still asks for evidence when Stripe gave no deadline', () => {
    expect(disputeUrgency({ state: 'open', evidenceDaysLeft: null })).toMatchObject({ tone: 'warning', label: 'Needs evidence' })
  })

  it('reads closed disputes by outcome', () => {
    expect(disputeUrgency({ state: 'closed', outcome: 'won' })).toMatchObject({ tone: 'success', label: 'Won' })
    expect(disputeUrgency({ state: 'closed', outcome: 'lost' })).toMatchObject({ tone: 'danger', label: 'Lost' })
    expect(disputeUrgency({ state: 'closed', outcome: null }).label).toBe('Closed')
  })

  it('sorts overdue before due-soon before submitted before closed', () => {
    const ranks = [{ state: 'closed', outcome: 'won' }, { state: 'open', evidence_submitted: true }, { state: 'open', evidenceDaysLeft: 1 }, { state: 'open', evidenceDaysLeft: -1 }].map(d => disputeUrgency(d).rank)
    expect([...ranks].sort((a, b) => a - b)).toEqual([0, 1, 5, 9])
  })
})

describe('reasonLabel', () => {
  it('uses plain words and degrades gracefully', () => {
    expect(reasonLabel('fraudulent')).toBe('Fraud')
    expect(reasonLabel('some_new_reason')).toBe('some new reason')
    expect(reasonLabel(null)).toBe('—')
  })
})

describe('revenueRows', () => {
  it('scales bars to the biggest source and formats value and share', () => {
    const rows = revenueRows({ rows: [{ key: 'a', label: 'Commission', minor: 6000, share: 0.6 }, { key: 'b', label: 'Fee', minor: 1500, share: 0.15 }, { key: 'c', label: 'Tips', minor: 0, share: 0 }] })
    expect(rows.map(r => r.widthPct)).toEqual([100, 25, 0])
    expect(rows[0]).toMatchObject({ value: '$60.00', share: '60%' })
  })
  it('keeps a tiny non-zero source visible and survives no data', () => {
    expect(revenueRows({ rows: [{ key: 'a', label: 'A', minor: 100000, share: 0.99 }, { key: 'b', label: 'B', minor: 1, share: 0.01 }] })[1].widthPct).toBe(3)
    expect(revenueRows(null)).toEqual([])
    expect(revenueRows({ rows: [{ key: 'a', label: 'A', minor: 0, share: null }] })[0]).toMatchObject({ share: '—', widthPct: 0 })
  })
})

describe('liabilityRows / moneyTrend', () => {
  it('lists who is owed what', () => {
    const rows = liabilityRows({ traineeWalletMinor: 40000, coachAvailableMinor: 27000, coachPendingMinor: 6000, inEscrowMinor: 11000 })
    expect(rows.map(r => r.value)).toEqual(['$400.00', '$270.00', '$60.00', '$110.00'])
    expect(liabilityRows(null)).toEqual([])
  })
  it('builds aligned daily series and tolerates gaps', () => {
    const t = moneyTrend([{ date: '2026-10-09', gmvMinor: 100, revenueMinor: 10 }, { date: '2026-10-10', gmvMinor: 200 }])
    expect(t.gmv[0].data).toEqual([100, 200])
    expect(t.revenue[0].data).toEqual([10, 0])
  })
})

describe('overviewTiles', () => {
  const overview = {
    gmvMinor: 2200000, bookings: 140, takeRate: 0.15,
    revenue: { totalMinor: 515000 },
    refunds: { amountMinor: 50000, count: 4, rate: 0.03 },
    escrow: { heldMinor: 800000, releasingMinor: 20000 },
    payouts: { pendingMinor: 90000, pendingCount: 3 },
    disputes: { open: 2, openMinor: 30000, won: 3, lost: 1, winRate: 0.75 },
    walletLiability: { totalMinor: 7300000 }
  }
  it('summarises the money position with working drill-down links', () => {
    const tiles = Object.fromEntries(overviewTiles(overview).map(t => [t.key, t]))
    expect(tiles.gmv.value).toBe('$22K')
    expect(tiles.revenue.hint).toBe('15.0% take rate on completed')
    expect(tiles.disputes).toMatchObject({ value: '2', tone: 'danger', href: '/apps/finance/disputes' })
    expect(tiles.win.value).toBe('75%')
    expect(tiles.escrow.href).toBe('/apps/finance?tab=escrow&status=held')
    expect(tiles.payouts.href).toBe('/apps/finance?tab=payouts')
  })
  it('shows a dash for a win rate with no decided disputes, and is quiet with none open', () => {
    const tiles = Object.fromEntries(overviewTiles({ ...overview, disputes: { open: 0, openMinor: 0, won: 0, lost: 0, winRate: null } }).map(t => [t.key, t]))
    expect(tiles.win.value).toBe('—')
    expect(tiles.disputes.tone).toBeUndefined()
  })
  it('returns nothing without data', () => {
    expect(overviewTiles(null)).toEqual([])
  })
})
