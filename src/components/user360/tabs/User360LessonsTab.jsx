import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined'
import { useContext, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material'

import { SectionShell, EmptyHint, downloadCsv, lessonStatusColor } from '../user360Shared'
import { DeleteActions, renderParty } from '../user360Parts'
import { QueryToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { adminFetch } from 'src/services/http'

function refundDone(status) {
  const s = String(status || '').trim().toLowerCase()
  return s === 'completed' || s === 'refunded' || s === 'processing'
}

export default function User360LessonsTab({
  lessons = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  loadingLessons = false,
  query,
  onQueryChange,
  onRefresh,
  hardDeletePolicy,
  onOpenTimeline
}) {
  const ability = useContext(AbilityContext)
  const canRefund = ability?.can('update', 'admin-action-refund') ?? false
  const lessonsItems = lessons?.items || []
  const [refundRow, setRefundRow] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const runRefund = async () => {
    const r = reason.trim()
    if (!refundRow?._id || r.length < 3) return
    setBusy(true)
    try {
      const res = await adminFetch('/transaction/create-refund', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: refundRow._id,
          payment_intent_id: refundRow.payment_intent_id || undefined,
          reason: r
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || String(data?.status).toLowerCase() === 'fail' || data?.code === 400) {
        throw new Error(data?.error || 'Refund was not completed')
      }
      toast.success('Refund completed')
      setRefundRow(null)
      setReason('')
      onRefresh?.()
    } catch (e) {
      toast.error(e?.message || 'Refund failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell
      title='Lessons & bookings'
      subtitle='Sessions where this user is trainer or trainee. Refund runs card, wallet, or escrow from here.'
      action={<ToolbarRefreshExport busy={loadingLessons} onRefresh={onRefresh} onExport={() => downloadCsv(lessonsItems, 'admin-lessons.csv')} />}
    >
      <QueryToolbar section='lessons' sectionQuery={query?.lessons} onQueryChange={onQueryChange} lessonSortOptions={true} />
      <Divider sx={{ my: 2 }} />
      {loadingLessons ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      {!loadingLessons && lessonsItems.length ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Booked</TableCell>
                <TableCell>Window</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Trainee</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessonsItems.map(lesson => (
                <TableRow key={lesson?._id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{lesson?.booked_date ? new Date(lesson.booked_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{lesson?.session_start_time || '—'} – {lesson?.session_end_time || '—'}</TableCell>
                  <TableCell>
                    <Chip size='small' label={lesson?.status || '—'} color={lessonStatusColor(lesson?.status)} variant='outlined' />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{renderParty(lesson?.trainer_id)}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{renderParty(lesson?.trainee_id)}</TableCell>
                  <TableCell align='right'>
                    <Stack direction='row' spacing={0.5} justifyContent='flex-end' alignItems='center'>
                      {canRefund && !refundDone(lesson?.refund_status) ? (
                        <IconButton
                          size='small'
                          aria-label='Refund booking'
                          onClick={() => { setReason(''); setRefundRow(lesson) }}
                        >
                          <UndoOutlinedIcon fontSize='small' />
                        </IconButton>
                      ) : null}
                      <IconButton
                        size='small'
                        aria-label='Session timeline'
                        onClick={() => onOpenTimeline(String(lesson?._id))}
                      >
                        <TimelineOutlinedIcon fontSize='small' />
                      </IconButton>
                      <DeleteActions entityType='booked_session' entityId={lesson?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {!loadingLessons && !lessonsItems.length ? (
        <EmptyHint icon={EventNoteOutlinedIcon} title='No lessons in this view' hint='Clear search or status filters, or check the other user role (trainer vs trainee).' />
      ) : null}
      <PaginationBar section='lessons' pagination={lessons?.pagination} onQueryChange={onQueryChange} />
      <Dialog open={Boolean(refundRow)} onClose={() => !busy && setRefundRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Refund this session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            required
            margin='dense'
            label='Refund reason'
            value={reason}
            onChange={e => setReason(e.target.value)}
            helperText='Card, wallet, or escrow — whichever funded the booking. Min 3 characters.'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundRow(null)} disabled={busy}>Cancel</Button>
          <Button variant='contained' color='warning' onClick={() => void runRefund()} disabled={busy || reason.trim().length < 3}>
            Process refund
          </Button>
        </DialogActions>
      </Dialog>
    </SectionShell>
  )
}
