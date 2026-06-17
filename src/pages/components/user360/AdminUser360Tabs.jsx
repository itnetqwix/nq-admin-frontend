import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import User360AccountReviewActions from './User360AccountReviewActions'
import User360WalletTab from './User360WalletTab'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useTheme
} from '@mui/material'
import { useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import toast from 'react-hot-toast'
import { deleteAdminEntity, getClipPlayUrl } from 'src/services/user360Api'
import LessonTimelineDialog from 'src/pages/components/booking/LessonTimelineDialog'
import { getImageUrl } from 'src/utils/utils'

const tabLabels = ['Overview', 'Lessons', 'Reviews', 'Clips', 'PDF & saved', 'Activity', 'Wallet', 'Issues & Logs']

const SectionShell = ({ title, subtitle, action, children }) => {
  const theme = useTheme()
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }} justifyContent='space-between' sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>{title}</Typography>
          {subtitle ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, maxWidth: 720 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
      </Stack>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          p: { xs: 1.5, md: 2 }
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

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

const lessonStatusColor = status => {
  const s = String(status || '').toLowerCase()
  if (s.includes('complete')) return 'success'
  if (s.includes('cancel')) return 'error'
  if (s.includes('confirm') || s.includes('book')) return 'info'
  if (s.includes('pending') || s.includes('start')) return 'warning'
  return 'default'
}

const timelineDotColor = type => {
  const t = String(type || '').toLowerCase()
  if (t.includes('admin')) return 'error'
  if (t.includes('booking')) return 'primary'
  if (t.includes('clip')) return 'secondary'
  if (t.includes('login') || t.includes('user_activity')) return 'success'
  if (t.includes('report') || t.includes('saved')) return 'info'
  if (t.includes('online')) return 'warning'
  return 'default'
}

const timelineDotBg = (type, theme) => {
  const c = timelineDotColor(type)
  if (c === 'error') return theme.palette.error.main
  if (c === 'primary') return theme.palette.primary.main
  if (c === 'secondary') return theme.palette.secondary.main
  if (c === 'success') return theme.palette.success.main
  if (c === 'info') return theme.palette.info.main
  if (c === 'warning') return theme.palette.warning.main
  return theme.palette.grey[500]
}

const DeleteActions = ({ entityType, entityId, onDeleted, hardDeletePolicy }) => {
  const ability = useContext(AbilityContext)
  const canSoft = ability?.can('update', 'admin-action-soft-delete') ?? true
  const canHard = ability?.can('delete', 'admin-action-hard-delete') ?? true
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

  if (!canSoft && !canHard) return null

  return (
    <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap>
      {canSoft ? (
        <Button size='small' color='warning' variant='outlined' disabled={loadingMode !== ''} onClick={() => handleDelete('soft')}>
          {loadingMode === 'soft' ? '…' : 'Soft delete'}
        </Button>
      ) : null}
      {canHard ? (
        <Button size='small' color='error' variant='outlined' disabled={loadingMode !== ''} onClick={() => handleDelete('hard')}>
          {loadingMode === 'hard' ? '…' : 'Hard delete'}
        </Button>
      ) : null}
    </Stack>
  )
}

const renderParty = party => (party ? `${party?.fullname || ''} (${party?.account_type || '—'})` : '—')

const safeImg = path => {
  const u = getImageUrl(path)
  return typeof u === 'string' ? u : undefined
}

const EmptyHint = ({ icon: Icon, title, hint }) => (
  <Box
    sx={{
      py: 6,
      px: 2,
      textAlign: 'center',
      color: 'text.secondary',
      borderRadius: 2,
      border: '1px dashed',
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}
  >
    {Icon ? <Icon sx={{ fontSize: 40, opacity: 0.35, mb: 1 }} /> : null}
    <Typography variant='subtitle1' color='text.primary' sx={{ mb: 0.5 }}>{title}</Typography>
    <Typography variant='body2'>{hint}</Typography>
  </Box>
)

const formatPrimitive = val => {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') return val.trim() === '' ? '—' : val
  if (val instanceof Date) return val.toLocaleString()
  try {
    return JSON.stringify(val)
  } catch {
    return String(val)
  }
}

const RATING_FIELD_LABELS = {
  sessionRating: 'Session',
  audioVideoRating: 'Audio & video',
  recommendRating: 'Would recommend',
  title: 'Title',
  remarksInfo: 'Remarks',
  booking_id: 'Booking',
  session_id: 'Session'
}

/** Human-readable block for one side of a session rating (trainee / trainer). */
const RatingSideCard = ({ label, data }) => {
  const theme = useTheme()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const numericKeys = ['sessionRating', 'audioVideoRating', 'recommendRating']
  const chips = []
  numericKeys.forEach(key => {
    const v = data[key]
    if (v == null || v === '') return
    const lbl = RATING_FIELD_LABELS[key] || key
    chips.push(
      <Chip
        key={key}
        size='small'
        label={`${lbl}: ${v}/5`}
        color='primary'
        variant='outlined'
        sx={{ fontWeight: 600 }}
      />
    )
  })

  const textBits = []
  if (data.title) textBits.push({ k: 'Title', v: data.title })
  if (data.remarksInfo) textBits.push({ k: 'Remarks', v: data.remarksInfo })
  if (data.booking_id) textBits.push({ k: 'Booking ID', v: String(data.booking_id) })
  if (data.session_id) textBits.push({ k: 'Session ID', v: String(data.session_id) })

  const restKeys = Object.keys(data).filter(
    k => !numericKeys.includes(k) && !['title', 'remarksInfo', 'booking_id', 'session_id'].includes(k)
  )

  return (
    <Paper variant='outlined' sx={{ p: 1.25, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
      <Typography variant='caption' sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'primary.main' }}>
        {label}
      </Typography>
      {chips.length ? (
        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={0.75} sx={{ mt: 1 }}>
          {chips}
        </Stack>
      ) : null}
      {textBits.length ? (
        <Stack spacing={0.5} sx={{ mt: chips.length ? 1 : 0.5 }}>
          {textBits.map(({ k, v }) => (
            <Box key={k}>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>{k}</Typography>
              <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>{v}</Typography>
            </Box>
          ))}
        </Stack>
      ) : null}
      {restKeys.length ? (
        <Stack spacing={0.25} sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          {restKeys.map(k => (
            <Typography key={k} variant='caption' sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {k}: {formatPrimitive(data[k])}
            </Typography>
          ))}
        </Stack>
      ) : null}
    </Paper>
  )
}

/** Parses `ratings` object and renders trainee / trainer (and any other object-shaped sides). */
const ReviewRatingsCell = ({ ratings }) => {
  if (!ratings || typeof ratings !== 'object') {
    return <Typography variant='body2' color='text.secondary'>—</Typography>
  }

  const roleLabels = {
    trainee: 'Trainee review',
    trainer: 'Trainer review'
  }

  const entries = Object.entries(ratings).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))

  if (!entries.length) {
    return <Typography variant='body2' color='text.secondary'>No structured ratings</Typography>
  }

  return (
    <Stack spacing={1.25} sx={{ minWidth: { sm: 260 }, maxWidth: 420 }}>
      {entries.map(([role, data]) => (
        <RatingSideCard key={role} label={roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1)} data={data} />
      ))}
    </Stack>
  )
}

