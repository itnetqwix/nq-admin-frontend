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
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  InputAdornment,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useAdminConfirm } from 'src/components/admin'
import CmsEditorDrawer from 'src/components/admin/content/CmsEditorDrawer'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import BannerCtaEditor from 'src/components/admin/content/BannerCtaEditor'
import BannerPlacementPreview from 'src/components/admin/content/BannerPlacementPreview'
import CmsImageUploader from 'src/components/admin/content/CmsImageUploader'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import BannerScheduleCalendar from 'src/components/admin/content/BannerScheduleCalendar'
import PreviewAudienceToggle, { bannerVisibleForAudience } from 'src/components/admin/content/PreviewAudienceToggle'
import { computeScheduleStatus, scheduleStatusChip } from 'src/components/admin/content/scheduleStatus'
import { BANNERS_AUDIENCE_HELP, BANNERS_PLACEMENT_HELP } from 'src/components/admin/content/contentPlacementConfig'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner
} from 'src/services/bannersApi'
import { getCmsSummary } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

const SEVERITIES = ['info', 'promo', 'maintenance', 'critical', 'success']
const AUDIENCES = ['guest', 'trainee', 'trainer', 'all']
const PLACEMENTS = [
  { value: 'hero', label: 'Hero carousel', hint: 'Large cards under search (auto-advance)' },
  { value: 'strip', label: 'Announcement strip', hint: 'Compact bar on login / alerts' },
  { value: 'sticky_bottom', label: 'Sticky bottom promo', hint: 'Slim bar above tab bar' }
]

const EMPTY_FORM = {
  title: '',
  body: '',
  image_url: '',
  background_image_url: '',
  background_color: '',
  image_height: '140',
  image_fit: 'cover',
  text_align: 'left',
  overlay_opacity: '0.45',
  audience: ['all'],
  placement: 'hero',
  auto_advance_sec: '5',
  severity: 'info',
  ctas: [],
  cta_label: '',
  cta_url: '',
  dismissible: true,
  is_active: true,
  sort_order: '0',
  start_date: '',
  end_date: '',
  experiment_key: '',
  variant_label: ''
}

function normalizeCtasFromRow(row) {
  if (Array.isArray(row?.ctas) && row.ctas.length) {
    return row.ctas.map(c => ({
      label: c.label || '',
      url: c.url || '',
      variant: c.variant || 'primary'
    }))
  }
  if (row?.cta_label && row?.cta_url) {
    return [{ label: row.cta_label, url: row.cta_url, variant: 'primary' }]
  }
  return []
}

function buildCtasPayload(ctas) {
  return (ctas || [])
    .map(c => ({
      label: String(c.label || '').trim(),
      url: String(c.url || '').trim(),
      variant: ['primary', 'secondary', 'ghost'].includes(c.variant) ? c.variant : 'primary'
    }))
    .filter(c => c.label && c.url)
    .slice(0, 4)
}

function severityChip(s) {
  const map = {
    info: { bg: ops.softIndigo, color: ops.indigoDeep },
    promo: { bg: '#ebe6ff', color: ops.indigo },
    maintenance: { bg: '#ffefcf', color: '#ab570a' },
    critical: { bg: ops.errorSoft, color: ops.error },
    success: { bg: '#AAFFEC', color: '#1A8F76' }
  }
  const t = map[s] || { bg: ops.canvasSoft2, color: ops.body }
  return (
    <Chip
      label={s}
      size='small'
      sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: t.bg, color: t.color, fontWeight: 600 }}
    />
  )
}

