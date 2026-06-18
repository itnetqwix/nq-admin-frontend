import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/**
 * Friendly empty state for grids, drawers, and section panels.
 */
export default function AdminEmptyState({
  title = 'Nothing here yet',
  description = 'Try adjusting filters or refresh the list.',
  actionLabel,
  onAction,
  icon: Icon = InboxOutlinedIcon,
  compact = false
}) {
  return (
    <Stack
      alignItems='center'
      justifyContent='center'
      spacing={1.5}
      sx={{
        py: compact ? 3 : 5,
        px: 3,
        textAlign: 'center',
        minHeight: compact ? 160 : 220
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary'
        }}
      >
        <Icon />
      </Box>
      <Typography variant='subtitle1' fontWeight={700}>
        {title}
      </Typography>
      {description ? (
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 360, lineHeight: 1.6 }}>
          {description}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant='outlined' size='small' onClick={onAction} sx={{ mt: 0.5 }}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  )
}
