import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { searchAdminUsers } from 'src/services/adminOpsApi'
import authConfig from 'src/configs/auth'
import { requireApiBaseUrl } from 'src/utils/apiBase'

const OID_RE = /^[a-f\d]{24}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

const STATIC_PAGES = [
  { label: 'Home', path: '/home' },
  { label: 'CMS', path: '/apps/cms' },
  { label: 'Banners', path: '/apps/cms/banners' },
  { label: 'Tips', path: '/apps/cms/tips' },
  { label: 'Uploads', path: '/apps/cms/uploads' },
  { label: 'Trainers', path: '/apps/manage-trainer' },
  { label: 'Trainees', path: '/apps/manage-trainee' },
  { label: 'Bookings', path: '/apps/booking' },
  { label: 'Support tickets', path: '/apps/concern-by-user' },
  { label: 'Failed jobs', path: '/apps/failed-jobs' },
  { label: 'Audit log', path: '/apps/audit-logs' },
  { label: 'Call diagnostics', path: '/apps/call-diagnostics' },
  { label: 'Live lessons', path: '/apps/live-lessons' },
  { label: 'Careers', path: '/apps/careers' },
  { label: 'Broadcasts', path: '/apps/broadcasts' },
  { label: 'Promo codes', path: '/apps/promo-codes' }
]

export default function AdminCommandPalette({ open, onClose }) {
  const router = useRouter()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [value, setValue] = useState('')
  const [hits, setHits] = useState([])
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!open) {
      setValue('')
      setHits([])
      setHint('')
    }
  }, [open])

  const goPath = useCallback(
    path => {
      void router.push(path)
      onClose()
    },
    [router, onClose]
  )

  const run = useCallback(async () => {
    const q = value.trim()
    if (!q) return

    if (q.startsWith('/')) {
      goPath(q)
      return
    }

    if (OID_RE.test(q)) {
      // Try booking detail first if path preference; User 360 is the common case
      setBusy(true)
      setHint('')
      try {
        const token = window.localStorage.getItem(authConfig.storageTokenKeyName)
        const base = requireApiBaseUrl()
        const bookingRes = await fetch(`${base}/admin/booking/${q}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const bookingJson = await bookingRes.json()
        const bookingOk =
          bookingRes.ok &&
          String(bookingJson?.status ?? '').toLowerCase() !== 'fail' &&
          (bookingJson?.result || bookingJson?.data)
        if (bookingOk) {
          goPath(`/apps/booking?bookingId=${q}`)
          return
        }
      } catch {
        /* fall through to user */
      } finally {
        setBusy(false)
      }
      goPath(`/apps/users/${q}`)
      return
    }

    if (EMAIL_RE.test(q) || q.length >= 2) {
      setBusy(true)
      setHint('')
      try {
        const users = await searchAdminUsers(q, 8)
        setHits(
          users.map(u => ({
            id: String(u._id || u.id),
            primary: u.fullname || u.email || String(u._id),
            secondary: `${u.account_type || ''} · ${u.email || ''}`.trim()
          }))
        )
        if (!users.length) setHint('No users matched')
      } catch (e) {
        setHint(e?.message || 'Search failed')
        setHits([])
      } finally {
        setBusy(false)
      }
      return
    }

    setHint('Enter ObjectId, email, or /path')
  }, [value, goPath])

  const pageHits = STATIC_PAGES.filter(p => {
    const q = value.trim().toLowerCase()
    if (!q || q.startsWith('/') || OID_RE.test(q) || EMAIL_RE.test(q)) return false
    return p.label.toLowerCase().includes(q) || p.path.includes(q)
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm' fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        Jump to…
        {fullScreen ? (
          <IconButton aria-label='Close' onClick={onClose} edge='end'>
            <Icon icon='mdi:close' />
          </IconButton>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          User id / email → User 360 · Booking ObjectId → bookings · path like{' '}
          <code>/apps/failed-jobs</code>. ⌘/Ctrl+K.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            autoFocus
            fullWidth
            size='small'
            label='Search'
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void run()}
          />
          <Button variant='contained' onClick={() => void run()} disabled={busy} sx={{ flexShrink: 0 }}>
            {busy ? <CircularProgress size={18} color='inherit' /> : 'Go'}
          </Button>
        </Box>
        {hint ? (
          <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
            {hint}
          </Typography>
        ) : null}
        {pageHits.length ? (
          <List dense sx={{ mt: 1 }}>
            {pageHits.map(p => (
              <ListItemButton key={p.path} onClick={() => goPath(p.path)}>
                <ListItemText primary={p.label} secondary={p.path} />
              </ListItemButton>
            ))}
          </List>
        ) : null}
        {hits.length ? (
          <List dense sx={{ mt: 1 }}>
            {hits.map(h => (
              <ListItemButton key={h.id} onClick={() => goPath(`/apps/users/${h.id}`)}>
                <ListItemText primary={h.primary} secondary={h.secondary} />
              </ListItemButton>
            ))}
          </List>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
