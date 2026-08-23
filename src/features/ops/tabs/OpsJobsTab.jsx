import { Button, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'
import { retryFailedJob } from 'src/services/adminOpsApi'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import {
  fetchFailedJobsList,
  selectFailedJobs,
  setFailedJobsPage,
  setFailedJobsSearch
} from 'src/store/slices/opsSlice'

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

export default function OpsJobsTab({ hub = false }) {
  const dispatch = useAppDispatch()
  const jobs = useAppSelector(selectFailedJobs)
  const [retrying, setRetrying] = useState(null)
  const page = Math.max(0, jobs.page - 1)
  const pageSize = jobs.limit

  const load = useCallback(() => {
    void dispatch(fetchFailedJobsList({ page: page + 1, limit: pageSize, search: jobs.search }))
  }, [dispatch, page, pageSize, jobs.search])

  useEffect(() => {
    void load()
  }, [load])

  const onRetry = async row => {
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

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'queue', headerName: 'Queue', width: 180 },
    { field: 'name', headerName: 'Job', flex: 1, minWidth: 140 },
    { field: 'why', headerName: 'Why', flex: 1, minWidth: 200 },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: params => (
        <Button
          size='small'
          disabled={retrying === `${params.row.queue}:${params.row.jobId}`}
          onClick={() => void onRetry(params.row)}
        >
          Retry
        </Button>
      )
    }
  ]

  const body = (
    <>
      {!jobs.available ? (
        <Typography color='text.secondary' sx={{ mb: 2 }}>
          BullMQ is disabled in this environment — no failed jobs to show.
        </Typography>
      ) : null}
      <AdminDataTable
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
        searchLabel='Search queue, job id, reason…'
        onRetry={() => void load()}
        emptyMessage='No failed jobs'
      />
    </>
  )

  if (hub) return body

  return (
    <AdminPageShell title='Failed jobs' subtitle='BullMQ dead-letter visibility.'>
      <AdminPageSection>{body}</AdminPageSection>
    </AdminPageShell>
  )
}
