import { useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AreaTrend from 'src/components/admin/charts/AreaTrend'
import ChartCard from 'src/components/admin/charts/ChartCard'
import KpiTile from 'src/components/admin/KpiTile'
import StatusPill from 'src/components/admin/StatusPill'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { useInvalidateOnAdminEvent } from 'src/hooks/useAdminLive'
import ActiveUsersTable from 'src/pages/components/tables/UsersTable'
import { getCommandCenter, getSentryStats } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { rankIssues } from 'src/features/sentry/describeIssue'
import SentryIssueList from 'src/features/sentry/SentryIssueList'
import { timeAgo } from 'src/utils/format'
import AttentionList from './AttentionList'
import { apiTrend, dailyTrend } from './chartData'
import FunnelBars from './FunnelBars'
import GlobalCommissionCard from './GlobalCommissionCard'
import { buildKpiTiles } from './kpiTiles'
import LiveNowCard from './LiveNowCard'
import MoneyAtRiskCard from './MoneyAtRiskCard'
import RecentAlerts from './RecentAlerts'
import StatusStrip from './StatusStrip'

const WINDOWS = [
  { value: 1, label: '24h' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' }
]

export const resolveDays = raw => {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return [1, 7, 30].includes(n) ? n : 7
}

const Section = ({ title, subtitle, actions, children }) => (
  <ChartCard title={title} subtitle={subtitle} actions={actions}>
    {children}
  </ChartCard>
)

export default function CommandCenterPage() {
  const router = useRouter()
  const days = resolveDays(router.query.days)
  const { socketConnected } = useAdminRealtime()
  const ability = useContext(AbilityContext)
  const canSeeErrors = ability?.can('read', 'admin-nav-ops-logs') ?? true

  const query = useQuery({
    queryKey: queryKeys.commandCenter(days),
    queryFn: () => getCommandCenter(days),
    placeholderData: keepPreviousData,
    // The socket nudges a refetch on lesson/incident changes; this is the safety net.
    refetchInterval: socketConnected ? 60_000 : 30_000
  })
  useInvalidateOnAdminEvent(['ADMIN_LIVE_LESSON_CHANGED', 'ADMIN_OPS_EVENT_CREATED'], queryKeys.commandCenterAll)

  const sentry = useQuery({
    queryKey: queryKeys.sentryStats('24h'),
    queryFn: () => getSentryStats('24h'),
    enabled: canSeeErrors,
    retry: false,
    refetchInterval: 120_000
  })

  const data = query.data
  const tiles = useMemo(() => buildKpiTiles(data?.kpis, data?.daily), [data])
  const trend = useMemo(() => dailyTrend(data?.daily), [data])
  const api = useMemo(() => apiTrend(data?.health?.apiSeries), [data])
  const issues = useMemo(() => rankIssues(sentry.data?.topIssues), [sentry.data])

  const setDays = (_, next) => {
    if (next) router.replace({ pathname: router.pathname, query: { ...router.query, days: next } }, undefined, { shallow: true })
  }

  const actions = (
    <>
      <ToggleButtonGroup size='small' exclusive value={days} onChange={setDays} aria-label='Time range'>
        {WINDOWS.map(w => (
          <ToggleButton key={w.value} value={w.value} sx={{ px: 1.5, textTransform: 'none' }}>
            {w.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <StatusPill tone={socketConnected ? 'live' : 'warning'} pulse={socketConnected} size='sm'>
        {socketConnected ? 'Live' : 'Polling'}
      </StatusPill>
      <AdminRefreshButton onClick={() => query.refetch()} loading={query.isFetching} label='Refresh' />
    </>
  )

  if (query.isError && !data) {
    return (
      <AdminPageShell title='Command Center' subtitle='How the business and the platform are doing right now.' actions={actions}>
        <AdminEmptyState
          title='Couldn’t load the Command Center'
          description={`${query.error?.message || 'Something went wrong.'}${query.error?.requestId ? ` (request ${query.error.requestId})` : ''}`}
          actionLabel='Try again'
          onAction={() => query.refetch()}
        />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell
      title='Command Center'
      subtitle='What needs you, what is happening right now, and how the business is trending.'
      actions={actions}
    >
      <ApexChartWrapper>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <StatusStrip health={data?.health} live={data?.live} socketConnected={socketConnected} />
          </Grid>

          <Grid item xs={12} lg={7}>
            <Section title='Needs your attention' subtitle='Worst first. Each row opens the place to act.'>
              <AttentionList items={data?.attention || []} />
            </Section>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Section title='Live now' subtitle='Lessons in progress and about to start'>
              {data?.live ? <LiveNowCard live={data.live} /> : <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading…</Typography>}
            </Section>
          </Grid>

          {tiles.map(t => (
            <Grid item xs={6} md={4} xl={3} key={t.key}>
              <KpiTile
                label={t.label}
                value={t.value}
                delta={t.delta}
                deltaLabel={t.deltaLabel}
                higherIsBetter={t.higherIsBetter}
                series={t.series}
                href={t.href}
                loading={!data}
              />
            </Grid>
          ))}

          {trend.gmv ? (
            <Grid item xs={12} lg={6}>
              <ChartCard title='Gross booking value' subtitle='Daily, excluding cancelled' empty={!trend.categories.length}>
                <AreaTrend series={trend.gmv} categories={trend.categories} format='money' />
              </ChartCard>
            </Grid>
          ) : null}
          <Grid item xs={12} lg={trend.gmv ? 6 : 12}>
            <ChartCard title='Bookings' subtitle='Created per day' empty={!trend.categories.length}>
              <AreaTrend series={trend.bookings} categories={trend.categories} type='bar' />
            </ChartCard>
          </Grid>

          {data?.moneyAtRisk ? (
            <Grid item xs={12} md={6} lg={4}>
              <Section title='Money at risk' subtitle='Held, in flight, disputed or owed'>
                <MoneyAtRiskCard data={data.moneyAtRisk} />
              </Section>
            </Grid>
          ) : null}
          {canSeeErrors ? (
            <Grid item xs={12} md={6} lg={data?.moneyAtRisk ? 8 : 12}>
              <Section
                title='Top errors, last 24h'
                subtitle={
                  sentry.data
                    ? `${sentry.data.unresolvedIssues} unresolved · ${sentry.data.newOrRegressed} new or regressed`
                    : 'From Sentry, ranked by people affected'
                }
              >
                <SentryIssueList issues={issues} loading={sentry.isLoading} error={sentry.error} max={5} />
              </Section>
            </Grid>
          ) : null}

          {data?.health ? (
            <>
              <Grid item xs={12} lg={6}>
                <ChartCard title='API error rate' subtitle='Share of requests returning 5xx, hourly (estimated)' empty={!api.categories.length}>
                  <AreaTrend series={api.errorRate} categories={api.categories} format='pct' height={220} />
                </ChartCard>
              </Grid>
              <Grid item xs={12} lg={6}>
                <ChartCard title='API latency' subtitle='Average response time, hourly' empty={!api.categories.length}>
                  <AreaTrend series={api.latency} categories={api.categories} format='ms' height={220} />
                </ChartCard>
              </Grid>
            </>
          ) : null}

          <Grid item xs={12} md={6}>
            <Section title='Booking funnel' subtitle='From viewing a coach to a completed lesson'>
              <FunnelBars steps={data?.funnel} />
            </Section>
          </Grid>
          <Grid item xs={12} md={6}>
            <Section title='Recent alerts' subtitle={data ? `Updated ${timeAgo(data.generatedAt)}` : undefined}>
              <RecentAlerts alerts={data?.recentAlerts || []} />
            </Section>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <GlobalCommissionCard />
          </Grid>
        </Grid>
      </ApexChartWrapper>

      <Box sx={{ mt: 3 }}>
        <ActiveUsersTable />
      </Box>
    </AdminPageShell>
  )
}
