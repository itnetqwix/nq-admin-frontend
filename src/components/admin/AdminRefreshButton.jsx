import RefreshIcon from '@mui/icons-material/Refresh'
import AdminButton from './AdminButton'

export default function AdminRefreshButton({ onClick, loading, label = 'Refresh', sx, ...props }) {
  return (
    <AdminButton
      variant='outlined'
      startIcon={<RefreshIcon />}
      onClick={onClick}
      loading={loading}
      sx={sx}
      {...props}
    >
      {loading ? 'Loading…' : label}
    </AdminButton>
  )
}
