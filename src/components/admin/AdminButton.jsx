import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { ops } from 'src/styles/opsSurface'

/**
 * Shared admin button — sentence case, no Materio shadow.
 * Use instead of raw MUI Button / CustomButton on /apps pages.
 */
export default function AdminButton({
  variant = 'outlined',
  loading = false,
  children,
  disabled,
  startIcon,
  sx,
  ...props
}) {
  const contained = variant === 'contained'
  return (
    <Button
      variant={variant}
      size={props.size || 'small'}
      disabled={disabled || loading}
      startIcon={
        loading ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : startIcon
      }
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        borderRadius: ops.radiusSm,
        ...(contained
          ? {
              bgcolor: ops.indigo,
              color: '#fff',
              '&:hover': { bgcolor: ops.indigoDeep, boxShadow: 'none' }
            }
          : {
              borderColor: ops.hairline,
              color: ops.ink,
              bgcolor: ops.canvas,
              '&:hover': { borderColor: ops.mute, bgcolor: ops.canvasSoft }
            }),
        ...sx
      }}
      {...props}
    >
      {children}
    </Button>
  )
}
