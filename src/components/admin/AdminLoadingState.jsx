import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/**
 * Centered loading indicator for admin panels (not full-page).
 */
export function AdminLoadingState({ message = 'Loading…', minHeight = 240 }) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4
      }}
    >
      <CircularProgress size={36} thickness={4} />
      {message ? (
        <Typography variant='body2' color='text.secondary'>
          {message}
        </Typography>
      ) : null}
    </Box>
  )
}

/** Skeleton placeholder for taxonomy / two-column master-detail layouts. */
export function AdminMasterDetailSkeleton() {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Skeleton variant='rounded' height={360} sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }} />
      <Skeleton variant='rounded' height={360} sx={{ flex: 1 }} />
    </Stack>
  )
}
