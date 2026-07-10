import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'

import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getPlatformHealthSnapshot } from 'src/services/platformHealthApi'

function StatusChip({ ok, label }) {
  return <Chip size='small' label={label} color={ok ? 'success' : 'error'} variant={ok ? 'filled' : 'outlined'} />
}

function ChannelCard({ title, channel, href }) {
  if (!channel || channel.error) {
    return (
      <Card variant='outlined' sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={700}>
            {title}
          </Typography>
          <Alert severity='error' sx={{ mt: 1 }}>
            {channel?.error || 'Unavailable'}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1 }}>
          <Typography variant='subtitle2' fontWeight={700}>
            {title}
          </Typography>
          <StatusChip ok={channel.ok !== false} label={channel.ok ? 'OK' : 'Issue'} />
        </Stack>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          {channel.message}
        </Typography>
        {channel.configured === false ? (
          <Chip size='small' label='Not configured' variant='outlined' />
        ) : null}
        {channel.from ? (
          <Typography variant='caption' display='block' color='text.secondary'>
            From: {channel.from}
          </Typography>
        ) : null}
        {channel.host ? (
          <Typography variant='caption' display='block' color='text.secondary'>
            Host: {channel.host}
          </Typography>
        ) : null}
        {channel.accountStatus ? (
          <Typography variant='caption' display='block' color='text.secondary'>
            Twilio: {channel.accountStatus}
          </Typography>
        ) : null}
        {channel.enabled != null ? (
          <Typography variant='caption' display='block' color='text.secondary'>
            WhatsApp enabled: {channel.enabled ? 'yes' : 'no'}
          </Typography>
        ) : null}
        {href ? (
          <Button size='small' sx={{ mt: 1 }} component={Link} href={href}>
            Open related →
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function PlatformHealthPage() {
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

        <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
          Messaging
        </Typography>
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

        <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
          Operations (last 24h)
        </Typography>
        {opsStats?.error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            {opsStats.error}
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='overline' color='text.secondary'>
                    Critical open
                  </Typography>
                  <Typography variant='h4' fontWeight={800} color='error.main'>
                    {opsStats?.criticalOpen ?? 0}
                  </Typography>
                  <Button
                    size='small'
                    component={Link}
                    href='/apps/ops-logs?severity=critical&resolution=open'
                  >
                    Ops log →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='overline' color='text.secondary'>
                    Instant lesson failures
                  </Typography>
                  <Typography variant='h4' fontWeight={800}>
                    {opsStats?.instantFailures ?? 0}
                  </Typography>
                  <Button size='small' component={Link} href='/apps/ops-logs?instant_only=true'>
                    Filter instant →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='overline' color='text.secondary'>
                    Call preflight failures
                  </Typography>
                  <Typography variant='h4' fontWeight={800}>
                    {opsStats?.callPreflightFailures ?? 0}
                  </Typography>
                  <Button size='small' component={Link} href='/apps/call-diagnostics'>
                    Call diagnostics →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
          Finance anomaly queues
        </Typography>
        {financeOps?.error ? (
          <Alert severity='error' sx={{ mb: 2 }}>
            {financeOps.error}
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { key: 'heldCount', label: 'Escrow held', href: '/apps/finance?tab=escrow&status=held' },
              { key: 'releasingCount', label: 'Releasing', href: '/apps/finance?tab=escrow&status=releasing' },
              { key: 'disputedCount', label: 'Disputed', href: '/apps/finance?tab=escrow&status=disputed', warn: true },
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
                label: 'Extension reconcile alerts (7d)',
                href: '/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT',
                warn: true
              },
              {
                key: 'transferFailuresLast7d',
                label: 'Transfer failures (7d)',
                href: '/apps/finance?tab=audit'
              }
            ].map(item => (
              <Grid item xs={6} sm={4} md={2} key={item.key}>
                <Card variant='outlined'>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant='caption' color='text.secondary'>
                      {item.label}
                    </Typography>
                    <Typography
                      variant='h5'
                      fontWeight={800}
                      color={item.warn && (financeOps?.[item.key] ?? 0) > 0 ? 'error.main' : 'text.primary'}
                    >
                      {financeOps?.[item.key] ?? 0}
                    </Typography>
                    <Button size='small' component={Link} href={item.href} sx={{ mt: 0.5, p: 0, minWidth: 0 }}>
                      Open →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant='h6' fontWeight={700} sx={{ mb: 1.5 }}>
          Quick links
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' size='small' component={Link} href='/apps/finance'>
            Finance console
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
