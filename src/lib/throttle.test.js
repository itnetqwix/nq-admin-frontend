import { describe, expect, it, vi } from 'vitest'
import { createThrottle } from './throttle'

function fakeClock() {
  let t = 1000
  const timers = []
  return {
    now: () => t,
    setTimer: (fn, ms) => {
      const handle = { fn, at: t + ms, cleared: false }
      timers.push(handle)
      return handle
    },
    clearTimer: handle => {
      handle.cleared = true
    },
    advance(ms) {
      t += ms
      timers.filter(h => !h.cleared && h.at <= t).forEach(h => ((h.cleared = true), h.fn()))
    }
  }
}

describe('createThrottle', () => {
  it('runs the first call immediately', () => {
    const clock = fakeClock()
    const fn = vi.fn()
    createThrottle(fn, 1000, clock)()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('collapses a burst into one trailing call', () => {
    const clock = fakeClock()
    const fn = vi.fn()
    const throttled = createThrottle(fn, 1000, clock)
    throttled() // runs
    clock.advance(100)
    throttled()
    clock.advance(100)
    throttled()
    clock.advance(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
    clock.advance(1000)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('runs again immediately after a quiet period', () => {
    const clock = fakeClock()
    const fn = vi.fn()
    const throttled = createThrottle(fn, 1000, clock)
    throttled()
    clock.advance(5000)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('cancel drops the pending trailing call', () => {
    const clock = fakeClock()
    const fn = vi.fn()
    const throttled = createThrottle(fn, 1000, clock)
    throttled()
    clock.advance(100)
    throttled()
    throttled.cancel()
    clock.advance(2000)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
