import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import MModal from 'src/pages/components/modal/Modal'

export default function UserQuickPreviewModal({ open, handleClose, loading, user360Data, userId }) {
  const user = user360Data?.user || {}
  const summary = user360Data?.summary || {}
  const resolvedId =
    userId != null && userId !== 'undefined' && String(userId).trim() !== ''
      ? String(userId)
      : user?._id != null
        ? String(user._id)
        : user?.id != null
          ? String(user.id)
          : ''
  const fullPageHref = resolvedId ? `/apps/users/${resolvedId}` : '/apps/manage-trainer'

  return (
    <MModal open={open} handleClose={handleClose} maxWidth='md'>
      <Box sx={{ p: 3, minWidth: { xs: '90vw', md: 760 } }}>
        <Typography variant='h6' sx={{ mb: 2 }}>Quick User Preview</Typography>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Name: ${user?.fullname || '-'}`} />
              <Chip label={`Email: ${user?.email || '-'}`} />
              <Chip label={`Type: ${user?.account_type || '-'}`} />
              <Chip label={`Status: ${user?.status ?? '-'}`} />
            </Stack>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Lessons: ${summary?.lessonsCount || 0}`} />
              <Chip label={`Completed: ${summary?.completedLessonsCount || 0}`} />
              <Chip label={`Reviews: ${summary?.reviewsCount || 0}`} />
              <Chip label={`Clips: ${summary?.clipsCount || 0}`} />
              <Chip label={`PDF/Reports: ${summary?.reportsCount || 0}`} />
            </Stack>

            <Typography variant='body2' sx={{ mb: 2 }}>
              Open the full console for lessons, reviews, clips, plans, and admin activity. You can also click a row in the table to go there directly.
            </Typography>

            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Button variant='outlined' onClick={handleClose}>Close</Button>
              <Button
                component={Link}
                href={fullPageHref}
                variant='contained'
                disabled={!resolvedId}
                onClick={handleClose}
              >
                Open Full Access Page
              </Button>
            </Stack>
            {!resolvedId && !loading ? (
              <Typography variant='caption' color='error' sx={{ display: 'block', mt: 1 }}>
                Could not resolve user id. Check API configuration (NEXT_PUBLIC_API_BASE_URL) and try again.
              </Typography>
            ) : null}
          </>
        )}
      </Box>
    </MModal>
  )
}
