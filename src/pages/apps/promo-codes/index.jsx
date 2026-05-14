<<<<<<< HEAD
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
  Select, Stack, Switch, TextField, Tooltip, Typography
} from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminTabs from 'src/components/admin/AdminTabs'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { useAdminConfirm } from 'src/components/admin'
=======
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem,
  Select, Switch, TextField, Tooltip, Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'
<<<<<<< HEAD
import Link from 'next/link'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { ops } from 'src/styles/opsSurface'
import MiniSparkline, { sparkFromUsedBy, fillDailySeries } from 'src/components/admin/MiniSparkline'
import {
  listPromoCodes,
  getPromoAdminStats,
=======

import styles from 'styles/common.module.css'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import DeletePopup from 'src/pages/components/modal/DeletePopup'
import {
  listPromoCodes,
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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

<<<<<<< HEAD
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

=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
function getStatusChip(row) {
  const now = new Date()
  if (!row.is_active) return <Chip label='Inactive' size='small' color='default' />
  if (new Date(row.end_date) < now) return <Chip label='Expired' size='small' color='error' />
  if (new Date(row.start_date) > now) return <Chip label='Upcoming' size='small' color='warning' />
  return <Chip label='Active' size='small' color='success' />
}

export default function PromoCodesPage() {
<<<<<<< HEAD
  const ability = useContext(AbilityContext)
  const fullAccess = ability?.can('manage', 'all') ?? false
  const canCreate = fullAccess || (ability?.can('create', 'admin-action-promo') ?? false)
  const canUpdate = fullAccess || (ability?.can('update', 'admin-action-promo') ?? false)
  const canDelete = fullAccess || (ability?.can('delete', 'admin-action-promo') ?? false)
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [promos, setPromos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [sponsorTab, setSponsorTab] = useState('')
=======
  const [promos, setPromos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

<<<<<<< HEAD
=======
  const [deleteTarget, setDeleteTarget] = useState(null)
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
  const [usageOpen, setUsageOpen] = useState(false)
  const [usageData, setUsageData] = useState(null)

  const searchTimer = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
<<<<<<< HEAD
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
=======
      const data = await listPromoCodes({ search, page, limit: pageSize })
      const list = data?.result?.promos || []
      setPromos(list.map(p => ({ ...p, id: p._id })))
      setTotal(data?.result?.total || 0)
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    } catch (err) {
      toast.error(err.message || 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
<<<<<<< HEAD
  }, [search, page, pageSize, sponsorTab])
=======
  }, [search, page, pageSize])
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)

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
<<<<<<< HEAD
    if (!canCreate) {
      toast.error('You cannot create promo codes')
      return
    }
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }

  const openEdit = row => {
<<<<<<< HEAD
    if (!canUpdate) {
      toast.error('You cannot edit promo codes')
      return
    }
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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

<<<<<<< HEAD
  const requestDelete = async row => {
    if (!canDelete) {
      toast.error('You cannot delete promo codes')
      return
    }
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
=======
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePromoCode(deleteTarget._id)
      toast.success('Promo code deleted.')
      setDeleteTarget(null)
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
      field: 'sponsor_type',
      headerName: 'Sponsor',
      width: 110,
      renderCell: p => sponsorChip(p.row)
    },
    {
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      field: 'display_label',
      headerName: 'Label',
      flex: 1.2,
      minWidth: 140,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => p.value || <Typography color='text.disabled'>--</Typography>
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 120,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
      renderCell: p => `${p.row.usage_count || 0} / ${p.row.usage_limit || '∞'}`
    },
    {
      field: 'usage_spark',
      headerName: '14d',
      width: 90,
      sortable: false,
      renderCell: p => <MiniSparkline values={sparkFromUsedBy(p.row.used_by, 14)} />
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
=======
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
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => getStatusChip(p.row)
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
=======
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => (
        <Box>
          <Tooltip title='View Usage'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); handleViewUsage(p.row) }}>
              <VisibilityIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Edit'>
