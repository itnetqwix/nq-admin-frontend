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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import NextLink from 'next/link'
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
import { getUser360 } from 'src/services/user360Api'
import { deleteUser, listUsers } from 'src/services/userAdminApi'
import { getImageUrl } from 'src/utils/utils'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'

const TYPE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'trainer', label: 'Trainers' },
  { value: 'trainee', label: 'Trainees' }
]

const STATUS_CHIPS = [
  { value: '', label: 'Any status' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' }
]

const STATUS_TONE = {
  approved: { bg: '#AAFFEC', color: '#1A8F76' },
  pending: { bg: '#ffefcf', color: '#ab570a' },
  rejected: { bg: ops.errorSoft, color: ops.error }
}

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

export default function UsersDirectoryPage() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  // Applied filters (drive API). Draft fields only commit on Apply.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [country, setCountry] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [category, setCategory] = useState('')
  const [loginType, setLoginType] = useState('')
  const [minSessions, setMinSessions] = useState('')
  const [maxSessions, setMaxSessions] = useState('')
  const [draft, setDraft] = useState({
    from: '',
    to: '',
    country: '',
    time_zone: '',
    category: '',
    login_type: '',
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

  // Sync URL → state (shareable filters)
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.search != null) {
      setSearchInput(String(q.search))
      setSearch(String(q.search))
    }
    if (q.account_type != null) setTypeFilter(String(q.account_type))
    if (q.status != null) setStatusFilter(String(q.status))
    const next = {
      from: q.from != null ? String(q.from) : '',
      to: q.to != null ? String(q.to) : '',
      country: q.country != null ? String(q.country) : '',
      time_zone: q.time_zone != null ? String(q.time_zone) : '',
      category: q.category != null ? String(q.category) : '',
      login_type: q.login_type != null ? String(q.login_type) : '',
      min_sessions: q.min_sessions != null ? String(q.min_sessions) : '',
      max_sessions: q.max_sessions != null ? String(q.max_sessions) : ''
    }
    setFromDate(next.from)
    setToDate(next.to)
    setCountry(next.country)
    setTimeZone(next.time_zone)
    setCategory(next.category)
    setLoginType(next.login_type)
    setMinSessions(next.min_sessions)
    setMaxSessions(next.max_sessions)
    setDraft(next)
    if (
      next.from ||
      next.to ||
      next.country ||
      next.time_zone ||
      next.category ||
      next.login_type ||
      next.min_sessions ||
      next.max_sessions
    ) {
      setFiltersOpen(true)
    }
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushQuery = useCallback(
    next => {
      const q = {
        ...(next.search ? { search: next.search } : {}),
        ...(next.account_type ? { account_type: next.account_type } : {}),
        ...(next.status ? { status: next.status } : {}),
        ...(next.from ? { from: next.from } : {}),
        ...(next.to ? { to: next.to } : {}),
        ...(next.country ? { country: next.country } : {}),
        ...(next.time_zone ? { time_zone: next.time_zone } : {}),
        ...(next.category ? { category: next.category } : {}),
        ...(next.login_type ? { login_type: next.login_type } : {}),
        ...(next.min_sessions !== '' && next.min_sessions != null ? { min_sessions: next.min_sessions } : {}),
        ...(next.max_sessions !== '' && next.max_sessions != null ? { max_sessions: next.max_sessions } : {})
      }
      void router.replace({ pathname: '/apps/users', query: q }, undefined, { shallow: true })
    },
    [router]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listUsers({
        page,
        limit: pageSize,
        search,
        account_type: typeFilter,
        status: statusFilter,
        category,
        login_type: loginType,
        time_zone: timeZone,
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
      toast.error(e?.message || 'Failed to load users')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    search,
    typeFilter,
    statusFilter,
    category,
    loginType,
    timeZone,
    country,
    fromDate,
    toDate,
    minSessions,
    maxSessions
  ])

  useEffect(() => {
    void load()
  }, [load])

  const scheduleSearch = value => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearch(value)
      setPage(1)
      pushQuery({
        search: value,
        account_type: typeFilter,
        status: statusFilter,
        from: fromDate,
        to: toDate,
        country,
        time_zone: timeZone,
        category,
        login_type: loginType,
        min_sessions: minSessions,
        max_sessions: maxSessions
      })
    }, 400)
  }

  const applyAdvanced = () => {
    setFromDate(draft.from)
    setToDate(draft.to)
    setCountry(draft.country)
    setTimeZone(draft.time_zone)
    setCategory(draft.category)
    setLoginType(draft.login_type)
    setMinSessions(draft.min_sessions)
    setMaxSessions(draft.max_sessions)
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: statusFilter,
      from: draft.from,
      to: draft.to,
      country: draft.country,
      time_zone: draft.time_zone,
      category: draft.category,
      login_type: draft.login_type,
      min_sessions: draft.min_sessions,
      max_sessions: draft.max_sessions
    })
  }

  const clearAdvanced = () => {
    const empty = {
      from: '',
      to: '',
      country: '',
      time_zone: '',
      category: '',
      login_type: '',
      min_sessions: '',
      max_sessions: ''
    }
    setDraft(empty)
    setFromDate('')
    setToDate('')
    setCountry('')
    setTimeZone('')
    setCategory('')
    setLoginType('')
    setMinSessions('')
    setMaxSessions('')
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: statusFilter
    })
  }

  const advancedQuerySlice = () => ({
    from: fromDate,
    to: toDate,
    country,
    time_zone: timeZone,
    category,
    login_type: loginType,
    min_sessions: minSessions,
    max_sessions: maxSessions
  })

  const setType = value => {
    setTypeFilter(value)
    setPage(1)
    pushQuery({
      search,
      account_type: value,
      status: statusFilter,
      ...advancedQuerySlice()
    })
  }

  const setStatus = value => {
    setStatusFilter(value)
    setPage(1)
    pushQuery({
      search,
      account_type: typeFilter,
      status: value,
      ...advancedQuerySlice()
    })
  }

  const openPreview = async (e, id) => {
    e.stopPropagation()
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
    e.stopPropagation()
    const ok = await confirm({
      title: 'Delete user permanently?',
      message: 'This cannot be undone. Prefer Account deletions for soft-delete workflow.',
      detail: name || id,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteUser(id)
      toast.success('User deleted')
      void load()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const copyId = (e, id) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(String(id)).then(
      () => toast.success('User ID copied'),
      () => toast.error('Copy failed')
    )
  }

  const activeAdvanced = Boolean(
    fromDate || toDate || country || timeZone || category || loginType || minSessions || maxSessions
  )

  const columns = useMemo(
    () => [
      {
        field: 'identity',
        headerName: 'User',
        flex: 1.4,
        minWidth: 240,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ minWidth: 0, py: 0.5 }}>
            <Avatar
              alt={p.row.fullname || 'User'}
              src={getImageUrl(p.row.profile_picture)}
              sx={{ width: 40, height: 40, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: ops.ink }} noWrap>
                {p.row.fullname || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
                {p.row.email || '—'}
              </Typography>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                  {String(p.row.id || '').slice(0, 10)}…
                </Typography>
                <IconButton size='small' onClick={e => copyId(e, p.row.id)} sx={{ p: 0.25 }}>
                  <ContentCopyIcon sx={{ fontSize: 12, color: ops.mute }} />
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        )
      },
      {
        field: 'account_type',
        headerName: 'Type',
        width: 100,
        renderCell: p => (
          <Chip
            size='small'
            label={p.value === 'trainer' ? 'Trainer' : 'Trainee'}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: p.value === 'trainer' ? ops.softIndigo : ops.canvasSoft2,
              color: p.value === 'trainer' ? ops.indigoDeep : ops.body
            }}
          />
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: p => {
          const t = STATUS_TONE[String(p.value || '').toLowerCase()] || {
            bg: ops.canvasSoft2,
            color: ops.body
          }
          return (
            <Chip
              size='small'
              label={p.value || '—'}
              sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: t.bg, color: t.color, fontWeight: 600 }}
            />
          )
        }
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        sortable: false,
        renderCell: p => {
          const loc = [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ')
          return (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: ops.body }} noWrap>
                {loc || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.time_zone || p.row.last_ip || ''}
              </Typography>
            </Box>
          )
        }
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 100,
        valueGetter: p => p.row.category || '—'
      },
      {
        field: 'session_count',
        headerName: 'Sessions',
        width: 90,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {fmtInt(p.row.session_count ?? 0)}
          </Typography>
        )
      },
      {
        field: 'wallet_amount',
        headerName: 'Wallet',
        width: 100,
        valueGetter: p =>
          p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(0)}` : '—'
      },
      {
        field: 'signals',
        headerName: 'Signals',
        width: 120,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {p.row.is_kyc_completed ? (
              <Chip size='small' label='KYC' sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }} />
            ) : null}
            {p.row.is_registered_with_stript ? (
              <Chip size='small' label='Stripe' sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }} />
            ) : null}
            {p.row.login_type ? (
              <Chip
                size='small'
                label={String(p.row.login_type).slice(0, 8)}
                sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }}
              />
            ) : null}
          </Stack>
        )
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        width: 140,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontSize: 12 }}>
              {p.row.createdAt ? formatOpsDateTime(p.row.createdAt, { withSeconds: false }) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.lastSeen
                ? `seen ${moment(p.row.lastSeen).fromNow()}`
                : p.row.last_login_at
                  ? `login ${moment(p.row.last_login_at).fromNow()}`
                  : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actions',
        headerName: '',
        width: 96,
        sortable: false,
        renderCell: params => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Quick preview'>
              <IconButton size='small' onClick={e => void openPreview(e, params.row.id)}>
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                size='small'
                color='error'
                onClick={e => void requestDelete(e, params.row.id, params.row.fullname)}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    []
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
        icon='mdi:account-search-outline'
        eyebrow='People'
        title='Users & accounts'
        subtitle='Directory of trainers and trainees — filter by identity, dates, location, and status. Click a row for User 360.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip
              component={NextLink}
              href='/apps/manage-trainer'
              label='Trainers'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/manage-trainee'
              label='Trainees'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/trainer-verifications'
              label='Verifications'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip
              component={NextLink}
              href='/apps/account-deletions'
              label='Deletions'
              clickable
              variant='outlined'
              size='small'
            />
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:human-male-board'
              label='Trainers'
              value={counts ? fmtInt(counts.trainers) : '—'}
              hint='All time'
              tone='accent'
              onClick={() => setType('trainer')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-school-outline'
              label='Trainees'
              value={counts ? fmtInt(counts.trainees) : '—'}
              hint='All time'
              onClick={() => setType('trainee')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-clock-outline'
              label='Pending'
              value={counts ? fmtInt(counts.pending) : '—'}
              hint='Needs review'
              tone='warn'
              onClick={() => setStatus('pending')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:check-decagram-outline'
              label='Approved'
              value={counts ? fmtInt(counts.approved) : '—'}
              hint='Active'
              tone='success'
              onClick={() => setStatus('approved')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:close-octagon-outline'
              label='Rejected'
              value={counts ? fmtInt(counts.rejected) : '—'}
              hint='Denied'
              tone='danger'
              onClick={() => setStatus('rejected')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-plus-outline'
              label='Joined 7d'
              value={counts ? fmtInt(counts.joined_7d) : '—'}
              hint='New accounts'
              tone='accent'
              onClick={() => {
                const to = moment().format('YYYY-MM-DD')
                const from = moment().subtract(7, 'days').format('YYYY-MM-DD')
                setDraft(d => ({ ...d, from, to }))
                setFromDate(from)
                setToDate(to)
                setFiltersOpen(true)
                setPage(1)
                pushQuery({
                  search,
                  account_type: typeFilter,
                  status: statusFilter,
                  from,
                  to,
                  country,
                  time_zone: timeZone,
                  category,
                  login_type: loginType
                })
              }}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name, email, mobile, user ID, referral…'
              searchValue={searchInput}
              onSearchChange={e => {
                const val = e.target.value
                setSearchInput(val)
                scheduleSearch(val)
              }}
              onRefresh={() => void load()}
              refreshLoading={loading}
              resultCount={total}
              helperText='Row click → User 360. Preview for a fast glance. Filters sync to the URL.'
            >
              {TYPE_CHIPS.map(t => (
                <FilterChip
                  key={t.value || 'all-type'}
                  active={typeFilter === t.value}
                  label={t.label}
                  count={
                    t.value === 'trainer'
                      ? counts?.trainers
                      : t.value === 'trainee'
                        ? counts?.trainees
                        : counts
                          ? (counts.trainers || 0) + (counts.trainees || 0)
                          : null
                  }
                  onClick={() => setType(t.value)}
                />
              ))}
              {STATUS_CHIPS.map(s => (
                <FilterChip
                  key={s.value || 'all-status'}
                  active={statusFilter === s.value}
                  label={s.label}
                  count={s.value ? counts?.[s.value] : null}
                  onClick={() => setStatus(s.value)}
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
                  ...(filtersOpen || activeAdvanced
                    ? { bgcolor: ops.indigo, boxShadow: 'none' }
                    : {})
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
                  <Grid item xs={12} sm={6} md={3}>
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
                  <Grid item xs={12} sm={6} md={3}>
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
                      placeholder='US, IN…'
                      value={draft.country}
                      onChange={e => setDraft(d => ({ ...d, country: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Timezone'
                      placeholder='America/…'
                      value={draft.time_zone}
                      onChange={e => setDraft(d => ({ ...d, time_zone: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Category'
                      placeholder='sport…'
                      value={draft.category}
                      onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Login type'
                      placeholder='default / google'
                      value={draft.login_type}
                      onChange={e => setDraft(d => ({ ...d, login_type: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label='Min sessions'
                      inputProps={{ min: 0 }}
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
                      inputProps={{ min: 0 }}
                      value={draft.max_sessions}
                      onChange={e => setDraft(d => ({ ...d, max_sessions: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
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
                <Typography sx={{ mt: 1.25, fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                  Country = last login geo. Sessions = booked lessons (trainer or trainee role).
                </Typography>
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
                emptyMessage='No users match these filters'
                emptyDescription='Try clearing dates, country, or status chips.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>
      {ConfirmDialog}
    </>
  )
}
