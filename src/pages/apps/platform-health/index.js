import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Alert, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import moment from 'moment'

import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getPlatformHealthSnapshot } from 'src/services/platformHealthApi'
import { ops } from 'src/styles/opsSurface'

function StatusChip({ ok, label }) {
  return (
    <Chip
      size='small'
      label={label}
      sx={{
        fontFamily: ops.mono,
        fontSize: 11,
        height: 22,
        bgcolor: ok ? '#AAFFEC' : ops.errorSoft || '#f7d4d6',
        color: ok ? '#1A8F76' : ops.error,
        border: 'none'
      }}
    />
  )
}

function ChannelCard({ title, channel, href }) {
  if (!channel || channel.error) {
    return (
      <OpsSurfaceCard sx={{ height: '100%' }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>{title}</Typography>
        <Alert severity='error' sx={{ borderRadius: ops.radiusSm }}>
          {channel?.error || 'Unavailable'}
        </Alert>
      </OpsSurfaceCard>
    )
  }

  return (
    <OpsSurfaceCard sx={{ height: '100%' }}>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>{title}</Typography>
        <StatusChip ok={channel.ok !== false} label={channel.ok ? 'OK' : 'Issue'} />
      </Stack>
      <Typography sx={{ fontSize: 13, color: ops.body, mb: 1, lineHeight: 1.5 }}>{channel.message}</Typography>
      {channel.configured === false ? (
        <Chip size='small' label='Not configured' sx={{ fontFamily: ops.mono, fontSize: 11, mb: 1 }} variant='outlined' />
      ) : null}
      {channel.from ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block' }}>
          From: {channel.from}
        </Typography>
      ) : null}
      {channel.host ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block' }}>
          Host: {channel.host}
        </Typography>
      ) : null}
      {channel.accountStatus ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block' }}>
          Twilio: {channel.accountStatus}
        </Typography>
      ) : null}
      {channel.enabled != null ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block' }}>
          WhatsApp enabled: {channel.enabled ? 'yes' : 'no'}
        </Typography>
      ) : null}
      {href ? (
        <Button
          size='small'
          component={Link}
          href={href}
          sx={{ mt: 1.5, textTransform: 'none', color: ops.indigo, fontWeight: 500, px: 0 }}
        >
          Open related →
        </Button>
      ) : null}
    </OpsSurfaceCard>
  )
}

