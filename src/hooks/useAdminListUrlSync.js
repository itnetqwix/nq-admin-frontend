import { useCallback, useEffect, useRef } from 'react'

/**
 * Sync list filters with URL query (shallow routing).
 * @param {object} opts
 * @param {import('next/router').NextRouter} opts.router
 * @param {string} opts.pathname
 * @param {Record<string, string>} opts.queryMap - applied filter keys → URL keys
 * @param {(values: Record<string, string>) => void} opts.onHydrate - called once when router ready
 */
export function useAdminListUrlSync({ router, pathname, queryMap = {}, onHydrate }) {
  const hydrated = useRef(false)

  useEffect(() => {
    if (!router.isReady || hydrated.current) return
    hydrated.current = true
    const q = router.query
    const values = {}
    Object.entries(queryMap).forEach(([stateKey, urlKey]) => {
      const raw = q[urlKey]
      if (raw != null) values[stateKey] = String(Array.isArray(raw) ? raw[0] : raw)
    })
    if (q.search != null) values.search = String(Array.isArray(q.search) ? q.search[0] : q.search)
    if (q.page != null) values.page = String(Array.isArray(q.page) ? q.page[0] : q.page)
    onHydrate?.(values)
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushQuery = useCallback(
    values => {
      const q = {}
      if (values.search) q.search = values.search
      if (values.page && Number(values.page) > 1) q.page = String(values.page)
      Object.entries(queryMap).forEach(([stateKey, urlKey]) => {
        const v = values[stateKey]
        if (v !== undefined && v !== null && String(v) !== '') q[urlKey] = String(v)
      })
      if (values.bookingId) q.bookingId = values.bookingId
      void router.replace({ pathname, query: q }, undefined, { shallow: true })
    },
    [router, pathname, queryMap]
  )

  return { pushQuery }
}
