import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import SessionTimelinePanel from 'src/pages/components/booking/SessionTimelinePanel'

export default function LessonTimelineDialog({ open, bookingId, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Session timeline</DialogTitle>
      <DialogContent dividers>
        {bookingId ? (
          <SessionTimelinePanel bookingId={bookingId} />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No booking selected.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
