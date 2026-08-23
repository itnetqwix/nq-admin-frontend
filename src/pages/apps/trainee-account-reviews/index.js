import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button, Chip, Drawer, Grid, Stack, TextField, Typography } from '@mui/material'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { approveTraineeAccount, rejectTraineeAccount } from 'src/services/clipsAdminApi'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import { useAdminListUrlSync } from 'src/hooks/useAdminListUrlSync'
import {
  fetchTraineeReviews,
  selectTraineeReviews,
  setTraineeReviewPage,
  setTraineeReviewSearch
} from 'src/store/slices/traineeReviewsSlice'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function TraineeAccountReviewsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items, total, page, limit, search, loading, error } = useAppSelector(selectTraineeReviews)
  const searchTimer = useRef(null)
  const [searchInput, setSearchInput] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  const { pushQuery } = useAdminListUrlSync({
    router,
    pathname: '/apps/trainee-account-reviews',
    queryMap: {},
    onHydrate: values => {
      if (values.search) {
        setSearchInput(values.search)
        dispatch(setTraineeReviewSearch(values.search))
      }
      if (values.page) dispatch(setTraineeReviewPage({ page: Number(values.page) }))
    }
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    void dispatch(fetchTraineeReviews())
  }, [dispatch, page, limit, search])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const reload = useCallback(() => void dispatch(fetchTraineeReviews()), [dispatch])

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      dispatch(setTraineeReviewSearch(val.trim()))
      pushQuery({ search: val.trim(), page: 1 })
    }, 300)
  }

  const openDetail = row => {
    setDetail(row)
    setRejectReason('')
    setDrawerOpen(true)
  }

  const handleApprove = async () => {
    if (!detail?.id) return
    setActing(true)
    try {
      await approveTraineeAccount(detail.id)
      toast.success('Trainee approved')
      setDrawerOpen(false)
      reload()
    } catch (e) {
      toast.error(e?.message || 'Approve failed')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!detail?.id || !rejectReason.trim()) {
      toast.error('Rejection reason required')
      return
    }
    setActing(true)
    try {
      await rejectTraineeAccount(detail.id, rejectReason.trim())
      toast.success('Trainee rejected')
      setDrawerOpen(false)
      reload()
    } catch (e) {
      toast.error(e?.message || 'Reject failed')
    } finally {
      setActing(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        field: 'submitted',
        headerName: 'Updated',
        width: 170,
        valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
      },
      { field: 'fullname', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: () => <Chip size='small' color='warning' label='Pending' />
      }
    ],
    []
  )

  return (
    <AdminPageShell
      bare
      eyebrow='People · trainee reviews'
      icon='mdi:account-clock-outline'
      title='Trainee account reviews.'
      subtitle='Review trainees who resubmitted after rejection or were set to pending.'
      actions={<AdminRefreshButton onClick={reload} loading={loading} />}
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:account-clock'
            label='In queue'
            value={fmtInt(total)}
            hint='Awaiting review'
            tone={total > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:filter-outline'
            label='Page'
            value={`${page}`}
            hint={`${limit} per page`}
          />
        </Grid>
      </Grid>

      <AdminPageSection>
        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
            <AdminFilterBar
              searchPlaceholder='Search name, email, phone…'
              searchValue={searchInput}
              onSearchChange={handleSearchChange}
              resultCount={total}
              onRefresh={reload}
              refreshLoading={loading}
            />
          </Box>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={items}
              columns={columns}
              loading={loading}
              onRowClick={p => openDetail(p.row)}
              emptyMessage='No trainees awaiting review.'
              emptyDescription='Clear search or refresh the queue.'
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page: page - 1, pageSize: limit }}
              onPaginationModelChange={m => {
                dispatch(setTraineeReviewPage({ page: m.page + 1, limit: m.pageSize }))
                pushQuery({ search, page: m.page + 1 })
              }}
              pageSizeOptions={[10, 30, 50]}
            />
          </AdminGridContainer>
        </OpsSurfaceCard>
      </AdminPageSection>

      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        {detail ? (
          <Stack spacing={2}>
            <Typography variant='h6'>{detail.fullname}</Typography>
            <Typography variant='body2'>
              {detail.email} · {detail.mobile_no || '—'}
            </Typography>
            <Button component={Link} href={`/apps/users/${detail.id}`} variant='outlined' size='small'>
              Open User 360
            </Button>
            <TextField
              label='Rejection reason'
              multiline
              minRows={2}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <Stack direction='row' spacing={1}>
              <Button
                variant='contained'
                disabled={acting}
                onClick={() => void handleApprove()}
                sx={{ textTransform: 'none', bgcolor: ops.ink }}
              >
                Approve
              </Button>
              <Button
                variant='outlined'
                color='error'
                disabled={acting}
                onClick={() => void handleReject()}
                sx={{ textTransform: 'none' }}
              >
                Reject
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </AdminPageShell>
  )
}
