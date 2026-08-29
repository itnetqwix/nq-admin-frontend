import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, Switch, TextField, Tooltip, Typography
} from '@mui/material'
import Link from 'next/link'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'

import styles from 'styles/common.module.css'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import DeletePopup from 'src/pages/components/modal/DeletePopup'
import PromoCodeFormDialog from 'src/features/promo/components/PromoCodeFormDialog'
import { PromoFlowStrip } from 'src/features/promo/components/PromoFlowStrip'
import { BOOKING_TYPE_OPTIONS, formatBookingTypes } from 'src/constants/revenueAdmin'
import {
  listPromoCodes,
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

function getStatusChip(row) {
  const now = new Date()
  if (!row.is_active) return <Chip label='Inactive' size='small' color='default' />
  if (new Date(row.end_date) < now) return <Chip label='Expired' size='small' color='error' />
  if (new Date(row.start_date) > now) return <Chip label='Upcoming' size='small' color='warning' />
  return <Chip label='Active' size='small' color='success' />
}

export default function PromoCodesPage() {
  const [promos, setPromos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [usageOpen, setUsageOpen] = useState(false)
  const [usageData, setUsageData] = useState(null)

  const searchTimer = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listPromoCodes({ search, page, limit: pageSize })
      const list = data?.result?.promos || []
      setPromos(list.map(p => ({ ...p, id: p._id })))
      setTotal(data?.result?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize])

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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePromoCode(deleteTarget._id)
      toast.success('Promo code deleted.')
      setDeleteTarget(null)
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
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
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
      field: 'display_label',
      headerName: 'Label',
      flex: 1.2,
      minWidth: 140,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => p.value || <Typography color='text.disabled'>--</Typography>
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 120,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => {
        const r = p.row
        return r.discount_type === 'percentage'
          ? `${r.discount_value}%`
          : `$${r.discount_value}`
      }
    },
    {
      field: 'booking_types',
      headerName: 'Applies to',
      width: 160,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => (
        <Typography variant='body2' sx={{ fontSize: 12 }}>
          {formatBookingTypes(p.row.applicable_booking_types)}
        </Typography>
      )
    },
    {
      field: 'usage',
      headerName: 'Usage',
      width: 110,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => `${p.row.usage_count || 0} / ${p.row.usage_limit || '∞'}`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => getStatusChip(p.row)
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
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
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
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
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
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
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
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
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); setDeleteTarget(p.row) }}>
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

  const filteredPromos = useMemo(() => {
    if (bookingTypeFilter === 'all') return promos
    return promos.filter(p => {
      const types = p.applicable_booking_types || ['all']
      return types.includes('all') || types.includes(bookingTypeFilter)
    })
  }, [promos, bookingTypeFilter])

  return (
    <>
      <AdminPageShell
        title='Promo codes'
        subtitle='Discount codes for lesson checkout and live session extensions. Use presets or scope by booking type.'
        actions={
          <Stack direction='row' spacing={1}>
            <Button component={Link} href='/apps/pricing?tab=locker' variant='outlined' size='small' sx={{ textTransform: 'none' }}>
              Locker extension %
            </Button>
            <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}>
              Create promo
            </Button>
          </Stack>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <PromoFlowStrip />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
            <TextField
              size='small'
              placeholder='Search code, label, description…'
              onChange={handleSearchChange}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
            <Chip
              label='All'
              size='small'
              color={bookingTypeFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setBookingTypeFilter('all')}
              sx={{ cursor: 'pointer' }}
            />
            {BOOKING_TYPE_OPTIONS.filter(o => o.value !== 'all').map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                size='small'
                color={bookingTypeFilter === opt.value ? 'primary' : 'default'}
                onClick={() => setBookingTypeFilter(opt.value)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          <DataGrid
            rows={filteredPromos}
            columns={columns}
            loading={loading}
            rowCount={total}
            paginationMode='server'
            paginationModel={{ page: page - 1, pageSize }}
            onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? styles['even-row'] : styles['odd-row']}
            sx={{ border: 'none', '& .MuiDataGrid-cell': { py: 1 } }}
          />
        </AdminPageSection>
      </AdminPageShell>

      <PromoCodeFormDialog
        open={formOpen}
        editId={editId}
        form={form}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onChange={handleFormChange}
        onSave={handleSave}
        onGenerateCode={() => handleFormChange('code', generateCode())}
      />

      {/* Delete Confirmation */}
      <DeletePopup
        open={!!deleteTarget}
        setOpen={() => setDeleteTarget(null)}
        onClick={handleDelete}
      />

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
          <DataGrid
            rows={usageRows}
            columns={usageColumns}
            autoHeight
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
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
