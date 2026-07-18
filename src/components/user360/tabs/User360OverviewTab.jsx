import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import { useMemo } from 'react'
import { ops } from 'src/styles/opsSurface'

import User360AccountReviewActions from '../User360AccountReviewActions'
import { SectionShell, StatTile, OpsSurfaceCard } from '../user360Shared'
import { KeyValueRow, NotificationPreferencesPanel, ExtraInfoTree, safeImg } from '../user360Parts'

export default function User360OverviewTab({ userId, userData, onRefresh }) {
  const summary = useMemo(() => userData?.summary || {}, [userData])
  const overview = userData?.overview || {}
  const profile = userData?.user || {}
  const identity = overview.identity || {}
  const money = overview.money || {}
  const media = overview.media || {}
  const preferences = overview.preferences || {}

  const lastOnlineLabel = summary.lastOnlineAt || overview.lastOnlineAt
    ? new Date(summary.lastOnlineAt || overview.lastOnlineAt).toLocaleString()
    : 'Not recorded (user may be a trainee without socket presence)'

  const accordionSx = {
    borderRadius: `${ops.radiusMd} !important`,
    '&:before': { display: 'none' },
    bgcolor: ops.canvas,
    boxShadow: ops.shadowCard
  }

  return (
    <SectionShell
      title='Profile & account snapshot'
      subtitle='High-signal fields for identity, wallet, and engagement counts. Expand sections below for notification channels and extended profile metadata.'
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ lg: 'flex-start' }}>
        <Stack alignItems='center' spacing={1.5} sx={{ minWidth: { lg: 200 } }}>
          <Avatar
            src={media.profile_picture_url || safeImg(profile?.profile_picture)}
            sx={{ width: 112, height: 112, boxShadow: ops.shadowCard, border: `3px solid ${ops.canvas}` }}
          />
          <Chip
            label={identity.account_type || profile?.account_type || '—'}
            size='small'
            sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.ink, color: '#fff' }}
          />
          <Chip
            label={`Account: ${identity.status || profile?.status || '—'}`}
            size='small'
            variant='outlined'
            sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
          />
        </Stack>
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography sx={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.96px', mb: 0.5 }}>
            {identity.fullname || profile?.fullname || '—'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: ops.indigo, mb: 2 }}>
            {identity.email || profile?.email || '—'}
          </Typography>

          <User360AccountReviewActions
            userId={identity._id || profile?._id}
            accountType={identity.account_type || profile?.account_type}
            status={identity.status || profile?.status}
            onUpdated={onRefresh}
          />

          <OpsSurfaceCard sx={{ mb: 3, bgcolor: ops.canvasSoft }}>
            <Typography
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                color: ops.mute,
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              Last activity
            </Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 600 }}>{lastOnlineLabel}</Typography>
          </OpsSurfaceCard>

          <Typography sx={{ mb: 1.5, fontWeight: 600, letterSpacing: '-0.28px' }}>Engagement</Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='Lessons' value={summary.lessonsCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='Completed' value={summary.completedLessonsCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='Reviews' value={summary.reviewsCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='Clips' value={summary.clipsCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='PDF / plans' value={summary.reportsCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatTile label='Friends' value={summary.friendsCount} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatTile label='In-app notifications (rows)' value={summary.notificationsCount} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 1, fontWeight: 600, letterSpacing: '-0.28px' }}>Identity</Typography>
              <Grid container spacing={1.5}>
                {KeyValueRow('User ID', userId || profile?._id)}
                {KeyValueRow('Mobile', identity.mobile_no)}
                {KeyValueRow('Login type', identity.login_type)}
                {KeyValueRow('Category', identity.category)}
                {KeyValueRow('Created', identity.createdAt ? new Date(identity.createdAt).toLocaleString() : null)}
                {KeyValueRow('Updated', identity.updatedAt ? new Date(identity.updatedAt).toLocaleString() : null)}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 1, fontWeight: 600, letterSpacing: '-0.28px' }}>Wallet & compliance</Typography>
              <Grid container spacing={1.5}>
                {KeyValueRow('Wallet balance', money.wallet_amount != null ? String(money.wallet_amount) : null)}
                {KeyValueRow('Stripe account', money.stripe_account_id)}
                {KeyValueRow('KYC', money.is_kyc_completed != null ? (money.is_kyc_completed ? 'Yes' : 'No') : null)}
                {KeyValueRow(
                  'Stripe onboarding',
                  money.is_registered_with_stript != null ? (money.is_registered_with_stript ? 'Yes' : 'No') : null
                )}
                {KeyValueRow('Commission', money.commission)}
              </Grid>
            </Grid>
          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Accordion defaultExpanded sx={accordionSx} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                  <Typography fontWeight={600}>Notification preferences</Typography>
                  <Typography sx={{ fontSize: 12, color: ops.mute }}>Email &amp; SMS by category</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <NotificationPreferencesPanel notifications={preferences.notifications} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={accordionSx} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                  <Typography fontWeight={600}>Extra profile data (extraInfo)</Typography>
                  <Typography sx={{ fontSize: 12, color: ops.mute }}>Availability, timezone, and other fields</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {preferences.extraInfo && typeof preferences.extraInfo === 'object' && Object.keys(preferences.extraInfo).length > 0 ? (
                  <Box sx={{ maxHeight: 480, overflow: 'auto', pr: 1 }}>
                    <ExtraInfoTree data={preferences.extraInfo} />
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 13, color: ops.mute }}>No extraInfo on this user.</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion sx={accordionSx} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600} sx={{ color: ops.mute }}>
                  Technical: raw JSON
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ fontSize: 12, color: ops.mute, display: 'block', mb: 1 }}>
                  For debugging or copy-paste into tickets.
                </Typography>
                <Box
                  component='pre'
                  sx={{
                    p: 2,
                    borderRadius: ops.radiusSm,
                    bgcolor: ops.night,
                    color: ops.onNightMuted,
                    overflow: 'auto',
                    maxHeight: 320,
                    fontSize: 12,
                    fontFamily: ops.mono
                  }}
                >
                  {JSON.stringify(
                    { notifications: preferences.notifications, extraInfo: preferences.extraInfo },
                    null,
                    2
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Stack>
    </SectionShell>
  )
}
