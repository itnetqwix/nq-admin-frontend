import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Avatar,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NextLink from 'next/link'
import toast from 'react-hot-toast'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  useAdminConfirm
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import UserQuickPreviewModal from 'src/components/user360/UserQuickPreviewModal'
import { getUser360 } from 'src/services/user360Api'
import { deleteUser, listUsers } from 'src/services/userAdminApi'
import { getImageUrl } from 'src/utils/utils'

const TYPE_FILTERS = [
  { value: '', label: 'All accounts' },
  { value: 'trainer', label: 'Trainers' },
  { value: 'trainee', label: 'Trainees' }
]

const STATUS_COLORS = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
  blocked: 'error'
}

export default function UsersDirectoryPage() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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
        account_type: typeFilter,
        status: statusFilter
      })
      setRows(data.items)
      setTotal(data.total)
    } catch (e) {
      toast.error(e?.message || 'Failed to load users')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, typeFilter, statusFilter])

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
      message: 'This cannot be undone. Consider account deletions for soft-delete workflow.',
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

  const columns = useMemo(
    () => [
      {
        field: 'image',
        headerName: '',
        width: 72,
        sortable: false,
        renderCell: params => (
          <Avatar
            alt={params.row.fullname || 'User'}
            src={getImageUrl(params.row.profile_picture)}
            sx={{ width: 44, height: 44 }}
          />
        )
      },
      { field: 'fullname', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      { field: 'mobile_no', headerName: 'Mobile', width: 130 },
      {
        field: 'account_type',
        headerName: 'Type',
        width: 100,
        renderCell: p => (
          <Chip
            size='small'
            label={p.value === 'trainer' ? 'Trainer' : 'Trainee'}
            color={p.value === 'trainer' ? 'primary' : 'secondary'}
            variant='outlined'
          />
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: p => (
          <Chip
            size='small'
            label={p.value || '—'}
            color={STATUS_COLORS[String(p.value || '').toLowerCase()] || 'default'}
          />
        )
      },
      { field: 'wallet_amount', headerName: 'Wallet', width: 100 },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        renderCell: params => (
          <Stack direction='row' spacing={0.5}>
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
        icon='mdi:account-search-outline'
        title='All users'
        subtitle='Unified directory — click a row for User 360 (support, billing, moderation).'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={NextLink} href='/apps/trainer-verifications' label='Verifications' clickable variant='outlined' size='small' />
            <Chip component={NextLink} href='/apps/trainee-account-reviews' label='Trainee reviews' clickable variant='outlined' size='small' />
            <Chip component={NextLink} href='/apps/account-deletions' label='Deletions' clickable variant='outlined' size='small' />
          </Stack>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name, email, or mobile…'
            searchValue={searchInput}
            onSearchChange={e => {
              const val = e.target.value
              setSearchInput(val)
              scheduleSearch(val)
            }}
            onRefresh={() => void load()}
            refreshLoading={loading}
            resultCount={total}
            helperText='Click any row to open the full User 360 console.'
          >
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Account type</InputLabel>
              <Select
                label='Account type'
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
              >
                {TYPE_FILTERS.map(t => (
                  <MenuItem key={t.value || 'all'} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 140 }}>
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
                <MenuItem value='approved'>approved</MenuItem>
                <MenuItem value='pending'>pending</MenuItem>
                <MenuItem value='rejected'>rejected</MenuItem>
                <MenuItem value='blocked'>blocked</MenuItem>
              </Select>
            </FormControl>
          </AdminFilterBar>

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
            />
          </AdminGridContainer>
        </AdminPageSection>
      </AdminPageShell>
      {ConfirmDialog}
    </>
  )
}
