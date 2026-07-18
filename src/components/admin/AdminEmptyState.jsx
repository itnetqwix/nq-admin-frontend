import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

/**
 * Ops Surface empty state — soft canvas frame, mono caption.
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
        minHeight: compact ? 160 : 220,
        bgcolor: ops.canvasSoft,
        borderRadius: ops.radiusLg,
        m: compact ? 1 : 2
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: ops.radiusMd,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: ops.canvas,
          color: ops.mute,
          boxShadow: ops.shadowCard
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', color: ops.ink }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, maxWidth: 360, lineHeight: 1.5 }}>{description}</Typography>
      {actionLabel && onAction ? (
        <Button
          size='small'
          onClick={onAction}
          sx={{
            mt: 0.5,
            textTransform: 'none',
            fontWeight: 500,
            bgcolor: ops.ink,
            color: '#fff',
            borderRadius: ops.radiusSm,
            px: 1.5,
            '&:hover': { bgcolor: '#000' }
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  )
}
