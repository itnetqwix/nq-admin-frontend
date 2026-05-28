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
import TipPreviewCard from 'src/components/admin/content/TipPreviewCard'
import { computeScheduleStatus, scheduleStatusChip } from 'src/components/admin/content/scheduleStatus'
import { TIPS_AUDIENCE_HELP } from 'src/components/admin/content/contentPlacementConfig'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import DeletePopup from 'src/pages/components/modal/DeletePopup'
import { listTips, createTip, updateTip, deleteTip, toggleTip } from 'src/services/tipsApi'

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

function audienceChip(audience) {
  const color = audience === 'trainer' ? 'primary' : audience === 'trainee' ? 'secondary' : 'default'

  return <Chip label={audience} size='small' color={color} />
}

export default function TipsPage() {
  const [tips, setTips] = useState([])
  const [total, setTotal] = useState(0)
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
      await deleteTip(deleteTarget._id)
      toast.success('Tip deleted.')
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
      await toggleTip(row._id)
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
        flex: 1.4,
        minWidth: 200,
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
        field: 'audience',
        headerName: 'Audience',
        width: 120,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => audienceChip(p.value)
      },
      {
        field: 'cta_label',
        headerName: 'CTA',
        width: 140,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class'],
        renderCell: p => p.value || <Typography color='text.disabled'>--</Typography>
      },
      {
        field: 'sort_order',
        headerName: 'Order',
        width: 80,
        headerClassName: styles['header-class'],
        cellClassName: styles['cell-class']
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
        title='Tips'
        subtitle='Coaching cards in the mobile home “Tips for you” carousel. Use audience + schedule to target trainee vs trainer homes (and guest browse for “Everyone”).'
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button component={NextLink} href='/apps/banners' variant='outlined' size='small'>
              Manage banners
            </Button>
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
            >
              New tip
            </Button>
          </Box>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <ContentPlacementGuide kind='tips' />
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
                <MenuItem value='all'>Everyone</MenuItem>
                <MenuItem value='trainer'>Trainers only</MenuItem>
                <MenuItem value='trainee'>Trainees only</MenuItem>
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
            getRowClassName={p => (p.indexRelativeToCurrentPage % 2 === 0 ? styles['even-row'] : styles['odd-row'])}
            sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
            getRowHeight={() => 72}
          />
        </AdminPageSection>
      </AdminPageShell>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editId ? 'Edit tip' : 'Create tip'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
              <Typography variant='subtitle2' gutterBottom>
                Mobile preview
              </Typography>
              <TipPreviewCard form={form} />
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
                label='Icon (optional, Ionicons name)'
                fullWidth
                size='small'
                value={form.icon}
                onChange={e => handleFormChange('icon', e.target.value)}
                placeholder='bulb-outline, megaphone-outline, …'
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

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Tip preview</DialogTitle>
        <DialogContent>
          {previewRow ? <TipPreviewCard form={previewRow} /> : null}
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
