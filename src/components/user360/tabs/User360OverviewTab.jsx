import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { revokeAllUserSessions, revokeUserSession } from 'src/services/user360Api'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'

import User360AccountReviewActions from '../User360AccountReviewActions'
import { SectionShell, StatTile, OpsSurfaceCard } from '../user360Shared'
import { KeyValueRow, NotificationPreferencesPanel, ExtraInfoTree, safeImg } from '../user360Parts'

export default function User360OverviewTab({ userId, userData, onRefresh }) {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [revoking, setRevoking] = useState(false)
  const summary = useMemo(() => userData?.summary || {}, [userData])
  const overview = userData?.overview || {}
  const profile = userData?.user || {}
  const identity = overview.identity || {}
  const money = overview.money || {}
  const media = overview.media || {}
  const preferences = overview.preferences || {}
  const sessions = overview.sessions || userData?.sessions || []
  const loginHistory = overview.login_history || userData?.login_history || []
  const activeSessions = sessions.filter(s => !s.revokedAt)

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
    <>
    <SectionShell
      title='Profile & account snapshot'
      subtitle='High-signal fields for identity, wallet, sessions, and engagement. Expand sections below for notification channels and extended profile metadata.'
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
            {summary.activeSessionsCount != null ? (
              <Typography sx={{ mt: 0.5, fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                {summary.activeSessionsCount} active auth session{summary.activeSessionsCount === 1 ? '' : 's'}
              </Typography>
            ) : null}
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
            <OpsSurfaceCard>
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1.5 }} flexWrap='wrap' gap={1}>
                <Typography sx={{ fontWeight: 600 }}>Sessions &amp; login IP</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap'>
                  {userId && activeSessions.length > 0 ? (
                    <Button
                      size='small'
                      color='error'
                      variant='outlined'
                      disabled={revoking}
                      sx={{ textTransform: 'none' }}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Revoke all devices?',
                          message: `Signs this user out of ${activeSessions.length} active session(s). They must log in again.`,
                          confirmLabel: 'Revoke all',
                          variant: 'danger'
                        })
                        if (!ok) return
                        setRevoking(true)
                        try {
                          const res = await revokeAllUserSessions(userId)
                          toast.success(`Revoked ${res?.revokedCount ?? activeSessions.length} session(s)`)
                          onRefresh?.()
                        } catch (e) {
                          toast.error(e?.message || 'Revoke failed')
                        } finally {
                          setRevoking(false)
                        }
                      }}
                    >
                      Revoke all devices
                    </Button>
                  ) : null}
                  {userId ? (
                    <Button
                      size='small'
                      component={Link}
                      href={`/apps/logs?tab=login&userId=${userId}`}
                      sx={{ textTransform: 'none' }}
                    >
                      Full login history →
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
              {sessions.length ? (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {sessions.slice(0, 6).map(s => (
                    <Box
                      key={s.id}
                      sx={{
                        borderBottom: `1px solid ${ops.hairline}`,
                        pb: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {s.deviceLabel || 'Device'} · {s.platform || '—'}
                          {s.revokedAt ? ' · revoked' : ''}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {[
                            s.ipAddress || 'no ip',
                            s.loginMethod,
                            [s.city, s.region, s.country].filter(Boolean).join(', '),
                            s.timezone,
                            s.browser,
                            s.os,
                            s.networkType || s.network_type,
                            s.environmentLabel
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                          {[s.publicId, s.deviceId, s.appVersion, s.screen].filter(Boolean).join(' · ')}
                        </Typography>
                      </Box>
                      <Stack alignItems='flex-end' spacing={0.5}>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }}>
                          {s.lastUsedAt ? formatOpsDateTime(s.lastUsedAt, { withSeconds: false }) : '—'}
                        </Typography>
                        {!s.revokedAt && userId ? (
                          <Button
                            size='small'
                            color='error'
                            disabled={revoking}
                            sx={{ textTransform: 'none', minWidth: 0 }}
                            onClick={async () => {
                              setRevoking(true)
                              try {
                                await revokeUserSession(userId, s.id)
                                toast.success('Session revoked')
                                onRefresh?.()
                              } catch (e) {
                                toast.error(e?.message || 'Revoke failed')
                              } finally {
                                setRevoking(false)
                              }
                            }}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 13, color: ops.mute, mb: 2 }}>No auth sessions on record.</Typography>
              )}
              {loginHistory.length ? (
                <>
                  <Typography
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 11,
                      color: ops.mute,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      mb: 1
                    }}
                  >
                    Recent logins
                  </Typography>
                  <Stack spacing={0.75}>
                    {loginHistory.slice(0, 5).map(row => (
                      <Typography key={row.id} sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.body }}>
                        {formatOpsDateTime(row.at, { withSeconds: false })} ·{' '}
                        <Box
                          component='span'
                          sx={{
                            color:
                              String(row.action || '').includes('fail') || String(row.action || '').includes('lock')
                                ? ops.error
                                : ops.body
                          }}
                        >
                          {String(row.action || '').replace(/_/g, ' ')}
                        </Box>{' '}
                        · {row.ip || 'no ip'} · {row.device || row.browser || '—'}
                        {[row.city, row.region, row.country].filter(Boolean).length
                          ? ` · ${[row.city, row.region, row.country].filter(Boolean).join(', ')}`
                          : ''}
                        {row.browser ? ` · ${row.browser}` : ''}
                        {row.os ? ` · ${row.os}` : ''}
                        {row.timezone ? ` · ${row.timezone}` : ''}
                        {Array.isArray(row.risk_flags) && row.risk_flags.length
                          ? ` · ${row.risk_flags.map(f => String(f).replace(/_/g, ' ')).join(', ')}`
                          : ''}
                        {row.session_public_id ? ` · ${row.session_public_id}` : ''}
                      </Typography>
                    ))}
                  </Stack>
                </>
              ) : null}
            </OpsSurfaceCard>

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
    {ConfirmDialog}
    </>
  )
}
