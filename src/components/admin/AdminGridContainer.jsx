import Box from '@mui/material/Box'

/** Standard height for full-page admin data tables */
export const ADMIN_LIST_GRID_HEIGHT = { xs: 420, sm: 520, md: 'min(71vh, 760px)' }

export default function AdminGridContainer({ children, height = ADMIN_LIST_GRID_HEIGHT, sx }) {
  return (
    <Box
      sx={{
        height,
        width: '100%',
        minHeight: 320,
        ...sx
      }}
    >
      {children}
    </Box>
  )
}
