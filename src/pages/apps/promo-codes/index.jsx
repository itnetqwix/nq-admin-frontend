import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
  Select, Switch, TextField, Tooltip, Typography
} from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  listPromoCodes,
  getPromoAdminStats,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCode,
  togglePromoVisibility,
  getPromoCodeById
} from 'src/services/promoCodeApi'

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount_amount: '0',
  start_date: '',
  end_date: '',
  usage_limit: '0',
  per_user_limit: '0',
  applicable_user_types: ['All'],
  applicable_booking_types: ['all'],
  applicable_locations: [],
  is_active: true,
  is_visible: false,
  display_label: ''
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const SPONSOR_TABS = [
  { value: '', label: 'All promos' },
  { value: 'platform', label: 'Platform (NetQwix)' },
  { value: 'trainer', label: 'Coach-owned' }
]

function sponsorChip(row) {
  const t = row.sponsor_type || 'platform'
  if (t === 'trainer') {
    return <Chip label='Coach' size='small' color='secondary' variant='outlined' />
  }
  return <Chip label='Platform' size='small' color='primary' variant='outlined' />
}

function getStatusChip(row) {
  const now = new Date()
  if (!row.is_active) return <Chip label='Inactive' size='small' color='default' />
  if (new Date(row.end_date) < now) return <Chip label='Expired' size='small' color='error' />
  if (new Date(row.start_date) > now) return <Chip label='Upcoming' size='small' color='warning' />
  return <Chip label='Active' size='small' color='success' />
}

