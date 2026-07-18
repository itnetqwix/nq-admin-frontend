import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import { useRouter } from 'next/router'
import { AdminLoadingState } from 'src/components/admin/AdminLoadingState'
import { ops } from 'src/styles/opsSurface'
import { eyebrowForPath } from 'src/styles/opsPageEyebrows'

/**
 * Ops Surface page chrome — mono eyebrow (explicit or auto from route), stacked-shadow card.
 */
export default function AdminPageShell({
  title,
  subtitle,
  eyebrow,
  actions,
  action,
  children,
  contentSx = {},
  loading = false,
  loadingMessage = 'Loading…',
  bare = false
}) {
  const router = useRouter()
  const resolvedEyebrow = eyebrow ?? eyebrowForPath(router.pathname)
  const headerActions = actions ?? action

  const header = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ sm: 'flex-start' }}
      justifyContent='space-between'
      sx={{ mb: 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        {resolvedEyebrow ? (
          <Typography
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              color: ops.mute,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              mb: 0.75
            }}
          >
            {resolvedEyebrow}
          </Typography>
        ) : null}
        <Box
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.96px',
            color: 'text.primary',
            lineHeight: 1.25,
            fontSize: { xs: 22, md: 24 }
          }}
        >
          {title}
        </Box>
        {subtitle ? (
          <Typography
            variant='body2'
            sx={{ mt: 0.75, maxWidth: 720, lineHeight: 1.65, color: 'text.secondary' }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {headerActions ? (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            maxWidth: { sm: '58%', md: '52%' }
          }}
        >
          {headerActions}
        </Box>
      ) : null}
    </Stack>
  )

  if (bare) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1680, mx: 'auto', pb: 4 }}>
        {header}
        {loading ? <AdminLoadingState message={loadingMessage} minHeight={280} /> : children}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1680, mx: 'auto', pb: 4 }}>
      {header}
      <Paper
        elevation={0}
        sx={{
          borderRadius: `${ops.radiusLg}`,
          border: 'none',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: ops.shadowCard,
          ...contentSx
        }}
      >
        {loading ? <AdminLoadingState message={loadingMessage} minHeight={280} /> : children}
      </Paper>
    </Box>
  )
}

export function AdminPageSection({ title, description, children, withDivider = false, action }) {
  return (
    <>
      {withDivider ? <Divider /> : null}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {title ? (
          <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: description ? 1 : 2 }}>
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>
                {title}
              </Typography>
              {description ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, maxWidth: 720, lineHeight: 1.6 }}>
                  {description}
                </Typography>
              ) : null}
            </Box>
            {action}
          </Stack>
        ) : null}
        {children}
      </Box>
    </>
  )
}
