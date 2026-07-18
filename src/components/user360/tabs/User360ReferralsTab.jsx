import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { AdminLoadingState } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

import { SectionShell, EmptyHint, StatTile, OpsSurfaceCard } from '../user360Shared'
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
      {loading ? <AdminLoadingState message='Loading referrals…' minHeight={180} /> : null}
      {!loading && data ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatTile label='Referral code' value={data.referral_code || '—'} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatTile label='Points balance' value={data.points_balance ?? 0} tone='accent' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <OpsSurfaceCard>
                <Typography
                  sx={{
                    fontFamily: ops.mono,
                    fontSize: 11,
                    color: ops.mute,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  Referred by
                </Typography>
                {data.referred_by ? (
                  <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                    <Typography sx={{ fontWeight: 600 }}>{data.referred_by.fullname}</Typography>
                    <Typography sx={{ fontSize: 13, color: ops.body }}>{data.referred_by.email}</Typography>
                    <Button
                      size='small'
                      component={Link}
                      href={`/apps/users/${data.referred_by._id}`}
                      sx={{ alignSelf: 'flex-start', px: 0, textTransform: 'none' }}
                    >
                      Open profile
                    </Button>
                  </Stack>
                ) : (
                  <Typography sx={{ mt: 0.75, fontSize: 13, color: ops.body }}>Organic signup</Typography>
                )}
              </OpsSurfaceCard>
            </Grid>
          </Grid>

          <Box>
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>
              Users referred ({data.attributions_as_referrer?.length ?? 0})
            </Typography>
            <Stack spacing={1}>
              {(data.attributions_as_referrer || []).map(row => (
                <OpsSurfaceCard key={row._id} sx={{ py: 1.5 }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{row.referee_user_id}</Typography>
                    {row.status ? (
                      <Chip size='small' label={row.status} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                    ) : null}
                    <Button
                      size='small'
                      component={Link}
                      href={`/apps/users/${row.referee_user_id}`}
                      sx={{ textTransform: 'none' }}
                    >
                      Open
                    </Button>
                  </Stack>
                </OpsSurfaceCard>
              ))}
              {!data.attributions_as_referrer?.length ? (
                <Typography sx={{ fontSize: 13, color: ops.mute }}>No referral attributions as referrer.</Typography>
              ) : null}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>
              Rewards ({data.rewards?.length ?? 0})
            </Typography>
            <Stack spacing={1}>
              {(data.rewards || []).map(row => (
                <OpsSurfaceCard key={row._id} sx={{ py: 1.5 }}>
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                    <Chip
                      size='small'
                      label={row.reward_type || 'reward'}
                      sx={{ fontFamily: ops.mono, fontSize: 11 }}
                    />
                    {row.status ? (
                      <Chip
                        size='small'
                        variant='outlined'
                        label={row.status}
                        sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
                      />
                    ) : null}
                    {row.amount_minor != null ? (
                      <Typography sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        ${(row.amount_minor / 100).toFixed(2)}
                      </Typography>
                    ) : null}
                    <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                    </Typography>
                  </Stack>
                </OpsSurfaceCard>
              ))}
              {!data.rewards?.length ? (
                <Typography sx={{ fontSize: 13, color: ops.mute }}>No referral rewards recorded.</Typography>
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
