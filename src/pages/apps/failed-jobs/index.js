import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'
import { listFailedJobs, retryFailedJob } from 'src/services/adminOpsApi'

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

export default function FailedJobsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [available, setAvailable] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [retrying, setRetrying] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listFailedJobs(Math.max(pageSize, 50))
      setAvailable(data.available)
      let list = data.rows
      const s = search.trim().toLowerCase()
      if (s) {
        list = list.filter(
          r =>
            r.queue?.toLowerCase().includes(s) ||
            r.name?.toLowerCase().includes(s) ||
            r.failedReason?.toLowerCase().includes(s) ||
            String(r.jobId).includes(s)
        )
      }
      setTotal(list.length)
      const start = page * pageSize
      setRows(list.slice(start, start + pageSize).map(r => ({ ...r, why: whyFailed(r.queue, r.failedReason) })))
    } catch (e) {
      setError(e?.message || 'Failed to load jobs')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    void load()
  }, [load])

  const onRetry = async row => {
    const key = `${row.queue}:${row.jobId}`
    setRetrying(key)
    try {
      await retryFailedJob(row.queue, row.jobId)
      toast.success(`Retried ${row.name || row.jobId}`)
      await load()
    } catch (e) {
      toast.error(e?.message || 'Retry failed')
    } finally {
      setRetrying(null)
    }
  }

  const columns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '—')
    },
    { field: 'queue', headerName: 'Queue', width: 180 },
    { field: 'name', headerName: 'Job', width: 140 },
    { field: 'jobId', headerName: 'Job ID', width: 140 },
    { field: 'attemptsMade', headerName: 'Tries', width: 70 },
    { field: 'why', headerName: 'Why (ops)', flex: 1, minWidth: 240 },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      renderCell: params => (
        <Button
          size='small'
          variant='outlined'
          disabled={retrying === `${params.row.queue}:${params.row.jobId}`}
          onClick={() => void onRetry(params.row)}
        >
          Retry
        </Button>
      )
    }
  ]

  return (
    <AdminPageShell
      title='Failed jobs'
      subtitle='BullMQ failures (PDF stitch, reminders, exports). Retry without SSH.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center'>
          <Chip
            size='small'
            label={available ? 'Redis/BullMQ up' : 'Queue unavailable'}
            color={available ? 'success' : 'warning'}
          />
          <Button variant='outlined' onClick={() => void load()}>
            Refresh
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        {!available ? (
          <Typography variant='body2' color='warning.main' sx={{ mb: 2 }}>
            BullMQ/Redis not available — jobs list empty. Fix Redis before retrying.
          </Typography>
        ) : null}
        <AdminDataTable
          rows={rows}
          columns={columns}
          loading={loading}
          error={error}
          total={total}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={m => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          search={search}
          onSearchChange={v => {
            setPage(0)
            setSearch(v)
          }}
          searchLabel='Filter queue / job / reason'
          onRetry={() => void load()}
          emptyMessage='No failed jobs'
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant='caption' color='text.secondary'>
            Queues: booking reminder, game-plan PDF, notify, data export, extension expiry, instant deadline.
          </Typography>
        </Box>
      </AdminPageSection>
    </AdminPageShell>
  )
}
