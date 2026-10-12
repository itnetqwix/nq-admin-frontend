import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import HealthLight from 'src/components/admin/HealthLight'
import { formatPct } from 'src/utils/format'

/** API error rate -> traffic-light level. 5xx share of estimated authenticated traffic. */
export function apiLevel(errorRate) {
  if (errorRate == null) return 'unknown'
  if (errorRate >= 0.05) return 'down'
  if (errorRate >= 0.01) return 'degraded'
  return 'ok'
}

export function lessonsLevel(live) {
  const s = live?.summary
  if (!s) return 'unknown'
  if (s.late > 0 || s.withQualityIssues > 0) return 'degraded'
  return 'ok'
}

/** The four lights an admin glances at first. Each links to where the detail lives. */
export default function StatusStrip({ health, live, socketConnected }) {
  const router = useRouter()
  return (
    <Grid container spacing={1.5}>
      {health ? (
        <>
          <Grid item xs={12} sm={6} lg={3}>
            <HealthLight
              label='Platform'
              level={health.level}
              detail={health.reasons?.[0] || 'Database, cache, jobs and webhooks'}
              onClick={() => router.push('/apps/system-health')}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <HealthLight
              label='API (24h)'
              level={apiLevel(health.api?.errorRate24h)}
              detail={
                health.api?.errorRate24h == null
                  ? 'No traffic recorded'
                  : `${formatPct(health.api.errorRate24h, 2)} errors · ${health.api.avgMs24h ?? '—'} ms avg`
              }
              onClick={() => router.push('/apps/system-health')}
            />
          </Grid>
        </>
      ) : null}
      {live ? (
        <Grid item xs={12} sm={6} lg={3}>
          <HealthLight
            label='Lessons'
            level={lessonsLevel(live)}
            detail={`${live.summary.live} live · ${live.summary.late} late · ${live.summary.withQualityIssues} with call issues`}
            onClick={() => router.push('/apps/live-lessons')}
          />
        </Grid>
      ) : null}
      <Grid item xs={12} sm={6} lg={3}>
        <HealthLight
          label='Live updates'
          level={socketConnected ? 'ok' : 'degraded'}
          detail={socketConnected ? 'Connected — updates arrive instantly' : 'Reconnecting — refreshing every 30s'}
        />
      </Grid>
    </Grid>
  )
}
