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
import TipPlacementPreview from 'src/components/admin/content/TipPlacementPreview'
import CmsImageUploader from 'src/components/admin/content/CmsImageUploader'
import IoniconsPicker from 'src/components/admin/content/IoniconsPicker'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import { computeScheduleStatus, scheduleStatusChip } from 'src/components/admin/content/scheduleStatus'
import { TIPS_AUDIENCE_HELP } from 'src/components/admin/content/contentPlacementConfig'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { listTips, createTip, updateTip, deleteTip, toggleTip } from 'src/services/tipsApi'
import { getCmsSummary } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

const EMPTY_FORM = {
  title: '',
  body: '',
  image_url: '',
  icon: '',
  audience: 'all',
  cta_label: '',
  cta_url: '',
  sort_order: '0',
  is_active: true,
  start_date: '',
  end_date: ''
}

const AUDIENCE_FILTERS = [
  { value: '', label: 'Any audience' },
  { value: 'all', label: 'Everyone' },
  { value: 'trainer', label: 'Trainers' },
  { value: 'trainee', label: 'Trainees' }
]

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

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

function audienceChip(audience) {
  const tone =
    audience === 'trainer'
      ? { bg: ops.softIndigo, color: ops.indigoDeep }
      : audience === 'trainee'
        ? { bg: ops.canvasSoft2, color: ops.body }
        : { bg: '#AAFFEC', color: '#1A8F76' }
  return (
    <Chip
      label={audience}
      size='small'
      sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: tone.bg, color: tone.color }}
    />
  )
}

