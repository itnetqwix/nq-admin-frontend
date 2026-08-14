import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops, categoryChipSx } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'

export default function OverviewTab({ summary, jumpTo, router, setDetail }) {
  const kpis = summary?.kpis || {}
  return (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {[
              ['Logins (24h)', kpis.logins, () => jumpTo('login', { action: 'login' }), null],
              ['Failed logins', kpis.failed_logins, () => jumpTo('security', { action: 'login_failed' }), 'danger'],
              ['API hits', kpis.api_hits, () => jumpTo('api'), null],
              ['API errors', kpis.api_errors, () => jumpTo('api', { minStatus: '400' }), 'warn'],
              ['Error rate %', kpis.error_rate, () => jumpTo('api', { minStatus: '400' }), null],
              ['Open ops', kpis.open_ops, () => router.push('/apps/ops-logs'), null],
              ['Uploads', kpis.uploads, () => jumpTo('files'), null]
            ].map(([label, value, onClick, tone]) => (
              <Grid item xs={6} sm={4} md={3} lg={true} key={label}>
                <OpsMetricTile label={label} value={value ?? '—'} tone={tone || undefined} onClick={onClick} />
              </Grid>
            ))}
          </Grid>

          <AdminPageSection title='Quick actions' subtitle='Deep explorers and settings.'>
            <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1}>
              {(summary?.quick_actions || []).map(a => (
                <Button
                  key={a.href}
                  component={Link}
                  href={a.href}
                  variant='outlined'
                  size='small'
                  sx={{ textTransform: 'none', borderColor: ops.hairline, color: ops.ink }}
                >
                  {a.label}
                </Button>
              ))}
            </Stack>
          </AdminPageSection>

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Failed logins (24h)</Typography>
                <Stack spacing={1.25}>
                  {(summary?.failed_logins || []).length ? (
                    summary.failed_logins.map(row => (
                      <Box
                        key={row.id}
                        onClick={() => setDetail(row)}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: ops.error }}>
                          {String(row.action || '').replace(/_/g, ' ')}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {formatOpsDateTime(row.at, { withSeconds: false })} · {row.actor?.label || '—'} ·{' '}
                          {row.ip || 'no ip'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No failed logins in window</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={7}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Top API paths (24h)</Typography>
                <Stack spacing={1}>
                  {(summary?.top_api_paths || []).length ? (
                    summary.top_api_paths.map(p => (
                      <Stack
                        key={p.path}
                        direction='row'
                        justifyContent='space-between'
                        alignItems='center'
                        spacing={1}
                        onClick={() => jumpTo('api', { path: p.path })}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 0.75,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Typography
                          sx={{ fontFamily: ops.mono, fontSize: 12, flex: 1, minWidth: 0 }}
                          noWrap
                          title={p.path}
                        >
                          {p.path}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {p.hits} hits · {p.errors} err · ~{p.avg_ms}ms
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No API traffic in window</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={7}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent activity</Typography>
                <Stack spacing={1.25}>
                  {(summary?.recent_activity || []).length ? (
                    summary.recent_activity.map(row => (
                      <Box
                        key={row.id}
                        onClick={() => setDetail(row)}
                        sx={{
                          borderBottom: `1px solid ${ops.hairline}`,
                          pb: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Stack direction='row' spacing={1} alignItems='center'>
                          {row.category ? (
                            <Chip size='small' label={row.category} sx={categoryChipSx(row.category)} />
                          ) : null}
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.title}</Typography>
                        </Stack>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {formatOpsDateTime(row.at, { withSeconds: false })} · {row.actor?.label || '—'}
                          {row.ip ? ` · ${row.ip}` : ''}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No recent events</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <OpsSurfaceCard>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Recent errors</Typography>
                <Stack spacing={1.25}>
                  {(summary?.recent_errors || []).length ? (
                    summary.recent_errors.map((row, i) => (
                      <Box key={row._id || i} sx={{ borderBottom: `1px solid ${ops.hairline}`, pb: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                          {row.title || row.event_type || 'Ops event'}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {row.severity || row.category || '—'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color='text.secondary'>No recent errors</Typography>
                  )}
                </Stack>
              </OpsSurfaceCard>
            </Grid>
          </Grid>
        </Stack>
      ) : (
  )
}
