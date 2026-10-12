// @vitest-environment jsdom
/**
 * Pins the shape of every finance table: fields, headers, sizes and the source of each cell
 * renderer. It exists so the columns can be reorganised without changing what an admin sees.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/link', () => ({ default: ({ children }) => <a>{children}</a> }))
vi.mock('src/services/financeApi', () => ({
  approvePayout: vi.fn(), disputeEscrowHold: vi.fn(), refundEscrowHold: vi.fn(), releaseEscrowHold: vi.fn(), resolveDisputeEscrow: vi.fn(), retryBookingRefund: vi.fn()
}))

import { TAB } from '../constants'
import { buildFinanceColumns } from '../columns'

const FIXTURE = path.join(__dirname, 'columns.baseline.json')
// Compiler output numbers its imports and records file/line for each element; neither says anything about behaviour.
const norm = v => (typeof v === 'string' ? v.replace(/__vite_ssr_import_\d+__\.?/g, '').replace(/\{[^{}]*fileName:[^{}]*\}/g, '{src}') : v)
const normalised = obj => JSON.parse(JSON.stringify(obj), (_, v) => norm(v))
const shape = tab =>
  buildFinanceColumns({ allowRefund: true, allowPayout: true, confirm: () => {}, load: () => {}, tab }).map(c => ({
    field: c.field, headerName: c.headerName, width: c.width, flex: c.flex, minWidth: c.minWidth,
    renderCell: c.renderCell ? String(c.renderCell) : undefined,
    valueGetter: c.valueGetter ? String(c.valueGetter) : undefined,
    valueFormatter: c.valueFormatter ? String(c.valueFormatter) : undefined
  }))
const current = () => Object.fromEntries(Object.entries(TAB).map(([name, tab]) => [name, shape(tab)]))

describe('finance columns', () => {
  it('match the recorded baseline for every tab', () => {
    if (process.env.UPDATE_BASELINE === '1') fs.writeFileSync(FIXTURE, JSON.stringify(current(), null, 1))
    const baseline = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))
    expect(normalised(current())).toEqual(normalised(baseline))
  })
  it('references nothing that is not imported (every cell renders against a sample row)', () => {
    const row = {
      _id: 'x1', id: 'x1', status: 'held', session_id: 'a'.repeat(24), trainer_id: { _id: 't1', fullname: 'T', email: 't@x.com' }, trainee_id: { _id: 'u1', fullname: 'U' },
      amount_minor: 1234, gross_minor: 5000, createdAt: new Date().toISOString(), reference_id: 'a'.repeat(24), reference_type: 'escrow_hold',
      reason: 'no_show', refund_status: 'failed', user: { id: 'u1', name: 'U', email: 'u@x.com' }, trainer: { id: 't1', name: 'T' }, trainee: { id: 'u1', name: 'U' }
    }
    for (const tab of Object.values(TAB)) {
      for (const c of buildFinanceColumns({ allowRefund: true, allowPayout: true, confirm: () => {}, load: () => {}, tab })) {
        for (const fn of [c.renderCell, c.valueGetter, c.valueFormatter]) {
          if (!fn) continue
          try {
            fn({ row, value: row[c.field], field: c.field, id: row._id })
          } catch (e) {
            expect(e.name, `${tab}/${c.field}: ${e.message}`).not.toBe('ReferenceError')
          }
        }
      }
    }
  })
  it('gives the two top-up tabs the same table and every other data tab its own', () => {
    expect(shape(TAB.STUCK_TOPUPS)).toEqual(shape(TAB.TOPUPS))
    const heads = [TAB.LEDGER, TAB.TRANSACTIONS, TAB.ESCROW, TAB.REFUNDS, TAB.PAYOUTS, TAB.TOPUPS, TAB.AUDIT].map(t => shape(t).map(c => c.field).join(','))
    expect(new Set(heads).size).toBe(heads.length)
  })
})
