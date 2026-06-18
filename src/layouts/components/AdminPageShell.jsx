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
  action,
  children,
  contentSx = {},
  loading = false,
  loadingMessage = 'Loading…',
  /** Dashboard-style pages: no outer card wrapper */
  bare = false
}) {
  const headerActions = actions ?? action
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
      {headerActions ? <Box sx={{ flexShrink: 0 }}>{headerActions}</Box> : null}
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

export function AdminPageSection({ title, description, children, withDivider = false, action }) {
  return (
    <>
      {withDivider ? <Divider /> : null}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {title ? (
          <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: description ? 1 : 2 }}>
            <Box>
              <Typography variant='subtitle1' fontWeight={700}>
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
