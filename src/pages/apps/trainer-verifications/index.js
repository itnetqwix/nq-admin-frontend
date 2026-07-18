import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Drawer,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import moment from 'moment'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  approveTrainerVerification,
  getTrainerVerificationDetail,
  getTrainerVerifications,
  rejectTrainerVerification
} from 'src/services/verificationApi'

export default function TrainerVerificationsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTrainerVerifications({ limit: 100 })
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || i,
          ...r,
          submitted: r.trainer_verification?.submitted_for_review_at,
          escalated: Boolean(r.trainer_verification?.review_escalated_at)
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

  const openDetail = async row => {
    try {
      const d = await getTrainerVerificationDetail(row.id)
      setDetail(d)
      setRejectReason('')
      setDrawerOpen(true)
    } catch (e) {
      toast.error(e?.message || 'Failed to load detail')
    }
  }

  const handleApprove = async () => {
    if (!detail?.user?._id) return
    setActing(true)
    try {
      await approveTrainerVerification(detail.user._id)
      toast.success('Trainer approved')
      setDrawerOpen(false)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Approve failed')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!detail?.user?._id || !rejectReason.trim()) {
      toast.error('Rejection reason required')
      return
    }
    setActing(true)
    try {
      await rejectTrainerVerification(detail.user._id, rejectReason.trim())
      toast.success('Trainer rejected')
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
      headerName: 'Submitted',
      width: 170,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'fullname', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'escalated',
      headerName: 'SLA',
      width: 100,
      renderCell: p =>
        p.row.escalated ? <Chip size='small' color='error' label='Overdue' /> : <Chip size='small' label='Pending' />
    }
  ]

  return (
    <AdminPageShell
      icon='mdi:account-check-outline'
      title='Trainer verifications'
      subtitle='Review face liveness and profile before granting access.'
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
            onRowClick={p => void openDetail(p.row)}
            emptyMessage='No trainers awaiting verification.'
          />
        </AdminGridContainer>
      </AdminPageSection>

      <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 440, p: 3 } }}>
        {detail?.user ? (
          <Stack spacing={2}>
            <Typography variant='h6'>{detail.user.fullname}</Typography>
            <Typography variant='body2'>{detail.user.email} · {detail.user.mobile_no}</Typography>
            <Typography variant='body2'>Category: {detail.user.category || '—'}</Typography>
            {detail.user.trainer_verification?.face ? (
              <Typography variant='body2'>
                Liveness: {detail.user.trainer_verification.face.liveness_status} (
                {detail.user.trainer_verification.face.confidence}%)
              </Typography>
            ) : null}
            {detail.selfieUrl ? (
              <Box component='img' src={detail.selfieUrl} alt='Selfie' sx={{ width: '100%', borderRadius: 1 }} />
            ) : (
              <Typography variant='caption' color='text.secondary'>
                Selfie preview unavailable (mock mode or missing S3 key)
              </Typography>
            )}
            <Button component={Link} href={`/apps/users/${detail.user._id}`} variant='outlined' size='small'>
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
