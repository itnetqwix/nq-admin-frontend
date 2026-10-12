import { useContext, useMemo } from 'react'
import NextLink from 'next/link'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AreaTrend from 'src/components/admin/charts/AreaTrend'
import ChartCard from 'src/components/admin/charts/ChartCard'
import HealthLight from 'src/components/admin/HealthLight'
import StatusPill from 'src/components/admin/StatusPill'
import { apiTrend } from 'src/features/command-center/chartData'
import { apiLevel } from 'src/features/command-center/StatusStrip'
import { rankIssues } from 'src/features/sentry/describeIssue'
import SentryIssueList from 'src/features/sentry/SentryIssueList'
import { IMPACT_LABELS } from 'src/features/sentry/describeIssue'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { getApiHealth, getSentryStats, getSystemHealth } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { formatDuration, formatInt, formatPct, timeAgo } from 'src/utils/format'
import { cronView, OVERALL, queueLabel, queueView, webhookView, workerView } from './healthView'

const Th = ({ children, align }) => (
  <TableCell align={align} sx={{ fontFamily: ops.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: ops.mute }}>
    {children}
  </TableCell>
)

const Panel = ({ title, subtitle, actions, children, ...rest }) => (
  <ChartCard title={title} subtitle={subtitle} actions={actions} {...rest}>
    {children}
  </ChartCard>
)

