import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import { AdminLoadingState } from 'src/components/admin/AdminLoadingState'

/**
 * Consistent page chrome: title, optional subtitle, actions, content in a soft card.
 */
export default function AdminPageShell({
  title,
  subtitle,
  actions,
  children,
  contentSx = {},
  loading = false,
  loadingMessage = 'Loading…',
  /** Dashboard-style pages: no outer card wrapper */
  bare = false
}) {
  const header = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ sm: 'flex-start' }}
      justifyContent='space-between'
      sx={{ mb: bare ? 3 : 3 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant='h5'
          sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.25 }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75, maxWidth: 720, lineHeight: 1.65 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
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
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme => theme.shadows[1],
          ...contentSx
        }}
      >
        {loading ? <AdminLoadingState message={loadingMessage} minHeight={280} /> : children}
      </Paper>
    </Box>
  )
}

export function AdminPageSection({ title, children, withDivider = false, action }) {
  return (
    <>
      {withDivider ? <Divider /> : null}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {title ? (
          <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
            <Typography variant='subtitle1' fontWeight={700}>
              {title}
            </Typography>
            {action}
          </Stack>
        ) : null}
        {children}
      </Box>
    </>
  )
}