<<<<<<< HEAD
            <IconButton size='small' disabled={!canUpdate} onClick={e => { e.stopPropagation(); openEdit(p.row) }}>
=======
            <IconButton size='small' onClick={e => { e.stopPropagation(); openEdit(p.row) }}>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
<<<<<<< HEAD
            <IconButton size='small' color='error' disabled={!canDelete} onClick={e => { e.stopPropagation(); void requestDelete(p.row) }}>
=======
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); setDeleteTarget(p.row) }}>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
<<<<<<< HEAD
  ], [canUpdate, canDelete])
=======
  ], [])
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)

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
<<<<<<< HEAD
        bare
        eyebrow='Revenue · promos'
        icon='mdi:tag-multiple-outline'
        title='Promo codes.'
        subtitle='Platform (NetQwix-funded) and coach-owned codes. Create / edit / delete respect RBAC.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={Link} href='/apps/pricing' label='Pricing' clickable variant='outlined' size='small' />
            {canCreate ? (
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
              >
                Create promo
              </Button>
            ) : (
              <Chip label='View only' size='small' sx={{ fontFamily: ops.mono }} />
            )}
          </Stack>
        }
      >
        <AdminPageSection>
          {stats ? (
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={6} md={3}>
                <OpsMetricTile
                  icon='mdi:tag'
                  label='Platform active'
                  value={`${stats.platformActive ?? 0}/${stats.platformTotal ?? 0}`}
                  tone='accent'
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <OpsMetricTile
                  icon='mdi:account-tie'
                  label='Coach active'
                  value={`${stats.trainerActive ?? 0}/${stats.trainerTotal ?? 0}`}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <OpsMetricTile icon='mdi:ticket-confirmation' label='Redemptions' value={String(stats.totalRedemptions ?? 0)} />
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 1 }}>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute, mb: 0.5 }}>14d trend</Typography>
                  <MiniSparkline
                    values={
                      Array.isArray(stats.dailyRedemptions)
                        ? fillDailySeries(stats.dailyRedemptions, 14, 'count')
                        : []
                    }
                    width={96}
                    height={28}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <OpsMetricTile
                  icon='mdi:clock-alert'
                  label='Expiring (7d)'
                  value={String(stats.expiringSoon ?? 0)}
                  tone={(stats.expiringSoon ?? 0) > 0 ? 'warn' : 'default'}
                />
              </Grid>
            </Grid>
          ) : null}
          <AdminTabs
            value={sponsorTab}
            onChange={v => { setSponsorTab(v); setPage(1) }}
            tabs={SPONSOR_TABS.map(t => ({ value: t.value, label: t.label }))}
          />
          <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
              <AdminFilterBar
                searchPlaceholder='Search by code, label, or description…'
                onSearchChange={handleSearchChange}
                resultCount={total}
                onRefresh={() => void fetchData()}
                refreshLoading={loading}
              />
            </Box>
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={promos}
                columns={columns}
                loading={loading}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
                sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
                emptyMessage='No promo codes in this view.'
              />
            </AdminGridContainer>
          </OpsSurfaceCard>
=======
        title='Promo Codes'
        subtitle='Create and manage promotional codes for bookings. Control discounts, validity periods, usage limits, and user visibility.'
        actions={
          <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}>
            Create Promo Code
          </Button>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <TextField
            size='small'
            placeholder='Search by code, label, or description...'
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: 320 }, mb: 2 }}
          />
          <DataGrid
            rows={promos}
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
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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

<<<<<<< HEAD
      {ConfirmDialog}
=======
      {/* Delete Confirmation */}
      <DeletePopup
        open={!!deleteTarget}
        setOpen={() => setDeleteTarget(null)}
        onClick={handleDelete}
      />
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)

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
<<<<<<< HEAD
          <AdminDataGrid
            rows={usageRows}
            columns={usageColumns}
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
=======
          <DataGrid
            rows={usageRows}
            columns={usageColumns}
            autoHeight
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
