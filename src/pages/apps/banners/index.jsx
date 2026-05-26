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
  ListItemText,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import toast from 'react-hot-toast'

import styles from 'styles/common.module.css'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
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

const EMPTY_FORM = {
  title: '',
  body: '',
  image_url: '',
  audience: ['all'],
  severity: 'info',
  cta_label: '',
  cta_url: '',
  dismissible: true,
  is_active: true,
  sort_order: '0',
  start_date: '',
  end_date: ''
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
  const [audienceFilter, setAudienceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const searchTimer = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listBanners({
        search,
        audience: audienceFilter,
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
  }, [search, audienceFilter, statusFilter, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearchChange = e => {
    const val = e.target.value
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
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
      const body = {
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url || null,
        audience: form.audience,
        severity: form.severity,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
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
    try {
      await deleteBanner(deleteTarget._id)
      toast.success('Banner deleted.')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
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
        width: 110,
        sortable: false,
        headerClassName: styles['header-class-last'],
        cellClassName: styles['cell-class-last'],
        renderCell: p => (
          <Box>
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
        subtitle='Announcement banners shown at the top of the mobile home screen. Tag with audience=guest to show on the login screen too.'
        actions={
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
          >
            New banner
          </Button>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size='small'
              placeholder='Search by title or body…'
              onChange={handleSearchChange}
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
                      <ListItemText primary={a} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Image URL (optional)'
                fullWidth
                size='small'
                value={form.image_url}
                onChange={e => handleFormChange('image_url', e.target.value)}
                placeholder='https://…'
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

      <DeletePopup open={!!deleteTarget} setOpen={() => setDeleteTarget(null)} onClick={handleDelete} />
    </>
  )
}