const NotificationPreferencesPanel = ({ notifications }) => {
  if (!notifications || typeof notifications !== 'object') {
    return <Typography variant='body2' color='text.secondary'>No notification preferences stored.</Typography>
  }

  const groups = ['promotional', 'transactional'].filter(g => notifications[g] && typeof notifications[g] === 'object')

  if (!groups.length) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Preferences are in an unexpected shape; use “Technical (raw)” below if needed.
      </Typography>
    )
  }

  return (
    <Grid container spacing={2}>
      {groups.map(group => (
        <Grid item xs={12} md={6} key={group}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700, textTransform: 'capitalize' }}>
            {group}
          </Typography>
          <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1}>
            {Object.entries(notifications[group]).map(([channel, on]) => (
              <Chip
                key={`${group}-${channel}`}
                size='small'
                label={`${channel}: ${on ? 'On' : 'Off'}`}
                color={on ? 'success' : 'default'}
                variant={on ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Grid>
      ))}
    </Grid>
  )
}

const ExtraInfoTree = ({ data, depth = 0 }) => {
  const theme = useTheme()
  if (data == null) return <Typography variant='body2' color='text.secondary'>—</Typography>
  if (typeof data !== 'object') {
    return <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>{formatPrimitive(data)}</Typography>
  }
  if (Array.isArray(data)) {
    if (!data.length) return <Typography variant='body2' color='text.secondary'>Empty list</Typography>
    return (
      <Stack component='ul' sx={{ m: 0, pl: 2 }}>
        {data.map((item, i) => (
          <Box component='li' key={i} sx={{ mb: 0.5 }}>
            {typeof item === 'object' && item !== null ? <ExtraInfoTree data={item} depth={depth + 1} /> : <Typography variant='body2'>{formatPrimitive(item)}</Typography>}
          </Box>
        ))}
      </Stack>
    )
  }

  const keys = Object.keys(data)
  if (!keys.length) return <Typography variant='body2' color='text.secondary'>Empty</Typography>

  return (
    <Grid container spacing={1.25}>
      {keys.map(key => {
        const val = data[key]
        const isNested = val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0
        return (
          <Grid item xs={12} key={key}>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>
              {key.replace(/_/g, ' ')}
            </Typography>
            {isNested && depth < 4 ? (
              <Box sx={{ pl: 1.5, borderLeft: `3px solid ${theme.palette.divider}`, py: 0.5 }}>
                <ExtraInfoTree data={val} depth={depth + 1} />
              </Box>
            ) : (
              <Box sx={{ pl: 0.5 }}>
                {typeof val === 'object' && val !== null ? (
                  <ExtraInfoTree data={val} depth={depth + 1} />
                ) : (
                  <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>{formatPrimitive(val)}</Typography>
                )}
              </Box>
            )}
          </Grid>
        )
      })}
    </Grid>
  )
}

