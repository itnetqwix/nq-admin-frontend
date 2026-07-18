import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import Modal from '../components/modal/Modal'
import CommissionForm from 'src/layouts/components/student/CommissionForm'
import ActiveUsersTable from '../components/tables/UsersTable'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { getAdminApiEnvLabel } from 'src/configs/adminEnv'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  fetchHomeDashboard,
  fetchLogSummaryOnly,
  selectDashboard
} from 'src/store/slices/dashboardSlice'
import { fetchGlobalCommission } from 'src/services/adminDashboardApi'
import { getFinanceOpsDashboard } from 'src/services/financeApi'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { useRouter } from 'next/router'
import Link from 'next/link'
import moment from 'moment'

const fmtMoney = v =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number(v) || 0
  )
const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

/** Horizontal bars — no chart lib. */
function BarList({ rows, valueKey = 'hits', labelKey = 'path', maxItems = 6 }) {
  const list = (rows || []).slice(0, maxItems)
  const max = Math.max(1, ...list.map(r => Number(r[valueKey]) || 0))
  if (!list.length) {
    return (
      <Typography sx={{ fontSize: 13, color: ops.mute, py: 2 }}>No data in this window.</Typography>
    )
  }
  return (
    <Stack spacing={1.25}>
      {list.map((r, i) => {
        const val = Number(r[valueKey]) || 0
        const pct = Math.round((val / max) * 100)
        const errors = Number(r.errors) || 0
        return (
          <Box key={`${r[labelKey]}-${i}`}>
            <Stack direction='row' justifyContent='space-between' alignItems='baseline' sx={{ mb: 0.5 }}>
              <Typography
                sx={{
                  fontFamily: ops.mono,
                  fontSize: 11,
                  color: ops.body,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '70%'
                }}
                title={r[labelKey]}
              >
                {r[labelKey] || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, flexShrink: 0 }}>
                {fmtInt(val)}
                {errors ? ` · ${fmtInt(errors)} err` : ''}
                {r.avg_ms != null ? ` · ${r.avg_ms}ms` : ''}
              </Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 99, bgcolor: ops.canvasSoft2, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 99,
                  bgcolor: errors > 0 ? ops.error : ops.indigo,
                  transition: 'width 280ms ease'
                }}
              />
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

function KpiStrip({ items }) {
  return (
    <Grid container spacing={1.5}>
      {items.map(it => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={it.label}>
          <OpsMetricTile {...it} />
        </Grid>
      ))}
    </Grid>
  )
}

function FeedRow({ title, meta, tone, href }) {
  const color =
    tone === 'danger' ? ops.error : tone === 'warn' ? '#ab570a' : ops.body
  const inner = (
    <Stack
      direction='row'
      spacing={1.5}
      alignItems='flex-start'
      sx={{
        py: 1.25,
        borderBottom: `1px solid ${ops.hairline}`,
        '&:last-child': { borderBottom: 'none' }
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
          mt: 0.75,
          flexShrink: 0
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: ops.ink, lineHeight: 1.35 }} noWrap>
          {title}
        </Typography>
        {meta ? (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mt: 0.25 }} noWrap>
            {meta}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )
  if (href) {
    return (
      <Box
        component={Link}
        href={href}
        sx={{ textDecoration: 'none', display: 'block', '&:hover .feed-title': { color: ops.indigo } }}
      >
        {inner}
      </Box>
    )
  }
  return inner
}

const Home = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canEditCommission = ability?.can('update', 'admin-action-commission') ?? true
  const { metrics, socketConnected, refreshMetrics } = useAdminRealtime()
  const dispatch = useAppDispatch()
  const dash = useAppSelector(selectDashboard)
  const { pendingVerifications, pendingTraineeReviews, logSummary, loading, fetchedAt } = dash

  const [commission, setCommission] = useState(null)
  const [commissionModal, setCommissionModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [focus, setFocus] = useState('all') // all | attention | business | security
  const [moneyAtRisk, setMoneyAtRisk] = useState(null)

  const kpis = useMemo(() => logSummary?.kpis || {}, [logSummary])
  const topPaths = logSummary?.top_api_paths || []
  const recentActivity = logSummary?.recent_activity || []
  const failedLogins = logSummary?.failed_logins || []
  const recentErrors = logSummary?.recent_errors || []

  const loadCommission = useCallback(async () => {
    try {
      const rows = await fetchGlobalCommission()
      if (Array.isArray(rows) && rows[0]) setCommission(rows[0])
    } catch {
      /* ignore */
    }
  }, [])

  const loadMoneyAtRisk = useCallback(async () => {
    try {
      const data = await getFinanceOpsDashboard()
      setMoneyAtRisk(data?.moneyAtRisk || null)
    } catch {
      setMoneyAtRisk(null)
    }
  }, [])

  useEffect(() => {
    void dispatch(fetchHomeDashboard())
    void loadCommission()
    void loadMoneyAtRisk()
    const t = setInterval(() => {
      void dispatch(fetchLogSummaryOnly())
    }, 60_000)
    return () => clearInterval(t)
  }, [dispatch, loadCommission, loadMoneyAtRisk])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        dispatch(fetchHomeDashboard()),
        refreshMetrics?.(),
        loadCommission(),
        loadMoneyAtRisk()
      ])
    } finally {
      setRefreshing(false)
    }
  }

  const attentionCount = useMemo(() => {
    return (
      (Number(kpis.failed_logins) || 0) +
      (Number(metrics?.opsCriticalOpen24h) || 0) +
      (Number(metrics?.bookingsPendingRefund) || 0) +
      (Number(pendingVerifications) || 0) +
      (Number(pendingTraineeReviews) || 0) +
      (Number(metrics?.openSupportTickets) || 0)
    )
  }, [kpis, metrics, pendingVerifications, pendingTraineeReviews])

  const show = key => focus === 'all' || focus === key

  const attentionTiles = [
    {
      icon: 'mdi:cash-lock',
      label: 'Money at risk',
      value:
        moneyAtRisk?.totalMinor != null
          ? fmtMoney(Number(moneyAtRisk.totalMinor) / 100)
          : '—',
      hint: moneyAtRisk
        ? `Escrow + refunds + payouts · ${fmtInt(moneyAtRisk.openRefundCount || 0)} open refunds`
        : 'Held escrow + open refunds + pending payouts',
      tone: (moneyAtRisk?.totalMinor || 0) > 0 ? 'danger' : 'default',
      onClick: () => router.push('/apps/finance?tab=escrow')
    },
    {
      icon: 'mdi:shield-alert-outline',
      label: 'Failed logins',
      value: kpis.failed_logins != null ? fmtInt(kpis.failed_logins) : '—',
      hint: 'Last 24h · security',
      tone: 'danger',
      onClick: () => router.push('/apps/logs?tab=security')
    },
    {
      icon: 'mdi:alert-octagon-outline',
      label: 'Critical ops',
      value: metrics != null ? fmtInt(metrics.opsCriticalOpen24h ?? 0) : '—',
      hint: 'Open / investigating',
      tone: 'danger',
      onClick: () => router.push('/apps/ops-logs?severity=critical')
    },
    {
      icon: 'mdi:cash-refund',
      label: 'Pending refunds',
      value: metrics != null ? fmtInt(metrics.bookingsPendingRefund ?? 0) : '—',
      hint: 'Canceled w/ payment',
      tone: 'danger',
      onClick: () => router.push('/apps/booking')
    },
    {
      icon: 'mdi:account-check-outline',
      label: 'Trainer verifications',
      value: pendingVerifications != null ? fmtInt(pendingVerifications) : '—',
      hint: 'Pending review',
      tone: 'warn',
      onClick: () => router.push('/apps/trainer-verifications')
    },
    {
      icon: 'mdi:account-clock-outline',
      label: 'Trainee reviews',
      value: pendingTraineeReviews != null ? fmtInt(pendingTraineeReviews) : '—',
      hint: 'Pending review',
      tone: 'warn',
      onClick: () => router.push('/apps/trainee-account-reviews')
    },
    {
      icon: 'mdi:lifebuoy',
      label: 'Support tickets',
      value: metrics != null ? fmtInt(metrics.openSupportTickets ?? 0) : '—',
      hint: 'Open queue',
      tone: 'warn',
      onClick: () => router.push('/apps/concern-by-user')
    }
  ]

  const businessTiles = [
    {
      icon: 'mdi:currency-usd',
      label: 'Total revenue',
      value: metrics ? fmtMoney(metrics.totalRevenue) : '—',
      hint: `Paid bookings · ${socketConnected ? 'live' : 'polling'}`,
      tone: 'accent',
      onClick: () => router.push('/apps/booking?focus=paid')
    },
    {
      icon: 'mdi:cart-outline',
      label: 'Total orders',
      value: metrics ? fmtInt(metrics.totalOrders) : '—',
      hint: 'Paid bookings',
      onClick: () => router.push('/apps/booking')
    },
    {
      icon: 'mdi:calendar-check-outline',
      label: 'Total sessions',
      value: metrics ? fmtInt(metrics.totalSessions) : '—',
      hint: `Completion ${metrics?.overviewCompletionPercent ?? 0}%`,
      tone: 'success',
      onClick: () => router.push('/apps/booking')
    },
    {
      icon: 'mdi:account-group-outline',
      label: 'Trainers / trainees',
      value: metrics
        ? `${fmtInt(metrics.trainersCount)} / ${fmtInt(metrics.traineesCount)}`
        : '—',
      hint: 'Directory',
      onClick: () => router.push('/apps/users')
    },
    {
      icon: 'mdi:account-plus-outline',
      label: 'New users (7d)',
      value: metrics != null ? fmtInt(metrics.newUsersLast7Days ?? 0) : '—',
      hint: 'Trainers + trainees',
      tone: 'accent',
      onClick: () => router.push('/apps/manage-trainer')
    },
    {
      icon: 'mdi:eye-outline',
      label: 'Impressions',
      value: metrics ? fmtInt(metrics.totalImpressions) : '—',
      hint: 'Published clips',
      onClick: () => router.push('/apps/netqwix-library')
    }
  ]

  const securityTiles = [
    {
      icon: 'mdi:login',
      label: 'Logins (24h)',
      value: kpis.logins != null ? fmtInt(kpis.logins) : '—',
      hint: 'Successful',
      tone: 'success',
      onClick: () => router.push('/apps/logs?tab=login')
    },
    {
      icon: 'mdi:api',
      label: 'API hits (24h)',
      value: kpis.api_hits != null ? fmtInt(kpis.api_hits) : '—',
      hint: 'Authenticated',
      onClick: () => router.push('/apps/logs?tab=api')
    },
    {
      icon: 'mdi:alert-circle-outline',
      label: 'API errors (24h)',
      value: kpis.api_errors != null ? fmtInt(kpis.api_errors) : '—',
      hint: kpis.error_rate != null ? `${kpis.error_rate}% error rate` : '4xx / 5xx',
      tone: 'warn',
      onClick: () => router.push('/apps/logs?tab=api&minStatus=400')
    },
    {
      icon: 'mdi:upload-outline',
      label: 'Uploads (24h)',
      value: kpis.uploads != null ? fmtInt(kpis.uploads) : '—',
      hint: 'Clips / sessions',
      onClick: () => router.push('/apps/logs?tab=files')
    },
    {
      icon: 'mdi:flash-alert-outline',
      label: 'Instant failures',
      value: metrics != null ? fmtInt(metrics.opsInstantFailures24h ?? 0) : '—',
      hint: 'Lesson errors 24h',
      tone: 'warn',
      onClick: () => router.push('/apps/ops-logs?instant_only=true')
    },
    {
      icon: 'mdi:wifi-strength-alert-outline',
      label: 'Call preflight',
      value: metrics != null ? fmtInt(metrics.opsCallPreflightFailures24h ?? 0) : '—',
      hint: 'Connection 24h',
      onClick: () => router.push('/apps/ops-logs?category=connection')
    }
  ]

  const cmsTiles = [
    {
      icon: 'mdi:image-multiple-outline',
      label: 'Active banners',
      value: metrics != null ? fmtInt(metrics.activeBanners ?? 0) : '—',
      hint: 'CMS',
      onClick: () => router.push('/apps/banners')
    },
    {
      icon: 'mdi:lightbulb-on-outline',
      label: 'Active tips',
      value: metrics != null ? fmtInt(metrics.activeTips ?? 0) : '—',
      hint: 'Offers',
      tone: 'success',
      onClick: () => router.push('/apps/tips')
    },
    {
      icon: 'mdi:view-grid-outline',
      label: 'Placements',
      value:
        metrics != null
          ? `${fmtInt(metrics.activeBannersHero ?? 0)}/${fmtInt(metrics.activeBannersStrip ?? 0)}/${fmtInt(metrics.activeBannersSticky ?? 0)}`
          : '—',
      hint: 'hero · strip · sticky',
      onClick: () => router.push('/apps/cms')
    },
    {
      icon: 'mdi:message-text-outline',
      label: 'User feedback',
      value: metrics != null ? fmtInt(metrics.openUserFeedback ?? 0) : '—',
      hint: 'Open queue',
      onClick: () => router.push('/apps/write-by-user')
    },
    {
      icon: 'mdi:timeline-text-outline',
      label: 'Platform activity',
      value: 'Open',
      hint: 'Who · when · what',
      tone: 'accent',
      onClick: () => router.push('/apps/platform-activity')
    },
    {
      icon: 'mdi:phone-in-talk-outline',
      label: 'Call diagnostics',
      value: 'Open',
      hint: 'Quality & events',
      tone: 'accent',
      onClick: () => router.push('/apps/call-diagnostics')
    }
  ]

  return (
    <>
      <AdminPageShell
        bare
        loading={loading && !metrics && !logSummary}
        loadingMessage='Loading dashboard…'
        icon='mdi:view-dashboard-outline'
        eyebrow='Overview'
        title={
          <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            Platform overview
            <Chip
              size='small'
              label={socketConnected ? 'LIVE' : 'POLLING'}
              sx={{
                height: 22,
                fontFamily: ops.mono,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: socketConnected ? ops.lime : ops.canvasSoft2,
                color: ops.night
              }}
            />
          </Box>
        }
        subtitle='Attention queue, business pulse, security trends, and live presence — one screen.'
        actions={
          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
            <Chip
              size='small'
              variant='outlined'
              label={getAdminApiEnvLabel()}
              sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline, bgcolor: ops.canvas }}
            />
            {fetchedAt ? (
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                Updated {moment(fetchedAt).fromNow()}
              </Typography>
            ) : null}
          </Stack>
        }
      >
        <AdminFilterBar
          onRefresh={onRefresh}
          refreshLoading={refreshing}
          helperText='Focus filters the sections below. Refresh reloads metrics + log summary.'
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'attention', label: `Attention${attentionCount ? ` · ${attentionCount}` : ''}` },
            { id: 'business', label: 'Business' },
            { id: 'security', label: 'Security & API' }
          ].map(f => (
            <Chip
              key={f.id}
              size='small'
              clickable
              label={f.label}
              onClick={() => setFocus(f.id)}
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                height: 28,
                bgcolor: focus === f.id ? ops.softIndigo : ops.canvas,
                color: focus === f.id ? ops.indigoDeep : ops.body,
                border: `1px solid ${focus === f.id ? ops.indigo : ops.hairline}`,
                fontWeight: focus === f.id ? 600 : 500
              }}
            />
          ))}
          <Button
            size='small'
            variant='outlined'
            onClick={() => router.push('/apps/logs?tab=overview')}
            sx={{ textTransform: 'none', height: 28, fontSize: 12 }}
          >
            Logs hub
          </Button>
        </AdminFilterBar>

        {/* Commission */}
        <OpsSurfaceCard sx={{ mb: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Global commission
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: ops.body }}>Applies to all trainers</Typography>
          </Box>
          <Stack direction='row' alignItems='center' spacing={1.5}>
            <Typography sx={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.96px', fontVariantNumeric: 'tabular-nums' }}>
              {commission?.commission ?? 0}%
            </Typography>
            {canEditCommission ? (
              <CustomAvatar
                skin='light'
                variant='rounded'
                sx={{ bgcolor: ops.canvasSoft2, color: ops.ink, cursor: 'pointer', borderRadius: ops.radiusSm }}
                onClick={() => setCommissionModal(true)}
              >
                <Icon icon='tabler:edit' />
              </CustomAvatar>
            ) : null}
          </Stack>
        </OpsSurfaceCard>

        {show('attention') ? (
          <Box sx={{ mb: 3 }}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16 }}>Needs attention</Typography>
              <Chip
                size='small'
                label={`${attentionCount} open signals`}
                sx={{ fontFamily: ops.mono, fontSize: 10, bgcolor: attentionCount ? ops.errorSoft : ops.canvasSoft2, color: attentionCount ? ops.error : ops.mute }}
              />
            </Stack>
            <KpiStrip items={attentionTiles} />
          </Box>
        ) : null}

        {show('business') ? (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
              Business pulse
            </Typography>
            <KpiStrip items={businessTiles} />
          </Box>
        ) : null}

        {show('security') ? (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
              Security &amp; API · 24h
            </Typography>
            <KpiStrip items={securityTiles} />
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <OpsSurfaceCard>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
                    Top API paths
                  </Typography>
                  <BarList rows={topPaths} />
                  <Button
                    size='small'
                    sx={{ mt: 1.5, textTransform: 'none', px: 0 }}
                    onClick={() => router.push('/apps/logs?tab=api')}
                  >
                    Open API logs →
                  </Button>
                </OpsSurfaceCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <OpsSurfaceCard>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                    Failed logins
                  </Typography>
                  {failedLogins.length ? (
                    failedLogins.slice(0, 6).map(row => (
                      <FeedRow
                        key={row.id}
                        tone='danger'
                        title={row.actor?.fullname || row.actor?.email || row.actor?.label || row.action}
                        meta={[
                          row.at ? formatOpsDateTime(row.at, { withSeconds: false }) : null,
                          row.ip,
                          [row.city, row.country].filter(Boolean).join(', '),
                          row.device || row.browser
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        href={row.actor?.id ? `/apps/users/${row.actor.id}` : '/apps/logs?tab=security'}
                      />
                    ))
                  ) : (
                    <Typography sx={{ fontSize: 13, color: ops.mute, py: 2 }}>No failed logins in window.</Typography>
                  )}
                </OpsSurfaceCard>
              </Grid>
            </Grid>
          </Box>
        ) : null}

        {focus === 'all' ? (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
              Content &amp; shortcuts
            </Typography>
            <KpiStrip items={cmsTiles} />
          </Box>
        ) : null}

        {focus === 'all' || focus === 'security' ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <OpsSurfaceCard>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recent activity
                  </Typography>
                  <Button size='small' sx={{ textTransform: 'none', px: 0 }} onClick={() => router.push('/apps/platform-activity')}>
                    All →
                  </Button>
                </Stack>
                {recentActivity.length ? (
                  recentActivity.slice(0, 8).map((row, i) => (
                    <FeedRow
                      key={row.id || i}
                      title={row.title || row.action || 'Event'}
                      meta={[
                        row.at ? moment(row.at).fromNow() : null,
                        row.actor?.fullname || row.actor?.label,
                        row.ip,
                        row.country
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      href={row.actor?.id ? `/apps/users/${row.actor.id}` : undefined}
                    />
                  ))
                ) : (
                  <Typography sx={{ fontSize: 13, color: ops.mute, py: 2 }}>No recent activity.</Typography>
                )}
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <OpsSurfaceCard>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recent ops errors
                  </Typography>
                  <Button size='small' sx={{ textTransform: 'none', px: 0 }} onClick={() => router.push('/apps/ops-logs')}>
                    Ops →
                  </Button>
                </Stack>
                {recentErrors.length ? (
                  recentErrors.slice(0, 8).map((row, i) => (
                    <FeedRow
                      key={row.id || row._id || i}
                      tone='warn'
                      title={row.title || row.message || row.type || 'Ops event'}
                      meta={[
                        row.createdAt || row.at
                          ? moment(row.createdAt || row.at).fromNow()
                          : null,
                        row.severity || row.level,
                        row.category
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))
                ) : (
                  <Typography sx={{ fontSize: 13, color: ops.mute, py: 2 }}>No recent ops errors.</Typography>
                )}
              </OpsSurfaceCard>
            </Grid>
          </Grid>
        ) : null}

        <ActiveUsersTable embedded />
      </AdminPageShell>

      <Modal handleClose={() => setCommissionModal(false)} open={commissionModal} maxWidth='xs'>
        {canEditCommission ? (
          <CommissionForm
            getGlobalCommission={async () => {
              await loadCommission()
              setCommissionModal(false)
            }}
          />
        ) : null}
      </Modal>
    </>
  )
}

export default Home
