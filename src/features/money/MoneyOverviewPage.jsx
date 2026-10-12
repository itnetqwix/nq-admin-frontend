import { useMemo } from 'react'
import NextLink from 'next/link'
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
import AreaTrend from 'src/components/admin/charts/AreaTrend'
import ChartCard from 'src/components/admin/charts/ChartCard'
import EntityLink from 'src/components/admin/EntityLink'
import KpiTile from 'src/components/admin/KpiTile'
import Money from 'src/components/admin/Money'
import { shortDay } from 'src/features/command-center/chartData'
import { getConnectGaps, getFinanceOverview } from 'src/services/moneyApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { formatInt } from 'src/utils/format'
import { financeLink } from './financeLinks'
import { liabilityRows, moneyTrend, overviewTiles, revenueRows } from './moneyView'

const WINDOWS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' }
]
export const resolveMoneyDays = raw => {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return [7, 30, 90].includes(n) ? n : 30
}

const Row = ({ label, hint, value, strong }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, py: 0.75 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, fontWeight: strong ? 600 : 500 }}>{label}</Typography>
      {hint ? <Typography sx={{ fontSize: 11, color: ops.mute }}>{hint}</Typography> : null}
    </Box>
    <Typography sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Typography>
  </Box>
)

export default function MoneyOverviewPage() {
  const router = useRouter()
  const days = resolveMoneyDays(router.query.days)

  const overview = useQuery({
    queryKey: ['money', 'overview', days],
    queryFn: () => getFinanceOverview(days),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000
  })
  const gaps = useQuery({ queryKey: ['money', 'connect-gaps'], queryFn: getConnectGaps, refetchInterval: 5 * 60_000, retry: false })

  const o = overview.data
  const tiles = useMemo(() => overviewTiles(o), [o])
  const trend = useMemo(() => moneyTrend(o?.daily), [o])
  const categories = useMemo(() => trend.categories.map(shortDay), [trend])
  const sources = useMemo(() => revenueRows(o?.revenue), [o])
  const liability = useMemo(() => liabilityRows(o?.walletLiability), [o])

  const actions = (
    <>
      <ToggleButtonGroup
        size='small'
        exclusive
        value={days}
        onChange={(_, v) => v && router.replace({ pathname: router.pathname, query: { ...router.query, days: v } }, undefined, { shallow: true })}
        aria-label='Time range'
      >
        {WINDOWS.map(w => (
          <ToggleButton key={w.value} value={w.value} sx={{ px: 1.5, textTransform: 'none' }}>
            {w.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <AdminRefreshButton onClick={() => overview.refetch()} loading={overview.isFetching} />
    </>
  )

  if (overview.isError && !o) {
    return (
      <AdminPageShell title='Money' subtitle='Revenue, what is held, what is owed and what is at risk.' actions={actions}>
        <AdminEmptyState
          title='Couldn’t load the money overview'
          description={`${overview.error?.message || 'Something went wrong.'}${overview.error?.requestId ? ` (request ${overview.error.requestId})` : ''}`}
          actionLabel='Try again'
          onAction={() => overview.refetch()}
        />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell title='Money' subtitle='Revenue, what is held, what is owed to people, and what is at risk.' actions={actions}>
      <ApexChartWrapper>
        <Grid container spacing={2.5}>
          {(tiles.length ? tiles : Array.from({ length: 8 }, (_, i) => ({ key: i, label: ' ', value: ' ' }))).map(t => (
            <Grid item xs={6} md={4} xl={3} key={t.key}>
              <KpiTile label={t.label} value={t.value} hint={t.hint} href={t.href} tone={t.tone} loading={!o} />
            </Grid>
          ))}

          <Grid item xs={12} lg={6}>
            <ChartCard title='Gross booking value' subtitle='Per day, excluding cancelled' loading={!o} empty={o && !categories.length}>
              <AreaTrend series={trend.gmv} categories={categories} format='money' height={240} />
            </ChartCard>
          </Grid>
          <Grid item xs={12} lg={6}>
            <ChartCard title='Platform revenue' subtitle='Commission and fees on completed lessons' loading={!o} empty={o && !categories.length}>
              <AreaTrend series={trend.revenue} categories={categories} format='money' height={240} />
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <ChartCard title='Where revenue comes from' subtitle={o ? `${days}-day total ` : undefined} loading={!o}>
              {o ? (
                <>
                  <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 32, fontWeight: 600, lineHeight: 1, mb: 1.5 }}>
                    <Money minor={o.revenue.totalMinor} />
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {sources.map(r => (
                      <Box key={r.key}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography sx={{ fontSize: 12.5 }}>{r.label}</Typography>
                          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                            {r.value} · {r.share}
                          </Typography>
                        </Box>
                        <Box sx={{ height: 7, borderRadius: 4, bgcolor: ops.canvasSoft2 }}>
                          <Box sx={{ height: '100%', width: `${r.widthPct}%`, borderRadius: 4, bgcolor: ops.accent }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : null}
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <ChartCard title='Owed to people' subtitle='Cached wallet balances' loading={!o}>
              {o ? (
                <>
                  <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 32, fontWeight: 600, lineHeight: 1, mb: 1 }}>
                    <Money minor={o.walletLiability.totalMinor} />
                  </Typography>
                  {liability.map(r => (
                    <Row key={r.key} label={r.label} hint={r.hint} value={r.value} />
                  ))}
                  <Box sx={{ mt: 1, textAlign: 'right' }}>
                    <Box component={NextLink} href={financeLink({ tab: 'overview' })} sx={{ fontSize: 12, color: ops.link }}>
                      Reconcile in Finance →
                    </Box>
                  </Box>
                </>
              ) : null}
            </ChartCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <ChartCard title='Top coaches by earnings' subtitle={`Paid out in the last ${days} days`} loading={!o} empty={o && !o.topCoaches.length} emptyText='No released earnings in this period'>
              {o?.topCoaches?.length ? (
                <Box component='ol' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
                  {o.topCoaches.map((c, i) => (
                    <li key={c.id}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
                        <Typography sx={{ width: 18, fontSize: 12, color: ops.mute }}>{i + 1}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                          <EntityLink type='user' id={c.id}>{c.name}</EntityLink>
                          <Typography component='span' sx={{ ml: 1, fontSize: 11, color: ops.mute }}>{formatInt(c.lessons)} lessons</Typography>
                        </Box>
                        <Money minor={c.earnedMinor} sx={{ fontSize: 13, fontWeight: 600 }} />
                      </Box>
                    </li>
                  ))}
                </Box>
              ) : null}
            </ChartCard>
          </Grid>

          <Grid item xs={12}>
            <ChartCard
              title='Coaches who can’t be paid yet'
              subtitle='Owed money but no payout account connected'
              loading={gaps.isLoading}
              error={gaps.isError ? gaps.error : null}
            >
              {gaps.data ? (
                gaps.data.owedWithoutAccount.coaches === 0 ? (
                  <Typography sx={{ fontSize: 13, color: ops.successFg }}>
                    Every coach who is owed money has a payout account. {formatInt(gaps.data.withPayoutAccount)} of {formatInt(gaps.data.approvedCoaches)} approved coaches are connected.
                  </Typography>
                ) : (
                  <Box>
                    <Typography sx={{ fontSize: 13, mb: 1.25 }}>
                      <strong>{formatInt(gaps.data.owedWithoutAccount.coaches)}</strong> coaches are owed <Money minor={gaps.data.owedWithoutAccount.owedMinor} sx={{ fontWeight: 700 }} /> but can’t withdraw until they connect a payout account.
                      {' '}({formatInt(gaps.data.withPayoutAccount)} of {formatInt(gaps.data.approvedCoaches)} approved coaches are connected.)
                    </Typography>
                    <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
                      {gaps.data.owedWithoutAccount.top.map(c => (
                        <li key={c.userId}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <EntityLink type='user' id={c.userId}>{c.name}</EntityLink>
                            <Money minor={c.owedMinor} sx={{ fontWeight: 600 }} />
                          </Box>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )
              ) : null}
            </ChartCard>
          </Grid>
        </Grid>
      </ApexChartWrapper>
    </AdminPageShell>
  )
}
