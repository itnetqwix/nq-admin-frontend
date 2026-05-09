import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteAdminEntity, getClipPlayUrl } from 'src/services/user360Api'
import { getImageUrl } from 'src/utils/utils'

const SectionCard = ({ title, children }) => (
  <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: { xs: 1.25, md: 2 }, mb: 2, backgroundColor: '#fff' }}>
    <Typography variant='h6' sx={{ mb: 1 }}>{title}</Typography>
    {children}
  </Box>
)

const downloadCsv = (rows, filename) => {
  if (!rows?.length) {
    toast.error('No data available to export')
    return
  }
  const headers = Object.keys(rows[0] || {})
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const value = row[h] === null || row[h] === undefined ? '' : String(row[h]).replaceAll('"', '""')
        return `"${value}"`
      }).join(',')
    )
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const DeleteActions = ({ entityType, entityId, onDeleted, hardDeletePolicy }) => {
  const [loadingMode, setLoadingMode] = useState('')

  const handleDelete = async mode => {
    if (!entityId) return
    const confirmMessage =
      mode === 'hard'
        ? 'Type HARD to permanently delete this record'
        : 'Type DELETE to soft delete this record'
    const expected = mode === 'hard' ? 'HARD' : 'DELETE'
    const value = window.prompt(confirmMessage, '')
    if (value !== expected) return
    if (mode === 'hard' && !hardDeletePolicy?.hardDeleteEnabled) {
      toast.error('Hard delete policy is disabled for this admin account')
      return
    }
    setLoadingMode(mode)
    try {
      await deleteAdminEntity({ entityType, entityId, mode })
      toast.success(mode === 'hard' ? 'Deleted permanently' : 'Deleted')
      onDeleted?.(entityType, entityId, mode)
    } catch (error) {
      toast.error(error?.message || 'Delete failed')
    } finally {
      setLoadingMode('')
    }
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
      <Button size='small' color='warning' variant='outlined' fullWidth={true} disabled={loadingMode !== ''} onClick={() => handleDelete('soft')}>
        {loadingMode === 'soft' ? 'Deleting...' : 'Delete (soft)'}
      </Button>
      <Button size='small' color='error' variant='outlined' fullWidth={true} disabled={loadingMode !== ''} onClick={() => handleDelete('hard')}>
        {loadingMode === 'hard' ? 'Deleting...' : 'Delete Permanently'}
      </Button>
    </Stack>
  )
}

const renderParty = party => (party ? `${party?.fullname || ''} (${party?.account_type || '-'})` : '-')

const safeImg = path => {
  const u = getImageUrl(path)
  return typeof u === 'string' ? u : undefined
}

