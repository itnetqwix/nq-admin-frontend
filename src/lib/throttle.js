/**
 * Leading + trailing throttle: the first call runs immediately, calls during the quiet period are
 * collapsed into one trailing call. Used so a burst of socket events refetches once, not N times.
 */
export function createThrottle(fn, waitMs, { now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let last = 0
  let timer = null

  const run = () => {
    last = now()
    timer = null
    fn()
  }

  const throttled = () => {
    const remaining = waitMs - (now() - last)
    if (remaining <= 0) {
      if (timer) clearTimer(timer)
      run()
    } else if (!timer) {
      timer = setTimer(run, remaining)
    }
  }
  throttled.cancel = () => {
    if (timer) clearTimer(timer)
    timer = null
  }
  return throttled
}
