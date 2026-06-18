import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

/**
 * Legacy modal wrapper — styled to match the MUI admin theme (no heavy borders).
 * Prefer MUI Dialog or AdminConfirmDialog for new screens.
 */
export default function Modal({ open, handleClose, maxWidth = 'sm', fullWidth = true, children }) {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>{children}</DialogContent>
    </Dialog>
  )
}
