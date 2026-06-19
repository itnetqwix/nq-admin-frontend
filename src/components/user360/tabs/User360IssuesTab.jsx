import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material'

import { SectionShell, EmptyHint } from '../user360Shared'

export default function User360IssuesTab({ userId, opsItems = [], loadingOpsEvents = false }) {
  return (
    <SectionShell
      title='Issues & logs'
      subtitle='Ops events for this user: calls, instant lessons, wallet, support tickets, and errors.'
      action={
        <Button component={Link} href={`/apps/ops-logs?userId=${userId}`} variant='outlined' size='small'>
          View all logs
        </Button>
      }
    >
      {loadingOpsEvents ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}
      {!loadingOpsEvents && opsItems.length ? (
        <Stack spacing={1.5}>
          {opsItems.slice(0, 30).map(row => (
            <Paper key={row._id || row.event_id} variant='outlined' sx={{ p: 2 }}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Chip
                  size='small'
                  label={row.severity}
                  color={row.severity === 'error' || row.severity === 'critical' ? 'error' : 'default'}
                />
                <Chip size='small' label={row.category} variant='outlined' />
                <Typography variant='caption' color='text.secondary'>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                </Typography>
              </Stack>
              <Typography variant='subtitle2' sx={{ mt: 1, fontWeight: 600 }}>
                {row.title}
              </Typography>
              {row.summary ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  {row.summary}
                </Typography>
              ) : null}
            </Paper>
          ))}
        </Stack>
      ) : null}
      {!loadingOpsEvents && !opsItems.length ? (
        <EmptyHint title='No ops events' hint='Issues will appear here when logged from calls, wallet, or support.' />
      ) : null}
    </SectionShell>
  )
}
