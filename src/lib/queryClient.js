import { QueryClient } from '@tanstack/react-query'

/** 401/403/404 will not get better by asking again; everything else gets one retry. */
export function shouldRetry(failureCount, error) {
  const status = Number(error?.status)
  if ([400, 401, 403, 404, 422].includes(status)) return false
  return failureCount < 1
}

export function createAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true
      }
    }
  })
}