export default function PromoCodesPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [promos, setPromos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [sponsorTab, setSponsorTab] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const [usageOpen, setUsageOpen] = useState(false)
  const [usageData, setUsageData] = useState(null)

  const searchTimer = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query = { search, page, limit: pageSize }
      if (sponsorTab) query.sponsor_type = sponsorTab
      const [data, statsRes] = await Promise.all([
        listPromoCodes(query),
        getPromoAdminStats().catch(() => null)
      ])
      const list = data?.result?.promos || []
      setPromos(list.map(p => ({ ...p, id: p._id })))
      setTotal(data?.result?.total || 0)
      if (statsRes?.result) setStats(statsRes.result)
      else if (statsRes && !statsRes.result) setStats(statsRes)
    } catch (err) {
      toast.error(err.message || 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, sponsorTab])

  useEffect(() => { fetchData() }, [fetchData])

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
      code: row.code || '',
      description: row.description || '',
      discount_type: row.discount_type || 'percentage',
      discount_value: String(row.discount_value ?? ''),
      min_order_amount: String(row.min_order_amount ?? '0'),
      max_discount_amount: String(row.max_discount_amount ?? '0'),
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
      usage_limit: String(row.usage_limit ?? '0'),
      per_user_limit: String(row.per_user_limit ?? '0'),
      applicable_user_types: row.applicable_user_types || ['All'],
      applicable_booking_types: row.applicable_booking_types || ['all'],
      applicable_locations: row.applicable_locations || [],
      is_active: row.is_active ?? true,
      is_visible: row.is_visible ?? false,
      display_label: row.display_label || ''
    })
    setFormOpen(true)
  }

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error('Promo code is required.')
    if (!form.discount_value || Number(form.discount_value) <= 0) return toast.error('Discount value must be greater than 0.')
    if (!form.start_date || !form.end_date) return toast.error('Start and end dates are required.')
    if (new Date(form.end_date) <= new Date(form.start_date)) return toast.error('End date must be after start date.')

    setSaving(true)
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_discount_amount: Number(form.max_discount_amount) || 0,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date + 'T23:59:59').toISOString(),
        usage_limit: Number(form.usage_limit) || 0,
        per_user_limit: Number(form.per_user_limit) || 0,
        applicable_user_types: form.applicable_user_types,
        applicable_booking_types: form.applicable_booking_types,
        applicable_locations: form.applicable_locations,
        is_active: form.is_active,
        is_visible: form.is_visible,
        display_label: form.display_label
      }

      if (editId) {
        await updatePromoCode(editId, body)
        toast.success('Promo code updated.')
      } else {
        await createPromoCode(body)
        toast.success('Promo code created.')
      }
      setFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete promo code?',
      message: `"${row.code}" will be deactivated and removed from the list.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deletePromoCode(row._id)
      toast.success('Promo code deleted.')
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const handleToggleActive = async row => {
    try {
      await togglePromoCode(row._id)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const handleToggleVisible = async row => {
    try {
      await togglePromoVisibility(row._id)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Toggle failed')
    }
  }

  const handleViewUsage = async row => {
    try {
      const data = await getPromoCodeById(row._id)
      setUsageData(data?.result || row)
      setUsageOpen(true)
    } catch (err) {
      toast.error(err.message || 'Failed to load usage data')
    }
  }

  const columns = useMemo(() => [
    {
      field: 'code',
      headerName: 'Code',
      flex: 1,
      minWidth: 120,
      renderCell: p => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>{p.value}</Typography>
          <Tooltip title='Copy code'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(p.value); toast.success('Copied!') }}>
              <ContentCopyIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'sponsor_type',
      headerName: 'Sponsor',
      width: 110,
      renderCell: p => sponsorChip(p.row)
    },
    {
      field: 'display_label',
      headerName: 'Label',
      flex: 1.2,
      minWidth: 140,
      renderCell: p => p.value || <Typography color='text.disabled'>--</Typography>
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 120,
      renderCell: p => {
        const r = p.row
        return r.discount_type === 'percentage'
          ? `${r.discount_value}%`
          : `$${r.discount_value}`
      }
    },
    {
      field: 'usage',
      headerName: 'Usage',
      width: 110,
      renderCell: p => `${p.row.usage_count || 0} / ${p.row.usage_limit || '∞'}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: p => getStatusChip(p.row)
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
      renderCell: p => (
        <Switch
          size='small'
          checked={!!p.value}
          onChange={() => handleToggleActive(p.row)}
          onClick={e => e.stopPropagation()}
        />
      )
    },
    {
      field: 'is_visible',
      headerName: 'Visible',
      width: 80,
      renderCell: p => (
        <Switch
          size='small'
          checked={!!p.value}
          onChange={() => handleToggleVisible(p.row)}
          onClick={e => e.stopPropagation()}
        />
      )
    },
    {
      field: 'date_range',
      headerName: 'Date Range',
      width: 190,
      renderCell: p => {
        const s = p.row.start_date ? new Date(p.row.start_date).toLocaleDateString() : '?'
        const e = p.row.end_date ? new Date(p.row.end_date).toLocaleDateString() : '?'
        return `${s} - ${e}`
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: p => (
        <Box>
          <Tooltip title='View Usage'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); handleViewUsage(p.row) }}>
              <VisibilityIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); openEdit(p.row) }}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); void requestDelete(p.row) }}>
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ], [])

  const usageColumns = useMemo(() => [
    { field: 'user', headerName: 'User', flex: 1, renderCell: p => p.row.user_id?.fullname || p.row.user_id?.email || String(p.row.user_id) },
    { field: 'discount_applied', headerName: 'Discount', width: 100, renderCell: p => `$${p.value || 0}` },
    { field: 'used_at', headerName: 'Date', width: 160, renderCell: p => p.value ? new Date(p.value).toLocaleString() : '--' },
    { field: 'booking_id', headerName: 'Booking ID', flex: 1, renderCell: p => String(p.value || '--') }
  ], [])

  const usageRows = useMemo(() =>
    (usageData?.used_by || []).map((u, i) => ({ ...u, id: u._id || `u${i}` })),
    [usageData]
  )

  return (
    <>
      <AdminPageShell
        icon='mdi:tag-multiple-outline'
        title='Promo codes'
        subtitle='Platform promos (NetQwix-funded) and coach-owned promos. Coach codes only apply to that coach’s bookings.'
        actions={
          <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}>
            Create Promo Code
          </Button>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          {stats ? (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Typography variant='caption' color='text.secondary'>Platform active</Typography>
                <Typography fontWeight={700}>{stats.platformActive ?? 0} / {stats.platformTotal ?? 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant='caption' color='text.secondary'>Coach promos active</Typography>
                <Typography fontWeight={700}>{stats.trainerActive ?? 0} / {stats.trainerTotal ?? 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant='caption' color='text.secondary'>Total redemptions</Typography>
                <Typography fontWeight={700}>{stats.totalRedemptions ?? 0}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant='caption' color='text.secondary'>Expiring (7 days)</Typography>
                <Typography fontWeight={700}>{stats.expiringSoon ?? 0}</Typography>
              </Grid>
            </Grid>
          ) : null}
          <AdminTabs
            value={sponsorTab}
            onChange={v => { setSponsorTab(v); setPage(1) }}
            tabs={SPONSOR_TABS.map(t => ({ value: t.value, label: t.label }))}
          />
          <AdminFilterBar
            searchPlaceholder='Search by code, label, or description…'
            onSearchChange={handleSearchChange}
            resultCount={total}
            onRefresh={() => void fetchData()}
            refreshLoading={loading}
          />
          <AdminDataGrid
            rows={promos}
            columns={columns}
            loading={loading}
            rowCount={total}
            paginationMode='server'
            paginationModel={{ page: page - 1, pageSize }}
            onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
            sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
          />
        </AdminPageSection>
      </AdminPageShell>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editId ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Code'
                fullWidth
                size='small'
                value={form.code}
                onChange={e => handleFormChange('code', e.target.value.toUpperCase())}
                disabled={!!editId}
                InputProps={{
                  endAdornment: !editId ? (
                    <Button size='small' onClick={() => handleFormChange('code', generateCode())}>Generate</Button>
                  ) : null
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label='Display Label' fullWidth size='small' value={form.display_label} onChange={e => handleFormChange('display_label', e.target.value)} placeholder='e.g. Summer Sale 25% Off' />
            </Grid>
            <Grid item xs={12}>
              <TextField label='Description' fullWidth size='small' multiline rows={2} value={form.description} onChange={e => handleFormChange('description', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Discount Type</InputLabel>
                <Select label='Discount Type' value={form.discount_type} onChange={e => handleFormChange('discount_type', e.target.value)}>
                  <MenuItem value='percentage'>Percentage (%)</MenuItem>
                  <MenuItem value='fixed_amount'>Fixed Amount ($)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label={form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount ($)'}
                fullWidth size='small' type='number'
                value={form.discount_value}
                onChange={e => handleFormChange('discount_value', e.target.value)}
                inputProps={{ min: 0, max: form.discount_type === 'percentage' ? 100 : undefined }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='Max Discount ($)' fullWidth size='small' type='number' value={form.max_discount_amount} onChange={e => handleFormChange('max_discount_amount', e.target.value)} helperText='0 = no cap (percentage only)' inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='Min Order Amount ($)' fullWidth size='small' type='number' value={form.min_order_amount} onChange={e => handleFormChange('min_order_amount', e.target.value)} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='Start Date' fullWidth size='small' type='date' InputLabelProps={{ shrink: true }} value={form.start_date} onChange={e => handleFormChange('start_date', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='End Date' fullWidth size='small' type='date' InputLabelProps={{ shrink: true }} value={form.end_date} onChange={e => handleFormChange('end_date', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='Usage Limit' fullWidth size='small' type='number' value={form.usage_limit} onChange={e => handleFormChange('usage_limit', e.target.value)} helperText='0 = unlimited' inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label='Per User Limit' fullWidth size='small' type='number' value={form.per_user_limit} onChange={e => handleFormChange('per_user_limit', e.target.value)} helperText='0 = unlimited' inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>User Types</InputLabel>
                <Select label='User Types' multiple value={form.applicable_user_types} onChange={e => handleFormChange('applicable_user_types', e.target.value)} renderValue={v => v.join(', ')}>
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='Trainee'>Trainee</MenuItem>
                  <MenuItem value='Trainer'>Trainer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Booking Types</InputLabel>
                <Select label='Booking Types' multiple value={form.applicable_booking_types} onChange={e => handleFormChange('applicable_booking_types', e.target.value)} renderValue={v => v.join(', ')}>
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='instant'>Instant</MenuItem>
                  <MenuItem value='scheduled'>Scheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Locations (comma-separated)'
                fullWidth size='small'
                value={(form.applicable_locations || []).join(', ')}
                onChange={e => handleFormChange('applicable_locations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                helperText='Leave empty for all locations'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={e => handleFormChange('is_active', e.target.checked)} />}
                label='Active'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.is_visible} onChange={e => handleFormChange('is_visible', e.target.checked)} />}
                label='Visible to users (shown as available promo)'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving} sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {ConfirmDialog}

      {/* Usage Detail Dialog */}
      <Dialog open={usageOpen} onClose={() => setUsageOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          Usage History {usageData?.code ? `- ${usageData.code}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {usageData && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Total Uses</Typography>
                  <Typography variant='h6'>{usageData.usage_count || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Limit</Typography>
                  <Typography variant='h6'>{usageData.usage_limit || '∞'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Discount</Typography>
                  <Typography variant='h6'>
                    {usageData.discount_type === 'percentage' ? `${usageData.discount_value}%` : `$${usageData.discount_value}`}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(usageData)}</Box>
                </Grid>
              </Grid>
            </Box>
          )}
          <AdminDataGrid
            rows={usageRows}
            columns={usageColumns}
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
          {usageRows.length === 0 && (
            <Typography color='text.secondary' textAlign='center' sx={{ py: 4 }}>
              No usage records yet.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsageOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
