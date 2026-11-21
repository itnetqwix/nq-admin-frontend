import { describe, expect, it } from 'vitest'
import { countProblems, diagnosisTone, formatBytes, groupRecordingEvents, levelTone, recordingLogText } from './recordingView'

describe('recordingView', () => {
  it('maps API tones to pill tones', () => {
    expect(diagnosisTone('error')).toBe('danger')
    expect(diagnosisTone('success')).toBe('success')
    expect(levelTone('warn')).toBe('warning')
    expect(levelTone(undefined)).toBe('neutral')
  })

  it('formats bytes and hides empty sizes', () => {
    expect(formatBytes(0)).toBeNull()
    expect(formatBytes(512 * 1024)).toBe('512 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('groups pre-take events first, then takes, then orphaned take ids', () => {
    const takes = [{ id: 't1' }, { id: 't2' }]
    const events = [
      { id: 'a', take_id: null },
      { id: 'b', take_id: 't2' },
      { id: 'c', take_id: 'gone' },
      { id: 'd', take_id: 't1' }
    ]
    const groups = groupRecordingEvents(events, takes)
    expect(groups.map(g => g.key)).toEqual(['pre', 't1', 't2', 'gone'])
    expect(groups[1].events.map(e => e.id)).toEqual(['d'])
    expect(groups[3].title).toMatch(/Removed take/)
  })

  it('keeps a take with no events', () => {
    const groups = groupRecordingEvents([], [{ id: 't1' }])
    expect(groups).toHaveLength(1)
    expect(groups[0].events).toEqual([])
  })

  it('counts problems', () => {
    expect(countProblems([{ level: 'error' }, { level: 'warn' }, { level: 'warn' }, { level: 'info' }])).toEqual({ errors: 1, warnings: 2 })
  })

  it('builds a pasteable transcript', () => {
    const text = recordingLogText({
      sessionId: 's1',
      diagnosis: { headline: 'Recording failed', detail: 'empty file' },
      events: [{ at: '2026-11-21T10:00:00Z', level: 'error', phase: 'transcode', code: 'empty_upload', source: 'worker', message: 'Uploaded file was empty', owner: { name: 'Sam' } }]
    })
    expect(text).toContain('Diagnosis: Recording failed — empty file')
    expect(text).toContain('[ERROR] Processing/empty_upload (worker, Sam): Uploaded file was empty')
  })
})
