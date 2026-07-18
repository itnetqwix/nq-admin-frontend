import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { AdminLoadingState } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

import { SectionShell, EmptyHint, OpsSurfaceCard } from '../user360Shared'
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
      {loading ? <AdminLoadingState message='Loading tickets…' minHeight={180} /> : null}
      {!loading && items.length ? (
        <Stack spacing={1.5}>
          {items.map(row => (
            <OpsSurfaceCard key={row._id}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Chip
                  size='small'
                  label={row.type === 'feedback' ? 'Feedback' : 'Support'}
                  sx={{ fontFamily: ops.mono, fontSize: 11 }}
                />
                {row.status ? (
                  <Chip size='small' label={row.status} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                ) : null}
                <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                  {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 600, letterSpacing: '-0.28px' }}>{row.subject}</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: ops.body, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {row.message}
              </Typography>
              {row.session_id ? (
                <Button
                  size='small'
                  component={Link}
                  href={`/apps/booking?bookingId=${row.session_id}`}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  View session
                </Button>
              ) : null}
            </OpsSurfaceCard>
          ))}
        </Stack>
      ) : null}
      {!loading && !items.length ? (
        <EmptyHint title='No tickets' hint='This user has not submitted feedback or support concerns.' />
      ) : null}
    </SectionShell>
  )
}
