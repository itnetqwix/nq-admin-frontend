import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'

/**
 * Ops Surface card — stacked shadow, no Materio outlined border.
 * Prefer this over `Card variant="outlined"` in admin pages.
 */
export default function OpsSurfaceCard({ children, sx, onClick, ...rest }) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      sx={{
        p: 2.5,
        height: '100%',
        bgcolor: ops.canvas,
        borderRadius: ops.radiusLg,
        boxShadow: ops.shadowCard,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.12s ease',
        '&:hover': onClick ? { bgcolor: ops.canvasSoft } : undefined,
        ...sx
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
