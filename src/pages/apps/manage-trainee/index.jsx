import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Link from 'next/link'
import toast from 'react-hot-toast'
import moment from 'moment'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  useAdminConfirm
} from 'src/components/admin'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import UserQuickPreviewModal from 'src/components/user360/UserQuickPreviewModal'
import TraineeRejectActions from 'src/pages/components/trainee-reject/TraineeRejectActions'
import { getUser360 } from 'src/services/user360Api'
import { deleteUser, listUsers } from 'src/services/userAdminApi'
import { getImageUrl } from 'src/utils/utils'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'

const STATUS_CHIPS = [
  { value: '', label: 'Any status' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' }
]

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

function FilterChip({ active, label, onClick, count }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={count != null ? `${label} · ${fmtInt(count)}` : label}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        bgcolor: active ? ops.softIndigo : ops.canvas,
        color: active ? ops.indigoDeep : ops.body,
        border: `1px solid ${active ? ops.indigo : ops.hairline}`
      }}
    />
  )
}

export default function ManageTrainee() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [country, setCountry] = useState('')
  const [minSessions, setMinSessions] = useState('')
  const [maxSessions, setMaxSessions] = useState('')
  const [draft, setDraft] = useState({
    from: '',
    to: '',
    country: '',
    min_sessions: '',
    max_sessions: ''
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState({})
  const [previewUserId, setPreviewUserId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listUsers({
        page,
        limit: pageSize,
        search,
        account_type: 'trainee',
        status: statusFilter,
        country,
        from: fromDate,
        to: toDate,
        min_sessions: minSessions,
        max_sessions: maxSessions
      })
      setRows(data.items)
      setTotal(data.total)
      setCounts(data.counts)
    } catch (e) {
      toast.error(e?.message || 'Failed to load trainees')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, country, fromDate, toDate, minSessions, maxSessions])

  useEffect(() => {
    void load()
  }, [load])

  const scheduleSearch = value => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
    }, 400)
  }

  const applyAdvanced = () => {
    setFromDate(draft.from)
    setToDate(draft.to)
    setCountry(draft.country)
    setMinSessions(draft.min_sessions)
    setMaxSessions(draft.max_sessions)
    setPage(1)
  }

  const clearAdvanced = () => {
    const empty = { from: '', to: '', country: '', min_sessions: '', max_sessions: '' }
    setDraft(empty)
    setFromDate('')
    setToDate('')
    setCountry('')
    setMinSessions('')
    setMaxSessions('')
    setPage(1)
  }

  const openPreview = async (e, id) => {
    e?.stopPropagation?.()
    if (!id) return
    setPreviewUserId(String(id))
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      setPreviewData((await getUser360(id)) || {})
    } catch (err) {
      toast.error(err?.message || 'Preview failed')
      setPreviewData({})
    } finally {
      setPreviewLoading(false)
    }
  }

  const requestDelete = async (e, id, name) => {
    e?.stopPropagation?.()
    const ok = await confirm({
      title: 'Delete trainee account?',
      message: 'This permanently removes the user and cannot be undone.',
      detail: name || id,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteUser(id)
      toast.success('Trainee deleted')
      void load()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const activeAdvanced = Boolean(fromDate || toDate || country || minSessions || maxSessions)

  const columns = useMemo(
    () => [
      {
        field: 'identity',
        headerName: 'Trainee',
        flex: 1.3,
        minWidth: 220,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ minWidth: 0, py: 0.5 }}>
            <Avatar
              alt={p.row.fullname || 'Trainee'}
              src={getImageUrl(p.row.profile_picture)}
              sx={{ width: 40, height: 40 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                {p.row.fullname || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
                {p.row.email || '—'}
              </Typography>
            </Box>
          </Stack>
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 180,
        sortable: false,
        renderCell: p => (
          <Box onClick={e => e.stopPropagation()}>
            <TraineeRejectActions
              userId={p.row.id || p.row._id}
              status={p.row.status}
              onUpdated={() => void load()}
            />
          </Box>
        )
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 140,
        sortable: false,
        renderCell: p => {
          const loc = [p.row.city, p.row.country].filter(Boolean).join(', ')
          return (
            <Typography sx={{ fontSize: 12 }} noWrap>
              {loc || p.row.time_zone || '—'}
            </Typography>
          )
        }
      },
      {
        field: 'session_count',
        headerName: 'Sessions',
        width: 90,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{fmtInt(p.row.session_count ?? 0)}</Typography>
        )
      },
      {
        field: 'wallet_amount',
        headerName: 'Wallet',
        width: 90,
        valueGetter: p =>
          p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(0)}` : '—'
      },
      {
        field: 'referral_code',
        headerName: 'Referral',
        width: 110,
        valueGetter: p => p.row.referral_code || '—'
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        width: 130,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontSize: 12 }}>
              {p.row.createdAt ? formatOpsDateTime(p.row.createdAt, { withSeconds: false }) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.lastSeen ? `seen ${moment(p.row.lastSeen).fromNow()}` : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actions',
        headerName: '',
        width: 96,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={e => void openPreview(e, p.row.id)}>
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                size='small'
                color='error'
                onClick={e => void requestDelete(e, p.row.id, p.row.fullname)}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    // load used in TraineeRejectActions callback
    [load]
  )

  return (
    <>
      <UserQuickPreviewModal
        open={previewOpen}
        handleClose={() => {
          setPreviewOpen(false)
          setPreviewUserId(null)
        }}
        loading={previewLoading}
        user360Data={previewData}
        userId={previewUserId || previewData?.user?._id}
      />

      <AdminPageShell
        bare
        icon='mdi:account-school-outline'
        eyebrow='People'
        title='Trainees'
        subtitle='Approve / reject inline, filter by sessions and location. Click a row for User 360.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={Link} href='/apps/users' label='All users' clickable variant='outlined' size='small' />
            <Chip
              component={Link}
              href='/apps/trainee-account-reviews'
              label='Reviews queue'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={Link}
              href='/apps/manage-trainer'
              label='Trainers'
              clickable
              variant='outlined'
              size='small'
            />
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:account-school-outline'
              label='Trainees'
              value={counts ? fmtInt(counts.trainees) : '—'}
              hint='All time'
              tone='accent'
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:account-clock-outline'
              label='Pending'
              value={counts ? fmtInt(counts.pending) : '—'}
              hint='Needs review'
              tone='warn'
              onClick={() => {
                setStatusFilter('pending')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:check-decagram-outline'
              label='Approved'
              value={counts ? fmtInt(counts.approved) : '—'}
              hint='Active'
              tone='success'
              onClick={() => {
                setStatusFilter('approved')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:account-plus-outline'
              label='Joined 7d'
              value={counts ? fmtInt(counts.joined_7d) : '—'}
              hint='All roles'
              tone='accent'
              onClick={() => {
                const to = moment().format('YYYY-MM-DD')
                const from = moment().subtract(7, 'days').format('YYYY-MM-DD')
                setDraft(d => ({ ...d, from, to }))
                setFromDate(from)
                setToDate(to)
                setFiltersOpen(true)
                setPage(1)
              }}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name, email, mobile, user ID…'
              searchValue={searchInput}
              onSearchChange={e => {
                setSearchInput(e.target.value)
                scheduleSearch(e.target.value)
              }}
              onRefresh={() => void load()}
              refreshLoading={loading}
              resultCount={total}
              helperText='Approve / reject without leaving the list. Row click opens User 360.'
            >
              {STATUS_CHIPS.map(s => (
                <FilterChip
                  key={s.value || 'any'}
                  active={statusFilter === s.value}
                  label={s.label}
                  count={s.value ? counts?.[s.value] : counts?.trainees}
                  onClick={() => {
                    setStatusFilter(s.value)
                    setPage(1)
                  }}
                />
              ))}
              <Button
                size='small'
                variant={filtersOpen || activeAdvanced ? 'contained' : 'outlined'}
                onClick={() => setFiltersOpen(v => !v)}
                sx={{
                  textTransform: 'none',
                  height: 28,
                  fontSize: 12,
                  ...(filtersOpen || activeAdvanced ? { bgcolor: ops.indigo, boxShadow: 'none' } : {})
                }}
              >
                More filters{activeAdvanced ? ' · on' : ''}
              </Button>
            </AdminFilterBar>

            {filtersOpen ? (
              <Box
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: ops.radiusSm,
                  bgcolor: ops.canvas,
                  border: `1px solid ${ops.hairline}`
                }}
              >
                <Grid container spacing={1.5} alignItems='center'>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='date'
                      label='Joined from'
                      InputLabelProps={{ shrink: true }}
                      value={draft.from}
                      onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='date'
                      label='Joined to'
                      InputLabelProps={{ shrink: true }}
                      value={draft.to}
                      onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Country'
                      value={draft.country}
                      onChange={e => setDraft(d => ({ ...d, country: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label='Min sessions'
                      value={draft.min_sessions}
                      onChange={e => setDraft(d => ({ ...d, min_sessions: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label='Max sessions'
                      value={draft.max_sessions}
                      onChange={e => setDraft(d => ({ ...d, max_sessions: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Stack direction='row' spacing={1}>
                      <Button
                        size='small'
                        variant='contained'
                        onClick={applyAdvanced}
                        sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
                      >
                        Apply
                      </Button>
                      <Button size='small' variant='outlined' onClick={clearAdvanced} sx={{ textTransform: 'none' }}>
                        Clear
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            ) : null}

            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={rows}
                columns={columns}
                loading={loading}
                getRowHeight={() => 72}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => {
                  setPage(m.page + 1)
                  setPageSize(m.pageSize)
                }}
                onRowClick={p => {
                  const id = p.row?.id || p.row?._id
                  if (id) router.push(`/apps/users/${id}`)
                }}
                clickableRows
                emptyMessage='No trainees match'
                emptyDescription='Try clearing status or session filters.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      {ConfirmDialog}
    </>
  )
}
