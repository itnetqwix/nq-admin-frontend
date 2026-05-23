import Chip from '@mui/material/Chip'

const MAP = {
  submitted: { label: 'New request', color: 'warning' },
  under_review: { label: 'Under review', color: 'info' },
  accepted: { label: 'Published', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' }
}

export default function SubmissionStatusChip({ status, size = 'small' }) {
  const cfg = MAP[status] || { label: status || '—', color: 'default' }
  return <Chip size={size} label={cfg.label} color={cfg.color} variant='outlined' />
}
