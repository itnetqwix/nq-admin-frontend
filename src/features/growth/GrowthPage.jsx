import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminTabs from 'src/components/admin/AdminTabs'
import AreaTrend from 'src/components/admin/charts/AreaTrend'
import ChartCard from 'src/components/admin/charts/ChartCard'
import KpiTile from 'src/components/admin/KpiTile'
import StatusPill from 'src/components/admin/StatusPill'
import { shortDay } from 'src/features/command-center/chartData'
import { getGrowthCohorts, getGrowthFunnel, getGrowthOverview, getGrowthSegments, getGrowthSupply } from 'src/services/peopleApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt, formatPct, timeAgo } from 'src/utils/format'
import CohortHeatmap from './CohortHeatmap'
import { cohortTable, overviewTiles, signupTrend, stageRows } from './growthView'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'cohorts', label: 'Cohorts & retention' },
  { value: 'coaches', label: 'Coach supply' }
]
const one = v => (Array.isArray(v) ? v[0] : v)
const pick = (v, allowed, fallback) => (allowed.includes(one(v)) ? one(v) : fallback)

function Toggle({ value, options, onChange, label }) {
  return (
    <ToggleButtonGroup size='small' exclusive value={value} onChange={(_, v) => v && onChange(v)} aria-label={label}>
      {options.map(o => (
        <ToggleButton key={o.value} value={o.value} sx={{ px: 1.5, textTransform: 'none' }}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

function Overview({ days }) {
  const overview = useQuery({ queryKey: ['growth', 'overview', days], queryFn: () => getGrowthOverview(days), placeholderData: keepPreviousData })
  const funnel = useQuery({ queryKey: ['growth', 'funnel', days], queryFn: () => getGrowthFunnel(days), placeholderData: keepPreviousData })
  const segments = useQuery({ queryKey: ['growth', 'segments'], queryFn: getGrowthSegments })
  const supply = useQuery({ queryKey: ['growth', 'supply'], queryFn: getGrowthSupply })

  const tiles = useMemo(() => overviewTiles(overview.data, supply.data), [overview.data, supply.data])
  const trend = useMemo(() => signupTrend(overview.data?.dailySignups), [overview.data])
  const stages = useMemo(() => stageRows(segments.data), [segments.data])
  const f = funnel.data

  return (
    <Grid container spacing={2.5}>
      {(tiles.length ? tiles : Array.from({ length: 6 }, (_, i) => ({ key: i, label: ' ', value: ' ' }))).map(t => (
        <Grid item xs={6} md={4} xl={2} key={t.key}>
          <KpiTile label={t.label} value={t.value} delta={t.delta} deltaLabel={t.deltaLabel} hint={t.hint} href={t.href} tone={t.tone} loading={!overview.data} />
        </Grid>
      ))}

      <Grid item xs={12} lg={7}>
        <ChartCard title='New signups per day' subtitle={`Last ${days} days`} loading={overview.isLoading} error={overview.error} empty={overview.data && !trend.categories.length}>
          <AreaTrend series={trend.series} categories={trend.categories.map(shortDay)} type='bar' stacked height={260} />
        </ChartCard>
      </Grid>

      <Grid item xs={12} lg={5}>
        <ChartCard
          title='From signup to repeat customer'
          subtitle={f ? `People who joined in the last ${days} days${f.truncated ? ' (sample of the first 50,000)' : ''}` : undefined}
          loading={funnel.isLoading}
          error={funnel.error}
        >
          {f ? (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {f.steps.map(s => (
                <Box key={s.key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 500 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {formatInt(s.users)}
                      {s.ofPrevious !== null ? ` · ${formatPct(s.ofPrevious, 0)} of previous` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: ops.canvasSoft2 }}>
                    <Box sx={{ height: '100%', width: `${Math.max(s.ofSignups ? 2 : 0, Math.round((s.ofSignups || 0) * 100))}%`, borderRadius: 4, bgcolor: ops.accent }} />
                  </Box>
                </Box>
              ))}
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                {f.medianDaysToFirstBooking === null ? 'No one has booked yet.' : `A typical new trainee books their first lesson ${f.medianDaysToFirstBooking === 0 ? 'the same day' : `${f.medianDaysToFirstBooking} days`} after joining.`}
              </Typography>
            </Box>
          ) : null}
        </ChartCard>
      </Grid>

      <Grid item xs={12}>
        <ChartCard title='Where every trainee is right now' subtitle='Everyone, by how recently and how often they book' loading={segments.isLoading} error={segments.error}>
          {segments.data ? (
            <Grid container spacing={1.5}>
              {stages.map(s => (
                <Grid item xs={6} md={4} lg={2} key={s.stage}>
                  <Box sx={{ p: 1.5, borderRadius: ops.radiusMd, border: `1px solid ${ops.hairline}`, height: '100%' }} title={s.help}>
                    <StatusPill tone={s.tone} size='sm'>{s.label}</StatusPill>
                    <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 30, fontWeight: 600, lineHeight: 1.1, mt: 1, fontVariantNumeric: 'tabular-nums' }}>{formatInt(s.users)}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.share} of trainees</Typography>
                    <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.5 }}>{s.help}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : null}
        </ChartCard>
      </Grid>
    </Grid>
  )
}

function Cohorts({ kind, role, metric }) {
  const q = useQuery({
    queryKey: ['growth', 'cohorts', kind, role, metric],
    queryFn: () => getGrowthCohorts({ granularity: kind, cohorts: kind === 'week' ? 12 : 12, role, metric }),
    placeholderData: keepPreviousData
  })
  const table = useMemo(() => cohortTable(q.data, metric), [q.data, metric])
  return (
    <ChartCard
      title={metric === 'revenue' ? 'Money booked by each signup group' : 'How many come back'}
      subtitle={q.data?.definition}
      loading={q.isLoading}
      error={q.error}
    >
      {q.data ? <CohortHeatmap table={table} cohorts={q.data.cohorts} kind={kind} role={role} unit={kind} /> : null}
    </ChartCard>
  )
}

function Coaches() {
  const supply = useQuery({ queryKey: ['growth', 'supply'], queryFn: getGrowthSupply })
  const s = supply.data
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={6} md={3}><KpiTile label='Approved coaches' value={formatInt(s?.approvedCoaches)} loading={!s} href='/apps/manage-trainer' /></Grid>
      <Grid item xs={6} md={3}><KpiTile label='Booked in last 30d' value={formatInt(s?.activeCoaches30d)} hint={s ? `${formatPct(s.activeShare, 0)} of approved` : ''} loading={!s} /></Grid>
      <Grid item xs={6} md={3}><KpiTile label='Joined in last 30d' value={formatInt(s?.newCoaches30d)} loading={!s} /></Grid>
      <Grid item xs={6} md={3}><KpiTile label='Awaiting review' value={formatInt(s?.pendingReview)} hint={s?.oldestPendingAt ? `oldest waiting ${timeAgo(s.oldestPendingAt)}` : 'queue is empty'} loading={!s} href='/apps/trainer-verifications' tone={s?.pendingReview > 5 ? 'danger' : undefined} /></Grid>
      <Grid item xs={12}>
        <ChartCard title='How quickly new coaches get their first booking' subtitle='Coaches who joined in the last 90 days' loading={supply.isLoading} error={supply.error}>
          {s ? (
            <Typography sx={{ fontSize: 14 }}>
              {s.newCoachesTotal === 0
                ? 'No coaches joined in the last 90 days.'
                : s.medianDaysToFirstBooking === null
                  ? `None of the ${formatInt(s.newCoachesTotal)} new coaches has a booking yet.`
                  : `${formatInt(s.newCoachesBooked)} of ${formatInt(s.newCoachesTotal)} new coaches have been booked. The typical one waited ${s.medianDaysToFirstBooking === 0 ? 'under a day' : `${s.medianDaysToFirstBooking} days`}.`}
            </Typography>
          ) : null}
        </ChartCard>
      </Grid>
    </Grid>
  )
}

export default function GrowthPage() {
  const router = useRouter()
  const tab = pick(router.query.tab, ['overview', 'cohorts', 'coaches'], 'overview')
  const days = Number(pick(String(one(router.query.days) ?? ''), ['7', '30', '90'], '30'))
  const kind = pick(router.query.granularity, ['week', 'month'], 'week')
  const role = pick(router.query.role, ['Trainee', 'Trainer'], 'Trainee')
  const metric = pick(router.query.metric, ['retention', 'revenue'], 'retention')

  const set = patch => router.replace({ pathname: router.pathname, query: { ...router.query, ...patch } }, undefined, { shallow: true })

  const controls =
    tab === 'cohorts' ? (
      <>
        <Toggle label='Group by' value={kind} onChange={v => set({ granularity: v })} options={[{ value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }]} />
        <Toggle label='Who' value={role} onChange={v => set({ role: v })} options={[{ value: 'Trainee', label: 'Trainees' }, { value: 'Trainer', label: 'Coaches' }]} />
        <Toggle label='Measure' value={metric} onChange={v => set({ metric: v })} options={[{ value: 'retention', label: 'Retention' }, { value: 'revenue', label: 'Revenue' }]} />
      </>
    ) : tab === 'overview' ? (
      <Toggle label='Time range' value={days} onChange={v => set({ days: v })} options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} />
    ) : null

  return (
    <AdminPageShell
      title='Growth'
      subtitle='Who is joining, who is booking, and who is coming back. Numbers refresh every 10 minutes.'
      actions={controls}
    >
      <AdminTabs value={tab} onChange={v => set({ tab: v === 'overview' ? undefined : v })} tabs={TABS} />
      <ApexChartWrapper>
        {tab === 'overview' ? <Overview days={days} /> : tab === 'cohorts' ? <Cohorts kind={kind} role={role} metric={metric} /> : <Coaches />}
      </ApexChartWrapper>
    </AdminPageShell>
  )
}
