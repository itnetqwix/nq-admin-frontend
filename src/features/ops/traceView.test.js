import { describe, expect, it } from 'vitest'
import { filterTrace } from './traceView'

describe('filterTrace', () => {
  const items = [{ source: 'api' }, { source: 'ops' }, { source: 'api' }, { source: 'sentry' }]
  it('keeps everything for all, and only the chosen source otherwise', () => {
    expect(filterTrace(items, 'all')).toHaveLength(4)
    expect(filterTrace(items, 'api')).toHaveLength(2)
    expect(filterTrace(items, 'sentry')).toEqual([{ source: 'sentry' }])
  })
  it('tolerates missing data', () => {
    expect(filterTrace(undefined, 'api')).toEqual([])
  })
})
