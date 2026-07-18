import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

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
        py: 4,
        bgcolor: ops.canvasSoft
      }}
    >
      <CircularProgress size={28} thickness={4} sx={{ color: ops.ink }} />
      {message ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>{message}</Typography>
      ) : null}
    </Box>
  )
}

/** Skeleton placeholder for taxonomy / two-column master-detail layouts. */
export function AdminMasterDetailSkeleton() {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Skeleton
        variant='rounded'
        height={360}
        sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, borderRadius: ops.radiusLg, bgcolor: ops.canvasSoft2 }}
      />
      <Skeleton variant='rounded' height={360} sx={{ flex: 1, borderRadius: ops.radiusLg, bgcolor: ops.canvasSoft2 }} />
    </Stack>
  )
}
