import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminSubTabs from 'src/components/admin/AdminSubTabs'
import StatusPill from 'src/components/admin/StatusPill'
import { useAdminConfirm } from 'src/components/admin'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'
import { listFailedJobs, retryFailedJob } from 'src/services/adminOpsApi'
import { queryKeys } from 'src/services/queryKeys'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  fetchFailedJobsList,
  selectFailedJobs,
  setFailedJobsPage,
  setFailedJobsQueue,
  setFailedJobsSearch
} from 'src/store/slices/opsSlice'
import { groupFailedJobs } from 'src/features/ops/failedJobsView'
import { ops } from 'src/styles/opsSurface'
import { timeAgo } from 'src/utils/format'

function whyFailed(queue, reason) {
  const q = String(queue || '')
  const r = String(reason || '')
  if (q.includes('pdf') || q.includes('game-plan')) {
    return `PDF/game-plan worker failed: ${r}. Check template assets + S3; retry after fix.`
  }
  if (q.includes('reminder') || q.includes('booking')) {
    return `Booking reminder failed: ${r}. Check push/email credentials; retry once.`
  }
  if (q.includes('export')) {
    return `Data export failed: ${r}. Check export size limits + storage.`
  }
  return r || 'Unknown failure'
}

function GroupedFailures({ queue, onPick }) {
  const q = useQuery({
    queryKey: [...queryKeys.failedJobsGrouped, queue],
    queryFn: () => listFailedJobs({ page: 1, limit: 100, queue }),
    retry: false
  })
  const groups = useMemo(() => groupFailedJobs(q.data?.rows || []), [q.data])

  if (q.isLoading) return <Typography color='text.secondary'>Grouping failures…</Typography>
  if (q.isError) return <Typography color='error'>{q.error?.message || 'Could not load failures.'}</Typography>
  if (!groups.length) return <Typography color='text.secondary'>No failed jobs.</Typography>
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Newest 100 failures grouped by queue and error type{q.data?.truncated ? ' (more exist than were scanned)' : ''}.
        Click a group to see its jobs.
      </Typography>
      {groups.map(g => (
        <Box
          key={g.key}
          role='button'
          tabIndex={0}
          onClick={() => onPick(g)}
          onKeyDown={e => (e.key === 'Enter' ? onPick(g) : null)}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            gap: 1,
            p: 1.5,
            borderRadius: ops.radiusMd,
            border: `1px solid ${ops.hairline}`,
            cursor: 'pointer',
            '&:hover': { bgcolor: ops.canvasSoft }
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontWeight: 600, color: ops.error }}>
              {g.errorType}
            </Typography>
            <Typography sx={{ fontSize: 13, wordBreak: 'break-word' }}>
              {String(g.reason || '').split('\n')[0]}
            </Typography>
            <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.25 }}>
              {g.queue} · first {g.firstSeen ? timeAgo(g.firstSeen) : '—'} · last{' '}
              {g.lastSeen ? timeAgo(g.lastSeen) : '—'}
            </Typography>
          </Box>
          <Box sx={{ alignSelf: 'center' }}>
            <StatusPill tone={g.count >= 10 ? 'danger' : 'warning'}>{g.count} failed</StatusPill>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default function OpsJobsTab({ hub = false }) {
  const dispatch = useAppDispatch()
  const jobs = useAppSelector(selectFailedJobs)
  const { open } = useEntityDrawer()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [view, setView] = useState('jobs')
  const [retrying, setRetrying] = useState(null)
  const page = Math.max(0, jobs.page - 1)
  const pageSize = jobs.limit

  const load = useCallback(() => {
    void dispatch(fetchFailedJobsList({ page: page + 1, limit: pageSize, search: jobs.search, queue: jobs.queue }))
  }, [dispatch, page, pageSize, jobs.search, jobs.queue])

  useEffect(() => {
    void load()
  }, [load])

  const onRetry = async row => {
    const res = await confirm({
      title: 'Retry this job?',
      message: `${row.name || row.jobId} runs again now. Fix the root cause first or it will fail the same way.`,
      confirmLabel: 'Retry'
    })
    if (!res?.confirmed) return
    const key = `${row.queue}:${row.jobId}`
    setRetrying(key)
    try {
      await retryFailedJob(row.queue, row.jobId)
      toast.success(`Retried ${row.name || row.jobId}`)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Retry failed')
    } finally {
      setRetrying(null)
    }
  }

  const rows = jobs.items.map(r => ({ ...r, why: whyFailed(r.queue, r.failedReason) }))
  const openJob = row => open('job', `${row.queue}:${row.jobId}`)

  const columns = [
    {
      field: 'failedAt',
      headerName: 'Failed',
      width: 160,
      valueGetter: (value, row) => row?.failedAt || row?.at || null,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'queue', headerName: 'Queue', width: 190 },
    { field: 'name', headerName: 'Job', width: 160 },
    {
      field: 'errorType',
      headerName: 'Error',
      width: 180,
      renderCell: p => <Box sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.error }}>{p.value}</Box>
    },
    { field: 'why', headerName: 'Why', flex: 1, minWidth: 220 },
    {
      field: 'attemptsMade',
      headerName: 'Tries',
      width: 80,
      valueGetter: (value, row) =>
        row?.maxAttempts ? `${row.attemptsMade}/${row.maxAttempts}` : String(row?.attemptsMade ?? '')
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: params => (
        <Button
          size='small'
          disabled={retrying === `${params.row.queue}:${params.row.jobId}`}
          onClick={e => {
            e.stopPropagation()
            void onRetry(params.row)
          }}
        >
          Retry
        </Button>
      )
    }
  ]

  const queueFilter = (
    <TextField
      select
      size='small'
      label='Queue'
      value={jobs.queue || ''}
      onChange={e => dispatch(setFailedJobsQueue(e.target.value))}
      sx={{ minWidth: 220 }}
    >
      <MenuItem value=''>All queues</MenuItem>
      {(jobs.queues || []).map(name => (
        <MenuItem key={name} value={name}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  )

  const pickGroup = g => {
    dispatch(setFailedJobsQueue(g.queue))
    dispatch(setFailedJobsSearch(g.errorType))
    setView('jobs')
  }

  const body = (
    <>
      {!jobs.available ? (
        <Typography color='text.secondary' sx={{ mb: 2 }}>
          BullMQ is disabled in this environment — no failed jobs to show.
        </Typography>
      ) : null}
      <AdminSubTabs
        value={view}
        onChange={setView}
        tabs={[
          { value: 'jobs', label: 'All jobs' },
          { value: 'grouped', label: 'Grouped by error' }
        ]}
      />
      {jobs.truncated ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
          Some queues have more failed jobs than were fetched, so totals are a lower bound.
        </Typography>
      ) : null}
      {view === 'grouped' ? (
        <GroupedFailures queue={jobs.queue} onPick={pickGroup} />
      ) : (
        <AdminDataTable
          onRowClick={openJob}
          extraFilters={queueFilter}
          rows={rows}
          columns={columns}
          loading={jobs.loading}
          error={jobs.error}
          total={jobs.total}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={m => {
            dispatch(setFailedJobsPage({ page: m.page + 1, limit: m.pageSize }))
          }}
          search={jobs.search}
          onSearchChange={v => dispatch(setFailedJobsSearch(v))}
          searchLabel='Search queue, job id, reason, payload…'
          onRetry={() => void load()}
          emptyMessage='No failed jobs'
        />
      )}
      {ConfirmDialog}
    </>
  )

  if (hub) return body

  return (
    <AdminPageShell title='Failed jobs' subtitle='BullMQ dead-letter visibility.'>
      <AdminPageSection>{body}</AdminPageSection>
    </AdminPageShell>
  )
}
