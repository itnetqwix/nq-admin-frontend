import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ReplayIcon from '@mui/icons-material/Replay'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { listBroadcasts } from 'src/services/broadcastApi'
import { HISTORY_STATUS_FILTERS, STATUS_COLORS } from './constants'
import { deliverySuccessRate, formatDateTime } from './utils'

export default function BroadcastHistory({
  onView,
  onDelete,
  onResend,
  onDuplicate,
  refreshKey = 0
}) {
  const [broadcasts, setBroadcasts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const searchTimer = useRef(null)
  const pollRef = useRef(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const query = { search, page, limit: pageSize }
      if (statusFilter) query.status = statusFilter
      const data = await listBroadcasts(query)
      const list = data?.result?.broadcasts || []
      setBroadcasts(list.map(b => ({ ...b, id: b._id })))
      setTotal(data?.result?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load broadcasts')
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, statusFilter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshKey])

  useEffect(() => {
    const hasSending = broadcasts.some(b => b.status === 'sending')
    if (hasSending) {
      pollRef.current = setInterval(fetchHistory, 4000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [broadcasts, fetchHistory])

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const summary = useMemo(() => {
    const completed = broadcasts.filter(b => b.status === 'completed').length
    const failed = broadcasts.filter(b => b.status === 'failed').length
    const sending = broadcasts.filter(b => b.status === 'sending').length
    return { completed, failed, sending }
  }, [broadcasts])

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Title',
        flex: 1.2,
        minWidth: 180,
      },
      {
        field: 'audience',
        headerName: 'Audience',
        width: 100,
      },
      {
        field: 'channels',
        headerName: 'Channels',
        width: 200,
        renderCell: p => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
            {(p.value || []).map(ch => (
              <Chip key={ch} label={ch} size='small' variant='outlined' />
            ))}
          </Box>
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: p => (
          <Stack spacing={0.5}>
            <Chip label={p.value} size='small' color={STATUS_COLORS[p.value] || 'default'} />
            {p.value === 'sending' ? <LinearProgress sx={{ width: 72, height: 4, borderRadius: 2 }} /> : null}
          </Stack>
        )
      },
      {
        field: 'stats',
        headerName: 'Delivery',
        width: 130,
        renderCell: p => {
          const rate = deliverySuccessRate(p.value, p.row.channels)
          const totalRecipients = p.value?.total_recipients ?? 0
          return (
            <Box>
              <Typography variant='body2'>{totalRecipients} users</Typography>
              {rate != null ? (
                <Typography variant='caption' color={rate >= 90 ? 'success.main' : 'warning.main'}>
                  {rate}% delivered
                </Typography>
              ) : (
                <Typography variant='caption' color='text.secondary'>
                  —
                </Typography>
              )}
            </Box>
          )
        }
      },
      {
        field: 'created_by',
        headerName: 'Sent by',
        width: 140,
        renderCell: p => p.row.created_by?.fullname || p.row.created_by?.email || '—'
      },
      {
        field: 'sent_at',
        headerName: 'Sent',
        width: 165,
        renderCell: p => formatDateTime(p.value)
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 160,
        sortable: false,
        renderCell: p => (
          <Box>
            <Tooltip title='View details'>
              <IconButton size='small' onClick={e => { e.stopPropagation(); onView(p.row) }}>
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Duplicate to composer'>
              <IconButton size='small' onClick={e => { e.stopPropagation(); onDuplicate(p.row) }}>
                <ContentCopyIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            {(p.row.status === 'failed' || p.row.status === 'completed') && (
              <Tooltip title='Send again'>
                <IconButton
                  size='small'
                  color='warning'
                  onClick={e => { e.stopPropagation(); onResend(p.row._id) }}
                >
                  <ReplayIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Delete'>
              <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); onDelete(p.row) }}>
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    ],
    [onView, onDelete, onResend, onDuplicate]
  )

  return (
    <AdminPageSection>
      <Stack direction='row' spacing={2} sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Chip label={`${total} total`} size='small' />
        {summary.sending > 0 ? (
          <Chip label={`${summary.sending} sending`} size='small' color='warning' />
        ) : null}
        {summary.failed > 0 ? (
          <Chip label={`${summary.failed} failed on page`} size='small' color='error' variant='outlined' />
        ) : null}
      </Stack>

      <AdminFilterBar
        searchPlaceholder='Search title or message…'
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onRefresh={fetchHistory}
        refreshLoading={loading}
      >
        <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
          {HISTORY_STATUS_FILTERS.map(f => (
            <Chip
              key={f.value || 'all'}
              label={f.label}
              size='small'
              variant={statusFilter === f.value ? 'filled' : 'outlined'}
              color={statusFilter === f.value ? 'primary' : 'default'}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(1)
              }}
              clickable
            />
          ))}
        </Stack>
      </AdminFilterBar>

      <AdminDataGrid
        rows={broadcasts}
        columns={columns}
        loading={loading}
        rowCount={total}
        paginationMode='server'
        paginationModel={{ page: page - 1, pageSize }}
        onPaginationModelChange={m => {
          setPage(m.page + 1)
          setPageSize(m.pageSize)
        }}
        onRowClick={p => onView(p.row)}
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />

      {!loading && broadcasts.length === 0 ? (
        <Typography color='text.secondary' textAlign='center' sx={{ py: 6 }}>
          No broadcasts yet. Compose your first message to reach users.
        </Typography>
      ) : null}
    </AdminPageSection>
  )
}
