import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import { SectionShell, EmptyHint, downloadCsv, lessonStatusColor } from '../user360Shared'
import { renderParty, ReviewRatingsCell } from '../user360Parts'
import { QueryToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

export default function User360ReviewsTab({
  reviews = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  loadingReviews = false,
  query,
  onQueryChange,
  onRefresh
}) {
  const reviewsItems = reviews?.items || []

  return (
    <SectionShell
      title='Reviews'
      subtitle='Derived from booked sessions that include ratings.'
      action={<ToolbarRefreshExport busy={loadingReviews} onRefresh={onRefresh} onExport={() => downloadCsv(reviewsItems, 'admin-reviews.csv')} />}
    >
      <QueryToolbar section='reviews' sectionQuery={query?.reviews} onQueryChange={onQueryChange} lessonSortOptions={true} />
      <Divider sx={{ my: 2 }} />
      {loadingReviews ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      {!loadingReviews && reviewsItems.length ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Session</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Trainee</TableCell>
                <TableCell sx={{ minWidth: 280 }}>Ratings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewsItems.map(review => (
                <TableRow key={String(review?.session_id)} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{String(review?.session_id)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{review?.booked_date ? new Date(review.booked_date).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Chip size='small' label={review?.status || '—'} color={lessonStatusColor(review?.status)} variant='outlined' />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>{renderParty(review?.trainer)}</TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>{renderParty(review?.trainee)}</TableCell>
                  <TableCell sx={{ verticalAlign: 'top', py: 2 }}>
                    <ReviewRatingsCell ratings={review?.ratings} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {!loadingReviews && !reviewsItems.length ? (
        <EmptyHint icon={EventNoteOutlinedIcon} title='No reviews' hint='This user may not have completed dual-sided ratings yet.' />
      ) : null}
      <PaginationBar section='reviews' pagination={reviews?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
