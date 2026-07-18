import Link from 'next/link'
import { useRouter } from 'next/router'
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import { ops } from 'src/styles/opsSurface'

function formatMinor(minor) {
  if (minor == null) return '—'
  return `$${(Number(minor) / 100).toFixed(2)}`
}

function Section({ title, children }) {
  return (
    <Box sx={{ p: 2.5, bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard }}>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  )
}

export default function FinanceOverviewPanel({ opsDashboard, escrowSummary, onGoTab, onReconcile }) {
  const router = useRouter()
  const held = escrowSummary?.byStatus?.held
  const aging = escrowSummary?.aging
  const dash = opsDashboard || {}

  const anomalyTotal =
    (dash.releasingCount ?? 0) +
    (dash.disputedCount ?? 0) +
    (dash.stuckTopUpsPending30m ?? 0) +
    (dash.paidUnappliedExtensions ?? 0) +
    (dash.transferFailuresLast7d ?? 0) +
    (dash.extensionReconcileAlerts7d ?? 0)

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>Finance overview.</Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
          Live escrow totals, anomaly queues, and quick links into ledger tabs.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Escrow held'
            value={held?.count ?? 0}
            hint={formatMinor(held?.totalMinor)}
            tone={(held?.count ?? 0) > 0 ? 'warn' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'held' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Releasing'
            value={dash.releasingCount ?? 0}
            hint='Holds mid-release'
            tone={(dash.releasingCount ?? 0) > 0 ? 'warn' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'releasing' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Disputed'
            value={dash.disputedCount ?? 0}
            hint='Manual resolution'
            tone={(dash.disputedCount ?? 0) > 0 ? 'danger' : 'default'}
            onClick={() => onGoTab?.('escrow', { status: 'disputed' })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <OpsMetricTile
            label='Anomaly signals'
            value={anomalyTotal}
            hint='Queues needing attention'
            tone={anomalyTotal > 0 ? 'warn' : 'default'}
          />
        </Grid>
      </Grid>

      <Section title='Quick navigation'>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {[
            { label: 'Ledger', tab: 'ledger' },
            { label: 'Transactions', tab: 'transactions' },
            { label: 'Escrow', tab: 'escrow', status: 'held' },
            { label: 'Refunds', tab: 'refunds' },
            { label: 'Payouts', tab: 'payouts' },
            { label: 'Stuck top-ups', tab: 'stuck_topups' }
          ].map(item => (
            <Chip
              key={item.label}
              label={item.label}
              size='small'
              variant='outlined'
              onClick={() => onGoTab?.(item.tab, item.status ? { status: item.status } : undefined)}
              sx={{ cursor: 'pointer', fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
            />
          ))}
        </Stack>
      </Section>

      {escrowSummary ? (
        <Section title='Escrow by status'>
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            {Object.entries(escrowSummary.byStatus || {}).map(([status, row]) => (
              <Chip
                key={status}
                label={`${status}: ${row.count} · ${formatMinor(row.totalMinor)}`}
                variant='outlined'
                size='small'
                onClick={() => onGoTab?.('escrow', { status })}
                sx={{ cursor: 'pointer', fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
              />
            ))}
          </Stack>
          {aging ? (
            <Box sx={{ mt: 2 }}>
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
                Held aging
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip size='small' label={`<24h: ${aging.under24h ?? 0}`} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                <Chip size='small' label={`1–7d: ${aging.d1to7 ?? 0}`} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                <Chip size='small' label={`7–30d: ${aging.d7to30 ?? 0}`} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                <Chip
                  size='small'
                  label={`30d+: ${aging.over30 ?? 0}`}
                  sx={{
                    fontFamily: ops.mono,
                    fontSize: 11,
                    bgcolor: (aging.over30 ?? 0) > 0 ? ops.errorSoft : undefined,
                    color: (aging.over30 ?? 0) > 0 ? ops.error : undefined
                  }}
                />
              </Stack>
            </Box>
          ) : null}
        </Section>
      ) : null}

      <Section title='Ops queues'>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <OpsMetricTile
              label='Held (active)'
              value={dash.heldCount ?? '—'}
              hint='View escrow'
              onClick={() => onGoTab?.('escrow', { status: 'held' })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <OpsMetricTile
              label='Stuck top-ups'
              value={dash.stuckTopUpsPending30m ?? 0}
              hint='>30m pending'
              tone={(dash.stuckTopUpsPending30m ?? 0) > 0 ? 'warn' : 'default'}
              onClick={() => onGoTab?.('stuck_topups')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <OpsMetricTile
              label='Paid-unapplied extensions'
              value={dash.paidUnappliedExtensions ?? 0}
              hint='Paid but not applied to booking'
              tone={(dash.paidUnappliedExtensions ?? 0) > 0 ? 'warn' : 'default'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <OpsMetricTile
              label='Extension alerts (7d)'
              value={dash.extensionReconcileAlerts7d ?? 0}
              hint='Ops log'
              tone={(dash.extensionReconcileAlerts7d ?? 0) > 0 ? 'danger' : 'default'}
              onClick={() =>
                router.push('/apps/ops-logs?category=payment&event_type=EXTENSION_RECONCILE_ALERT')
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <OpsMetricTile
              label='Transfer failures (7d)'
              value={dash.transferFailuresLast7d ?? 0}
              hint='Platform activity'
              tone={(dash.transferFailuresLast7d ?? 0) > 0 ? 'danger' : 'default'}
              onClick={() => router.push('/apps/platform-activity?category=transactions')}
            />
          </Grid>
        </Grid>
      </Section>

      <Section title='Reconcile & maintenance'>
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
          <Button size='small' variant='outlined' onClick={() => onReconcile?.('escrow_backfill_dry')}>
            Preview escrow backfill
          </Button>
          <Button size='small' variant='outlined' color='warning' onClick={() => onReconcile?.('escrow_backfill')}>
            Backfill legacy escrow
          </Button>
          <Button size='small' variant='outlined' component={Link} href='/apps/finance/connect'>
            Stripe Connect
          </Button>
          <Button size='small' variant='outlined' component={Link} href='/apps/platform-health'>
            Platform health →
          </Button>
        </Stack>
      </Section>
    </Stack>
  )
}
