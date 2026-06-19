import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Avatar,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { useMemo } from 'react'

import User360AccountReviewActions from '../User360AccountReviewActions'
import { SectionShell, StatTile } from '../user360Shared'
import { KeyValueRow, NotificationPreferencesPanel, ExtraInfoTree, safeImg } from '../user360Parts'

export default function User360OverviewTab({ userId, userData, onRefresh }) {
  const theme = useTheme()
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

  return (
    <SectionShell
      title='Profile & account snapshot'
      subtitle='High-signal fields for identity, wallet, and engagement counts. Expand sections below for notification channels and extended profile metadata.'
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ lg: 'flex-start' }}>
        <Stack alignItems='center' spacing={1.5} sx={{ minWidth: { lg: 200 } }}>
          <Avatar
            src={media.profile_picture_url || safeImg(profile?.profile_picture)}
            sx={{ width: 112, height: 112, boxShadow: 2, border: `3px solid ${theme.palette.background.paper}` }}
          />
          <Chip
            label={identity.account_type || profile?.account_type || '—'}
            color='primary'
            variant='outlined'
            size='small'
          />
          <Chip
            label={`Account: ${identity.status || profile?.status || '—'}`}
            size='small'
            variant='outlined'
          />
        </Stack>
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
            {identity.fullname || profile?.fullname || '—'}
          </Typography>
          <Typography variant='body1' color='primary' sx={{ mb: 2 }}>
            {identity.email || profile?.email || '—'}
          </Typography>

          <User360AccountReviewActions
            userId={identity._id || profile?._id}
            accountType={identity.account_type || profile?.account_type}
            status={identity.status || profile?.status}
            onUpdated={onRefresh}
          />

          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>Last activity</Typography>
            <Typography variant='body1' sx={{ mt: 0.5, fontWeight: 600 }}>{lastOnlineLabel}</Typography>
          </Paper>

          <Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 700 }}>Engagement</Typography>
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
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Identity</Typography>
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
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Wallet & compliance</Typography>
              <Grid container spacing={1.5}>
                {KeyValueRow('Wallet balance', money.wallet_amount != null ? String(money.wallet_amount) : null)}
                {KeyValueRow('Stripe account', money.stripe_account_id)}
                {KeyValueRow('KYC', money.is_kyc_completed != null ? (money.is_kyc_completed ? 'Yes' : 'No') : null)}
                {KeyValueRow('Stripe onboarding', money.is_registered_with_stript != null ? (money.is_registered_with_stript ? 'Yes' : 'No') : null)}
                {KeyValueRow('Commission', money.commission)}
              </Grid>
            </Grid>
          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Accordion
              defaultExpanded
              sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }}
              disableGutters
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                  <Typography fontWeight={600}>Notification preferences</Typography>
                  <Typography variant='caption' color='text.secondary'>Email &amp; SMS by category</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <NotificationPreferencesPanel notifications={preferences.notifications} />
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                  <Typography fontWeight={600}>Extra profile data (extraInfo)</Typography>
                  <Typography variant='caption' color='text.secondary'>Availability, timezone, and other fields</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {preferences.extraInfo && typeof preferences.extraInfo === 'object' && Object.keys(preferences.extraInfo).length > 0 ? (
                  <Box sx={{ maxHeight: 480, overflow: 'auto', pr: 1 }}>
                    <ExtraInfoTree data={preferences.extraInfo} />
                  </Box>
                ) : (
                  <Typography variant='body2' color='text.secondary'>No extraInfo on this user.</Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600} color='text.secondary'>Technical: raw JSON</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                  For debugging or copy-paste into tickets.
                </Typography>
                <Box
                  component='pre'
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.common.black, 0.04),
                    overflow: 'auto',
                    maxHeight: 320,
                    fontSize: 12,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                  }}
                >
                  {JSON.stringify({ notifications: preferences.notifications, extraInfo: preferences.extraInfo }, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Stack>
    </SectionShell>
  )
}
