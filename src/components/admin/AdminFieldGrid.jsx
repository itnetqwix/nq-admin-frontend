import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'

/**
 * Responsive form grid — 1 col mobile, 2 col desktop by default.
 */
export default function AdminFieldGrid({ children, columns = 2, gap = 1.5, sx }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: columns === 1 ? '1fr' : `repeat(${columns}, minmax(0, 1fr))`
        },
        gap,
        alignItems: 'start',
        '& .MuiFormControl-root, & .MuiTextField-root': {
          width: '100%'
        },
        '& .MuiFormHelperText-root': {
          fontFamily: ops.mono,
          fontSize: 11
        },
        ...sx
      }}
    >
      {children}
    </Box>
  )
}
