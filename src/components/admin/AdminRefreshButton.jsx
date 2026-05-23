import RefreshIcon from '@mui/icons-material/Refresh'
import Button from '@mui/material/Button'

export default function AdminRefreshButton({ onClick, loading, label = 'Refresh', ...props }) {
  return (
    <Button
      variant='outlined'
      size='small'
      startIcon={<RefreshIcon />}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading…' : label}
    </Button>
  )
}
