import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import moment from 'moment'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import toast from 'react-hot-toast'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import {
  approveTrainerVerification,
  getTrainerVerificationDetail,
  getTrainerVerifications,
  rejectTrainerVerification,
  requestTrainerChanges
} from 'src/services/verificationApi'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)
const fmtWhen = v => (v ? moment(v).format('YYYY-MM-DD HH:mm') : '—')
const PAGE_SIZE = 50

function Field({ label, children }) {
  return (
    <Box>
      <Typography variant='caption' sx={{ color: ops.mute, display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ color: ops.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {children ?? '—'}
      </Typography>
    </Box>
  )
}

export default function TrainerVerificationsPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [forceIncomplete, setForceIncomplete] = useState(false)
  const [acting, setActing] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState('under_review')
  const [slaFilter, setSlaFilter] = useState('') // '' | pending | escalated
  const searchTimer = useRef(null)
  const openUserIdRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        limit: PAGE_SIZE,
        page,
        queue: queueFilter
      }
      if (search) params.q = search
      if (slaFilter === 'escalated') params.escalated = 'true'
      if (slaFilter === 'pending') params.escalated = 'false'

      const data = await getTrainerVerifications(params)
      setTotal(Number(data?.total) || 0)
      setTotalPages(Number(data?.total_pages) || 1)
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || i,
          ...r,
          submitted: r.trainer_verification?.submitted_for_review_at,
          escalated: Boolean(
            r.review_flags?.escalated ?? r.trainer_verification?.review_escalated_at
          ),
          resubmitted: Boolean(
            r.review_flags?.resubmitted ||
              r.review_flags?.has_silent_updates ||
              r.trainer_verification?.trainer_resubmitted_at
          ),
          hasUpdates: Boolean(
            r.review_flags?.has_updates_since_feedback || r.review_flags?.has_silent_updates
          ),
          step: r.trainer_verification?.onboarding_step,
          photo: r.profile_picture,
          confirmReady: Boolean(
            r.review_readiness?.confirm_ready ?? r.review_readiness?.go_live_ready
          )
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [queueFilter, page, search, slaFilter])

  useEffect(() => {
    void load()
  }, [load])

  // When filters change, page is reset via handlers / search debounce below.
  // (Avoid setPage(1) in an effect that races the load on page 2.)

  const handleSearchChange = e => {
    const val = e.target.value
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      setSearch(val.trim())
    }, 350)
  }

  const metrics = useMemo(() => {
    const escalated = rows.filter(r => r.escalated).length
    const resubmitted = rows.filter(r => r.resubmitted || r.hasUpdates).length
    const bookable = rows.filter(r => r.confirmReady).length
    return {
      total,
      escalated,
      pending: Math.max(0, total - escalated),
      resubmitted,
      bookable
    }
  }, [rows, total])

  const fetchDetail = useCallback(async (userId, { quiet } = {}) => {
    if (!userId) return
    if (!quiet) setDetailLoading(true)
    try {
      const d = await getTrainerVerificationDetail(userId)
      if (openUserIdRef.current !== userId) return
      setDetail(d)
      setFeedbackMessage(prev =>
        quiet
          ? prev
          : d?.review?.verification?.feedback_message ||
            d?.user?.trainer_verification?.feedback_message ||
            ''
      )
    } catch (e) {
      if (!quiet) {
        toast.error(e?.message || 'Failed to load detail')
        setDrawerOpen(false)
      }
    } finally {
      if (!quiet) setDetailLoading(false)
    }
  }, [])

  const openDetail = async row => {
    const userId = row.id || row._id
    openUserIdRef.current = userId
    setForceIncomplete(false)
    setRejectReason('')
    setDrawerOpen(true)
    setDetail(null)
    await fetchDetail(userId)
  }

  // Live-refresh open drawer so silent expert edits appear without manual reload
  useEffect(() => {
    if (!drawerOpen || !openUserIdRef.current) return undefined
    const id = openUserIdRef.current
    const t = setInterval(() => {
      void fetchDetail(id, { quiet: true })
    }, 15000)
    return () => clearInterval(t)
  }, [drawerOpen, detail?.user?._id, fetchDetail])

  const handleApprove = async () => {
    if (!detail?.user?._id) return
    const ready = Boolean(
      detail?.review?.readiness?.confirm_ready ?? detail?.review?.readiness?.go_live_ready
    )
    if (!ready && !forceIncomplete) {
      toast.error('Profile is not bookable yet — complete fields or check force override')
      return
    }
    if (!ready && forceIncomplete) {
      if (
        !window.confirm(
          `Force-confirm incomplete expert? Missing: ${(detail?.review?.readiness?.missing || []).join(', ')}`
        )
      ) {
        return
      }
    }
    setActing(true)
    try {
      await approveTrainerVerification(detail.user._id, { force: !ready && forceIncomplete })
      toast.success('Trainer confirmed')
      setDrawerOpen(false)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Approve failed')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!detail?.user?._id || !rejectReason.trim()) {
      toast.error('Rejection reason required')
      return
    }
    setActing(true)
    try {
      await rejectTrainerVerification(detail.user._id, rejectReason.trim())
      toast.success('Trainer rejected')
      setDrawerOpen(false)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Reject failed')
    } finally {
      setActing(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!detail?.user?._id || !feedbackMessage.trim()) {
      toast.error('Feedback message required')
      return
    }
    setActing(true)
    try {
      await requestTrainerChanges(detail.user._id, feedbackMessage.trim())
      toast.success('Feedback sent to trainer')
      setDrawerOpen(false)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Request changes failed')
    } finally {
      setActing(false)
    }
  }

  const columns = [
    {
      field: 'photo',
      headerName: '',
      width: 56,
      sortable: false,
      renderCell: p => (
        <Avatar src={p.row.photo || undefined} sx={{ width: 32, height: 32 }}>
          {(p.row.fullname || '?')[0]}
        </Avatar>
      )
    },
    {
      field: 'submitted',
      headerName: 'Submitted',
      width: 150,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '')
    },
    { field: 'fullname', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
    {
      field: 'confirmReady',
      headerName: 'Bookable',
      width: 110,
      renderCell: p =>
        p.row.confirmReady ? (
          <Chip size='small' color='success' label='Ready' />
        ) : (
          <Chip size='small' color='default' label='Incomplete' />
        )
    },
    {
      field: 'step',
      headerName: 'Status',
      width: 140,
      renderCell: p => {
        const step = p.row.step
        if (step === 'feedback') return <Chip size='small' color='warning' label='Feedback' />
        if (p.row.resubmitted || p.row.hasUpdates)
          return <Chip size='small' color='info' label='Updated' />
        return <Chip size='small' label='Under review' />
      }
    },
    {
      field: 'escalated',
      headerName: 'SLA',
      width: 110,
      renderCell: p =>
        p.row.escalated ? (
          <Chip size='small' color='error' label='Overdue' />
        ) : (
          <Chip size='small' label='On track' />
        )
    }
  ]

  const review = detail?.review
  const identity = review?.identity || {}
  const profile = review?.profile || {}
  const availability = review?.availability || {}
  const verification = review?.verification || {}
  const readiness = review?.readiness || {}
  const flags = review?.flags || {}
  const audit = detail?.audit || []
  const confirmReady = Boolean(readiness.confirm_ready ?? readiness.go_live_ready)

  return (
    <AdminPageShell
      bare
      eyebrow='People · verifications'
      icon='mdi:account-check-outline'
      title='Trainer verifications.'
      subtitle='Live expert profile (including schedule inventory). Confirm only when bookable — request changes when not.'
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3} md={2.4}>
          <OpsMetricTile
            icon='mdi:account-clock'
            label='In queue'
            value={fmtInt(metrics.total)}
            hint='Server total'
            onClick={() => setSlaFilter('')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <OpsMetricTile
            icon='mdi:check-decagram'
            label='Bookable'
            value={fmtInt(metrics.bookable)}
            hint='This page'
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <OpsMetricTile
            icon='mdi:timer-sand'
            label='On track'
            value={fmtInt(metrics.pending)}
            hint='Within SLA'
            onClick={() => setSlaFilter('pending')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <OpsMetricTile
            icon='mdi:alert-octagon'
            label='Escalated'
            value={fmtInt(metrics.escalated)}
            hint='Overdue (page)'
            tone={metrics.escalated > 0 ? 'danger' : 'default'}
            onClick={() => setSlaFilter('escalated')}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2.4}>
          <OpsMetricTile
            icon='mdi:refresh'
            label='Updated'
            value={fmtInt(metrics.resubmitted)}
            hint='Silent + explicit'
          />
        </Grid>
      </Grid>

      <AdminPageSection>
        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
            <AdminFilterBar
              searchPlaceholder='Server search: name, email, category, phone, id…'
              searchValue={searchInput}
              onSearchChange={handleSearchChange}
              resultCount={total}
              onRefresh={() => void load()}
              refreshLoading={loading}
            >
              <TextField
                select
                size='small'
                label='Queue'
                value={queueFilter}
                onChange={e => {
                  setPage(1)
                  setQueueFilter(e.target.value)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value='under_review'>Under review</MenuItem>
                <MenuItem value='feedback'>Awaiting trainer</MenuItem>
                <MenuItem value='all'>All open</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='SLA'
                value={slaFilter}
                onChange={e => {
                  setPage(1)
                  setSlaFilter(e.target.value)
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='pending'>On track</MenuItem>
                <MenuItem value='escalated'>Escalated</MenuItem>
              </TextField>
            </AdminFilterBar>
          </Box>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={rows}
              columns={columns}
              loading={loading}
              onRowClick={p => void openDetail(p.row)}
              emptyMessage='No trainers in this queue.'
              emptyDescription='Clear filters or refresh the queue.'
            />
          </AdminGridContainer>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${ops.hairline}` }}
          >
            <Typography variant='caption' color='text.secondary'>
              Page {page} of {totalPages} · {fmtInt(total)} total
            </Typography>
            <Stack direction='row' spacing={1}>
              <Button
                size='small'
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                sx={{ textTransform: 'none' }}
              >
                Previous
              </Button>
              <Button
                size='small'
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                sx={{ textTransform: 'none' }}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </OpsSurfaceCard>
      </AdminPageSection>

      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 520 },
            p: 3,
            boxShadow: ops.shadowDrawer
          }
        }}
      >
        {detailLoading && !detail?.user ? (
          <Typography variant='body2' color='text.secondary'>
            Loading latest profile…
          </Typography>
        ) : null}

        {detail?.user ? (
          <Stack spacing={2.25}>
            <Stack direction='row' spacing={2} alignItems='center'>
              <Avatar
                src={identity.profile_picture || detail.user.profile_picture || undefined}
                sx={{ width: 72, height: 72 }}
              >
                {(identity.fullname || detail.user.fullname || '?')[0]}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant='h6' noWrap>
                  {identity.fullname || detail.user.fullname}
                </Typography>
                <Typography variant='body2' color='text.secondary' noWrap>
                  {identity.email || detail.user.email}
                </Typography>
                <Stack direction='row' spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    size='small'
                    label={
                      flags.awaiting_trainer
                        ? 'Awaiting trainer'
                        : flags.resubmitted || flags.has_silent_updates
                          ? 'Updated'
                          : 'Under review'
                    }
                    color={
                      flags.awaiting_trainer
                        ? 'warning'
                        : flags.resubmitted || flags.has_silent_updates
                          ? 'info'
                          : 'default'
                    }
                  />
                  {confirmReady ? (
                    <Chip size='small' color='success' label='Bookable ready' />
                  ) : (
                    <Chip size='small' label='Not bookable yet' />
                  )}
                  {flags.escalated ? <Chip size='small' color='error' label='SLA overdue' /> : null}
                </Stack>
              </Box>
            </Stack>

            <Stack direction='row' spacing={1}>
              <Button
                size='small'
                variant='outlined'
                disabled={detailLoading || acting}
                onClick={() => void fetchDetail(detail.user._id)}
                sx={{ textTransform: 'none' }}
              >
                Refresh latest
              </Button>
              <Button
                component={Link}
                href={`/apps/users/${detail.user._id}`}
                variant='outlined'
                size='small'
                sx={{ textTransform: 'none' }}
              >
                Open User 360
              </Button>
            </Stack>

            <Typography variant='caption' color='text.secondary'>
              Auto-refreshes every 15s while open so silent expert edits show up.
            </Typography>

            {flags.has_silent_updates || flags.has_updates_since_feedback ? (
              <Alert severity='info'>
                Expert updated their profile after submission — reviewing live data below.
              </Alert>
            ) : null}

            {confirmReady ? (
              <Alert severity='success'>
                Profile is complete for go-online / bookings after Confirm.
              </Alert>
            ) : (
              <Alert severity='warning'>
                Not bookable yet — missing: {(readiness.missing || []).join(', ') || 'fields'}.
                Confirm is blocked until complete (or force override).
              </Alert>
            )}

            <Divider />

            <Typography variant='subtitle2' sx={{ color: ops.ink }}>
              Identity (live)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Field label='Phone'>{identity.mobile_no || detail.user.mobile_no}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Date of birth'>{identity.date_of_birth || '—'}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Category'>{identity.category || detail.user.category || '—'}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Account status'>{identity.account_status || detail.user.status}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Email verified'>
                  {readiness.email_verified
                    ? fmtWhen(verification.email_verified_at)
                    : 'Not verified'}
                </Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Phone verified'>
                  {readiness.phone_verified
                    ? fmtWhen(verification.phone_verified_at)
                    : 'Not verified'}
                </Field>
              </Grid>
            </Grid>

            <Divider />

            <Typography variant='subtitle2' sx={{ color: ops.ink }}>
              Profile they are filling
            </Typography>
            <Field label='About / bio'>{profile.bio || '—'}</Field>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Field label='Hourly rate'>
                  {profile.hourly_rate != null ? `$${profile.hourly_rate}` : '—'}
                </Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Location'>{profile.location || '—'}</Field>
              </Grid>
              <Grid item xs={12}>
                <Field label='Specialties / experience'>
                  {[profile.specialties, profile.experience].filter(Boolean).join(' · ') || '—'}
                </Field>
              </Grid>
            </Grid>

            <Divider />

            <Typography variant='subtitle2' sx={{ color: ops.ink }}>
              Weekly availability
              {availability.source
                ? ` · ${availability.source === 'schedule_inventory' ? 'Schedule inventory' : availability.source}`
                : ''}
            </Typography>
            <Field label='Time zone'>
              {availability.time_zone || '—'}
              {availability.selected_duration
                ? ` · ${availability.selected_duration} min slots`
                : ''}
            </Field>
            {availability.days?.length ? (
              <Stack direction='row' flexWrap='wrap' gap={0.75}>
                {availability.days.map(d => (
                  <Chip
                    key={`${d.day}-${d.source || ''}`}
                    size='small'
                    label={`${d.day}: ${d.slot_count}`}
                    variant='outlined'
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No weekly slots in schedule inventory or profile yet
              </Typography>
            )}

            <Divider />

            <Typography variant='subtitle2' sx={{ color: ops.ink }}>
              Review timestamps
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Field label='Submitted'>{fmtWhen(verification.submitted_for_review_at)}</Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Last profile edit'>
                  {fmtWhen(verification.profile_last_edited_at)}
                </Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Resubmitted / Updated'>
                  {fmtWhen(verification.trainer_resubmitted_at)}
                </Field>
              </Grid>
              <Grid item xs={6}>
                <Field label='Feedback sent'>{fmtWhen(verification.feedback_requested_at)}</Field>
              </Grid>
            </Grid>

            {verification.feedback_message ? (
              <Alert severity='warning'>
                Last feedback to expert: {verification.feedback_message}
              </Alert>
            ) : null}

            {verification.face ? (
              <Typography variant='body2'>
                Liveness (legacy): {verification.face.liveness_status} (
                {verification.face.confidence ?? '—'}%) — not required for approval
              </Typography>
            ) : null}

            {detail.selfieUrl ? (
              <Box
                component='img'
                src={detail.selfieUrl}
                alt='Selfie'
                sx={{ width: '100%', borderRadius: 1, maxHeight: 220, objectFit: 'cover' }}
              />
            ) : null}

            {audit.length ? (
              <>
                <Divider />
                <Typography variant='subtitle2' sx={{ color: ops.ink }}>
                  Audit trail
                </Typography>
                <Stack spacing={0.75} sx={{ maxHeight: 160, overflow: 'auto' }}>
                  {audit.slice(0, 12).map((a, i) => (
                    <Typography key={a._id || i} variant='caption' color='text.secondary'>
                      {fmtWhen(a.createdAt)} · {a.action || 'event'}
                      {a.actor_id ? ` · admin ${String(a.actor_id).slice(-6)}` : ''}
                    </Typography>
                  ))}
                </Stack>
              </>
            ) : null}

            <Divider />

            <Typography variant='subtitle2' sx={{ color: ops.ink }}>
              Admin actions
            </Typography>
            <TextField
              label='Feedback for trainer'
              multiline
              minRows={3}
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              placeholder='What should they update? (photo, bio, rate, schedule…)'
              fullWidth
            />
            <Button
              variant='outlined'
              disabled={acting || detailLoading}
              onClick={() => void handleRequestChanges()}
              sx={{ textTransform: 'none' }}
            >
              Request changes
            </Button>

            <TextField
              label='Rejection reason'
              multiline
              minRows={2}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              fullWidth
            />

            {!confirmReady ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceIncomplete}
                    onChange={e => setForceIncomplete(e.target.checked)}
                    size='small'
                  />
                }
                label='Force confirm incomplete (ops override — expert still cannot go online without full bookability)'
              />
            ) : null}

            <Stack direction='row' spacing={1}>
              <Button
                variant='contained'
                disabled={acting || detailLoading || (!confirmReady && !forceIncomplete)}
                onClick={() => void handleApprove()}
                sx={{ textTransform: 'none', bgcolor: ops.ink }}
              >
                Confirm expert
              </Button>
              <Button
                variant='outlined'
                color='error'
                disabled={acting || detailLoading}
                onClick={() => void handleReject()}
                sx={{ textTransform: 'none' }}
              >
                Reject
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Drawer>
    </AdminPageShell>
  )
}
