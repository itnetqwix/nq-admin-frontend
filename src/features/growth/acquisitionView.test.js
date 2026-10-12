import { describe, expect, it } from 'vitest'
import { acquisitionNote, acquisitionRows } from './acquisitionView'

const data = {
  total: 10, tracked: 8, truncated: false,
  sources: [
    { source: 'google', medium: 'organic', signups: 4, booked: 2, bookedShare: 0.5 },
    { source: 'mobile_app', medium: 'ios', signups: 2, booked: 0, bookedShare: 0 },
    { source: 'referral', medium: 'invite', signups: 1, booked: 1, bookedShare: 1 },
    { source: 'direct', medium: 'none', signups: 1, booked: 0, bookedShare: 0 },
    { source: 'untracked', medium: null, signups: 2, booked: 1, bookedShare: 0.5 }
  ]
}

describe('acquisitionRows', () => {
  it('labels sources in plain words and marks untracked ones', () => {
    const r = acquisitionRows(data)
    expect(r.map(x => x.label)).toEqual(['Google · organic', 'Mobile app (iPhone)', 'Referred by a member', 'Direct visit', 'Not tracked (joined before source tracking)'])
    expect(r[4].tracked).toBe(false)
    expect(r[0]).toMatchObject({ signups: 4, booked: 2, bookedShare: 0.5 })
  })
  it('handles no data', () => {
    expect(acquisitionRows(undefined)).toEqual([])
  })
})

describe('acquisitionNote', () => {
  it('says how many signups have no source and warns about comparing ages', () => {
    expect(acquisitionNote(data)).toMatch(/2 of 10 signups have no recorded source/)
    expect(acquisitionNote(data)).toMatch(/newer sources look lower/)
  })
  it('flags truncation, and stays quiet with nothing to say', () => {
    expect(acquisitionNote({ ...data, tracked: 10, truncated: true })).toMatch(/most recent 50,000/)
    expect(acquisitionNote({ total: 0, sources: [] })).toBeNull()
  })
})
