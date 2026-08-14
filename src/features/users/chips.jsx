import { Chip } from '@mui/material'
import { ops } from 'src/styles/opsSurface'

export const TYPE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'trainer', label: 'Trainers' },
  { value: 'trainee', label: 'Trainees' }
]

export const STATUS_CHIPS = [
  { value: '', label: 'Any status' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' }
]

export const STATUS_TONE = {
  approved: { bg: '#AAFFEC', color: '#1A8F76' },
  pending: { bg: '#ffefcf', color: '#ab570a' },
  rejected: { bg: ops.errorSoft, color: ops.error }
}

export const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export function FilterChip({ active, label, onClick, count }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={count != null ? `${label} · ${fmtInt(count)}` : label}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        bgcolor: active ? ops.softIndigo : ops.canvas,
        color: active ? ops.indigoDeep : ops.body,
        border: `1px solid ${active ? ops.indigo : ops.hairline}`
      }}
    />
  )
}
