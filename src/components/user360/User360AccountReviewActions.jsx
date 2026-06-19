import { useState } from 'react'
import { Button, Stack, TextField } from '@mui/material'
import toast from 'react-hot-toast'
import {
  approveTraineeAccount,
  rejectTraineeAccount
} from 'src/services/clipsAdminApi'
import {
  approveTrainerVerification,
  rejectTrainerVerification
} from 'src/services/verificationApi'

export default function User360AccountReviewActions({ userId, accountType, status, onUpdated }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const normalized = String(status || '').toLowerCase()
  const isTrainer = String(accountType || '').toLowerCase() === 'trainer'
  const showActions = normalized === 'pending' || normalized === 'rejected'

  if (!userId || !showActions) return null

  const approve = async () => {
    setBusy(true)
    try {
      if (isTrainer) {
        await approveTrainerVerification(userId)
      } else {
        await approveTraineeAccount(userId)
      }
      toast.success('Account approved')
      onUpdated?.()
    } catch (e) {
      toast.error(e?.message || 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    if (!reason.trim()) {
      toast.error('Rejection reason required')
      return
    }
    setBusy(true)
    try {
      if (isTrainer) {
        await rejectTrainerVerification(userId, reason.trim())
      } else {
        await rejectTraineeAccount(userId, reason.trim())
      }
      toast.success('Account rejected')
      setReason('')
      onUpdated?.()
    } catch (e) {
      toast.error(e?.message || 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={1.5} sx={{ mt: 2, maxWidth: 480 }}>
      <TextField
        label='Rejection reason'
        size='small'
        multiline
        minRows={2}
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <Stack direction='row' spacing={1}>
        <Button variant='contained' size='small' disabled={busy} onClick={() => void approve()}>
          Approve account
        </Button>
        <Button variant='outlined' color='error' size='small' disabled={busy} onClick={() => void reject()}>
          Reject account
        </Button>
      </Stack>
    </Stack>
  )
}
