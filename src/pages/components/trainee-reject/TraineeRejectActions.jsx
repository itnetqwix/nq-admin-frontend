import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import toast from 'react-hot-toast'
import { approveTraineeAccount, rejectTraineeAccount } from 'src/services/clipsAdminApi'

export default function TraineeRejectActions({ userId, status, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const reject = async () => {
    if (!reason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setBusy(true)
    try {
      await rejectTraineeAccount(userId, reason.trim())
      toast.success('Trainee rejected')
      setOpen(false)
      setReason('')
      onUpdated?.()
    } catch (e) {
      toast.error(e?.message || 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  const approve = async () => {
    setBusy(true)
    try {
      await approveTraineeAccount(userId)
      toast.success('Trainee approved')
      onUpdated?.()
    } catch (e) {
      toast.error(e?.message || 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  if (!userId) return null

  return (
    <Stack direction='row' spacing={1}>
      {status !== 'approved' && (
        <Button size='small' variant='contained' color='success' disabled={busy} onClick={() => void approve()}>
          Approve
        </Button>
      )}
      {status !== 'rejected' && (
        <Button size='small' variant='outlined' color='error' disabled={busy} onClick={() => setOpen(true)}>
          Reject
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Reject trainee account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Rejection reason (required)'
            fullWidth
            multiline
            minRows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color='error' variant='contained' disabled={busy} onClick={() => void reject()}>
            Reject account
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