function FilterChip({ active, label, onClick }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={label}
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

export default function BannersPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [banners, setBanners] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [placementFilter, setPlacementFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [previewRow, setPreviewRow] = useState(null)
  const [previewAudience, setPreviewAudience] = useState('trainee')

  const searchTimer = useRef(null)

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    if (q.placement != null) setPlacementFilter(String(q.placement))
    if (q.status != null) setStatusFilter(String(q.status))
    if (q.audience != null) setAudienceFilter(String(q.audience))
    if (q.search != null) {
      setSearchInput(String(q.search))
      setSearch(String(q.search))
    }
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    },
    []
  )

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getCmsSummary()
      setSummary(res?.data || null)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listBanners({
        search,
        audience: audienceFilter,
        placement: placementFilter,
        status: statusFilter,
        page,
        pageSize
      })
      const items = data?.data?.items || []
      setBanners(items.map(p => ({ ...p, id: p._id })))
      setTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }, [search, audienceFilter, placementFilter, statusFilter, page, pageSize])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const pushQuery = useCallback(
    next => {
      const q = {
        ...(next.placement ? { placement: next.placement } : {}),
        ...(next.status ? { status: next.status } : {}),
        ...(next.audience ? { audience: next.audience } : {}),
        ...(next.search ? { search: next.search } : {})
      }
      void router.replace({ pathname: '/apps/banners', query: q }, undefined, { shallow: true })
    },
    [router]
  )

  const setPlacement = value => {
    setPlacementFilter(value)
    setPage(1)
    pushQuery({ placement: value, status: statusFilter, audience: audienceFilter, search })
  }

  const setStatus = value => {
    setStatusFilter(value)
    setPage(1)
    pushQuery({ placement: placementFilter, status: value, audience: audienceFilter, search })
  }

  const setAudience = value => {
    setAudienceFilter(value)
    setPage(1)
    pushQuery({ placement: placementFilter, status: statusFilter, audience: value, search })
  }

  const handleSearchChange = value => {
    const val = value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
      pushQuery({
        placement: placementFilter,
        status: statusFilter,
        audience: audienceFilter,
        search: val.trim()
      })
    }, 400)
  }

  const applySearchImmediately = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearch(searchInput.trim())
    setPage(1)
    pushQuery({
      placement: placementFilter,
      status: statusFilter,
      audience: audienceFilter,
      search: searchInput.trim()
    })
  }

  const clearSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  const openEdit = row => {
    setEditId(row._id)
    setForm({
      title: row.title || '',
      body: row.body || '',
      image_url: row.image_url || '',
      background_image_url: row.background_image_url || '',
      background_color: row.background_color || '',
      image_height: String(row.image_height ?? 140),
      image_fit: row.image_fit || 'cover',
      text_align: row.text_align || 'left',
      overlay_opacity: String(row.overlay_opacity ?? 0.45),
      audience: Array.isArray(row.audience) && row.audience.length ? row.audience : ['all'],
      severity: row.severity || 'info',
      placement: row.placement || 'hero',
      auto_advance_sec: String(row.auto_advance_sec ?? 5),
      ctas: normalizeCtasFromRow(row),
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      dismissible: row.dismissible !== false,
      is_active: row.is_active ?? true,
      sort_order: String(row.sort_order ?? '0'),
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
      experiment_key: row.experiment_key || '',
      variant_label: row.variant_label || ''
    })
    setFormOpen(true)
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required.')
    if (!form.audience.length) return toast.error('Select at least one audience.')
    setSaving(true)
    try {
      const ctas = buildCtasPayload(form.ctas)
      const body = {
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url || null,
        background_image_url: form.background_image_url || null,
        background_color: form.background_color?.trim() || null,
        image_height: Number(form.image_height) || 140,
        image_fit: form.image_fit === 'contain' ? 'contain' : 'cover',
        text_align: form.text_align === 'center' ? 'center' : 'left',
        overlay_opacity: Math.min(1, Math.max(0, Number(form.overlay_opacity) || 0.45)),
        audience: form.audience,
        severity: form.severity,
        placement: form.placement || 'hero',
        auto_advance_sec: Number(form.auto_advance_sec) || 5,
        ctas,
        cta_label: ctas.length ? null : form.cta_label || null,
        cta_url: ctas.length ? null : form.cta_url || null,
        dismissible: form.dismissible,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date + 'T23:59:59').toISOString() : null,
        experiment_key: form.experiment_key?.trim() || null,
        variant_label: form.variant_label?.trim() || null
      }
      if (editId) {
        await updateBanner(editId, body)
        toast.success('Banner updated.')
      } else {
        await createBanner(body)
        toast.success('Banner created.')
      }
      setFormOpen(false)
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete banner?',
      message: `"${row.title}" will be removed from all mobile placements.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteBanner(row._id)
      toast.success('Banner deleted.')
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleToggle = async row => {
    try {
      await toggleBanner(row._id)
      void fetchData()
      void fetchSummary()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Banner',
        flex: 1.6,
        minWidth: 240,
        renderCell: p => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: ops.ink }} noWrap>
              {p.value}
            </Typography>
            <Typography sx={{ fontSize: 11, color: ops.mute }} noWrap>
              {p.row.body?.slice(0, 80)}
              {p.row.body?.length > 80 ? '…' : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'schedule',
        headerName: 'Schedule',
        width: 110,
        renderCell: p => {
          const status = computeScheduleStatus(p.row)
          const meta = scheduleStatusChip(status)
          return (
            <Chip
              label={meta.label}
              size='small'
              sx={{ height: 22, fontFamily: ops.mono, fontSize: 10 }}
              color={meta.color}
            />
          )
        }
      },
      {
        field: 'placement',
        headerName: 'Placement',
        width: 130,
        renderCell: p => (
          <Chip
            label={p.value || 'hero'}
            size='small'
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: ops.softIndigo,
              color: ops.indigoDeep
            }}
          />
        )
      },
      {
        field: 'audience',
        headerName: 'Audience',
        width: 180,
        renderCell: p => (
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {(p.value || []).map(a => (
              <Chip
                key={a}
                label={a}
                size='small'
                sx={{ height: 20, fontFamily: ops.mono, fontSize: 9, bgcolor: ops.canvasSoft2 }}
              />
            ))}
          </Stack>
        )
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 110,
        renderCell: p => severityChip(p.value)
      },
      {
        field: 'is_active',
        headerName: 'Active',
        width: 90,
        renderCell: p => (
          <Switch
            size='small'
            checked={!!p.value}
            onChange={() => handleToggle(p.row)}
            onClick={e => e.stopPropagation()}
          />
        )
      },
      {
        field: 'date_range',
        headerName: 'Window',
        width: 170,
        renderCell: p => {
          const s = p.row.start_date ? new Date(p.row.start_date).toLocaleDateString() : 'Always'
          const e = p.row.end_date ? new Date(p.row.end_date).toLocaleDateString() : 'Always'
          return (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
              {s} – {e}
            </Typography>
          )
        }
      },
      {
        field: 'actions',
        headerName: '',
        width: 120,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Preview'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  setPreviewRow(p.row)
                }}
              >
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  openEdit(p.row)
                }}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                size='small'
                color='error'
                onClick={e => {
                  e.stopPropagation()
                  void requestDelete(p.row)
                }}
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

  const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

  return (
    <>
      <AdminPageShell
        bare
        icon='mdi:image-multiple-outline'
        eyebrow='CMS'
        title='Banners & placements'
        subtitle='Hero, strip, and sticky promos — filter by placement, audience, and schedule status.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={NextLink} href='/apps/cms' label='CMS overview' clickable variant='outlined' size='small' />
            <Chip component={NextLink} href='/apps/tips' label='Tips' clickable variant='outlined' size='small' />
            <Button
              variant='contained'
              size='small'
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
            >
              New banner
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:view-carousel-outline'
              label='Hero live'
              value={summary ? fmtInt(summary.live?.banners_hero) : '—'}
              hint='Carousel'
              tone={summary?.health?.hero_empty ? 'danger' : 'accent'}
              onClick={() => setPlacement('hero')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:page-layout-header'
              label='Strip live'
              value={summary ? fmtInt(summary.live?.banners_strip) : '—'}
              hint='Announcement'
              onClick={() => setPlacement('strip')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:dock-bottom'
              label='Sticky live'
              value={summary ? fmtInt(summary.live?.banners_sticky_bottom) : '—'}
              hint='Tab bar'
              onClick={() => setPlacement('sticky_bottom')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:check-circle-outline'
              label='Active total'
              value={summary ? fmtInt(summary.live?.banners) : '—'}
              hint='All placements'
              tone='success'
              onClick={() => setStatus('active')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:pause-circle-outline'
              label='Inactive'
              value={summary ? fmtInt(summary.inactive?.banners) : '—'}
              hint='Paused'
              tone='warn'
              onClick={() => setStatus('inactive')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:calendar-clock'
              label='Off-window'
              value={summary ? fmtInt(summary.scheduled_off_window) : '—'}
              hint='Outside dates'
              tone={(summary?.scheduled_off_window || 0) > 0 ? 'warn' : 'default'}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', mb: 2 }}>
          <AdminPageSection>
            <ContentPlacementGuide kind='banners' defaultExpanded={false} />
            <Box sx={{ mb: 2 }}>
              <BannerScheduleCalendar banners={banners} />
            </Box>
            <AdminFilterBar
              searchPlaceholder='Title, body, CTA, audience…'
              searchValue={searchInput}
              onSearchChange={e => handleSearchChange(e.target.value)}
              onSearchSubmit={applySearchImmediately}
              resultCount={total}
              onRefresh={() => {
                void fetchData()
                void fetchSummary()
              }}
              refreshLoading={loading}
              helperText='Placement chips sync to the URL — shareable with CMS overview deep links.'
            >
              <FilterChip active={placementFilter === ''} label='All placements' onClick={() => setPlacement('')} />
              {PLACEMENTS.map(p => (
                <FilterChip
                  key={p.value}
                  active={placementFilter === p.value}
                  label={p.label}
                  onClick={() => setPlacement(p.value)}
                />
              ))}
              <FilterChip active={statusFilter === ''} label='Any status' onClick={() => setStatus('')} />
              <FilterChip active={statusFilter === 'active'} label='Active' onClick={() => setStatus('active')} />
              <FilterChip active={statusFilter === 'inactive'} label='Inactive' onClick={() => setStatus('inactive')} />
              <FilterChip active={audienceFilter === ''} label='Any audience' onClick={() => setAudience('')} />
              {AUDIENCES.map(a => (
                <FilterChip key={a} active={audienceFilter === a} label={a} onClick={() => setAudience(a)} />
              ))}
            </AdminFilterBar>

            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={banners}
                columns={columns}
                loading={loading}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => {
                  setPage(m.page + 1)
                  setPageSize(m.pageSize)
                }}
                getRowHeight={() => 72}
                emptyMessage='No banners match'
                emptyDescription='Try clearing placement or status chips.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      <CmsEditorDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit banner' : 'Create banner'}
        subtitle={PLACEMENTS.find(p => p.value === form.placement)?.label || form.placement}
        onSave={handleSave}
        saving={saving}
        saveLabel={editId ? 'Update' : 'Create'}
      >
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label='Title'
                fullWidth
                size='small'
                value={form.title}
                onChange={e => handleFormChange('title', e.target.value)}
                inputProps={{ maxLength: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Placement</InputLabel>
                <Select
                  label='Placement'
                  value={form.placement}
                  onChange={e => handleFormChange('placement', e.target.value)}
                >
                  {PLACEMENTS.map(p => (
                    <MenuItem key={p.value} value={p.value}>
                      <ListItemText
                        primary={p.label}
                        secondary={BANNERS_PLACEMENT_HELP[p.value] || p.hint}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Severity</InputLabel>
                <Select
                  label='Severity'
                  value={form.severity}
                  onChange={e => handleFormChange('severity', e.target.value)}
                >
                  {SEVERITIES.map(s => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Body (optional)'
                fullWidth
                size='small'
                multiline
                minRows={2}
                value={form.body}
                onChange={e => handleFormChange('body', e.target.value)}
                inputProps={{ maxLength: 600 }}
                helperText={`${form.body.length}/600`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Audience</InputLabel>
                <Select
                  label='Audience'
                  multiple
                  value={form.audience}
                  onChange={e => handleFormChange('audience', e.target.value)}
                  renderValue={v => v.join(', ')}
                >
                  {AUDIENCES.map(a => (
                    <MenuItem key={a} value={a}>
                      <Switch size='small' checked={form.audience.indexOf(a) > -1} />
                      <ListItemText
                        primary={a}
                        secondary={BANNERS_AUDIENCE_HELP[a]}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.placement === 'hero' ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  label='Auto-advance (seconds)'
                  fullWidth
                  size='small'
                  type='number'
                  inputProps={{ min: 3, max: 60 }}
                  value={form.auto_advance_sec}
                  onChange={e => handleFormChange('auto_advance_sec', e.target.value)}
                  helperText='Hero carousel slide interval (3–60)'
                />
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <CmsImageUploader
                kind='banners'
                surfaceKey={`banner.${form.placement || 'hero'}`}
                label='Foreground image'
                value={form.image_url}
                onChange={v => handleFormChange('image_url', v)}
              />
            </Grid>
            <Grid item xs={12}>
              <CmsImageUploader
                kind='banners'
                surfaceKey={`banner.${form.placement || 'hero'}.background`}
                label='Background image (optional)'
                value={form.background_image_url}
                onChange={v => handleFormChange('background_image_url', v)}
                helperText='Full-bleed behind text — great for hero promos'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Background color'
                fullWidth
                size='small'
                value={form.background_color}
                onChange={e => handleFormChange('background_color', e.target.value)}
                placeholder='#1a237e or transparent'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Image height (px)'
                fullWidth
                size='small'
                type='number'
                inputProps={{ min: 64, max: 320 }}
                value={form.image_height}
                onChange={e => handleFormChange('image_height', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Overlay opacity'
                fullWidth
                size='small'
                type='number'
                inputProps={{ min: 0, max: 1, step: 0.05 }}
                value={form.overlay_opacity}
                onChange={e => handleFormChange('overlay_opacity', e.target.value)}
                helperText='Darken background image for readable text'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Image fit</InputLabel>
                <Select
                  label='Image fit'
                  value={form.image_fit}
                  onChange={e => handleFormChange('image_fit', e.target.value)}
                >
                  <MenuItem value='cover'>Cover (crop to fill)</MenuItem>
                  <MenuItem value='contain'>Contain (fit inside)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Text align</InputLabel>
                <Select
                  label='Text align'
                  value={form.text_align}
                  onChange={e => handleFormChange('text_align', e.target.value)}
                >
                  <MenuItem value='left'>Left</MenuItem>
                  <MenuItem value='center'>Center</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <BannerCtaEditor
                ctas={form.ctas}
                onChange={next => handleFormChange('ctas', next)}
              />
            </Grid>
            {!(form.ctas || []).length ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label='CTA label (legacy, optional)'
                    fullWidth
                    size='small'
                    value={form.cta_label}
                    onChange={e => handleFormChange('cta_label', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label='CTA URL / deep link (legacy)'
                    fullWidth
                    size='small'
                    value={form.cta_url}
                    onChange={e => handleFormChange('cta_url', e.target.value)}
                    placeholder='netqwix://wallet or https://…'
                  />
                </Grid>
              </>
            ) : null}
            <Grid item xs={12} sm={4}>
              <TextField
                label='Start date (optional)'
                fullWidth
                size='small'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={form.start_date}
                onChange={e => handleFormChange('start_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='End date (optional)'
                fullWidth
                size='small'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={form.end_date}
                onChange={e => handleFormChange('end_date', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Sort order'
                fullWidth
                size='small'
                type='number'
                value={form.sort_order}
                onChange={e => handleFormChange('sort_order', e.target.value)}
                helperText='Lower numbers appear first'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.dismissible}
                    onChange={e => handleFormChange('dismissible', e.target.checked)}
                  />
                }
                label='User can dismiss locally'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={e => handleFormChange('is_active', e.target.checked)}
                  />
                }
                label='Active'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='A/B experiment key'
                fullWidth
                size='small'
                value={form.experiment_key}
                onChange={e => handleFormChange('experiment_key', e.target.value)}
                placeholder='e.g. spring-hero-test'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Variant label'
                fullWidth
                size='small'
                value={form.variant_label}
                onChange={e => handleFormChange('variant_label', e.target.value)}
                placeholder='A, B, control…'
              />
            </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                position: { md: 'sticky' },
                top: { md: 8 },
                alignSelf: 'flex-start'
              }}
            >
              <Stack direction='row' alignItems='center' flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
                <PreviewAudienceToggle value={previewAudience} onChange={setPreviewAudience} />
              </Stack>
              <MobileFramePreview
                label='App preview'
                subtitle={PLACEMENTS.find(p => p.value === form.placement)?.label}
              >
                <BannerPlacementPreview
                  form={form}
                  showLabel={false}
                  embedded
                  previewAudience={previewAudience}
                />
              </MobileFramePreview>
              <Box sx={{ mt: 2 }}>
                <BannerPlacementPreview form={form} compareAll showLabel={false} previewAudience={previewAudience} />
              </Box>
            </Grid>
          </Grid>
      </CmsEditorDrawer>

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {previewRow
            ? `Preview · ${PLACEMENTS.find(p => p.value === (previewRow.placement || 'hero'))?.label || previewRow.placement}`
            : 'Banner preview'}
        </DialogTitle>
        <DialogContent>
          {previewRow ? (
            <MobileFramePreview showLabel={false} footer={false}>
              <BannerPlacementPreview form={previewRow} showLabel={false} embedded />
            </MobileFramePreview>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewRow(null)}>Close</Button>
          {previewRow ? (
            <Button
              variant='contained'
              onClick={() => {
                openEdit(previewRow)
                setPreviewRow(null)
              }}
              sx={{ bgcolor: '#000080' }}
            >
              Edit
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {ConfirmDialog}
    </>
  )
}
