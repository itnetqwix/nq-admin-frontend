import * as Sentry from '@sentry/nextjs'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

const Fallback = ({ eventId, resetError }) => (
  <Box sx={{ p: 4, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
    <Typography variant='h6' sx={{ mb: 1 }}>
      This screen crashed
    </Typography>
    <Typography color='text.secondary' sx={{ mb: 2 }}>
      The error was reported automatically. Try again, or reload the page.
      {eventId ? ` Reference: ${eventId}` : ''}
    </Typography>
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      <Button variant='outlined' onClick={resetError}>
        Try again
      </Button>
      <Button variant='contained' onClick={() => window.location.reload()}>
        Reload
      </Button>
    </Box>
  </Box>
)

/** Catches render errors in a page and reports them to Sentry (the admin had no boundary before). */
export default function AppErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={props => <Fallback {...props} />} showDialog={false}>
      {children}
    </Sentry.ErrorBoundary>
  )
}
