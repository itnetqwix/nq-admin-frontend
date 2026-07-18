import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Alert, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'

import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
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
      <Box sx={{ p: 2, height: '100%', bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard }}>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>{title}</Typography>
        <Alert severity='error' sx={{ borderRadius: ops.radiusSm }}>
          {channel?.error || 'Unavailable'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2.5, height: '100%', bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard }}>
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
    </Box>
  )
}

export default function PlatformHealthPage() {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const messagingOk =
    messaging && !messaging.error && messaging.email?.ok && messaging.sms?.ok

  return (
    <AdminPageShell
      icon='mdi:heart-pulse'
      title='Platform health'
      subtitle='Messaging providers, finance anomaly queues, and ops signals — live from the backend.'
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminPageSection>
        {!messagingOk && messaging && !messaging.error ? (
          <Alert severity='warning' sx={{ mb: 2 }}>
            One or more messaging channels reported issues. OTP and notification delivery may be affected.
          </Alert>
        ) : null}

        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Messaging.</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
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

        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Operations (last 24h).</Typography>
        {opsStats?.error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            {opsStats.error}
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <OpsMetricTile
                label='Critical open'
                value={opsStats?.criticalOpen ?? 0}
                hint='Ops log'
                tone={(opsStats?.criticalOpen ?? 0) > 0 ? 'danger' : 'default'}
                onClick={() => router.push('/apps/ops-logs?severity=critical&resolution=open')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <OpsMetricTile
                label='Instant lesson failures'
                value={opsStats?.instantFailures ?? 0}
                hint='Filter instant'
                tone={(opsStats?.instantFailures ?? 0) > 0 ? 'warn' : 'default'}
                onClick={() => router.push('/apps/ops-logs?instant_only=true')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <OpsMetricTile
                label='Call preflight failures'
                value={opsStats?.callPreflightFailures ?? 0}
                hint='Call diagnostics'
                onClick={() => router.push('/apps/call-diagnostics')}
              />
            </Grid>
          </Grid>
        )}

        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Finance anomaly queues.</Typography>
        {financeOps?.error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            {financeOps.error}
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { key: 'heldCount', label: 'Escrow held', href: '/apps/finance?tab=escrow&status=held' },
              { key: 'releasingCount', label: 'Releasing', href: '/apps/finance?tab=escrow&status=releasing' },
              {
                key: 'disputedCount',
                label: 'Disputed',
                href: '/apps/finance?tab=escrow&status=disputed',
                warn: true
              },
              {
                key: 'stuckTopUpsPending30m',
                label: 'Stuck top-ups',
                href: '/apps/finance?tab=stuck_topups'
              },
              {
                key: 'paidUnappliedExtensions',
                label: 'Paid-unapplied extensions',
                href: '/apps/booking'
              },
              {
                key: 'extensionReconcileAlerts7d',
                label: 'Extension alerts (7d)',
                href: '/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT',
                warn: true
              },
              {
                key: 'transferFailuresLast7d',
                label: 'Transfer failures (7d)',
                href: '/apps/finance?tab=audit'
              }
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

        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Quick links.</Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' size='small' component={Link} href='/apps/finance'>
            Finance console
          </Button>
          <Button variant='outlined' size='small' component={Link} href='/apps/platform-activity'>
            Platform activity
          </Button>
          <Button variant='outlined' size='small' component={Link} href='/apps/ops-logs'>
            Operations log
          </Button>
          <Button variant='outlined' size='small' component={Link} href='/apps/audit-logs'>
            Audit log
          </Button>
          <Button variant='outlined' size='small' component={Link} href='/apps/call-diagnostics'>
            Call diagnostics
          </Button>
        </Stack>
      </AdminPageSection>
    </AdminPageShell>
  )
}
