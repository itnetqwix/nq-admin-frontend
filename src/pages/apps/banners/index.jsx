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
import toast from 'react-hot-toast'

import styles from 'styles/common.module.css'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import BannerCtaEditor from 'src/components/admin/content/BannerCtaEditor'
import BannerPlacementPreview from 'src/components/admin/content/BannerPlacementPreview'
import CmsImageUploader from 'src/components/admin/content/CmsImageUploader'
import { computeScheduleStatus, scheduleStatusChip } from 'src/components/admin/content/scheduleStatus'
import { BANNERS_AUDIENCE_HELP } from 'src/components/admin/content/contentPlacementConfig'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import DeletePopup from 'src/pages/components/modal/DeletePopup'
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner
} from 'src/services/bannersApi'

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
  end_date: ''
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
  const colorMap = {
    info: 'info',
    promo: 'secondary',
    maintenance: 'warning',
    critical: 'error',
    success: 'success'
  }

  return <Chip label={s} size='small' color={colorMap[s] || 'default'} />
}

export default function BannersPage() {
  const [banners, setBanners] = useState([])
  const [total, setTotal] = useState(0)
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
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
    fetchData()
  }, [fetchData])

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
      end_date: row.end_date ? row.end_date.slice(0, 10) : ''
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
        end_date: form.end_date ? new Date(form.end_date + 'T23:59:59').toISOString() : null
      }
      if (editId) {
        await updateBanner(editId, body)
        toast.success('Banner updated.')
      } else {
        await createBanner(body)
        toast.success('Banner created.')
      }
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBanner(deleteTarget._id)
      toast.success('Banner deleted.')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async row => {
    try {
      await toggleBanner(row._id)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Title',
        flex: 1.6,
        minWidth: 240,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => (
          <Box>
            <Typography fontWeight={600}>{p.value}</Typography>
            <Typography variant='caption' color='text.secondary' noWrap>
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
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => {
          const status = computeScheduleStatus(p.row)
          const meta = scheduleStatusChip(status)

          return <Chip label={meta.label} size='small' color={meta.color} />
        }
      },
      {
        field: 'placement',
        headerName: 'Placement',
        width: 130,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => <Chip label={p.value || 'hero'} size='small' color='primary' variant='outlined' />
      },
      {
        field: 'audience',
        headerName: 'Audience',
        width: 200,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(p.value || []).map(a => (
              <Chip key={a} label={a} size='small' />
            ))}
          </Box>
        )
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 120,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => severityChip(p.value)
      },
      {
        field: 'is_active',
        headerName: 'Active',
        width: 100,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
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
        width: 190,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => {
          const s = p.row.start_date ? new Date(p.row.start_date).toLocaleDateString() : 'Always'
          const e = p.row.end_date ? new Date(p.row.end_date).toLocaleDateString() : 'Always'

          return `${s} - ${e}`
        }
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 140,
        sortable: false,
        headerClassName: styles['header-class-last'],
        cellClassName: styles['cell-class-last'],
        renderCell: p => (
          <Box>
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
                  setDeleteTarget(p.row)
                }}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
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
        title='Banners'
        subtitle='Hero carousel, announcement strip, and sticky promo on mobile + web dashboard home. Upload images or paste URL/S3 key. Use guest + all for sign-in promos.'
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button component={NextLink} href='/apps/tips' variant='outlined' size='small'>
              Manage tips
            </Button>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
            >
              New banner
            </Button>
          </Box>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <ContentPlacementGuide kind='banners' />
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size='small'
              placeholder='Search title, body, CTA, audience…'
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') applySearchImmediately()
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={clearSearch} edge='end'>
                      <CloseIcon fontSize='small' />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Audience</InputLabel>
              <Select
                label='Audience'
                value={audienceFilter}
                onChange={e => {
                  setAudienceFilter(e.target.value)
                  setPage(1)
                }}
              >
                <MenuItem value=''>All</MenuItem>
                {AUDIENCES.map(a => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Placement</InputLabel>
              <Select
                label='Placement'
                value={placementFilter}
                onChange={e => {
                  setPlacementFilter(e.target.value)
                  setPage(1)
                }}
              >
                <MenuItem value=''>All</MenuItem>
                {PLACEMENTS.map(p => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 160 }}>
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
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <AdminDataGrid
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
            getRowClassName={p => (p.indexRelativeToCurrentPage % 2 === 0 ? styles['even-row'] : styles['odd-row'])}
            sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
            getRowHeight={() => 72}
          />
        </AdminPageSection>
      </AdminPageShell>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editId ? 'Edit banner' : 'Create banner'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
                      <ListItemText primary={p.label} secondary={p.hint} />
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
            <Grid item xs={12}>
              <BannerPlacementPreview form={form} />
            </Grid>
            {form.placement === 'hero' ? (
              <Grid item xs={12} sm={4}>
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
                value={form.image_url}
                onChange={v => handleFormChange('image_url', v)}
              />
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
          >
            {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {previewRow
            ? `Preview · ${PLACEMENTS.find(p => p.value === (previewRow.placement || 'hero'))?.label || previewRow.placement}`
            : 'Banner preview'}
        </DialogTitle>
        <DialogContent>
          {previewRow ? <BannerPlacementPreview form={previewRow} showLabel={false} /> : null}
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

      <DeletePopup
        open={!!deleteTarget}
        handleClose={() => setDeleteTarget(null)}
        onConform={handleDelete}
        isLoading={deleting}
      />
    </>
  )
}