export default function TipsPage() {
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tips, setTips] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [previewRow, setPreviewRow] = useState(null)

  const searchTimer = useRef(null)

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
      const data = await listTips({
        search,
        audience: audienceFilter,
        status: statusFilter,
        page,
        pageSize
      })
      const items = data?.data?.items || []
      setTips(items.map(p => ({ ...p, id: p._id })))
      setTotal(data?.data?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load tips')
    } finally {
      setLoading(false)
    }
  }, [search, audienceFilter, statusFilter, page, pageSize])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const refreshAll = () => {
    void fetchData()
    void fetchSummary()
  }

  const handleSearchChange = value => {
    const val = value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val.trim())
      setPage(1)
    }, 400)
  }

  const applySearchImmediately = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearch(searchInput.trim())
    setPage(1)
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
      icon: row.icon || '',
      audience: row.audience || 'all',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      sort_order: String(row.sort_order ?? '0'),
      is_active: row.is_active ?? true,
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : ''
    })
    setFormOpen(true)
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required.')
    if (!form.body.trim()) return toast.error('Body is required.')
    setSaving(true)
    try {
      const body = {
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url || null,
        icon: form.icon || null,
        audience: form.audience,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date + 'T23:59:59').toISOString() : null
      }
      if (editId) {
        await updateTip(editId, body)
        toast.success('Tip updated.')
      } else {
        await createTip(body)
        toast.success('Tip created.')
      }
      setFormOpen(false)
      refreshAll()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete tip?',
      message: `"${row.title}" will be removed from the mobile home carousel.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteTip(row._id)
      toast.success('Tip deleted.')
      refreshAll()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleToggle = async row => {
    try {
      await toggleTip(row._id)
      refreshAll()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Tip',
        flex: 1.4,
        minWidth: 200,
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
              color={meta.color}
              sx={{ height: 22, fontFamily: ops.mono, fontSize: 10 }}
            />
          )
        }
      },
      {
        field: 'audience',
        headerName: 'Audience',
        width: 120,
        renderCell: p => audienceChip(p.value)
      },
      {
        field: 'cta_label',
        headerName: 'CTA',
        width: 140,
        renderCell: p => (
          <Typography sx={{ fontSize: 12, color: p.value ? ops.body : ops.mute }}>{p.value || '—'}</Typography>
        )
      },
      {
        field: 'sort_order',
        headerName: 'Order',
        width: 80,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{p.value ?? 0}</Typography>
        )
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

  return (
    <>
      <AdminPageShell
        bare
        icon='mdi:lightbulb-on-outline'
        eyebrow='CMS'
        title='Tips (offers)'
        subtitle='Home “Tips for you” carousel — filter by audience and schedule. Preview matches mobile frame.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={NextLink} href='/apps/cms' label='CMS overview' clickable variant='outlined' size='small' />
            <Chip component={NextLink} href='/apps/banners' label='Banners' clickable variant='outlined' size='small' />
            <Button
              variant='contained'
              size='small'
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
            >
              New tip
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:lightbulb-on-outline'
              label='Live tips'
              value={summary ? fmtInt(summary.live?.tips) : '—'}
              hint='Active now'
              tone='success'
              onClick={() => {
                setStatusFilter('active')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:pause-circle-outline'
              label='Inactive'
              value={summary ? fmtInt(summary.inactive?.tips) : '—'}
              hint='Paused'
              tone='warn'
              onClick={() => {
                setStatusFilter('inactive')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:filter-variant'
              label='In this view'
              value={fmtInt(total)}
              hint='Matching filters'
              tone='accent'
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:image-multiple-outline'
              label='Banners live'
              value={summary ? fmtInt(summary.live?.banners) : '—'}
              hint='Open placements'
              onClick={() => router.push('/apps/banners')}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <ContentPlacementGuide kind='tips' defaultExpanded={false} />
            <AdminFilterBar
              searchPlaceholder='Title, body, CTA, audience…'
              searchValue={searchInput}
              onSearchChange={e => handleSearchChange(e.target.value)}
              onSearchSubmit={applySearchImmediately}
              resultCount={total}
              onRefresh={refreshAll}
              refreshLoading={loading}
              helperText='Audience chips target who sees the tip on home.'
            >
              {AUDIENCE_FILTERS.map(a => (
                <FilterChip
                  key={a.value || 'any'}
                  active={audienceFilter === a.value}
                  label={a.label}
                  onClick={() => {
                    setAudienceFilter(a.value)
                    setPage(1)
                  }}
                />
              ))}
              <FilterChip
                active={statusFilter === ''}
                label='Any status'
                onClick={() => {
                  setStatusFilter('')
                  setPage(1)
                }}
              />
              <FilterChip
                active={statusFilter === 'active'}
                label='Active'
                onClick={() => {
                  setStatusFilter('active')
                  setPage(1)
                }}
              />
              <FilterChip
                active={statusFilter === 'inactive'}
                label='Inactive'
                onClick={() => {
                  setStatusFilter('inactive')
                  setPage(1)
                }}
              />
            </AdminFilterBar>
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={tips}
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
                emptyMessage='No tips match'
                emptyDescription='Try clearing audience or status chips.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      <CmsEditorDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit tip' : 'Create tip'}
        subtitle='Offers carousel + trainer dashboard list'
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
                inputProps={{ maxLength: 80 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Audience</InputLabel>
                <Select
                  label='Audience'
                  value={form.audience}
                  onChange={e => handleFormChange('audience', e.target.value)}
                >
                  <MenuItem value='all'>Everyone</MenuItem>
                  <MenuItem value='trainer'>Trainers only</MenuItem>
                  <MenuItem value='trainee'>Trainees only</MenuItem>
                </Select>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
                  {TIPS_AUDIENCE_HELP[form.audience] || ''}
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Body'
                fullWidth
                size='small'
                multiline
                minRows={3}
                value={form.body}
                onChange={e => handleFormChange('body', e.target.value)}
                inputProps={{ maxLength: 600 }}
                helperText={`${form.body.length}/600`}
              />
            </Grid>
            <Grid item xs={12}>
              <CmsImageUploader
                kind='tips'
                surfaceKey='tip.offers_carousel'
                label='Offer image (carousel thumb)'
                value={form.image_url}
                onChange={v => handleFormChange('image_url', v)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <IoniconsPicker
                label='Icon (optional)'
                value={form.icon}
                onChange={v => handleFormChange('icon', v)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='CTA label (optional)'
                fullWidth
                size='small'
                value={form.cta_label}
                onChange={e => handleFormChange('cta_label', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='CTA URL / deep link (optional)'
                fullWidth
                size='small'
                value={form.cta_url}
                onChange={e => handleFormChange('cta_url', e.target.value)}
                placeholder='netqwix://wallet or https://…'
              />
            </Grid>
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
            <Grid item xs={12}>
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
              </Grid>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 8 } }}>
              <MobileFramePreview label='App preview' subtitle='Both mobile surfaces' showDeviceToggle>
                <TipPlacementPreview form={form} />
              </MobileFramePreview>
              </Box>
            </Grid>
          </Grid>
      </CmsEditorDrawer>

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Tip preview</DialogTitle>
        <DialogContent>
          {previewRow ? (
            <MobileFramePreview label='App preview'>
              <TipPlacementPreview form={previewRow} />
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
