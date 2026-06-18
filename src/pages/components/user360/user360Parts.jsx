import CloseIcon from '@mui/icons-material/Close'
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteAdminEntity, getClipPlayUrl } from 'src/services/user360Api'
import { getImageUrl } from 'src/utils/utils'
import { AbilityContext } from 'src/layouts/components/acl/Can'

export const timelineDotColor = type => {
  const t = String(type || '').toLowerCase()
  if (t.includes('admin')) return 'error'
  if (t.includes('booking')) return 'primary'
  if (t.includes('clip')) return 'secondary'
  if (t.includes('login') || t.includes('user_activity')) return 'success'
  if (t.includes('report') || t.includes('saved')) return 'info'
  if (t.includes('online')) return 'warning'
  return 'default'
}

export const timelineDotBg = (type, theme) => {
  const c = timelineDotColor(type)
  if (c === 'error') return theme.palette.error.main
  if (c === 'primary') return theme.palette.primary.main
  if (c === 'secondary') return theme.palette.secondary.main
  if (c === 'success') return theme.palette.success.main
  if (c === 'info') return theme.palette.info.main
  if (c === 'warning') return theme.palette.warning.main
  return theme.palette.grey[500]
}

export const DeleteActions = ({ entityType, entityId, onDeleted, hardDeletePolicy }) => {
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

export const renderParty = party => (party ? `${party?.fullname || ''} (${party?.account_type || '—'})` : '—')

export const safeImg = path => {
  const u = getImageUrl(path)
  return typeof u === 'string' ? u : undefined
}

export const formatPrimitive = val => {
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

export const ReviewRatingsCell = ({ ratings }) => {
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

export const NotificationPreferencesPanel = ({ notifications }) => {
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

export const ExtraInfoTree = ({ data, depth = 0 }) => {
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

export function ClipPlayDialog({ clipId, open, onClose }) {
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

export const KeyValueRow = (label, value) => (
  <Grid item xs={12} sm={6} md={4}>
    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>{label}</Typography>
    <Typography variant='body2' sx={{ wordBreak: 'break-word', mt: 0.25 }}>{value ?? '—'}</Typography>
  </Grid>
)
