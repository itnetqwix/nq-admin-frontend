import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material'

function formatMinor(minor) {
  if (minor == null) return '—'
  return `$${(Number(minor) / 100).toFixed(2)}`
}

function MetricCard({ title, value, subtitle, color = 'default', href, onClick }) {
  const inner = (
    <Card variant='outlined' sx={{ height: '100%', borderColor: color === 'error' ? 'error.light' : undefined }}>
      <CardContent>
        <Typography variant='overline' color='text.secondary'>
          {title}
        </Typography>
        <Typography variant='h4' fontWeight={800} color={color === 'error' ? 'error.main' : 'text.primary'}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Box component={Link} href={href} sx={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </Box>
    )
  }
  if (onClick) {
    return (
      <Box onClick={onClick} sx={{ cursor: 'pointer', height: '100%' }}>
        {inner}
      </Box>
    )
  }
  return inner
}

export default function FinanceOverviewPanel({
  opsDashboard,
  escrowSummary,
  onGoTab,
  onReconcile
}) {
  const held = escrowSummary?.byStatus?.held
  const aging = escrowSummary?.aging
  const ops = opsDashboard || {}

  const anomalyTotal =
    (ops.releasingCount ?? 0) +
    (ops.disputedCount ?? 0) +
    (ops.stuckTopUpsPending30m ?? 0) +
    (ops.paidUnappliedExtensions ?? 0) +
    (ops.transferFailuresLast7d ?? 0)

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant='h6' fontWeight={700} sx={{ mb: 0.5 }}>
          Finance overview
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Live escrow totals, anomaly queues, and quick links into ledger tabs. Data refreshes from the wallet backend.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title='Escrow held'
            value={held?.count ?? 0}
            subtitle={formatMinor(held?.totalMinor)}
            color={(held?.count ?? 0) > 0 ? 'warning' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'held' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title='Releasing'
            value={ops.releasingCount ?? 0}
            subtitle='Holds mid-release — reconcile if stuck'
            color={(ops.releasingCount ?? 0) > 0 ? 'warning' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'releasing' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title='Disputed'
            value={ops.disputedCount ?? 0}
            subtitle='Manual resolution required'
            color={(ops.disputedCount ?? 0) > 0 ? 'error' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'disputed' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title='Anomaly signals'
            value={anomalyTotal}
            subtitle='Releasing + disputed + stuck top-ups + extensions + transfer failures'
            color={anomalyTotal > 0 ? 'warning' : 'default'}
          />
        </Grid>
      </Grid>

      {escrowSummary ? (
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1.5 }}>
              Escrow by status
            </Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              {Object.entries(escrowSummary.byStatus || {}).map(([status, row]) => (
                <Chip
                  key={status}
                  label={`${status}: ${row.count} · ${formatMinor(row.totalMinor)}`}
                  variant='outlined'
                  size='small'
                  onClick={() => onGoTab?.('escrow', { status })}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
            {aging ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Held aging
                </Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip size='small' label={`<24h: ${aging.under24h ?? 0}`} />
                  <Chip size='small' label={`1–7d: ${aging.d1to7 ?? 0}`} />
                  <Chip size='small' label={`7–30d: ${aging.d7to30 ?? 0}`} />
                  <Chip size='small' color='error' variant='outlined' label={`30d+: ${aging.over30 ?? 0}`} />
                </Stack>
              </Box>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1.5 }}>
            Ops queues
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={4}>
              <Stack spacing={0.5}>
                <Typography variant='body2' fontWeight={600}>
                  Held (active)
                </Typography>
                <Typography variant='h5'>{ops.heldCount ?? '—'}</Typography>
                <Button size='small' variant='text' onClick={() => onGoTab?.('escrow', { status: 'held' })}>
                  View escrow →
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Stack spacing={0.5}>
                <Typography variant='body2' fontWeight={600}>
                  Stuck top-ups (&gt;30m pending)
                </Typography>
                <Typography variant='h5'>{ops.stuckTopUpsPending30m ?? 0}</Typography>
                <Button size='small' variant='text' onClick={() => onGoTab?.('stuck_topups')}>
                  View queue →
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Stack spacing={0.5}>
                <Typography variant='body2' fontWeight={600}>
                  Paid-unapplied extensions
                </Typography>
                <Typography variant='h5'>{ops.paidUnappliedExtensions ?? 0}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  Sessions with paid extensions not yet applied to booking time
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Stack spacing={0.5}>
                <Typography variant='body2' fontWeight={600}>
                  Stripe transfer failures (7d)
                </Typography>
                <Typography variant='h5'>{ops.transferFailuresLast7d ?? 0}</Typography>
                <Button size='small' variant='text' component={Link} href='/apps/audit-logs'>
                  Audit log →
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1.5 }}>
            Reconcile &amp; maintenance
          </Typography>
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Button size='small' variant='outlined' onClick={() => onReconcile?.('topups')}>
              Reconcile top-ups
            </Button>
            <Button size='small' variant='outlined' onClick={() => onReconcile?.('refunds')}>
              Reconcile refunds
            </Button>
            <Button size='small' variant='outlined' onClick={() => onReconcile?.('releasing')}>
              Reconcile releasing holds
            </Button>
            <Button size='small' variant='outlined' component={Link} href='/apps/finance/connect'>
              Stripe Connect
            </Button>
            <Button size='small' variant='outlined' component={Link} href='/apps/platform-health'>
              Platform health →
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
