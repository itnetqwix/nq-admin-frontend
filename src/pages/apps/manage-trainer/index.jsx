import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Avatar,
  Box,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import Link from 'next/link'
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
import TrainerStatus from 'src/pages/components/trainer-status'
import MModal from 'src/pages/components/modal/Modal'
import AddEditCommision from 'src/pages/components/add-edit-commision'
import { getUser360 } from 'src/services/user360Api'
import { deleteUser, listUsers } from 'src/services/userAdminApi'
import { getImageUrl } from 'src/utils/utils'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'
import { FilterChip, fmtInt, STATUS_CHIPS } from 'src/features/users/chips'

export default function ManageTrainer() {
  const router = useRouter()
  const searchTimerRef = useRef(null)
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const kycQuery = router.isReady ? String(router.query?.kyc || '') : ''
  const kycFilter = kycQuery === 'incomplete' || kycQuery === '0' ? 'incomplete' : ''

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState({})
  const [previewUserId, setPreviewUserId] = useState(null)
  const [commissionId, setCommissionId] = useState(null)

  const load = useCallback(async () => {
    if (!router.isReady) return
    setLoading(true)
    try {
      const data = await listUsers({
        page,
        limit: pageSize,
        search,
        account_type: 'trainer',
        status: statusFilter,
        kyc: kycFilter
      })
      setRows(data.items)
      setTotal(data.total)
      setCounts(data.counts)
    } catch (e) {
      toast.error(e?.message || 'Failed to load trainers')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [router.isReady, page, pageSize, search, statusFilter, kycFilter])

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

  const setKyc = incomplete => {
    const query = { ...router.query }
    if (incomplete) query.kyc = 'incomplete'
    else delete query.kyc
    void router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
    setPage(1)
  }

  const openPreview = async (e, id) => {
    e?.stopPropagation?.()
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
    e?.stopPropagation?.()
    const ok = await confirm({
      title: 'Delete trainer account?',
      message: 'This permanently removes the user and cannot be undone.',
      detail: name || id,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteUser(id)
      toast.success('Trainer deleted')
      void load()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'identity',
        headerName: 'Trainer',
        flex: 1.4,
        minWidth: 240,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ minWidth: 0, py: 0.5 }}>
            <Avatar
              alt={p.row.fullname || 'Trainer'}
              src={getImageUrl(p.row.profile_picture)}
              sx={{ width: 40, height: 40, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
                {p.row.fullname || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
                {p.row.email || '—'}
              </Typography>
              {p.row.mobile_no ? (
                <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                  {p.row.mobile_no}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 150,
        sortable: false,
        renderCell: p => (
          <Box onClick={e => e.stopPropagation()}>
            <TrainerStatus params={p} cb={() => void load()} />
          </Box>
        )
      },
      {
        field: 'kyc',
        headerName: 'KYC',
        width: 110,
        sortable: false,
        renderCell: p => (
          <Chip
            size='small'
            label={p.row.is_kyc_completed ? 'Complete' : 'Incomplete'}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              fontWeight: 600,
              bgcolor: p.row.is_kyc_completed ? ops.softMint : ops.errorSoft,
              color: p.row.is_kyc_completed ? ops.live : ops.error
            }}
          />
        )
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 120,
        renderCell: p => (
          <Typography sx={{ fontSize: 12 }} noWrap>
            {p.row.category || '—'}
          </Typography>
        )
      },
      {
        field: 'session_count',
        headerName: 'Sessions',
        width: 90,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{fmtInt(p.row.session_count ?? 0)}</Typography>
        )
      },
      {
        field: 'wallet_amount',
        headerName: 'Wallet',
        width: 90,
        valueGetter: p => (p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(0)}` : '—')
      },
      {
        field: 'commission',
        headerName: 'Commission',
        width: 120,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.5} alignItems='center' onClick={e => e.stopPropagation()}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
              {p.row.commission != null ? `${p.row.commission}%` : '—'}
            </Typography>
            <Tooltip title='Edit commission'>
              <IconButton size='small' onClick={() => setCommissionId(p.row.id)}>
                <SaveAsIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
      {
        field: 'login_type',
        headerName: 'Login',
        width: 90,
        renderCell: p => (
          <Typography sx={{ fontSize: 12, textTransform: 'capitalize' }} noWrap>
            {p.row.login_type || '—'}
          </Typography>
        )
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        width: 130,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontSize: 12 }}>
              {p.row.createdAt ? formatOpsDateTime(p.row.createdAt, { withSeconds: false }) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.lastSeen ? `seen ${moment(p.row.lastSeen).fromNow()}` : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actions',
        headerName: '',
        width: 96,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Preview'>
              <IconButton size='small' onClick={e => void openPreview(e, p.row.id)}>
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton size='small' color='error' onClick={e => void requestDelete(e, p.row.id, p.row.fullname)}>
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    [load]
  )

  const kycSubtitle =
    kycFilter === 'incomplete'
      ? 'Filtered: pending KYC (from ops home). Clear the KYC chip to see all trainers.'
      : 'All trainer accounts. Search, filter status/KYC, click a row for User 360.'

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
        icon='mdi:account-tie-outline'
        eyebrow='People'
        title='Trainers'
        subtitle={kycSubtitle}
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={Link} href='/apps/users' label='All users' clickable variant='outlined' size='small' />
            <Chip
              component={Link}
              href='/apps/trainer-verifications'
              label='Verifications'
              clickable
              variant='outlined'
              size='small'
            />
            <Chip component={Link} href='/apps/manage-trainee' label='Trainees' clickable variant='outlined' size='small' />
          </Stack>
        }
      >
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:account-tie-outline'
              label='Trainers'
              value={counts ? fmtInt(counts.trainers) : '—'}
              hint='All time'
              tone='accent'
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:account-clock-outline'
              label='Pending'
              value={counts ? fmtInt(counts.pending) : '—'}
              hint='Needs review'
              tone='warn'
              onClick={() => {
                setStatusFilter('pending')
                setPage(1)
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:shield-alert-outline'
              label='KYC filter'
              value={kycFilter === 'incomplete' ? 'On' : 'Off'}
              hint='Incomplete Stripe/KYC'
              tone={kycFilter === 'incomplete' ? 'warn' : 'success'}
              onClick={() => setKyc(kycFilter !== 'incomplete')}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <OpsMetricTile
              icon='mdi:filter-variant'
              label='Showing'
              value={fmtInt(total)}
              hint='This list'
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name, email, mobile, user ID…'
              searchValue={searchInput}
              onSearchChange={e => {
                setSearchInput(e.target.value)
                scheduleSearch(e.target.value)
              }}
              onRefresh={() => void load()}
              refreshLoading={loading}
              resultCount={total}
              helperText='Status and commission edit inline. Row click opens User 360.'
            >
              {STATUS_CHIPS.map(s => (
                <FilterChip
                  key={s.value || 'any'}
                  active={statusFilter === s.value && !kycFilter}
                  label={s.label}
                  count={s.value ? counts?.[s.value] : counts?.trainers}
                  onClick={() => {
                    setStatusFilter(s.value)
                    if (kycFilter) setKyc(false)
                    setPage(1)
                  }}
                />
              ))}
              <FilterChip
                active={kycFilter === 'incomplete'}
                label='KYC incomplete'
                onClick={() => setKyc(kycFilter !== 'incomplete')}
              />
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
                emptyMessage='No trainers match'
                emptyDescription='Try clearing status or KYC filters.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      <MModal handleClose={() => setCommissionId(null)} open={Boolean(commissionId)} maxWidth='xs'>
        <AddEditCommision
          handleClose={() => {
            setCommissionId(null)
            void load()
          }}
          trainer_id={commissionId}
        />
      </MModal>

      {ConfirmDialog}
    </>
  )
}