function ClipPlayDialog({ clipId, open, onClose }) {
  const [url, setUrl] = useState('')
  const [poster, setPoster] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open || !clipId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr('')
      setUrl('')
      setPoster('')
      try {
        const u = await getClipPlayUrl(clipId)
        if (!cancelled) {
          setUrl(u.videoUrl || u.cdnFallbackVideo || '')
          setPoster(u.thumbnailUrl || '')
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || 'Failed to load video')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, clipId])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Play clip</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
        ) : null}
        {err ? <Typography color='error' sx={{ py: 2 }}>{err}</Typography> : null}
        {!loading && url ? (
          <video
            controls
            playsInline
            style={{ width: '100%', maxHeight: '70vh', background: '#000' }}
            src={url}
            poster={poster || undefined}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUser360Tabs({
  tab,
  onTabChange,
  userData,
  lessons = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  reviews = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  assets = {
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
  timeline = { items: [], pagination: { page: 1, limit: 30, total: 0 } },
  loadingLessons = false,
  loadingReviews = false,
  loadingAssets = false,
  loadingTimeline = false,
  onRefresh,
  query,
  onQueryChange,
  hardDeletePolicy
}) {
  const summary = useMemo(() => userData?.summary || {}, [userData])
  const overview = userData?.overview || {}
  const profile = userData?.user || {}
  const identity = overview.identity || {}
  const money = overview.money || {}
  const media = overview.media || {}
  const preferences = overview.preferences || {}

  const lessonsItems = lessons?.items || []
  const reviewsItems = reviews?.items || []
  const clipsItems = assets?.clips?.items || []
  const reportItems = assets?.reports?.items || []
  const savedItems = assets?.savedSessions?.items || []
  const timelineItems = timeline?.items || []

  const [playClipId, setPlayClipId] = useState(null)

  const QueryToolbar = ({ section, sectionQuery, lessonSortOptions = true }) => {
    const [searchDraft, setSearchDraft] = useState(sectionQuery?.search ?? '')
    useEffect(() => {
      setSearchDraft(sectionQuery?.search ?? '')
    }, [section, sectionQuery?.search])
    useEffect(() => {
      const tid = setTimeout(() => {
        if (searchDraft !== (sectionQuery?.search ?? '')) {
          onQueryChange(section, { search: searchDraft, page: 1 })
        }
      }, 450)
      return () => clearTimeout(tid)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search only
    }, [searchDraft])
    return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} alignItems={{ md: 'center' }} useFlexGap>
      {'search' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          label='Search (server)'
          value={searchDraft}
          onChange={e => setSearchDraft(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 220 } }}
        />
      ) : null}
      {'sortBy' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          select
          label='Sort By'
          value={sectionQuery?.sortBy || 'createdAt'}
          onChange={e => onQueryChange(section, { sortBy: e.target.value })}
          sx={{ minWidth: { xs: '100%', md: 140 } }}
        >
          <MenuItem value='createdAt'>Created</MenuItem>
          {lessonSortOptions ? <MenuItem value='booked_date'>Booked Date</MenuItem> : null}
          {lessonSortOptions ? <MenuItem value='status'>Status</MenuItem> : null}
          {!lessonSortOptions ? <MenuItem value='title'>Title</MenuItem> : null}
        </TextField>
      ) : null}
      {'sortOrder' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          select
          label='Order'
          value={sectionQuery?.sortOrder || 'desc'}
          onChange={e => onQueryChange(section, { sortOrder: e.target.value })}
          sx={{ minWidth: { xs: '100%', md: 120 } }}
        >
          <MenuItem value='desc'>Desc</MenuItem>
          <MenuItem value='asc'>Asc</MenuItem>
        </TextField>
      ) : null}
      {'status' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          label='Status'
          value={sectionQuery?.status || ''}
          onChange={e => onQueryChange(section, { status: e.target.value, page: 1 })}
          sx={{ minWidth: { xs: '100%', md: 140 } }}
        />
      ) : null}
      {'limit' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          select
          label='Limit'
          value={sectionQuery?.limit || 20}
          onChange={e => onQueryChange(section, { limit: Number(e.target.value), page: 1 })}
          sx={{ minWidth: { xs: '100%', md: 110 } }}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={30}>30</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </TextField>
      ) : null}
    </Stack>
    )
  }

  const ActivityToolbar = () => {
    const aq = query?.activity || {}
    const [typeDraft, setTypeDraft] = useState(aq.eventType ?? '')
    useEffect(() => {
      setTypeDraft(aq.eventType ?? '')
    }, [aq.eventType])
    useEffect(() => {
      const tid = setTimeout(() => {
        if (typeDraft !== (aq.eventType ?? '')) {
          onQueryChange('activity', { eventType: typeDraft, page: 1 })
        }
      }, 400)
      return () => clearTimeout(tid)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce filter only
    }, [typeDraft])
    return (
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} alignItems={{ md: 'center' }} useFlexGap>
        <TextField
          size='small'
          label='Filter by type (substring)'
          placeholder='booking, clip, admin_audit, login…'
          value={typeDraft}
          onChange={e => setTypeDraft(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 280 } }}
        />
        <TextField
          size='small'
          select
          label='Limit'
          value={aq.limit || 30}
          onChange={e => onQueryChange('activity', { limit: Number(e.target.value), page: 1 })}
          sx={{ minWidth: { xs: '100%', md: 110 } }}
        >
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={30}>30</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </TextField>
      </Stack>
    )
  }

  const PaginationBar = ({ section, pagination }) => {
    const page = pagination?.page || 1
    const total = pagination?.total || 0
    const limit = pagination?.limit || 20
    const maxPage = Math.max(1, Math.ceil(total / limit))
    return (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mt: 2 }}>
        <Typography variant='body2'>Page {page} of {maxPage} (Total: {total})</Typography>
        <Button size='small' variant='outlined' fullWidth={true} disabled={page <= 1} onClick={() => onQueryChange(section, { page: page - 1 })}>
          Prev
        </Button>
        <Button size='small' variant='outlined' fullWidth={true} disabled={page >= maxPage} onClick={() => onQueryChange(section, { page: page + 1 })}>
          Next
        </Button>
      </Stack>
    )
  }

  const kv = (label, value) => (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>{value ?? '—'}</Typography>
    </Grid>
  )

  return (
    <Box sx={{ mt: 2, width: '100%', overflowX: 'hidden' }}>
      <Tabs value={tab} onChange={(_, value) => onTabChange(value)} variant='scrollable' scrollButtons='auto'>
        <Tab label='Overview' />
        <Tab label='Lessons' />
        <Tab label='Reviews' />
        <Tab label='Clips' />
        <Tab label='PDF Plans' />
        <Tab label='Activity' />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && (
          <SectionCard title='User overview'>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: 'flex-start' }}>
              <Avatar src={media.profile_picture_url || safeImg(profile?.profile_picture)} sx={{ width: 88, height: 88 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant='h6'>{identity.fullname || profile?.fullname || '—'}</Typography>
                <Typography variant='body2' color='text.secondary'>{identity.email || profile?.email}</Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                  <Chip size='small' label={`Type: ${identity.account_type || profile?.account_type || '—'}`} />
                  <Chip size='small' label={`Status: ${identity.status || profile?.status || '—'}`} />
                  <Chip size='small' label={`Last online: ${summary.lastOnlineAt || overview.lastOnlineAt ? new Date(summary.lastOnlineAt || overview.lastOnlineAt).toLocaleString() : '—'}`} />
                </Stack>
              </Box>
            </Stack>

            <Typography variant='subtitle2' sx={{ mt: 2, mb: 1 }}>Counts</Typography>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
              <Chip label={`Lessons: ${summary.lessonsCount ?? 0}`} />
              <Chip label={`Completed: ${summary.completedLessonsCount ?? 0}`} />
              <Chip label={`Reviews: ${summary.reviewsCount ?? 0}`} />
              <Chip label={`Clips: ${summary.clipsCount ?? 0}`} />
              <Chip label={`Plans: ${summary.reportsCount ?? 0}`} />
              <Chip label={`Friends: ${summary.friendsCount ?? 0}`} />
              <Chip label={`Notifications (inbox rows): ${summary.notificationsCount ?? 0}`} />
            </Stack>

            <Typography variant='subtitle2' sx={{ mb: 1 }}>Identity</Typography>
            <Grid container spacing={1.5}>
              {kv('Mobile', identity.mobile_no)}
              {kv('Login type', identity.login_type)}
              {kv('Category', identity.category)}
              {kv('Created', identity.createdAt ? new Date(identity.createdAt).toLocaleString() : null)}
              {kv('Updated', identity.updatedAt ? new Date(identity.updatedAt).toLocaleString() : null)}
            </Grid>

            <Typography variant='subtitle2' sx={{ mt: 2, mb: 1 }}>Wallet &amp; compliance</Typography>
            <Grid container spacing={1.5}>
              {kv('Wallet', money.wallet_amount != null ? String(money.wallet_amount) : null)}
              {kv('Stripe account', money.stripe_account_id)}
              {kv('KYC completed', money.is_kyc_completed != null ? String(money.is_kyc_completed) : null)}
              {kv('Registered with Stripe', money.is_registered_with_stript != null ? String(money.is_registered_with_stript) : null)}
              {kv('Commission', money.commission)}
            </Grid>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Notification preferences &amp; extra profile (JSON)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography component='pre' variant='caption' sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', mb: 2 }}>
                  {JSON.stringify({ notifications: preferences.notifications, extraInfo: preferences.extraInfo }, null, 2)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </SectionCard>
        )}

        {tab === 1 && (
          <SectionCard title='Lessons and Requests'>
            <QueryToolbar section='lessons' sectionQuery={query?.lessons} lessonSortOptions={true} />
            {loadingLessons ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
            ) : null}
            <Button size='small' sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }} onClick={() => downloadCsv(lessonsItems, 'admin-lessons.csv')}>Export CSV</Button>
            {!loadingLessons && lessonsItems.length ? lessonsItems.map(lesson => (
              <Box key={lesson?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Typography variant='body2'>Date: {lesson?.booked_date ? new Date(lesson.booked_date).toLocaleString() : '-'}</Typography>
                <Typography variant='body2'>Time: {lesson?.session_start_time || '-'} - {lesson?.session_end_time || '-'}</Typography>
                <Typography variant='body2'>Status: {lesson?.status || '-'}</Typography>
                <Typography variant='body2'>Trainer: {renderParty(lesson?.trainer_id)}</Typography>
                <Typography variant='body2'>Trainee: {renderParty(lesson?.trainee_id)}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='booked_session' entityId={lesson?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : null}
            {!loadingLessons && !lessonsItems.length ? <Typography>No lessons found.</Typography> : null}
            <PaginationBar section='lessons' pagination={lessons?.pagination} />
          </SectionCard>
        )}

        {tab === 2 && (
          <SectionCard title='Reviews'>
            <QueryToolbar section='reviews' sectionQuery={query?.reviews} lessonSortOptions={true} />
            {loadingReviews ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
            ) : null}
            <Button size='small' sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }} onClick={() => downloadCsv(reviewsItems, 'admin-reviews.csv')}>Export CSV</Button>
            {!loadingReviews && reviewsItems.length ? reviewsItems.map(review => (
              <Box key={review?.session_id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Typography variant='body2'>Session: {String(review?.session_id)}</Typography>
                <Typography variant='body2'>Date: {review?.booked_date ? new Date(review.booked_date).toLocaleString() : '-'}</Typography>
                <Typography variant='body2'>Status: {review?.status || '-'}</Typography>
                <Typography variant='body2'>Trainer: {renderParty(review?.trainer)}</Typography>
                <Typography variant='body2'>Trainee: {renderParty(review?.trainee)}</Typography>
                <Typography variant='body2'>Ratings: {review?.ratings ? JSON.stringify(review.ratings) : '-'}</Typography>
              </Box>
            )) : null}
            {!loadingReviews && !reviewsItems.length ? <Typography>No reviews found.</Typography> : null}
            <PaginationBar section='reviews' pagination={reviews?.pagination} />
          </SectionCard>
        )}

        {tab === 3 && (
          <SectionCard title='Clips'>
            <QueryToolbar section='assets' sectionQuery={query?.assets} lessonSortOptions={false} />
            {loadingAssets ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
            ) : null}
            <Button size='small' sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }} onClick={() => downloadCsv(clipsItems, 'admin-clips.csv')}>Export CSV</Button>
            {!loadingAssets && clipsItems.length ? clipsItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                  {item?.thumbnail ? (
                    <Box
                      component='img'
                      src={safeImg(item.thumbnail)}
                      alt=''
                      sx={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 1, bgcolor: '#f3f4f6' }}
                    />
                  ) : null}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='body2'>Title: {item?.title || '-'}</Typography>
                    <Typography variant='body2'>Category: {item?.category || '-'}</Typography>
                    <Typography variant='body2'>File: {item?.file_name || '-'}</Typography>
                    <Typography variant='body2'>Type: {item?.file_type || '-'}</Typography>
                    <Stack direction='row' spacing={1} sx={{ mt: 1 }} flexWrap='wrap' useFlexGap>
                      <Button size='small' variant='contained' onClick={() => setPlayClipId(String(item._id))}>Play</Button>
                      <DeleteActions entityType='clip' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            )) : null}
            {!loadingAssets && !clipsItems.length ? <Typography>No clips found.</Typography> : null}
            <PaginationBar section='assets' pagination={assets?.clips?.pagination} />
          </SectionCard>
        )}

        {tab === 4 && (
          <SectionCard title='PDF Plans and Session Reports'>
            <QueryToolbar section='assets' sectionQuery={query?.assets} lessonSortOptions={false} />
            {loadingAssets ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
            ) : null}
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
              Pagination applies to both reports and saved sessions (same page size).
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <Button size='small' fullWidth={true} onClick={() => downloadCsv(reportItems, 'admin-pdf-reports.csv')}>Export Reports CSV</Button>
              <Button size='small' fullWidth={true} onClick={() => downloadCsv(savedItems, 'admin-saved-sessions.csv')}>Export Sessions CSV</Button>
            </Stack>
            {!loadingAssets && reportItems.length ? reportItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Typography variant='body2'>Title: {item?.title || '-'}</Typography>
                <Typography variant='body2'>Session: {item?.sessions?._id || '-'}</Typography>
                <Typography variant='body2'>Trainer: {item?.trainer?.fullname || '-'}</Typography>
                <Typography variant='body2'>Trainee: {item?.trainee?.fullname || '-'}</Typography>
                <Typography variant='body2'>Recording: {item?.sessionRecordingUrl || '-'}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='report' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : null}
            {!loadingAssets && !reportItems.length ? <Typography>No plans/reports found.</Typography> : null}

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>Saved Sessions</Typography>
            {!loadingAssets && savedItems.length ? savedItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Typography variant='body2'>File: {item?.file_name || '-'}</Typography>
                <Typography variant='body2'>Trainer: {item?.trainer_name || '-'}</Typography>
                <Typography variant='body2'>Trainee: {item?.trainee_name || '-'}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='saved_session' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : null}
            {!loadingAssets && !savedItems.length ? <Typography>No saved sessions found.</Typography> : null}
            <PaginationBar section='assets' pagination={assets?.reports?.pagination} />
          </SectionCard>
        )}

        {tab === 5 && (
          <SectionCard title='Activity timeline'>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Merged history: bookings, clips, reports, saved sessions, admin actions, trainer online snapshot, and recorded user events (login, profile, etc.).
            </Typography>
            <ActivityToolbar />
            {loadingTimeline ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
            ) : null}
            <Button
              size='small'
              sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }}
              onClick={() =>
                downloadCsv(
                  timelineItems.map(row => ({
                    type: row.type,
                    at: row.at,
                    title: row.title,
                    meta: JSON.stringify(row.meta || {})
                  })),
                  'admin-user-timeline.csv'
                )}
            >
              Export CSV
            </Button>
            {!loadingTimeline && timelineItems.length ? timelineItems.map((item, idx) => (
              <Box key={`${item.at}-${item.type}-${idx}`} sx={{ borderBottom: '1px dashed #ddd', py: 1.5, wordBreak: 'break-word' }}>
                <Typography variant='caption' color='text.secondary'>{item.at ? new Date(item.at).toLocaleString() : '—'}</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>{item.type}</Typography>
                <Typography variant='body2'>{item.title}</Typography>
                {item.meta && Object.keys(item.meta).length ? (
                  <Typography variant='caption' component='pre' sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                    {JSON.stringify(item.meta, null, 2)}
                  </Typography>
                ) : null}
              </Box>
            )) : null}
            {!loadingTimeline && !timelineItems.length ? <Typography>No activity in this view.</Typography> : null}
            <PaginationBar section='activity' pagination={timeline?.pagination} />
          </SectionCard>
        )}
      </Box>

      <ClipPlayDialog clipId={playClipId} open={Boolean(playClipId)} onClose={() => setPlayClipId(null)} />
    </Box>
  )
}
