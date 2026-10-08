import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fetchLoadTestRun, fetchLoadTestRuns } from 'src/services/loadTestApi'
import LoadTestControlPanel from './LoadTestControlPanel'

const STATUS_COLOR = { passed: 'success', failed: 'error', aborted: 'warning' }

function Tile({ label, value }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h6'>{value}</Typography>
    </Box>
  )
}

function RunDetail({ run }) {
  const rows = useMemo(
    () =>
      (run.stages || []).map(s => {
        const total = (s.httpOk || 0) + (s.httpFail || 0) + (s.http429 || 0)
        return {
          name: s.scenario ? `${s.scenario} ${s.users}` : s.name,
          users: s.users,
          p50: s.latencyMs?.p50 ?? null,
          p95: s.latencyMs?.p95 ?? null,
          p99: s.latencyMs?.p99 ?? null,
          errorPct: total ? Number(((((s.httpFail || 0) + (s.http429 || 0)) / total) * 100).toFixed(1)) : 0,
          socketFail: s.socketFail || 0,
          http429: s.http429 || 0
        }
      }),
    [run]
  )

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Tile label='Peak users' value={run.peak_users ?? 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label='Breaking point' value={run.breaking_point_users ? `${run.breaking_point_users} users` : 'none reached'} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label='Environment' value={run.environment} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label='Commit' value={run.commit_sha ? run.commit_sha.slice(0, 8) : '—'} />
        </Grid>
      </Grid>

      <Typography variant='subtitle2'>Latency by stage (ms)</Typography>
      <Box sx={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='p50' stroke='#2e7d32' dot />
            <Line type='monotone' dataKey='p95' stroke='#ed6c02' dot />
            <Line type='monotone' dataKey='p99' stroke='#d32f2f' dot />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Typography variant='subtitle2'>Errors by stage</Typography>
      <Box sx={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey='errorPct' name='HTTP error + 429 %' fill='#d32f2f' />
            <Bar dataKey='socketFail' name='Socket failures' fill='#7b1fa2' />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Typography variant='subtitle2'>Slowest endpoints (by p95)</Typography>
      {(run.stages || []).filter(s => s.endpoints?.length).length === 0 ? (
        <Typography variant='body2' color='text.secondary'>No per-endpoint data for this run.</Typography>
      ) : (
        (run.stages || [])
          .filter(s => s.endpoints?.length)
          .map(s => (
            <Box key={s.name} sx={{ mb: 1 }}>
              <Typography variant='caption' color='text.secondary'>
                {s.scenario} · {s.users} users
              </Typography>
              {s.endpoints.slice(0, 6).map(e => (
                <Typography key={e.path} variant='body2' sx={{ fontFamily: 'monospace' }}>
                  {e.path} — p50 {e.p50}ms · p95 {e.p95}ms · max {e.max}ms · {e.count} req · {e.fail} failed
                </Typography>
              ))}
            </Box>
          ))
      )}

      {(run.stages || []).some(s => s.failures && Object.keys(s.failures).length) ? (
        <>
          <Typography variant='subtitle2'>Failure signatures</Typography>
          {(run.stages || []).flatMap(s =>
            Object.entries(s.failures || {}).map(([k, n]) => (
              <Typography key={`${s.name}-${k}`} variant='body2' sx={{ fontFamily: 'monospace' }}>
                {s.scenario}: {k} × {n}
              </Typography>
            ))
          )}
        </>
      ) : null}

      <Typography variant='subtitle2'>Server CPU / memory during the run</Typography>
      {(() => {
        const samples = (run.stages || []).find(s => s.samples?.length)?.samples || []
        if (!samples.length) return <Typography variant='body2' color='text.secondary'>No samples recorded.</Typography>
        const t0 = samples[0].t
        const data = samples.map(x => ({ sec: Math.round((x.t - t0) / 1000), load: x.cpuLoad1, rssMb: x.rssMb }))
        return (
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='sec' />
                <YAxis yAxisId='l' />
                <YAxis yAxisId='r' orientation='right' />
                <Tooltip />
                <Legend />
                <Line yAxisId='l' dataKey='load' name='CPU load (1m)' stroke='#ed6c02' dot={false} />
                <Line yAxisId='r' dataKey='rssMb' name='Memory RSS (MB)' stroke='#1976d2' dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )
      })()}
    </Stack>
  )
}

export default function OpsLoadTestsTab({ refreshTick = 0 }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await fetchLoadTestRuns(50)
      setRuns(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.message || 'Could not load runs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshTick])

  const openRun = async id => {
    try {
      setSelected(await fetchLoadTestRun(id))
    } catch (e) {
      setError(e?.message || 'Could not load run')
    }
  }

  const columns = [
    {
      field: 'started_at',
      headerName: 'Started',
      width: 170,
      valueFormatter: ({ value }) => moment(value).format('DD MMM YYYY HH:mm')
    },
    { field: 'label', headerName: 'Run', flex: 1, minWidth: 200 },
    { field: 'environment', headerName: 'Env', width: 110 },
    { field: 'peak_users', headerName: 'Peak users', width: 110 },
    {
      field: 'status',
      headerName: 'Result',
      width: 110,
      renderCell: ({ value }) => <Chip size='small' label={value} color={STATUS_COLOR[value] || 'default'} />
    }
  ]

  return (
    <>
    <LoadTestControlPanel onFinished={load} />
    <AdminPageSection title='Load test runs'>
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {loading && !runs.length ? <CircularProgress size={24} /> : null}
      <Box sx={{ height: 360, mb: 3 }}>
        <DataGrid
          rows={runs}
          columns={columns}
          getRowId={r => r._id}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={p => void openRun(p.id)}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </Box>
      {selected ? (
        <>
          <Typography variant='h6' sx={{ mb: 1 }}>
            {selected.label}
          </Typography>
          <RunDetail run={selected} />
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          {runs.length ? 'Select a run to see per-stage latency and errors.' : 'No runs recorded yet.'}
        </Typography>
      )}
    </AdminPageSection>
    </>
  )
}
