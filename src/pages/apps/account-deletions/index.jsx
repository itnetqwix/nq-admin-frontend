import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import RestoreIcon from '@mui/icons-material/Restore'
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useAdminConfirm } from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import {
  listAccountDeletions,
  restoreAccountDeletion,
  addAccountDeletionNote
} from 'src/services/accountDeletionsApi'

const STATUS_COLOR = {
  pending: 'default',
  confirmed: 'warning',
  restored: 'success',
  hard_deleted: 'error',
  cancelled: 'info'
}

function daysLeft(deadline) {
  if (!deadline) return null
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'expired'

  return `${Math.max(0, Math.ceil(ms / 86400000))}d left`
}

export default function AccountDeletionsPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('confirmed')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoreNote, setRestoreNote] = useState('')
  const [restoring, setRestoring] = useState(false)

  const [noteTarget, setNoteTarget] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const searchTimer = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listAccountDeletions({ search, status: statusFilter, page, pageSize })
      const items = data?.data?.items || []
      setRows(items.map(p => ({ ...p, id: p._id })))
      setTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const openRestore = row => {
    setRestoreTarget(row)
    setRestoreNote('')
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    const ok = await confirm({
      title: 'Restore account?',
      message: 'The user can sign in again and will leave the deletion queue.',
      detail: restoreTarget?.user_email_at_request || restoreTarget?.user_fullname_at_request,
      confirmLabel: 'Restore',
      variant: 'warning'
    })
    if (!ok) return
    setRestoring(true)
    try {
      await restoreAccountDeletion(restoreTarget._id, restoreNote)
      toast.success('Account restored.')
      setRestoreTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Restore failed')
    } finally {
      setRestoring(false)
    }
  }

  const openNote = row => {
    setNoteTarget(row)
    setNoteText(row.admin_notes || '')
  }

  const handleSaveNote = async () => {
    if (!noteTarget) return
    setSavingNote(true)
    try {
      await addAccountDeletionNote(noteTarget._id, noteText)
      toast.success('Note saved.')
      setNoteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSavingNote(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'user_fullname_at_request',
        headerName: 'User',
        flex: 1.4,
        minWidth: 220,
        renderCell: p => (
          <Box>
            <Typography fontWeight={600}>{p.value || 'Unknown'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {p.row.user_email_at_request}
            </Typography>
          </Box>
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: p => <Chip label={p.value} color={STATUS_COLOR[p.value] || 'default'} size='small' />
      },
      {
        field: 'reason',
        headerName: 'Reason',
        flex: 1.2,
        minWidth: 200,
        renderCell: p => (
          <Tooltip title={p.value || ''}>
            <Typography variant='body2' noWrap>
              {p.value || <Typography component='span' color='text.disabled'>--</Typography>}
            </Typography>
          </Tooltip>
        )
      },
      {
        field: 'confirmed_at',
        headerName: 'Confirmed',
        width: 160,
        renderCell: p => (p.value ? new Date(p.value).toLocaleString() : '--')
      },
      {
        field: 'restore_deadline',
        headerName: 'Restore window',
        width: 150,
        renderCell: p => {
          if (!p.value) return '--'
          const left = daysLeft(p.value)

          return (
            <Box>
              <Typography variant='body2'>{new Date(p.value).toLocaleDateString()}</Typography>
              <Typography variant='caption' color={left === 'expired' ? 'error' : 'text.secondary'}>
                {left}
              </Typography>
            </Box>
          )
        }
      },
      {
        field: 'admin_notes',
        headerName: 'Notes',
        flex: 1,
        minWidth: 180,
        renderCell: p => (
          <Tooltip title={p.value || ''}>
            <Typography variant='body2' noWrap>
              {p.value || <Typography component='span' color='text.disabled'>--</Typography>}
            </Typography>
          </Tooltip>
        )
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 130,
        sortable: false,
        renderCell: p => (
          <Box>
            {(p.row.status === 'confirmed' || p.row.status === 'pending') && (
              <Tooltip title='Restore account'>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<RestoreIcon fontSize='small' />}
                  onClick={e => {
                    e.stopPropagation()
                    openRestore(p.row)
                  }}
                  sx={{ minWidth: 0, mr: 1 }}
                >
                  Restore
                </Button>
              </Tooltip>
            )}
            <Tooltip title='Add note'>
              <Button
                size='small'
                variant='text'
                onClick={e => {
                  e.stopPropagation()
                  openNote(p.row)
                }}
                sx={{ minWidth: 0 }}
              >
                <NoteAddOutlinedIcon fontSize='small' />
              </Button>
            </Tooltip>
          </Box>
        )
      }
    ],
    []
  )

  return (
    <>
      <AdminPageShell
        bare
        eyebrow='People · deletions'
        icon='mdi:account-remove-outline'
        title='Account deletions.'
        subtitle='15-day soft-delete queue. Restore accounts that asked support before the deadline. After 15 days the nightly job hard-deletes the row.'
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:timer-sand'
              label='In restore window'
              value={statusFilter === 'confirmed' ? String(total) : '·'}
              hint='Confirmed soft-deletes'
              tone='warn'
              onClick={() => {
                setStatusFilter('confirmed')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:restore'
              label='Restored'
              value={statusFilter === 'restored' ? String(total) : '·'}
              hint='Brought back'
              tone='success'
              onClick={() => {
                setStatusFilter('restored')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:delete-forever'
              label='Hard-deleted'
              value={statusFilter === 'hard_deleted' ? String(total) : '·'}
              hint='Past deadline'
              tone='danger'
              onClick={() => {
                setStatusFilter('hard_deleted')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:filter-variant'
              label='In this view'
              value={String(total)}
              hint='Matching filters'
              tone='accent'
            />
          </Grid>
        </Grid>

        <AdminPageSection>
          <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
              <AdminFilterBar
                searchPlaceholder='Search by name, email, reason…'
                searchValue={searchInput}
                onSearchChange={handleSearchChange}
                resultCount={total}
                onRefresh={() => void fetchData()}
                refreshLoading={loading}
              >
                <FormControl size='small' sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label='Status'
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                  >
                    <MenuItem value=''>All</MenuItem>
                    <MenuItem value='pending'>Pending OTP</MenuItem>
                    <MenuItem value='confirmed'>In restore window</MenuItem>
                    <MenuItem value='restored'>Restored</MenuItem>
                    <MenuItem value='hard_deleted'>Hard-deleted</MenuItem>
                    <MenuItem value='cancelled'>Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </AdminFilterBar>
            </Box>
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={rows}
                columns={columns}
                loading={loading}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => {
                  setPage(m.page + 1)
                  setPageSize(m.pageSize)
                }}
                sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
                getRowHeight={() => 72}
                emptyMessage='No deletion requests in this view.'
              />
            </AdminGridContainer>
          </OpsSurfaceCard>
        </AdminPageSection>
      </AdminPageShell>

      <Dialog open={!!restoreTarget} onClose={() => setRestoreTarget(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Restore account?</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            This will clear the deletion mark for{' '}
            <strong>{restoreTarget?.user_email_at_request || 'this user'}</strong> and they'll be able to sign in
            again. They'll also stop showing up in this list as confirmed.
          </Typography>
          <TextField
            label='Note (optional)'
            fullWidth
            size='small'
            multiline
            minRows={3}
            value={restoreNote}
            onChange={e => setRestoreNote(e.target.value)}
            inputProps={{ maxLength: 600 }}
            placeholder='Why are you restoring this account?'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreTarget(null)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleRestore}
            disabled={restoring}
            sx={{ bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
          >
            {restoring ? 'Restoring…' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!noteTarget} onClose={() => setNoteTarget(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Admin notes</DialogTitle>
        <DialogContent dividers>
          <TextField
            label='Notes'
            fullWidth
            size='small'
            multiline
            minRows={4}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            inputProps={{ maxLength: 600 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteTarget(null)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSaveNote}
            disabled={savingNote}
            sx={{ bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
          >
            {savingNote ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      {ConfirmDialog}
    </>
  )
}
