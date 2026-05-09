import { Box, Button, Chip, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteAdminEntity } from './api'

const SectionCard = ({ title, children }) => (
  <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2, mb: 2, backgroundColor: '#fff' }}>
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
    <Stack direction='row' spacing={1}>
      <Button size='small' color='warning' variant='outlined' disabled={loadingMode !== ''} onClick={() => handleDelete('soft')}>
        {loadingMode === 'soft' ? 'Deleting...' : 'Delete (soft)'}
      </Button>
      <Button size='small' color='error' variant='outlined' disabled={loadingMode !== ''} onClick={() => handleDelete('hard')}>
        {loadingMode === 'hard' ? 'Deleting...' : 'Delete Permanently'}
      </Button>
    </Stack>
  )
}

const renderParty = party => party ? `${party?.fullname || ''} (${party?.account_type || '-'})` : '-'

export default function AdminUser360Tabs({
  userData,
  lessons = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  reviews = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  assets = {
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
  auditLogs = { items: [], pagination: { page: 1, limit: 20, total: 0 } },
  onRefresh,
  query,
  onQueryChange,
  hardDeletePolicy
}) {
  const [tab, setTab] = useState(0)

  const overview = useMemo(() => userData?.summary || {}, [userData])
  const profile = userData?.user || {}
  const lessonsItems = lessons?.items || []
  const reviewsItems = reviews?.items || []
  const clipsItems = assets?.clips?.items || []
  const reportItems = assets?.reports?.items || []
  const savedItems = assets?.savedSessions?.items || []
  const auditItems = auditLogs?.items || []

  const QueryToolbar = ({ section, sectionQuery }) => (
    <Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
      <TextField
        size='small'
        label='Search'
        value={sectionQuery?.search || ''}
        onChange={e => onQueryChange(section, { search: e.target.value, page: 1 })}
      />
      <TextField
        size='small'
        select
        label='Sort By'
        value={sectionQuery?.sortBy || 'createdAt'}
        onChange={e => onQueryChange(section, { sortBy: e.target.value })}
      >
        <MenuItem value='createdAt'>Created</MenuItem>
        <MenuItem value='booked_date'>Booked Date</MenuItem>
        <MenuItem value='status'>Status</MenuItem>
      </TextField>
      <TextField
        size='small'
        select
        label='Order'
        value={sectionQuery?.sortOrder || 'desc'}
        onChange={e => onQueryChange(section, { sortOrder: e.target.value })}
      >
        <MenuItem value='desc'>Desc</MenuItem>
        <MenuItem value='asc'>Asc</MenuItem>
      </TextField>
      {'status' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          label='Status'
          value={sectionQuery?.status || ''}
          onChange={e => onQueryChange(section, { status: e.target.value, page: 1 })}
        />
      ) : null}
      <TextField
        size='small'
        select
        label='Limit'
        value={sectionQuery?.limit || 20}
        onChange={e => onQueryChange(section, { limit: Number(e.target.value), page: 1 })}
      >
        <MenuItem value={10}>10</MenuItem>
        <MenuItem value={20}>20</MenuItem>
        <MenuItem value={50}>50</MenuItem>
      </TextField>
    </Stack>
  )

  const PaginationBar = ({ section, pagination }) => {
    const page = pagination?.page || 1
    const total = pagination?.total || 0
    const limit = pagination?.limit || 20
    const maxPage = Math.max(1, Math.ceil(total / limit))
    return (
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 2 }}>
        <Typography variant='body2'>Page {page} of {maxPage} (Total: {total})</Typography>
        <Button size='small' variant='outlined' disabled={page <= 1} onClick={() => onQueryChange(section, { page: page - 1 })}>
          Prev
        </Button>
        <Button size='small' variant='outlined' disabled={page >= maxPage} onClick={() => onQueryChange(section, { page: page + 1 })}>
          Next
        </Button>
      </Stack>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant='scrollable' scrollButtons='auto'>
        <Tab label='Overview' />
        <Tab label='Lessons' />
        <Tab label='Reviews' />
        <Tab label='Clips' />
        <Tab label='PDF Plans' />
        <Tab label='Activity' />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && (
          <SectionCard title='User Overview'>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip label={`Name: ${profile?.fullname || '-'}`} />
              <Chip label={`Email: ${profile?.email || '-'}`} />
              <Chip label={`Type: ${profile?.account_type || '-'}`} />
              <Chip label={`Status: ${profile?.status || '-'}`} />
              <Chip label={`Lessons: ${overview?.lessonsCount || 0}`} />
              <Chip label={`Completed: ${overview?.completedLessonsCount || 0}`} />
              <Chip label={`Reviews: ${overview?.reviewsCount || 0}`} />
              <Chip label={`Clips: ${overview?.clipsCount || 0}`} />
              <Chip label={`Plans: ${overview?.reportsCount || 0}`} />
            </Stack>
          </SectionCard>
        )}

        {tab === 1 && (
          <SectionCard title='Lessons and Requests'>
            <QueryToolbar section='lessons' sectionQuery={query?.lessons} />
            <Button size='small' sx={{ mb: 2 }} onClick={() => downloadCsv(lessonsItems, 'admin-lessons.csv')}>Export CSV</Button>
            {lessonsItems.length ? lessonsItems.map(lesson => (
              <Box key={lesson?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>Date: {lesson?.booked_date ? new Date(lesson.booked_date).toLocaleString() : '-'}</Typography>
                <Typography variant='body2'>Time: {lesson?.session_start_time || '-'} - {lesson?.session_end_time || '-'}</Typography>
                <Typography variant='body2'>Status: {lesson?.status || '-'}</Typography>
                <Typography variant='body2'>Trainer: {renderParty(lesson?.trainer_id)}</Typography>
                <Typography variant='body2'>Trainee: {renderParty(lesson?.trainee_id)}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='booked_session' entityId={lesson?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : <Typography>No lessons found.</Typography>}
            <PaginationBar section='lessons' pagination={lessons?.pagination} />
          </SectionCard>
        )}

        {tab === 2 && (
          <SectionCard title='Reviews'>
            <QueryToolbar section='reviews' sectionQuery={query?.reviews} />
            <Button size='small' sx={{ mb: 2 }} onClick={() => downloadCsv(reviewsItems, 'admin-reviews.csv')}>Export CSV</Button>
            {reviewsItems.length ? reviewsItems.map(review => (
              <Box key={review?.session_id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>Session: {String(review?.session_id)}</Typography>
                <Typography variant='body2'>Date: {review?.booked_date ? new Date(review.booked_date).toLocaleString() : '-'}</Typography>
                <Typography variant='body2'>Status: {review?.status || '-'}</Typography>
                <Typography variant='body2'>Trainer: {renderParty(review?.trainer)}</Typography>
                <Typography variant='body2'>Trainee: {renderParty(review?.trainee)}</Typography>
                <Typography variant='body2'>Ratings: {review?.ratings ? JSON.stringify(review.ratings) : '-'}</Typography>
              </Box>
            )) : <Typography>No reviews found.</Typography>}
            <PaginationBar section='reviews' pagination={reviews?.pagination} />
          </SectionCard>
        )}

        {tab === 3 && (
          <SectionCard title='Clips'>
            <QueryToolbar section='assets' sectionQuery={query?.assets} />
            <Button size='small' sx={{ mb: 2 }} onClick={() => downloadCsv(clipsItems, 'admin-clips.csv')}>Export CSV</Button>
            {clipsItems.length ? clipsItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>Title: {item?.title || '-'}</Typography>
                <Typography variant='body2'>Category: {item?.category || '-'}</Typography>
                <Typography variant='body2'>File: {item?.file_name || '-'}</Typography>
                <Typography variant='body2'>Type: {item?.file_type || '-'}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='clip' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : <Typography>No clips found.</Typography>}
            <PaginationBar section='assets' pagination={assets?.clips?.pagination} />
          </SectionCard>
        )}

        {tab === 4 && (
          <SectionCard title='PDF Plans and Session Reports'>
            <QueryToolbar section='assets' sectionQuery={query?.assets} />
            <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
              <Button size='small' onClick={() => downloadCsv(reportItems, 'admin-pdf-reports.csv')}>Export Reports CSV</Button>
              <Button size='small' onClick={() => downloadCsv(savedItems, 'admin-saved-sessions.csv')}>Export Sessions CSV</Button>
            </Stack>
            {reportItems.length ? reportItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>Title: {item?.title || '-'}</Typography>
                <Typography variant='body2'>Session: {item?.sessions?._id || '-'}</Typography>
                <Typography variant='body2'>Trainer: {item?.trainer?.fullname || '-'}</Typography>
                <Typography variant='body2'>Trainee: {item?.trainee?.fullname || '-'}</Typography>
                <Typography variant='body2'>Recording: {item?.sessionRecordingUrl || '-'}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='report' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : <Typography>No plans/reports found.</Typography>}

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>Saved Sessions</Typography>
            {savedItems.length ? savedItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>File: {item?.file_name || '-'}</Typography>
                <Typography variant='body2'>Trainer: {item?.trainer_name || '-'}</Typography>
                <Typography variant='body2'>Trainee: {item?.trainee_name || '-'}</Typography>
                <Box sx={{ mt: 1 }}>
                  <DeleteActions entityType='saved_session' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                </Box>
              </Box>
            )) : <Typography>No saved sessions found.</Typography>}
            <PaginationBar section='assets' pagination={assets?.reports?.pagination} />
          </SectionCard>
        )}

        {tab === 5 && (
          <SectionCard title='Admin Activity / Audit'>
            <QueryToolbar section='activity' sectionQuery={query?.activity} />
            <Button size='small' sx={{ mb: 2 }} onClick={() => downloadCsv(auditItems, 'admin-activity.csv')}>Export CSV</Button>
            {auditItems.length ? auditItems.map(item => (
              <Box key={item?._id} sx={{ borderBottom: '1px dashed #ddd', py: 1.5 }}>
                <Typography variant='body2'>Action: {item?.action || '-'}</Typography>
                <Typography variant='body2'>Entity: {item?.entity_type || '-'} / {item?.entity_id || '-'}</Typography>
                <Typography variant='body2'>Admin: {item?.admin_id?.fullname || '-'}</Typography>
                <Typography variant='body2'>Target User: {item?.target_user_id?.fullname || '-'}</Typography>
                <Typography variant='body2'>When: {item?.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</Typography>
                <Typography variant='body2'>Reason: {item?.reason || '-'}</Typography>
              </Box>
            )) : <Typography>No activity found.</Typography>}
            <PaginationBar section='activity' pagination={auditLogs?.pagination} />
          </SectionCard>
        )}
      </Box>
    </Box>
  )
}
