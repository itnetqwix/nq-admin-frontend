import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const OID_RE = /^[a-f\d]{24}$/i

export default function AdminCommandPalette({ open, onClose }) {
  const router = useRouter()
  const [value, setValue] = useState('')

  const go = useCallback(() => {
    const q = value.trim()
    if (!q) return
    if (OID_RE.test(q)) {
      void router.push(`/apps/users/${q}`)
      setValue('')
      onClose()
      return
    }
    if (q.startsWith('/')) {
      void router.push(q)
      setValue('')
      onClose()
    }
  }, [value, router, onClose])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Go to…</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Enter a user <strong>ObjectId</strong> to open User 360, or an internal path (e.g.{' '}
          <code>/apps/booking</code>).
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            autoFocus
            fullWidth
            size='small'
            label='User ID or path'
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
          />
          <Button variant='contained' onClick={go}>
            Go
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
