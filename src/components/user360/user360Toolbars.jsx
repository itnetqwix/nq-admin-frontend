import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import { ops } from 'src/styles/opsSurface'
import { TIMELINE_CATEGORY_META, TIMELINE_CATEGORY_QUICK } from './constants'

export const ToolbarRefreshExport = ({ onRefresh, onExport, exportLabel = 'Export CSV', busy }) => (
  <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
    <AdminRefreshButton onClick={() => onRefresh?.()} loading={busy} />
    <Button
      size='small'
      variant='contained'
      startIcon={<FileDownloadOutlinedIcon />}
      onClick={onExport}
      disabled={busy}
      sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
    >
      {exportLabel}
    </Button>
  </Stack>
)

export const QueryToolbar = ({ section, sectionQuery, onQueryChange, lessonSortOptions = true }) => {
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
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 0, flexWrap: 'wrap' }} alignItems={{ md: 'center' }} useFlexGap>
      {'search' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          placeholder='Search…'
          value={searchDraft}
          onChange={e => setSearchDraft(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' color='action' />
              </InputAdornment>
            )
          }}
        />
      ) : null}
      {'sortBy' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          select
          label='Sort by'
          value={sectionQuery?.sortBy || 'createdAt'}
          onChange={e => onQueryChange(section, { sortBy: e.target.value })}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value='createdAt'>Created</MenuItem>
          {lessonSortOptions ? <MenuItem value='booked_date'>Booked date</MenuItem> : null}
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
          sx={{ minWidth: 120 }}
        >
          <MenuItem value='desc'>Newest first</MenuItem>
          <MenuItem value='asc'>Oldest first</MenuItem>
        </TextField>
      ) : null}
      {'status' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          label='Status contains'
          value={sectionQuery?.status || ''}
          onChange={e => onQueryChange(section, { status: e.target.value, page: 1 })}
          sx={{ minWidth: 160 }}
        />
      ) : null}
      {'limit' in (sectionQuery || {}) ? (
        <TextField
          size='small'
          select
          label='Rows'
          value={sectionQuery?.limit || 20}
          onChange={e => onQueryChange(section, { limit: Number(e.target.value), page: 1 })}
          sx={{ minWidth: 100 }}
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

export const ActivityToolbar = ({ query, onQueryChange, userId: userIdProp }) => {
  const router = useRouter()
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

  const userId = userIdProp || (router.query?.id ? String(router.query.id) : '')
  const activeCategory = String(aq.category || 'all')

  return (
    <Stack spacing={2}>
      <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} alignItems='center'>
        {TIMELINE_CATEGORY_QUICK.map(key => {
          const selected = activeCategory === key
          const label = TIMELINE_CATEGORY_META[key]?.label || key
          return (
            <Chip
              key={key}
              label={label}
              onClick={() => {
                onQueryChange('activity', {
                  category: key === 'all' ? '' : key,
                  page: 1
                })
              }}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              size='small'
              sx={{ fontWeight: selected ? 600 : 400 }}
            />
          )
        })}
      </Stack>
      <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} alignItems='center'>
        {userId ? (
          <Button
            size='small'
            component={Link}
            href={`/apps/platform-activity?userId=${userId}`}
            sx={{ textTransform: 'none' }}
          >
            Platform activity →
          </Button>
        ) : null}
        {userId ? (
          <Button
            size='small'
            component={Link}
            href={`/apps/finance?userId=${userId}`}
            sx={{ textTransform: 'none' }}
          >
            Finance →
          </Button>
        ) : null}
        {userId ? (
          <Button
            size='small'
            component={Link}
            href={`/apps/audit-logs?userId=${userId}`}
            sx={{ textTransform: 'none' }}
          >
            Admin audit →
          </Button>
        ) : null}
        {userId ? (
          <Button
            size='small'
            component={Link}
            href={`/apps/logs?tab=login&userId=${userId}`}
            sx={{ textTransform: 'none' }}
          >
            Login history →
          </Button>
        ) : null}
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} flexWrap='wrap' useFlexGap>
        <TextField
          size='small'
          label='Custom filter (matches event type)'
          placeholder='e.g. booking_updated, user_activity…'
          value={typeDraft}
          onChange={e => setTypeDraft(e.target.value)}
          sx={{ minWidth: { xs: '100%', md: 320 }, flex: 1 }}
        />
        <TextField
          size='small'
          select
          label='Rows'
          value={aq.limit || 30}
          onChange={e => onQueryChange('activity', { limit: Number(e.target.value), page: 1 })}
          sx={{ minWidth: 100 }}
        >
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={30}>30</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </TextField>
      </Stack>
    </Stack>
  )
}

export const PaginationBar = ({ section, pagination, onQueryChange }) => {
  const page = pagination?.page || 1
  const total = pagination?.total || 0
  const limit = pagination?.limit || 20
  const maxPage = Math.max(1, Math.ceil(total / limit))
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent='space-between' sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant='body2' color='text.secondary'>
        Page <strong>{page}</strong> of <strong>{maxPage}</strong>
        <Box component='span' sx={{ mx: 1, opacity: 0.4 }}>|</Box>
        {total} total rows
      </Typography>
      <Stack direction='row' spacing={1}>
        <Button size='small' variant='outlined' disabled={page <= 1} onClick={() => onQueryChange(section, { page: page - 1 })}>
          Previous
        </Button>
        <Button size='small' variant='outlined' disabled={page >= maxPage} onClick={() => onQueryChange(section, { page: page + 1 })}>
          Next
        </Button>
      </Stack>
    </Stack>
  )
}