function StatTile({ label, value, emphasize }) {
  const theme = useTheme()
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.06)}` }
      }}
    >
      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography variant={emphasize ? 'h4' : 'h5'} sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
        {value ?? 0}
      </Typography>
    </Paper>
  )
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
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Preview clip
        <IconButton aria-label='close' onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></Box>
        ) : null}
        {err ? <Typography color='error' sx={{ py: 2 }}>{err}</Typography> : null}
        {!loading && url ? (
          <video
            controls
            playsInline
            style={{ width: '100%', maxHeight: '70vh', background: '#000', borderRadius: 8 }}
            src={url}
            poster={poster || undefined}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default function AdminUser360Tabs({
  userId,
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
  opsEvents = { items: [], total: 0 },
  loadingLessons = false,
  loadingReviews = false,
  loadingAssets = false,
  loadingTimeline = false,
  loadingOpsEvents = false,
  onRefresh,
  query,
  onQueryChange,
  hardDeletePolicy
}) {
  const theme = useTheme()
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
  const opsItems = opsEvents?.items || []

  const [playClipId, setPlayClipId] = useState(null)
  const [timelineBookingId, setTimelineBookingId] = useState(null)
  const [metaOpenId, setMetaOpenId] = useState(null)

  const lastOnlineLabel = summary.lastOnlineAt || overview.lastOnlineAt
    ? new Date(summary.lastOnlineAt || overview.lastOnlineAt).toLocaleString()
    : 'Not recorded (user may be a trainee without socket presence)'

  const ToolbarRefreshExport = ({ onExport, exportLabel = 'Export CSV', busy }) => (
    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
      <Button
        size='small'
        variant='outlined'
        startIcon={<RefreshIcon />}
        onClick={() => onRefresh?.()}
        disabled={busy}
        sx={{ textTransform: 'none' }}
      >
        Refresh
      </Button>
      <Button
        size='small'
        variant='contained'
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={onExport}
        disabled={busy}
        sx={{ textTransform: 'none' }}
      >
        {exportLabel}
      </Button>
    </Stack>
  )

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

    const quick = [
      { label: 'All', value: '' },
      { label: 'Bookings', value: 'booking' },
      { label: 'Clips', value: 'clip' },
      { label: 'Admin', value: 'admin' },
      { label: 'Logins', value: 'login' },
      { label: 'Reports', value: 'report' }
    ]

    return (
      <Stack spacing={2}>
        <Stack direction='row' flexWrap='wrap' useFlexGap spacing={1} alignItems='center'>
          {quick.map(q => {
            const selected = q.value === '' ? !aq.eventType : String(aq.eventType) === q.value
            return (
              <Chip
                key={q.label}
                label={q.label}
                onClick={() => {
                  setTypeDraft(q.value)
                  onQueryChange('activity', { eventType: q.value, page: 1 })
                }}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                sx={{ fontWeight: 500 }}
              />
            )
          })}
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

  const PaginationBar = ({ section, pagination }) => {
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

  const kv = (label, value) => (
    <Grid item xs={12} sm={6} md={4}>
      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant='body2' sx={{ wordBreak: 'break-word', mt: 0.25 }}>{value ?? '—'}</Typography>
    </Grid>
  )

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: 'blur(8px)',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => onTabChange(value)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            px: { xs: 1, md: 2 },
            minHeight: 48,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 }
          }}
        >
          {tabLabels.map((label, i) => (
            <Tab key={label} label={label} id={`user360-tab-${i}`} />
          ))}
        </Tabs>
      </Box>

      <Box>
        {tab === 0 && (
          <SectionShell
            title='Profile & account snapshot'
            subtitle='High-signal fields for identity, wallet, and engagement counts. Expand sections below for notification channels and extended profile metadata.'
          >
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems={{ lg: 'flex-start' }}>
              <Stack alignItems='center' spacing={1.5} sx={{ minWidth: { lg: 200 } }}>
                <Avatar
                  src={media.profile_picture_url || safeImg(profile?.profile_picture)}
                  sx={{ width: 112, height: 112, boxShadow: 2, border: `3px solid ${theme.palette.background.paper}` }}
                />
                <Chip
                  label={identity.account_type || profile?.account_type || '—'}
                  color='primary'
                  variant='outlined'
                  size='small'
                />
                <Chip
                  label={`Account: ${identity.status || profile?.status || '—'}`}
                  size='small'
                  variant='outlined'
                />
              </Stack>
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                  {identity.fullname || profile?.fullname || '—'}
                </Typography>
                <Typography variant='body1' color='primary' sx={{ mb: 2 }}>
                  {identity.email || profile?.email || '—'}
                </Typography>

                <User360AccountReviewActions
                  userId={identity._id || profile?._id}
                  accountType={identity.account_type || profile?.account_type}
                  status={identity.status || profile?.status}
                  onUpdated={onRefresh}
                />

                <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>Last activity</Typography>
                  <Typography variant='body1' sx={{ mt: 0.5, fontWeight: 600 }}>{lastOnlineLabel}</Typography>
                </Paper>

                <Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 700 }}>Engagement</Typography>
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='Lessons' value={summary.lessonsCount} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='Completed' value={summary.completedLessonsCount} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='Reviews' value={summary.reviewsCount} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='Clips' value={summary.clipsCount} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='PDF / plans' value={summary.reportsCount} />
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <StatTile label='Friends' value={summary.friendsCount} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <StatTile label='In-app notifications (rows)' value={summary.notificationsCount} />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Identity</Typography>
                    <Grid container spacing={1.5}>
                      {kv('User ID', userId || profile?._id)}
                      {kv('Mobile', identity.mobile_no)}
                      {kv('Login type', identity.login_type)}
                      {kv('Category', identity.category)}
                      {kv('Created', identity.createdAt ? new Date(identity.createdAt).toLocaleString() : null)}
                      {kv('Updated', identity.updatedAt ? new Date(identity.updatedAt).toLocaleString() : null)}
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Wallet & compliance</Typography>
                    <Grid container spacing={1.5}>
                      {kv('Wallet balance', money.wallet_amount != null ? String(money.wallet_amount) : null)}
                      {kv('Stripe account', money.stripe_account_id)}
                      {kv('KYC', money.is_kyc_completed != null ? (money.is_kyc_completed ? 'Yes' : 'No') : null)}
                      {kv('Stripe onboarding', money.is_registered_with_stript != null ? (money.is_registered_with_stript ? 'Yes' : 'No') : null)}
                      {kv('Commission', money.commission)}
                    </Grid>
                  </Grid>
                </Grid>

                <Stack spacing={2} sx={{ mt: 3 }}>
                  <Accordion
                    defaultExpanded
                    sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }}
                    disableGutters
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                        <Typography fontWeight={600}>Notification preferences</Typography>
                        <Typography variant='caption' color='text.secondary'>Email &amp; SMS by category</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <NotificationPreferencesPanel notifications={preferences.notifications} />
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap' sx={{ pr: 1 }}>
                        <Typography fontWeight={600}>Extra profile data (extraInfo)</Typography>
                        <Typography variant='caption' color='text.secondary'>Availability, timezone, and other fields</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {preferences.extraInfo && typeof preferences.extraInfo === 'object' && Object.keys(preferences.extraInfo).length > 0 ? (
                        <Box sx={{ maxHeight: 480, overflow: 'auto', pr: 1 }}>
                          <ExtraInfoTree data={preferences.extraInfo} />
                        </Box>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>No extraInfo on this user.</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: 1, borderColor: 'divider' }} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight={600} color='text.secondary'>Technical: raw JSON</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                        For debugging or copy-paste into tickets.
                      </Typography>
                      <Box
                        component='pre'
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.common.black, 0.04),
                          overflow: 'auto',
                          maxHeight: 320,
                          fontSize: 12,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                        }}
                      >
                        {JSON.stringify({ notifications: preferences.notifications, extraInfo: preferences.extraInfo }, null, 2)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Stack>
              </Box>
            </Stack>
          </SectionShell>
        )}

        {tab === 1 && (
          <SectionShell
            title='Lessons & bookings'
            subtitle='Sessions where this user is trainer or trainee. Use filters to narrow; actions support soft/hard delete per policy.'
            action={<ToolbarRefreshExport busy={loadingLessons} onExport={() => downloadCsv(lessonsItems, 'admin-lessons.csv')} />}
          >
            <QueryToolbar section='lessons' sectionQuery={query?.lessons} lessonSortOptions={true} />
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
                              onClick={() => setTimelineBookingId(String(lesson?._id))}
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
            <PaginationBar section='lessons' pagination={lessons?.pagination} />
          </SectionShell>
        )}

        {tab === 2 && (
          <SectionShell
            title='Reviews'
            subtitle='Derived from booked sessions that include ratings.'
            action={<ToolbarRefreshExport busy={loadingReviews} onExport={() => downloadCsv(reviewsItems, 'admin-reviews.csv')} />}
          >
            <QueryToolbar section='reviews' sectionQuery={query?.reviews} lessonSortOptions={true} />
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
            <PaginationBar section='reviews' pagination={reviews?.pagination} />
          </SectionShell>
        )}

        {tab === 3 && (
          <SectionShell
            title='Video clips'
            subtitle='Thumbnails use the same CDN rules as the main product. Play opens a signed or public stream.'
            action={<ToolbarRefreshExport busy={loadingAssets} onExport={() => downloadCsv(clipsItems, 'admin-clips.csv')} />}
          >
            <QueryToolbar section='assets' sectionQuery={query?.assets} lessonSortOptions={false} />
            <Divider sx={{ my: 2 }} />
            {loadingAssets ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : null}
            {!loadingAssets && clipsItems.length ? (
              <Grid container spacing={2}>
                {clipsItems.map(item => (
                  <Grid item xs={12} sm={6} lg={4} key={item?._id}>
                    <Card variant='outlined' sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box
                        sx={{
                          position: 'relative',
                          pt: '56.25%',
                          bgcolor: 'grey.100',
                          backgroundImage: item?.thumbnail ? `url(${safeImg(item.thumbnail)})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3 }}>{item?.title || 'Untitled'}</Typography>
                        <Typography variant='caption' color='text.secondary'>{item?.category || '—'} · {item?.file_type || '—'}</Typography>
                        <Typography variant='caption' sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{item?.file_name || '—'}</Typography>
                        <Stack direction='row' spacing={1} sx={{ mt: 'auto', pt: 1 }} flexWrap='wrap' useFlexGap>
                          <Button size='small' variant='contained' onClick={() => setPlayClipId(String(item._id))} sx={{ textTransform: 'none' }}>
                            Play
                          </Button>
                          <DeleteActions entityType='clip' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : null}
            {!loadingAssets && !clipsItems.length ? (
              <EmptyHint icon={InboxOutlinedIcon} title='No clips' hint='Try clearing search or confirm clips are not soft-deleted.' />
            ) : null}
            <PaginationBar section='assets' pagination={assets?.clips?.pagination} />
          </SectionShell>
        )}

        {tab === 4 && (
          <SectionShell
            title='PDF plans & saved sessions'
            subtitle='Reports and saved session files for this user. Pagination applies to both lists together.'
            action={(
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <ToolbarRefreshExport
                  busy={loadingAssets}
                  exportLabel='Export reports'
                  onExport={() => downloadCsv(reportItems, 'admin-pdf-reports.csv')}
                />
                <Button size='small' variant='outlined' startIcon={<FileDownloadOutlinedIcon />} onClick={() => downloadCsv(savedItems, 'admin-saved-sessions.csv')} disabled={loadingAssets} sx={{ textTransform: 'none' }}>
                  Export saved
                </Button>
              </Stack>
            )}
          >
            <QueryToolbar section='assets' sectionQuery={query?.assets} lessonSortOptions={false} />
            <Divider sx={{ my: 2 }} />
            {loadingAssets ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : null}
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Session reports</Typography>
            {!loadingAssets && reportItems.length ? (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Trainer</TableCell>
                      <TableCell>Trainee</TableCell>
                      <TableCell>Recording key</TableCell>
                      <TableCell align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportItems.map(item => (
                      <TableRow key={item?._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item?.title || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item?.sessions?._id || '—'}</TableCell>
                        <TableCell>{item?.trainer?.fullname || '—'}</TableCell>
                        <TableCell>{item?.trainee?.fullname || '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 220, wordBreak: 'break-all', fontSize: 12 }}>{item?.sessionRecordingUrl || '—'}</TableCell>
                        <TableCell align='right'>
                          <DeleteActions entityType='report' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
            {!loadingAssets && !reportItems.length ? (
              <EmptyHint title='No reports' hint='No PDF / session reports for this filter.' />
            ) : null}

            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Saved sessions</Typography>
            {!loadingAssets && savedItems.length ? (
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>File</TableCell>
                      <TableCell>Trainer</TableCell>
                      <TableCell>Trainee</TableCell>
                      <TableCell align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedItems.map(item => (
                      <TableRow key={item?._id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{item?.file_name || '—'}</TableCell>
                        <TableCell>{item?.trainer_name || '—'}</TableCell>
                        <TableCell>{item?.trainee_name || '—'}</TableCell>
                        <TableCell align='right'>
                          <DeleteActions entityType='saved_session' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
            {!loadingAssets && !savedItems.length ? (
              <EmptyHint title='No saved sessions' hint='Saved session files will appear here when present.' />
            ) : null}
            <PaginationBar section='assets' pagination={assets?.reports?.pagination} />
          </SectionShell>
        )}

        {tab === 5 && (
          <SectionShell
            title='Unified activity timeline'
            subtitle='Newest first: bookings, clips, reports, admin actions, online snapshots, and instrumented user events. Use quick filters or a custom substring.'
            action={(
              <ToolbarRefreshExport
                busy={loadingTimeline}
                exportLabel='Export timeline'
                onExport={() =>
                  downloadCsv(
                    timelineItems.map(row => ({
                      type: row.type,
                      at: row.at,
                      title: row.title,
                      meta: JSON.stringify(row.meta || {})
                    })),
                    'admin-user-timeline.csv'
                  )
                }
              />
            )}
          >
            <ActivityToolbar />
            <Divider sx={{ my: 2 }} />
            {loadingTimeline ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : null}
            {!loadingTimeline && timelineItems.length ? (
              <Stack spacing={0} sx={{ position: 'relative' }}>
                {timelineItems.map((item, idx) => {
                  const dot = timelineDotColor(item.type)
                  const rowKey = `${item.at}-${item.type}-${idx}`
                  const hasMeta = item.meta && Object.keys(item.meta).length > 0
                  return (
                    <Stack key={rowKey} direction='row' spacing={2} sx={{ pb: 2.5 }}>
                      <Stack alignItems='center' sx={{ width: 24, flexShrink: 0 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: timelineDotBg(item.type, theme),
                            mt: 0.75,
                            boxShadow: 1
                          }}
                        />
                        {idx < timelineItems.length - 1 ? (
                          <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: 'divider', mt: 0.5 }} />
                        ) : null}
                      </Stack>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                          {item.at ? new Date(item.at).toLocaleString() : '—'}
                        </Typography>
                        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
                          <Chip label={item.type} size='small' color={dot === 'default' ? 'default' : dot} variant='outlined' sx={{ fontWeight: 600 }} />
                          <Typography variant='body1' sx={{ fontWeight: 600 }}>{item.title}</Typography>
                        </Stack>
                        {hasMeta ? (
                          <>
                            <Button size='small' onClick={() => setMetaOpenId(metaOpenId === rowKey ? null : rowKey)} sx={{ mt: 1, textTransform: 'none', p: 0, minWidth: 0 }}>
                              {metaOpenId === rowKey ? 'Hide details' : 'Show details'}
                            </Button>
                            <Collapse in={metaOpenId === rowKey}>
                              <Box
                                component='pre'
                                sx={{
                                  p: 1.5,
                                  mt: 1,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.common.black, 0.04),
                                  fontSize: 12,
                                  overflow: 'auto',
                                  maxHeight: 280,
                                  fontFamily: 'ui-monospace, Menlo, monospace'
                                }}
                              >
                                {JSON.stringify(item.meta, null, 2)}
                              </Box>
                            </Collapse>
                          </>
                        ) : null}
                      </Box>
                    </Stack>
                  )
                })}
              </Stack>
            ) : null}
            {!loadingTimeline && !timelineItems.length ? (
              <EmptyHint title='Nothing in this view' hint='Clear filters or widen the event type. New events appear after user actions are instrumented.' />
            ) : null}
            <PaginationBar section='activity' pagination={timeline?.pagination} />
          </SectionShell>
        )}

        {tab === 6 && (
          <SectionShell
            title='Wallet ledger'
            subtitle='Per-user wallet ledger entries (credits, debits, escrow holds, refunds).'
          >
            <User360WalletTab
              userId={userId}
              walletAmount={money.wallet_amount}
              currency={money.currency || 'USD'}
            />
          </SectionShell>
        )}

        {tab === 7 && (
          <SectionShell
            title='Issues & logs'
            subtitle='Ops events for this user: calls, instant lessons, wallet, support tickets, and errors.'
            action={(
              <Button component={Link} href={`/apps/ops-logs?userId=${userId}`} variant='outlined' size='small'>
                View all logs
              </Button>
            )}
          >
            {loadingOpsEvents ? (
              <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : null}
            {!loadingOpsEvents && opsItems.length ? (
              <Stack spacing={1.5}>
                {opsItems.slice(0, 30).map(row => (
                  <Paper key={row._id || row.event_id} variant='outlined' sx={{ p: 2 }}>
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                      <Chip size='small' label={row.severity} color={row.severity === 'error' || row.severity === 'critical' ? 'error' : 'default'} />
                      <Chip size='small' label={row.category} variant='outlined' />
                      <Typography variant='caption' color='text.secondary'>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                      </Typography>
                    </Stack>
                    <Typography variant='subtitle2' sx={{ mt: 1, fontWeight: 600 }}>{row.title}</Typography>
                    {row.summary ? (
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>{row.summary}</Typography>
                    ) : null}
                  </Paper>
                ))}
              </Stack>
            ) : null}
            {!loadingOpsEvents && !opsItems.length ? (
              <EmptyHint title='No ops events' hint='Issues will appear here when logged from calls, wallet, or support.' />
            ) : null}
          </SectionShell>
        )}
      </Box>

      <LessonTimelineDialog
        open={Boolean(timelineBookingId)}
        bookingId={timelineBookingId}
        onClose={() => setTimelineBookingId(null)}
      />
      <ClipPlayDialog clipId={playClipId} open={Boolean(playClipId)} onClose={() => setPlayClipId(null)} />
    </Box>
  )
}
