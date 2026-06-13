import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Chip, Drawer, Stack, TextField, Typography } from '@mui/material'
import moment from 'moment'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  approveTraineeAccount,
  getPendingTraineeAccounts,
  rejectTraineeAccount
} from 'src/services/clipsAdminApi'

export default function TraineeAccountReviewsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPendingTraineeAccounts({ limit: 100 })
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || i,
          ...r,
          submitted: r.updatedAt || r.createdAt
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
      void load()
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
      void load()
    } catch (e) {
      toast.error(e?.message || 'Reject failed')
    } finally {
      setActing(false)
    }
  }

  const columns = [
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
  ]

  return (
    <AdminPageShell
      title='Trainee account reviews'
      subtitle='Review trainees who resubmitted after rejection or were set to pending.'
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight={false}
            rows={rows}
            columns={columns}
            loading={loading}
            onRowClick={p => openDetail(p.row)}
            emptyMessage='No trainees awaiting review.'
          />
        </AdminGridContainer>
      </AdminPageSection>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 420, p: 3 } }}>
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
              <Button variant='contained' disabled={acting} onClick={() => void handleApprove()}>
                Approve
              </Button>
              <Button variant='outlined' color='error' disabled={acting} onClick={() => void handleReject()}>
                Reject
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </AdminPageShell>
  )
}
