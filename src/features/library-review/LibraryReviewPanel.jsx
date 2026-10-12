import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import StatusPill from 'src/components/admin/StatusPill'
import { useAdminConfirm } from 'src/components/admin'
import {
  approveLibrarySubmission,
  getClipPlayUrl,
  getClipTaxonomyAdmin,
  getLibrarySubmissions,
  markLibrarySubmissionUnderReview,
  rejectLibrarySubmission
} from 'src/services/clipsAdminApi'
import { ops } from 'src/styles/opsSurface'
import {
  approveBlocker,
  canModerate,
  initialPlacement,
  nextAfter,
  placementLabel,
  queueItem,
  QUEUE_TABS,
  QUICK_REASONS,
  shortcutFor,
  STATUS_META,
  step
} from './libraryReviewView'

const idOf = v => String((v && typeof v === 'object' ? v._id || v.id : v) || '')

/** Review queue on the left, the selected request on the right: watch, place, approve or reject without leaving the list. */
export default function LibraryReviewPanel({ onCountsChange }) {
  const queryClient = useQueryClient()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [reason, setReason] = useState('')
  const reasonRef = useRef(null)

  const list = useQuery({
    queryKey: ['library-review', 'list', status],
    queryFn: () => getLibrarySubmissions({ limit: 100, ...(status ? { status } : {}) }),
    placeholderData: keepPreviousData
  })
  const taxonomy = useQuery({ queryKey: ['library-review', 'taxonomy'], queryFn: async () => { const d = await getClipTaxonomyAdmin(); return Array.isArray(d) ? d : [] }, staleTime: 5 * 60_000 })

  const items = useMemo(() => (list.data?.items || []).map(s => queueItem(s)), [list.data])
  const selected = items.find(i => i.id === selectedId) || null
  const sub = selected?.raw || null
  const counts = { pending: list.data?.pendingCount ?? 0, underReview: list.data?.underReviewCount ?? 0 }

  useEffect(() => {
    onCountsChange?.(counts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.pending, counts.underReview])

  // Keep a valid selection as the list changes (first load, after an action, after changing tab).
  useEffect(() => {
    if (!items.length) {
      if (selectedId) setSelectedId(null)
    } else if (!items.some(i => i.id === selectedId)) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  // Prefill placement and clear the reason whenever a different request is shown.
  useEffect(() => {
    const p = initialPlacement(sub)
    setCategoryId(p.categoryId)
    setSubcategoryId(p.subcategoryId)
    setReason(sub?.rejection_reason || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const clipId = idOf(sub?.source_clip_id)
  const media = useQuery({ queryKey: ['library-review', 'media', clipId], queryFn: () => getClipPlayUrl(clipId), enabled: Boolean(clipId), staleTime: 4 * 60_000, retry: 1 })
  const videoUrl = media.data?.videoUrl || media.data?.cdnFallbackVideo || ''

  const cats = taxonomy.data || []
  const subs = cats.find(c => idOf(c) === categoryId)?.subcategories || []

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['library-review', 'list'] })
  const afterAction = id => {
    setSelectedId(nextAfter(items, id))
    refresh()
  }

  const approve = useMutation({
    mutationFn: ({ id, cat, subcat }) => approveLibrarySubmission(id, cat, subcat || null),
    onSuccess: (_, v) => { toast.success('Published to the NetQwix Library'); afterAction(v.id) },
    onError: e => { toast.error(e?.message || 'Could not publish'); refresh() }
  })
  const reject = useMutation({
    mutationFn: ({ id, text }) => rejectLibrarySubmission(id, text),
    onSuccess: (_, v) => { toast.success('Rejected — the person will see your reason in the app'); afterAction(v.id) },
    onError: e => { toast.error(e?.message || 'Could not reject'); refresh() }
  })
  const review = useMutation({
    mutationFn: id => markLibrarySubmissionUnderReview(id),
    onSuccess: () => { toast.success('Marked as in review'); refresh() },
    onError: e => { toast.error(e?.message || 'Could not update'); refresh() }
  })
  const busy = approve.isPending || reject.isPending || review.isPending

  const blocker = approveBlocker(sub, categoryId)

  const doApprove = useCallback(async () => {
    if (!sub || busy) return
    const why = approveBlocker(sub, categoryId)
    if (why) return toast.error(why)
    const catName = cats.find(c => idOf(c) === categoryId)?.name
    const subName = subs.find(s => idOf(s) === subcategoryId)?.name
    const ok = await confirm({
      title: 'Publish to the NetQwix Library?',
      message: 'Everyone using the app will be able to watch this clip.',
      detail: `${selected.title} → ${catName}${subName ? ` › ${subName}` : ' › General'}`,
      confirmLabel: 'Approve & publish',
      variant: 'warning'
    })
    if (ok) approve.mutate({ id: selected.id, cat: categoryId, subcat: subcategoryId })
  }, [sub, busy, categoryId, subcategoryId, cats, subs, selected, confirm, approve])

  const doReject = useCallback(async () => {
    if (!sub || busy) return
    if (!canModerate(sub.status)) return
    const text = reason.trim()
    if (!text) {
      reasonRef.current?.focus()
      return toast.error('Write the reason first — the person will see it')
    }
    const ok = await confirm({ title: 'Reject this request?', message: 'The person will see your reason in the app.', detail: text.length > 140 ? `${text.slice(0, 140)}…` : text, confirmLabel: 'Reject', variant: 'danger' })
    if (ok) reject.mutate({ id: selected.id, text })
  }, [sub, busy, reason, selected, confirm, reject])

  // J/K to move, A to approve, R to jump to the reason box, U to claim.
  useEffect(() => {
    const onKey = e => {
      const action = shortcutFor(e)
      if (!action) return
      if (action === 'next' || action === 'prev') {
        e.preventDefault()
        setSelectedId(cur => step(items, cur, action === 'next' ? 1 : -1))
      } else if (action === 'approve') { e.preventDefault(); void doApprove() }
      else if (action === 'reject') { e.preventDefault(); reasonRef.current?.focus() }
      else if (action === 'review' && sub?.status === 'submitted' && !busy) { e.preventDefault(); review.mutate(selected.id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, doApprove, sub, selected, busy, review])

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
        {QUEUE_TABS.map(t => (
          <Chip key={t.value || 'open'} clickable size='small' label={t.label} color={status === t.value ? 'primary' : 'default'} variant={status === t.value ? 'filled' : 'outlined'} onClick={() => setStatus(t.value)} />
        ))}
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, color: ops.mute, display: { xs: 'none', md: 'block' } }}>J / K next · A approve · R reason · U claim</Typography>
        <Button component={Link} href='/apps/clip-taxonomy' size='small' variant='text'>Manage categories →</Button>
      </Box>

      {list.isError && !list.data ? (
        <AdminEmptyState title='Couldn’t load the requests' description={list.error?.message} actionLabel='Try again' onAction={() => list.refetch()} />
      ) : !items.length && !list.isLoading ? (
        <AdminEmptyState title={status === '' ? 'Nothing waiting for review' : 'No requests match'} description={status === '' ? 'Experts submit clips from the app’s Clips tab. New ones appear here.' : 'Try another filter.'} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 360px) 1fr' }, gap: 2, alignItems: 'start' }}>
          <Box component='ul' aria-label='Library requests' sx={{ m: 0, p: 0, listStyle: 'none', border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusLg, maxHeight: { md: 'calc(100vh - 280px)' }, overflow: 'auto' }}>
            {items.map(i => {
              const meta = STATUS_META[i.status] || { label: i.status, tone: 'neutral' }
              return (
                <li key={i.id}>
                  <Box
                    component='button'
                    type='button'
                    aria-current={i.id === selectedId ? 'true' : undefined}
                    onClick={() => setSelectedId(i.id)}
                    sx={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: 0, borderBottom: `1px solid ${ops.hairline}`, p: 1.5, color: 'inherit', font: 'inherit', bgcolor: i.id === selectedId ? ops.canvasSoft : 'transparent', borderLeft: `3px solid ${i.id === selectedId ? ops.accent : 'transparent'}`, '&:hover': { bgcolor: ops.canvasSoft } }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }} noWrap>{i.title}</Typography>
                      <StatusPill tone={meta.tone} size='sm'>{meta.label}</StatusPill>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>{i.requester}</Typography>
                    <Typography sx={{ fontSize: 12, color: ops.mute }} noWrap>{i.proposed || 'No category proposed'} · {i.age}</Typography>
                  </Box>
                </li>
              )
            })}
          </Box>

          <Box sx={{ border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusLg, p: { xs: 1.5, md: 2.5 }, minHeight: 320 }}>
            {!sub ? (
              <Typography sx={{ color: 'text.secondary' }}>Select a request to review it.</Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{selected.title}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {selected.requester}{sub.requester_user_id?.email ? ` · ${sub.requester_user_id.email}` : ''} · submitted {selected.age}
                  </Typography>
                </Box>

                <Box sx={{ borderRadius: ops.radiusMd, overflow: 'hidden', bgcolor: '#0b0f14', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {media.isLoading ? (
                    <CircularProgress size={28} />
                  ) : videoUrl ? (
                    <video key={videoUrl} controls playsInline poster={media.data?.thumbnailUrl || undefined} style={{ width: '100%', maxHeight: 360, display: 'block' }}>
                      <source src={videoUrl} />
                    </video>
                  ) : (
                    <Typography sx={{ color: '#8b97a6', fontSize: 13, p: 2 }}>{media.isError ? 'The video couldn’t be loaded.' : 'No video available for this clip.'}</Typography>
                  )}
                </Box>

                <Typography sx={{ fontSize: 13 }}>
                  <strong>They suggested:</strong> {placementLabel(sub) || 'nothing'}
                  {sub.status === 'accepted' ? <> · <strong>Published under:</strong> {placementLabel(sub, 'assigned') || '—'}</> : null}
                </Typography>
                {sub.status === 'rejected' && sub.rejection_reason ? (
                  <Typography sx={{ fontSize: 13, color: ops.dangerFg }}>Rejected: {sub.rejection_reason}</Typography>
                ) : null}

                {canModerate(sub.status) ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                      <TextField select size='small' label='Category' value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId('') }}>
                        {cats.map(c => <MenuItem key={idOf(c)} value={idOf(c)}>{c.name}</MenuItem>)}
                      </TextField>
                      <TextField select size='small' label='Subcategory (optional)' value={subcategoryId} disabled={!categoryId} onChange={e => setSubcategoryId(e.target.value)}>
                        <MenuItem value=''>None — General</MenuItem>
                        {subs.map(s => <MenuItem key={idOf(s)} value={idOf(s)}>{s.name}</MenuItem>)}
                      </TextField>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button variant='contained' color='success' disabled={busy || Boolean(blocker)} onClick={() => void doApprove()}>Approve &amp; publish</Button>
                      {sub.status === 'submitted' ? <Button variant='outlined' disabled={busy} onClick={() => review.mutate(selected.id)}>I’m reviewing this</Button> : null}
                    </Box>
                    {blocker && categoryId === '' ? <Typography sx={{ fontSize: 12, color: ops.mute, mt: -1 }}>{blocker}</Typography> : null}

                    <Box>
                      <TextField inputRef={reasonRef} fullWidth multiline minRows={2} size='small' label='Reason for rejecting (shown to the person)' value={reason} onChange={e => setReason(e.target.value)} inputProps={{ maxLength: 1000 }} />
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                        {QUICK_REASONS.map(r => (
                          <Chip key={r} size='small' variant='outlined' clickable label={r} onClick={() => setReason(r)} />
                        ))}
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Button variant='outlined' color='error' disabled={busy} onClick={() => void doReject()}>Reject</Button>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>This request has already been {sub.status === 'accepted' ? 'published' : 'rejected'}.</Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
      {ConfirmDialog}
    </Box>
  )
}
