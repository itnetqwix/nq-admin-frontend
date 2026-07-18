import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const VARIANT_META = {
  default: { color: 'primary', Icon: InfoOutlinedIcon },
  warning: { color: 'warning', Icon: WarningAmberOutlinedIcon },
  danger: { color: 'error', Icon: DeleteOutlineOutlinedIcon }
}

/**
 * Standard confirmation dialog for destructive or sensitive admin actions.
 */
export default function AdminConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onClose
}) {
  const meta = VARIANT_META[variant] ?? VARIANT_META.default
  const Icon = meta.Icon

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction='row' spacing={1.5} alignItems='flex-start'>
          <Box
            sx={{
              mt: 0.25,
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme => `${theme.palette[meta.color].main}14`,
              color: `${meta.color}.main`,
              flexShrink: 0
            }}
          >
            <Icon fontSize='small' />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h6' fontWeight={700} lineHeight={1.3}>
              {title}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {message}
        </Typography>
        {detail ? (
          <Typography
            variant='caption'
            color='text.secondary'
            display='block'
            sx={{ mt: 1.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}
          >
            {detail}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} disabled={loading} color='inherit'>
          {cancelLabel}
        </Button>
        <Button
          variant='contained'
          color={meta.color}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
