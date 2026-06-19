import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import { SectionShell, EmptyHint, downloadCsv, lessonStatusColor } from '../user360Shared'
import { DeleteActions, renderParty } from '../user360Parts'
import { QueryToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

export default function User360LessonsTab({
  lessons = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  loadingLessons = false,
  query,
  onQueryChange,
  onRefresh,
  hardDeletePolicy,
  onOpenTimeline
}) {
  const lessonsItems = lessons?.items || []

  return (
    <SectionShell
      title='Lessons & bookings'
      subtitle='Sessions where this user is trainer or trainee. Use filters to narrow; actions support soft/hard delete per policy.'
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
    </SectionShell>
  )
}
