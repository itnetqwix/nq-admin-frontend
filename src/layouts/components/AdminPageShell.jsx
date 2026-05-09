import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

/**
 * Consistent page chrome: title, optional subtitle, actions, content in a soft card.
 */
export default function AdminPageShell({ title, subtitle, actions, children, contentSx = {} }) {
  return (
    <Box sx={{ width: '100%', maxWidth: 1680, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} justifyContent='space-between' sx={{ mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h5' sx={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75, maxWidth: 720, lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
      </Stack>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          ...contentSx
        }}
      >
        {children}
      </Paper>
    </Box>
  )
}

export function AdminPageSection({ children, withDivider = false }) {
  return (
    <>
      {withDivider ? <Divider /> : null}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
    </>
  )
}
