import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'

import { SectionShell, EmptyHint } from '../user360Shared'
import { getUserSupportTickets } from 'src/services/user360Api'

export default function User360TicketsTab({ userId }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ feedback: [], concerns: [] })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const d = await getUserSupportTickets(userId)
        if (!cancelled) setData(d || { feedback: [], concerns: [] })
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || 'Failed to load tickets')
          setData({ feedback: [], concerns: [] })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const items = [...(data.feedback || []), ...(data.concerns || [])]

  return (
    <SectionShell
      title='Support tickets & feedback'
      subtitle='Contact-us messages and raise-concern tickets submitted by this user.'
      action={
        <Stack direction='row' spacing={1}>
          <Button component={Link} href='/apps/write-by-user' variant='outlined' size='small'>
            All feedback
          </Button>
          <Button component={Link} href='/apps/concern-by-user' variant='outlined' size='small'>
            All support tickets
          </Button>
        </Stack>
      }
    >
      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}
      {!loading && items.length ? (
        <Stack spacing={1.5}>
          {items.map(row => (
            <Paper key={row._id} variant='outlined' sx={{ p: 2 }}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Chip size='small' label={row.type === 'feedback' ? 'Feedback' : 'Support'} variant='outlined' />
                {row.status ? <Chip size='small' label={row.status} /> : null}
                <Typography variant='caption' color='text.secondary'>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                </Typography>
              </Stack>
              <Typography variant='subtitle2' sx={{ mt: 1, fontWeight: 600 }}>
                {row.subject}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {row.message}
              </Typography>
              {row.session_id ? (
                <Button
                  size='small'
                  component={Link}
                  href={`/apps/booking?bookingId=${row.session_id}`}
                  sx={{ mt: 1 }}
                >
                  View session
                </Button>
              ) : null}
            </Paper>
          ))}
        </Stack>
      ) : null}
      {!loading && !items.length ? (
        <EmptyHint title='No tickets' hint='This user has not submitted feedback or support concerns.' />
      ) : null}
    </SectionShell>
  )
}
