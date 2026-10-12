import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { refundStatusLabel } from 'src/features/bookings/refundLabels'

export function PersonCell({ person, fallbackId }) {
  const id = person?.id || fallbackId
  const name = person?.name || (id ? String(id).slice(-6) : '—')
  const email = person?.email
  if (!id && !person?.name) return '—'
  return (
    <Box sx={{ lineHeight: 1.25, py: 0.5, minWidth: 0 }}>
      {id ? (
        <Button size='small' component={Link} href={`/apps/users/${id}`} onClick={e => e.stopPropagation()} sx={{ px: 0, minWidth: 0, textTransform: 'none' }}>
          {name}
        </Button>
      ) : (
        <Typography variant='body2'>{name}</Typography>
      )}
      {email ? (
        <Typography variant='caption' display='block' color='text.secondary' noWrap>
          {email}
        </Typography>
      ) : null}
    </Box>
  )
}

export function StatusChip({ status }) {
  const s = String(status || '').toLowerCase()
  const color =
    s === 'failed' || s === 'disputed' || s === 'open' || s === 'chargeback' ? 'error' : s === 'processing' || s === 'pending' || s === 'releasing' ? 'warning' : s === 'completed' || s === 'refunded' || s === 'released' ? 'success' : 'default'
  return <Chip size='small' label={refundStatusLabel(status)} color={color} variant='outlined' />
}
