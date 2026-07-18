import RefreshIcon from '@mui/icons-material/Refresh'
import Button from '@mui/material/Button'
import { ops } from 'src/styles/opsSurface'

export default function AdminRefreshButton({ onClick, loading, label = 'Refresh', sx, ...props }) {
  return (
    <Button
      variant='outlined'
      size='small'
      startIcon={<RefreshIcon />}
      onClick={onClick}
      disabled={loading}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        borderColor: ops.hairline,
        color: ops.ink,
        bgcolor: ops.canvas,
        borderRadius: ops.radiusSm,
        '&:hover': { borderColor: ops.mute, bgcolor: ops.canvasSoft },
        ...sx
      }}
      {...props}
    >
      {loading ? 'Loading…' : label}
    </Button>
  )
}