export default function SystemHealthPage() {
  const { socketConnected } = useAdminRealtime()
  const ability = useContext(AbilityContext)
  const canSeeErrors = ability?.can('read', 'admin-nav-ops-logs') ?? true

  const health = useQuery({
    queryKey: queryKeys.systemHealth,
    queryFn: getSystemHealth,
    placeholderData: keepPreviousData,
    refetchInterval: 20_000
  })
  const api = useQuery({ queryKey: queryKeys.apiHealth(24), queryFn: () => getApiHealth(24), refetchInterval: 60_000 })
  const sentry = useQuery({
    queryKey: queryKeys.sentryStats('24h'),
    queryFn: () => getSentryStats('24h'),
    enabled: canSeeErrors,
    retry: false,
    refetchInterval: 120_000
  })

  const d = health.data
  const overall = OVERALL[d?.overall?.level] || OVERALL.unknown
  const trend = useMemo(() => apiTrend(api.data?.buckets), [api.data])
  const issues = useMemo(() => rankIssues(sentry.data?.topIssues), [sentry.data])
  const failedTotal = d?.queues?.items?.reduce((n, q) => n + q.failed, 0) ?? 0

  return (
    <AdminPageShell
      title='System health'
      subtitle='Is the platform itself working: database, cache, background jobs, scheduled tasks, payments webhooks and errors.'
      actions={
        <>
          <StatusPill tone={socketConnected ? 'live' : 'warning'} pulse={socketConnected} size='sm'>
            {socketConnected ? 'Live' : 'Polling'}
          </StatusPill>
          <AdminRefreshButton onClick={() => { health.refetch(); api.refetch() }} loading={health.isFetching} />
        </>
      }
    >
      {health.isError && !d ? (
        <AdminEmptyState title='Couldn’t load system health' description={health.error?.message} actionLabel='Try again' onAction={() => health.refetch()} />
      ) : (
        <ApexChartWrapper>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: ops.radiusLg,
                  border: `1px solid ${ops[`${overall.tone === 'neutral' ? 'neutral' : overall.tone}Border`]}`,
                  bgcolor: ops[`${overall.tone}Bg`],
                  color: ops[`${overall.tone}Fg`]
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: 16, color: 'inherit' }}>{overall.title}</Typography>
                {d?.overall?.reasons?.length ? (
                  <Box component='ul' sx={{ m: 0, mt: 0.5, pl: 2.5, fontSize: 13 }}>
                    {d.overall.reasons.map(r => (
                      <li key={r}>{r}</li>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 13, color: 'inherit', opacity: 0.85 }}>
                    {d ? `Checked ${timeAgo(d.generatedAt)}` : 'Checking…'}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={6} md={3}>
              <HealthLight label='Database' level={d ? (d.mongo.ok ? 'ok' : 'down') : 'unknown'} detail={d?.mongo.ok ? 'MongoDB connected' : 'Not connected'} />
            </Grid>
            <Grid item xs={6} md={3}>
              <HealthLight
                label='Cache & queues'
                level={d ? (d.redis.enabled ? (d.redis.ok ? 'ok' : 'down') : 'unknown') : 'unknown'}
                detail={d ? (d.redis.enabled ? (d.redis.ok ? `Redis ${d.redis.latencyMs ?? '?'} ms` : 'Not responding') : 'Disabled in this environment') : ''}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <HealthLight
                label='API (24h)'
                level={apiLevel(api.data?.summary?.errorRate)}
                detail={api.data?.summary?.errorRate == null ? 'No traffic recorded' : `${formatPct(api.data.summary.errorRate, 2)} errors · ${api.data.summary.avgMs ?? '—'} ms avg`}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <HealthLight
                label='Stripe webhooks'
                level={d ? (webhookView(d.webhooks).tone === 'success' ? 'ok' : webhookView(d.webhooks).tone === 'danger' ? 'down' : 'degraded') : 'unknown'}
                detail={d ? `${webhookView(d.webhooks).label}${d.webhooks.lastReceivedAt ? ` · last ${timeAgo(d.webhooks.lastReceivedAt)}` : ''}` : ''}
              />
            </Grid>

            <Grid item xs={12} lg={7}>
              <Panel
                title='Background job queues'
                subtitle={failedTotal ? `${formatInt(failedTotal)} failed jobs waiting for a retry` : 'Work waiting to be processed'}
                actions={
                  <Box component={NextLink} href='/apps/ops?tab=jobs' sx={{ fontSize: 12, color: ops.link, whiteSpace: 'nowrap' }}>
                    Failed jobs →
                  </Box>
                }
              >
                {d && !d.queues.available ? (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Queues are off in this environment (Redis disabled).</Typography>
                ) : (
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <Th>Queue</Th>
                        <Th align='right'>Waiting</Th>
                        <Th align='right'>Active</Th>
                        <Th align='right'>Delayed</Th>
                        <Th>Status</Th>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(d?.queues.items || []).map(q => {
                        const v = queueView(q)
                        return (
                          <TableRow key={q.name}>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{queueLabel(q.name)}</TableCell>
                            <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatInt(q.waiting)}</TableCell>
                            <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatInt(q.active)}</TableCell>
                            <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatInt(q.delayed)}</TableCell>
                            <TableCell><StatusPill tone={v.tone} size='sm'>{v.label}</StatusPill></TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </Panel>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Panel title='Running processes' subtitle='Each server process reports every 15 seconds'>
                {d?.workers?.length ? (
                  <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
                    {d.workers.map(w => {
                      const v = workerView(w)
                      return (
                        <li key={w.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StatusPill tone={v.tone} size='sm'>{v.label}</StatusPill>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{w.role} <Box component='span' sx={{ fontWeight: 400, color: ops.mute }}>· pid {w.pid}</Box></Typography>
                              <Typography sx={{ fontSize: 11, color: ops.mute }} noWrap title={w.host}>{w.host} · up {formatDuration((Date.now() - Date.parse(w.startedAt)) / 1000)}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 11, color: ops.mute }}>{w.ageSec}s ago</Typography>
                          </Box>
                        </li>
                      )
                    })}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No process has reported in. If this server just started, give it 15 seconds.</Typography>
                )}
              </Panel>
            </Grid>

            <Grid item xs={12}>
              <Panel title='Scheduled tasks' subtitle='Jobs that run on a timer (payouts, reminders, cleanup). “Overdue” means it has missed 2½ runs.'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <Th>Task</Th>
                      <Th>Schedule</Th>
                      <Th>Last run</Th>
                      <Th align='right'>Took</Th>
                      <Th>Status</Th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(d?.crons || []).map(c => {
                      const v = cronView(c)
                      return (
                        <TableRow key={c.name}>
                          <TableCell sx={{ fontFamily: ops.mono, fontSize: 12 }}>{c.name}</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{c.expectedIntervalSec ? `every ${formatDuration(c.expectedIntervalSec)}` : c.pattern}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{c.lastRunAt ? timeAgo(c.lastRunAt) : '—'}</TableCell>
                          <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{c.lastDurationMs != null ? `${formatInt(c.lastDurationMs)} ms` : '—'}</TableCell>
                          <TableCell>
                            <StatusPill tone={v.tone} size='sm'>{v.label}</StatusPill>
                            {v.note ? <Typography component='span' sx={{ ml: 1, fontSize: 11, color: ops.mute }}>{v.note}</Typography> : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Panel>
            </Grid>

            <Grid item xs={12} lg={6}>
              <ChartCard title='API error rate' subtitle='5xx share of requests, hourly (estimated from sampled logs)' empty={!trend.categories.length} loading={api.isLoading}>
                <AreaTrend series={trend.errorRate} categories={trend.categories} format='pct' height={220} />
              </ChartCard>
            </Grid>
            <Grid item xs={12} lg={6}>
              <ChartCard title='API latency' subtitle='Average response time, hourly' empty={!trend.categories.length} loading={api.isLoading}>
                <AreaTrend series={trend.latency} categories={trend.categories} format='ms' height={220} />
              </ChartCard>
            </Grid>

            {canSeeErrors ? (
              <>
                <Grid item xs={12} md={4}>
                  <Panel title='Errors by area' subtitle='Unresolved issues, last 24h'>
                    {sentry.data ? (
                      <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75 }}>
                        {Object.entries(sentry.data.byImpact).length ? (
                          Object.entries(sentry.data.byImpact)
                            .sort((a, b) => b[1] - a[1])
                            .map(([impact, n]) => (
                              <li key={impact}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: 13 }}>{IMPACT_LABELS[impact] || impact}</Typography>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{n}</Typography>
                                </Box>
                              </li>
                            ))
                        ) : (
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No unresolved errors.</Typography>
                        )}
                        {sentry.data.errors?.length ? (
                          <Typography sx={{ fontSize: 11, color: ops.warningFg, mt: 1 }}>
                            Couldn’t read: {sentry.data.errors.map(e => e.project).join(', ')}
                          </Typography>
                        ) : null}
                      </Box>
                    ) : (
                      <SentryIssueList issues={[]} loading={sentry.isLoading} error={sentry.error} />
                    )}
                  </Panel>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Panel title='Top errors' subtitle='Ranked by people affected. Opens in Sentry.'>
                    <SentryIssueList issues={issues} loading={sentry.isLoading} error={sentry.error} max={8} />
                  </Panel>
                </Grid>
              </>
            ) : null}
          </Grid>
        </ApexChartWrapper>
      )}
    </AdminPageShell>
  )
}
