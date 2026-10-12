import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { createThrottle } from 'src/lib/throttle'

/**
 * Refetch interval for a query that is normally pushed over the socket: off while the socket is
 * connected, `fallbackMs` while it is down so the screen never silently goes stale.
 */
export function useLiveRefetchInterval(fallbackMs = 30_000) {
  const { socketConnected } = useAdminRealtime()
  return socketConnected ? false : fallbackMs
}

/** 'live' | 'polling': what the realtime status chip shows. */
export function useRealtimeMode() {
  const { socketConnected } = useAdminRealtime()
  return socketConnected ? 'live' : 'polling'
}

/**
 * Invalidate `queryKey` whenever one of `events` arrives on the admin socket, at most once per
 * `throttleMs` (a burst of lesson events refetches once, not once per event).
 */
export function useInvalidateOnAdminEvent(events, queryKey, { throttleMs = 2000 } = {}) {
  const queryClient = useQueryClient()
  const { lastEvent } = useAdminRealtime()
  const eventSet = useMemo(() => new Set([].concat(events)), [events])
  const keyRef = useRef(queryKey)
  keyRef.current = queryKey

  const throttled = useMemo(
    () => createThrottle(() => queryClient.invalidateQueries({ queryKey: keyRef.current }), throttleMs),
    [queryClient, throttleMs]
  )
  useEffect(() => () => throttled.cancel(), [throttled])

  useEffect(() => {
    if (lastEvent && eventSet.has(lastEvent.event)) throttled()
  }, [lastEvent, eventSet, throttled])
}
