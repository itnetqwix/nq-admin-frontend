import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import { SectionShell, EmptyHint, StatTile } from '../user360Shared'
import { getUserReferrals } from 'src/services/user360Api'

export default function User360ReferralsTab({ userId }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const d = await getUserReferrals(userId)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || 'Failed to load referrals')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <SectionShell
      title='Referrals & rewards'
      subtitle='Referral code, who referred this user, attributions, and reward history.'
      action={
        <Button component={Link} href='/apps/referrals' variant='outlined' size='small'>
          Referrals dashboard
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}
      {!loading && data ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatTile label='Referral code' value={data.referral_code || '—'} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatTile label='Points balance' value={data.points_balance ?? 0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant='outlined' sx={{ p: 2, height: '100%' }}>
                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                  Referred by
                </Typography>
                {data.referred_by ? (
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    <Typography fontWeight={600}>{data.referred_by.fullname}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {data.referred_by.email}
                    </Typography>
                    <Button
                      size='small'
                      component={Link}
                      href={`/apps/users/${data.referred_by._id}`}
                      sx={{ alignSelf: 'flex-start', px: 0 }}
                    >
                      Open profile
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant='body2' sx={{ mt: 0.5 }}>
                    Organic signup
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Box>
            <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
              Users referred ({data.attributions_as_referrer?.length ?? 0})
            </Typography>
            <Stack spacing={1}>
              {(data.attributions_as_referrer || []).map(row => (
                <Paper key={row._id} variant='outlined' sx={{ p: 1.5 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography variant='body2' fontFamily='monospace'>
                      {row.referee_user_id}
                    </Typography>
                    {row.status ? <Chip size='small' label={row.status} /> : null}
                    <Button
                      size='small'
                      component={Link}
                      href={`/apps/users/${row.referee_user_id}`}
                    >
                      Open
                    </Button>
                  </Stack>
                </Paper>
              ))}
              {!data.attributions_as_referrer?.length ? (
                <Typography variant='body2' color='text.secondary'>
                  No referral attributions as referrer.
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Box>
            <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
              Rewards ({data.rewards?.length ?? 0})
            </Typography>
            <Stack spacing={1}>
              {(data.rewards || []).map(row => (
                <Paper key={row._id} variant='outlined' sx={{ p: 1.5 }}>
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip size='small' label={row.reward_type || 'reward'} />
                    {row.status ? <Chip size='small' variant='outlined' label={row.status} /> : null}
                    {row.amount_minor != null ? (
                      <Typography variant='body2'>${(row.amount_minor / 100).toFixed(2)}</Typography>
                    ) : null}
                    <Typography variant='caption' color='text.secondary'>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
              {!data.rewards?.length ? (
                <Typography variant='body2' color='text.secondary'>
                  No referral rewards recorded.
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      ) : null}
      {!loading && !data ? (
        <EmptyHint title='No referral data' hint='Could not load referral context for this user.' />
      ) : null}
    </SectionShell>
  )
}
