import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { render } from '@testing-library/react'

/** A client that never retries or caches between tests, so a failing fetch fails the test fast. */
export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 }, mutations: { retry: false } } })
}

export function renderWithProviders(ui, { mode = 'light', queryClient = createTestQueryClient() } = {}) {
  const theme = createTheme({ palette: { mode } })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>
  )
  return { ...utils, queryClient }
}