export default function PlatformHealthPage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState('all') // all | messaging | ops | finance

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlatformHealthSnapshot()
      setSnapshot(data)
    } catch (e) {
      toast.error(e?.message || 'Failed to load platform health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const messaging = snapshot?.messaging
  const financeOps = snapshot?.financeOps
  const opsStats = snapshot?.opsStats

  const messagingOk = messaging && !messaging.error && messaging.email?.ok && messaging.sms?.ok
  const critical = Number(opsStats?.criticalOpen) || 0
  const show = key => focus === 'all' || focus === key

  const attention = useMemo(() => {
    const items = []
    if (!messagingOk && messaging && !messaging.error) {
      items.push('Messaging channel issue — OTP / notifications may fail')
    }
    if (critical > 0) items.push(`${critical} critical ops open`)
    if ((financeOps?.disputedCount || 0) > 0) items.push(`${financeOps.disputedCount} disputed escrow`)
    if ((financeOps?.stuckTopUpsPending30m || 0) > 0) items.push(`${financeOps.stuckTopUpsPending30m} stuck top-ups`)
    return items
  }, [messagingOk, messaging, critical, financeOps])

  return (
    <AdminPageShell
      bare
      loading={loading && !snapshot}
      loadingMessage='Loading platform health…'
      icon='mdi:heart-pulse'
      eyebrow='Operations'
      title='Platform health'
      subtitle='Messaging, finance queues, and ops signals — live from the backend.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          {snapshot?.generatedAt || snapshot?.updated_at ? (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
              Synced {moment(snapshot.generatedAt || snapshot.updated_at).fromNow()}
            </Typography>
          ) : null}
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <AdminFilterBar helperText='Focus filters the sections below. Tiles deep-link into ops and finance.'>
        {[
          { id: 'all', label: 'All' },
          { id: 'messaging', label: 'Messaging' },
          { id: 'ops', label: 'Ops 24h' },
          { id: 'finance', label: 'Finance' }
        ].map(f => (
          <Chip
            key={f.id}
            size='small'
            clickable
            label={f.label}
            onClick={() => setFocus(f.id)}
            sx={{
              height: 28,
              fontFamily: ops.mono,
              fontSize: 11,
              fontWeight: focus === f.id ? 600 : 500,
              bgcolor: focus === f.id ? ops.softIndigo : ops.canvas,
              color: focus === f.id ? ops.indigoDeep : ops.body,
              border: `1px solid ${focus === f.id ? ops.indigo : ops.hairline}`
            }}
          />
        ))}
      </AdminFilterBar>

      {attention.length ? (
        <Stack spacing={1} sx={{ mb: 2.5 }}>
          {attention.map(t => (
            <Alert key={t} severity='warning' sx={{ borderRadius: ops.radiusSm }}>
              {t}
            </Alert>
          ))}
        </Stack>
      ) : (
        <OpsSurfaceCard sx={{ mb: 2.5, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: ops.body }}>No attention items — messaging OK, ops quiet.</Typography>
        </OpsSurfaceCard>
      )}

      {show('messaging') ? (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
            Messaging
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <ChannelCard title='Email (SES)' channel={messaging?.email} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChannelCard title='SMS (Twilio)' channel={messaging?.sms} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChannelCard title='WhatsApp' channel={messaging?.whatsapp} />
            </Grid>
          </Grid>
        </Box>
      ) : null}

      {show('ops') ? (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
            Operations · last 24h
          </Typography>
          {opsStats?.error ? (
            <Alert severity='error' sx={{ mb: 2 }}>
              {opsStats.error}
            </Alert>
          ) : (
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <OpsMetricTile
                  icon='mdi:alert-octagon-outline'
                  label='Critical open'
                  value={opsStats?.criticalOpen ?? 0}
                  hint='Ops log'
                  tone={critical > 0 ? 'danger' : 'default'}
                  onClick={() => router.push('/apps/ops-logs?severity=critical&resolution=open')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <OpsMetricTile
                  icon='mdi:flash-alert-outline'
                  label='Instant failures'
                  value={opsStats?.instantFailures ?? 0}
                  hint='Instant lessons'
                  tone={(opsStats?.instantFailures ?? 0) > 0 ? 'warn' : 'default'}
                  onClick={() => router.push('/apps/ops-logs?instant_only=true')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <OpsMetricTile
                  icon='mdi:phone-in-talk-outline'
                  label='Call preflight'
                  value={opsStats?.callPreflightFailures ?? 0}
                  hint='Diagnostics'
                  onClick={() => router.push('/apps/call-diagnostics')}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      ) : null}

      {show('finance') ? (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
            Finance anomaly queues
          </Typography>
          {financeOps?.error ? (
            <Alert severity='error' sx={{ mb: 2 }}>
              {financeOps.error}
            </Alert>
          ) : (
            <Grid container spacing={1.5}>
              {[
                { key: 'heldCount', label: 'Escrow held', href: '/apps/finance?tab=escrow&status=held' },
                { key: 'releasingCount', label: 'Releasing', href: '/apps/finance?tab=escrow&status=releasing' },
                {
                  key: 'disputedCount',
                  label: 'Disputed',
                  href: '/apps/finance?tab=escrow&status=disputed',
                  warn: true
                },
                { key: 'stuckTopUpsPending30m', label: 'Stuck top-ups', href: '/apps/finance?tab=stuck_topups' },
                { key: 'paidUnappliedExtensions', label: 'Paid-unapplied ext.', href: '/apps/booking' },
                {
                  key: 'extensionReconcileAlerts7d',
                  label: 'Ext. alerts 7d',
                  href: '/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT',
                  warn: true
                },
                { key: 'transferFailuresLast7d', label: 'Transfer fails 7d', href: '/apps/finance?tab=audit' }
              ].map(item => {
                const n = financeOps?.[item.key] ?? 0
                return (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={item.key}>
                    <OpsMetricTile
                      label={item.label}
                      value={n}
                      hint='Open →'
                      tone={item.warn && n > 0 ? 'danger' : 'default'}
                      onClick={() => router.push(item.href)}
                    />
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Box>
      ) : null}

      <OpsSurfaceCard>
        <Typography
          sx={{
            fontFamily: ops.mono,
            fontSize: 11,
            color: ops.mute,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            mb: 1.5
          }}
        >
          Quick links
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {[
            ['/apps/finance', 'Finance'],
            ['/apps/booking', 'Bookings'],
            ['/apps/ops-logs', 'Ops log'],
            ['/apps/platform-activity', 'Activity'],
            ['/apps/call-diagnostics', 'Call diagnostics'],
            ['/apps/concern-by-user', 'Support'],
            ['/apps/write-by-user', 'Feedback']
          ].map(([href, label]) => (
            <Chip
              key={href}
              component={Link}
              href={href}
              label={label}
              clickable
              variant='outlined'
              size='small'
              sx={{ fontFamily: ops.mono, fontSize: 11 }}
            />
          ))}
        </Stack>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
