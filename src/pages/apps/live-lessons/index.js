import {
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment'
import {
  AdminEmptyState,
  AdminFilterBar,
  OpsMetricTile,
  OpsSurfaceCard
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ObservabilityLinks from 'src/layouts/components/ObservabilityLinks'
import { getLiveLessonDebug, getLiveLessons } from 'src/services/user360Api'
import { ops } from 'src/styles/opsSurface'
import Icon from 'src/@core/components/icon'

function personLabel(p) {
  if (!p) return '—'
  return p.name || p.email || p.id || '—'
}

function shortId(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}

async function copyText(text) {
  if (!text) throw new Error('Nothing to copy')
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('Copy failed')
}

const KIND_META = {
  lifecycle: { label: 'Lifecycle', color: ops.indigo, bg: ops.softIndigo },
  join: { label: 'Join', color: '#0f766e', bg: ops.softMint },
  clip: { label: 'Clip', color: '#0369a1', bg: ops.softSky },
  call: { label: 'Call', color: '#a16207', bg: ops.softAmber },
  ops: { label: 'Ops', color: '#7c3aed', bg: ops.softIndigo },
  extension: { label: 'Ext', color: '#4338ca', bg: ops.softIndigo },
  note: { label: 'Note', color: ops.mute, bg: ops.canvasSoft2 }
}

const SEV_DOT = {
  info: ops.mute,
  ok: '#059669',
  warn: ops.warning,
  error: ops.error
}

const LOOKBACK_PRESETS = [
  { hours: 24, label: '24h' },
  { hours: 72, label: '3d' },
  { hours: 168, label: '7d' },
  { hours: 360, label: '15d' },
  { hours: 720, label: '30d' }
]

const DEFAULT_HOURS = 360 // 15 days

function FilterChip({ active, label, onClick }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={label}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        bgcolor: active ? ops.softIndigo : ops.canvas,
        color: active ? ops.indigoDeep : ops.body,
        border: `1px solid ${active ? ops.indigo : ops.hairline}`
      }}
    />
  )
}

function StoryRow({ item }) {
  const kind = KIND_META[item.kind] || KIND_META.note
  const when = item.at ? moment(item.at).format('HH:mm:ss') : '—'
  const day = item.at ? moment(item.at).format('MMM D') : ''
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '64px 1fr', sm: '72px 72px 1fr' },
        gap: 1.25,
        py: 1.25,
        px: 1.5,
        borderBottom: `1px solid ${ops.hairline}`,
        bgcolor: item.severity === 'error' ? ops.errorSoft : item.severity === 'warn' ? ops.softAmber : 'transparent',
        '&:hover': { bgcolor: ops.canvasSoft }
      }}
    >
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>{day}</Typography>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontWeight: 600, color: ops.ink }}>{when}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: { sm: 'none' } }}>
          {day} {when}
        </Typography>
        <Chip
          size='small'
          label={kind.label}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: kind.bg,
            color: kind.color,
            borderRadius: ops.radiusSm
          }}
        />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: SEV_DOT[item.severity] || SEV_DOT.info,
              flexShrink: 0
            }}
          />
          <Typography sx={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.2px' }}>{item.title}</Typography>
          {item.role ? (
            <Chip size='small' variant='outlined' label={item.role} sx={{ height: 20, fontSize: 10 }} />
          ) : null}
        </Stack>
        {item.detail ? (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.35, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {item.detail}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}

function PersonCard({ label, person, rollup }) {
  const lastFail = Array.isArray(rollup?.failures) ? rollup.failures[rollup.failures.length - 1] : null
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: ops.radiusMd,
        bgcolor: ops.canvasSoft,
        boxShadow: ops.shadowCard,
        height: '100%'
      }}
    >
      <Typography sx={{ fontSize: 11, fontFamily: ops.mono, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 17, mt: 0.5, letterSpacing: '-0.3px' }}>{personLabel(person)}</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-all' }}>
        {person?.email || '—'}
      </Typography>
      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mt: 0.75 }}>{person?.id || '—'}</Typography>
      <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mt: 1.25 }}>
        {rollup?.env?.os || rollup?.env?.country ? (
          <Chip
            size='small'
            label={[rollup.env.os, rollup.env.country].filter(Boolean).join(' · ')}
          />
        ) : null}
        {rollup?.client ? <Chip size='small' label={rollup.client} /> : null}
        {(rollup?.buildIds || []).slice(0, 2).map(b => (
          <Chip key={b} size='small' variant='outlined' label={`build ${b}`} sx={{ fontFamily: ops.mono, fontSize: 10 }} />
        ))}
        <Chip size='small' variant='outlined' label={`${rollup?.clipEventCount ?? 0} clip logs`} />
        {(rollup?.failureCount ?? 0) > 0 ? (
          <Chip size='small' color='warning' label={`${rollup.failureCount} fail`} />
        ) : (
          <Chip size='small' variant='outlined' label='no fails' />
        )}
      </Stack>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
        quality {rollup?.quality?.avgScore ?? '—'} · rtt {rollup?.quality?.avgRttMs ?? '—'}ms
      </Typography>
      {lastFail ? (
        <Typography
          sx={{
            mt: 1,
            fontFamily: ops.mono,
            fontSize: 10,
            color: ops.warning,
            lineHeight: 1.4,
            wordBreak: 'break-word'
          }}
        >
          last fail: {lastFail.action}
          {lastFail.error ? ` err=${lastFail.error}` : ''}
          {lastFail.playWaitMs != null ? ` waitMs=${lastFail.playWaitMs}` : ''}
          {lastFail.livePlayingCount != null ? ` live=${lastFail.livePlayingCount}` : ''}
          {lastFail.seeking != null ? ` seeking=${lastFail.seeking}` : ''}
          {lastFail.readyState != null ? ` rs=${lastFail.readyState}` : ''}
        </Typography>
      ) : null}
    </Box>
  )
}

export default function LiveLessonsPage() {
  const router = useRouter()
  const searchTimer = useRef(null)

  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [trainerInput, setTrainerInput] = useState('')
  const [traineeInput, setTraineeInput] = useState('')
  const [trainer, setTrainer] = useState('')
  const [trainee, setTrainee] = useState('')
  const [live, setLive] = useState('') // '' | '1' | '0'
  const [kind, setKind] = useState('') // '' | instant | scheduled
  const [hasClipIssues, setHasClipIssues] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [limit, setLimit] = useState(40)
  const [skip, setSkip] = useState(0)

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ returned: 0, live: 0, withClipIssues: 0 })
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [storyFilter, setStoryFilter] = useState('all')

  const selectedId = useMemo(() => {
    if (!router.isReady) return ''
    const sid = router.query.sessionId
    return sid ? String(Array.isArray(sid) ? sid[0] : sid) : ''
  }, [router.isReady, router.query.sessionId])

  const listView = !selectedId
  const usingDateRange = Boolean(fromDate || toDate)
  const activeAdvanced = Boolean(fromDate || toDate || trainer || trainee || hasClipIssues)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        limit,
        skip,
        live: live || undefined,
        kind: kind || undefined,
        hasClipIssues: hasClipIssues ? '1' : undefined,
        q: q || undefined,
        trainer: trainer || undefined,
        trainee: trainee || undefined
      }
      if (usingDateRange) {
        if (fromDate) params.from = fromDate
        if (toDate) params.to = toDate
      } else {
        params.hours = hours
      }
      const data = await getLiveLessons(params)
      setRows(data?.items || [])
      setTotal(Number(data?.total) || (data?.items || []).length)
      setSummary(data?.summary || { returned: (data?.items || []).length, live: 0, withClipIssues: 0 })
    } catch (e) {
      toast.error(e?.message || 'Failed to load live lessons')
      setRows([])
      setTotal(0)
      setSummary({ returned: 0, live: 0, withClipIssues: 0 })
    } finally {
      setLoading(false)
    }
  }, [hours, fromDate, toDate, usingDateRange, limit, skip, live, kind, hasClipIssues, q, trainer, trainee])

  const loadDetail = useCallback(async sessionId => {
    if (!sessionId) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    try {
      const data = await getLiveLessonDebug(sessionId)
      setDetail(data)
    } catch (e) {
      toast.error(e?.message || 'Failed to load session')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!router.isReady || !listView) return
    void loadList()
  }, [router.isReady, listView, loadList])

  useEffect(() => {
    if (!router.isReady) return
    void loadDetail(selectedId)
  }, [router.isReady, selectedId, loadDetail])

  // Hydrate filters from URL when opening list
  useEffect(() => {
    if (!router.isReady || selectedId) return
    const query = router.query
    if (query.q) {
      const v = String(Array.isArray(query.q) ? query.q[0] : query.q)
      setQInput(v)
      setQ(v)
    }
    if (query.trainer) {
      const v = String(Array.isArray(query.trainer) ? query.trainer[0] : query.trainer)
      setTrainerInput(v)
      setTrainer(v)
      setFiltersOpen(true)
    }
    if (query.trainee) {
      const v = String(Array.isArray(query.trainee) ? query.trainee[0] : query.trainee)
      setTraineeInput(v)
      setTrainee(v)
      setFiltersOpen(true)
    }
    if (query.hours) setHours(Number(query.hours) || DEFAULT_HOURS)
    if (query.from) {
      setFromDate(String(Array.isArray(query.from) ? query.from[0] : query.from))
      setFiltersOpen(true)
    }
    if (query.to) {
      setToDate(String(Array.isArray(query.to) ? query.to[0] : query.to))
      setFiltersOpen(true)
    }
    if (query.live != null) setLive(String(Array.isArray(query.live) ? query.live[0] : query.live))
    if (query.kind) setKind(String(Array.isArray(query.kind) ? query.kind[0] : query.kind))
    // only on first ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  const scheduleDebounced = (value, setApplied) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setApplied(value.trim())
      setSkip(0)
    }, 400)
  }

  const selectSession = id => {
    void router.push(
      {
        pathname: '/apps/live-lessons',
        query: id ? { sessionId: id } : {}
      },
      undefined,
      { shallow: true }
    )
  }

  const story = detail?.story || []
  const filteredStory = useMemo(() => {
    if (storyFilter === 'all') return story
    if (storyFilter === 'clip') return story.filter(s => s.kind === 'clip')
    if (storyFilter === 'media') {
      return story.filter(s => s.kind === 'media' || s.kind === 'annotation' || s.kind === 'plan')
    }
    if (storyFilter === 'call') return story.filter(s => s.kind === 'call' || s.kind === 'join')
    if (storyFilter === 'lifecycle') {
      return story.filter(s => s.kind === 'lifecycle' || s.kind === 'join' || s.kind === 'extension' || s.kind === 'ops')
    }
    if (storyFilter === 'problems') {
      return story.filter(s => s.severity === 'error' || s.severity === 'warn')
    }
    return story
  }, [story, storyFilter])

  const onCopyPack = async () => {
    try {
      await copyText(detail?.shareText || '')
      toast.success('Copied full share pack')
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const applyNameFilters = () => {
    setTrainer(trainerInput.trim())
    setTrainee(traineeInput.trim())
    setSkip(0)
  }

  const clearAdvanced = () => {
    setFromDate('')
    setToDate('')
    setTrainerInput('')
    setTraineeInput('')
    setTrainer('')
    setTrainee('')
    setHasClipIssues(false)
    setHours(DEFAULT_HOURS)
    setSkip(0)
  }

  const setPresetHours = h => {
    setHours(h)
    setFromDate('')
    setToDate('')
    setSkip(0)
  }

  const page = Math.floor(skip / limit) + 1
  const canPrev = skip > 0
  const canNext = skip + rows.length < total

  return (
    <AdminPageShell
      title='Live lessons'
      eyebrow='OPS · LESSONS'
      icon='mdi:record-rec'
      subtitle={
        listView
          ? 'Both-joined sessions — search by coach or trainee, filter by date / live / clip issues, open a row for the full story.'
          : detail?.title || 'Session story'
      }
      bare
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {!listView ? (
            <Button variant='outlined' startIcon={<Icon icon='mdi:arrow-left' />} onClick={() => selectSession('')}>
              All lessons
            </Button>
          ) : null}
          <Button
            variant='outlined'
            onClick={() => void (listView ? loadList() : loadDetail(selectedId))}
            disabled={listView ? loading : detailLoading}
          >
            Refresh
          </Button>
        </Stack>
      }
    >
      {listView ? (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                icon='mdi:video-account'
                label='In window'
                value={total.toLocaleString()}
                hint={usingDateRange ? 'Custom dates' : `Last ${Math.round(hours / 24)}d`}
                tone='accent'
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                icon='mdi:broadcast'
                label='Live now'
                value={String(summary.live ?? 0)}
                hint='On this page'
                tone={summary.live ? 'danger' : 'default'}
                onClick={() => {
                  setLive(live === '1' ? '' : '1')
                  setSkip(0)
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                icon='mdi:alert-circle-outline'
                label='Clip issues'
                value={String(summary.withClipIssues ?? 0)}
                hint='On this page'
                tone={summary.withClipIssues ? 'warn' : 'default'}
                onClick={() => {
                  setHasClipIssues(v => !v)
                  setSkip(0)
                  setFiltersOpen(true)
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <OpsMetricTile
                icon='mdi:calendar-range'
                label='Default window'
                value='15d'
                hint='Max lookback 45d'
                tone='default'
                onClick={() => setPresetHours(DEFAULT_HOURS)}
              />
            </Grid>
          </Grid>

          <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
            <AdminPageSection>
              <AdminFilterBar
                searchPlaceholder='Coach, trainee, email, or session id…'
                searchValue={qInput}
                onSearchChange={e => {
                  setQInput(e.target.value)
                  scheduleDebounced(e.target.value, setQ)
                }}
                onRefresh={() => void loadList()}
                refreshLoading={loading}
                resultCount={total}
                helperText='Server search by name/email. Presets default to last 15 days of both-joined lessons.'
              >
                {LOOKBACK_PRESETS.map(p => (
                  <FilterChip
                    key={p.hours}
                    active={!usingDateRange && hours === p.hours}
                    label={p.label}
                    onClick={() => setPresetHours(p.hours)}
                  />
                ))}
                <FilterChip active={live === ''} label='Any state' onClick={() => { setLive(''); setSkip(0) }} />
                <FilterChip active={live === '1'} label='Live' onClick={() => { setLive('1'); setSkip(0) }} />
                <FilterChip active={live === '0'} label='Ended' onClick={() => { setLive('0'); setSkip(0) }} />
                <FilterChip active={kind === ''} label='Any kind' onClick={() => { setKind(''); setSkip(0) }} />
                <FilterChip active={kind === 'instant'} label='Instant' onClick={() => { setKind('instant'); setSkip(0) }} />
                <FilterChip active={kind === 'scheduled'} label='Scheduled' onClick={() => { setKind('scheduled'); setSkip(0) }} />
                <Button
                  size='small'
                  variant={filtersOpen || activeAdvanced ? 'contained' : 'outlined'}
                  onClick={() => setFiltersOpen(v => !v)}
                  sx={{
                    textTransform: 'none',
                    height: 28,
                    fontSize: 12,
                    ...(filtersOpen || activeAdvanced ? { bgcolor: ops.indigo, boxShadow: 'none' } : {})
                  }}
                >
                  More filters{activeAdvanced ? ' · on' : ''}
                </Button>
              </AdminFilterBar>

              {filtersOpen ? (
                <Box
                  sx={{
                    mb: 2.5,
                    p: 2,
                    borderRadius: ops.radiusSm,
                    bgcolor: ops.canvas,
                    border: `1px solid ${ops.hairline}`
                  }}
                >
                  <Grid container spacing={1.5} alignItems='center'>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        size='small'
                        fullWidth
                        label='Trainer name / email'
                        value={trainerInput}
                        onChange={e => setTrainerInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyNameFilters()
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        size='small'
                        fullWidth
                        label='Trainee name / email'
                        value={traineeInput}
                        onChange={e => setTraineeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyNameFilters()
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        size='small'
                        fullWidth
                        type='date'
                        label='Joined from'
                        InputLabelProps={{ shrink: true }}
                        value={fromDate}
                        onChange={e => {
                          setFromDate(e.target.value)
                          setSkip(0)
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        size='small'
                        fullWidth
                        type='date'
                        label='Joined to'
                        InputLabelProps={{ shrink: true }}
                        value={toDate}
                        onChange={e => {
                          setToDate(e.target.value)
                          setSkip(0)
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        select
                        size='small'
                        fullWidth
                        label='Page size'
                        value={limit}
                        onChange={e => {
                          setLimit(Number(e.target.value))
                          setSkip(0)
                        }}
                      >
                        {[20, 40, 60, 100].map(n => (
                          <MenuItem key={n} value={n}>
                            {n} / page
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        <Button size='small' variant='contained' onClick={applyNameFilters} sx={{ textTransform: 'none' }}>
                          Apply name filters
                        </Button>
                        <Button
                          size='small'
                          variant={hasClipIssues ? 'contained' : 'outlined'}
                          color={hasClipIssues ? 'warning' : 'inherit'}
                          onClick={() => {
                            setHasClipIssues(v => !v)
                            setSkip(0)
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Clip issues only
                        </Button>
                        <Button size='small' variant='text' onClick={clearAdvanced} sx={{ textTransform: 'none' }}>
                          Clear advanced
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}

              {loading && rows.length === 0 ? (
                <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
                  Loading live lessons…
                </Typography>
              ) : rows.length === 0 ? (
                <AdminEmptyState
                  title='No live lessons match'
                  description='Try last 15 days, clear name filters, or widen the date range. Only sessions where both users joined appear here.'
                  actionLabel='Reset to 15 days'
                  onAction={clearAdvanced}
                  compact
                />
              ) : (
                <Stack spacing={0}>
                  {rows.map(r => {
                    const coach = personLabel(r.trainer)
                    const traineeLabel = personLabel(r.trainee)
                    const durationMin =
                      r.bothJoinedAt && r.actualEndAt
                        ? Math.max(0, Math.round((new Date(r.actualEndAt) - new Date(r.bothJoinedAt)) / 60000))
                        : null
                    return (
                      <Box
                        key={r.sessionId}
                        onClick={() => selectSession(r.sessionId)}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'minmax(0,1.5fr) minmax(0,1fr) 130px 90px 90px 100px'
                          },
                          gap: 1.25,
                          alignItems: 'center',
                          py: 1.75,
                          px: 1.5,
                          mx: { xs: -0.5, sm: -1 },
                          borderBottom: `1px solid ${ops.hairline}`,
                          cursor: 'pointer',
                          transition: 'background 120ms',
                          '&:hover': { bgcolor: ops.canvasSoft }
                        }}
                      >
                        <Box>
                          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                            {r.live ? (
                              <Chip size='small' color='error' label='LIVE' sx={{ fontWeight: 700 }} />
                            ) : (
                              <Chip size='small' variant='outlined' label='ended' />
                            )}
                            {r.isInstant ? <Chip size='small' variant='outlined' label='instant' /> : null}
                            {r.status ? (
                              <Chip size='small' variant='outlined' label={r.status} sx={{ fontFamily: ops.mono, fontSize: 10 }} />
                            ) : null}
                            {(r.clipFailEvents || 0) > 0 ? (
                              <Chip size='small' color='warning' label={`${r.clipFailEvents} clip issues`} />
                            ) : null}
                          </Stack>
                          <Typography sx={{ fontWeight: 700, fontSize: 16, mt: 0.75, letterSpacing: '-0.3px' }}>
                            {coach}{' '}
                            <Box component='span' sx={{ color: ops.mute, fontWeight: 500 }}>
                              ↔
                            </Box>{' '}
                            {traineeLabel}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                            {[r.trainer?.email, r.trainee?.email].filter(Boolean).join(' · ') || shortId(r.sessionId)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>session</Typography>
                          <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }} noWrap>
                            {r.sessionId}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>both joined</Typography>
                          <Typography sx={{ fontSize: 13 }}>
                            {r.bothJoinedAt ? moment(r.bothJoinedAt).format('MMM D · HH:mm') : '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>mins</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {r.live ? 'live' : durationMin != null ? durationMin : '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>clips</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.clipPlaybackEvents ?? 0}</Typography>
                        </Box>
                        <Box sx={{ textAlign: { md: 'right' } }}>
                          <Button size='small' endIcon={<Icon icon='mdi:chevron-right' />}>
                            Story
                          </Button>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              )}

              {total > 0 ? (
                <Stack
                  direction='row'
                  spacing={1}
                  alignItems='center'
                  justifyContent='space-between'
                  sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${ops.hairline}` }}
                >
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                    Page {page} · showing {rows.length} of {total.toLocaleString()}
                  </Typography>
                  <Stack direction='row' spacing={1}>
                    <Button
                      size='small'
                      variant='outlined'
                      disabled={!canPrev || loading}
                      onClick={() => setSkip(s => Math.max(0, s - limit))}
                    >
                      Previous
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      disabled={!canNext || loading}
                      onClick={() => setSkip(s => s + limit)}
                    >
                      Next
                    </Button>
                  </Stack>
                </Stack>
              ) : null}
            </AdminPageSection>
          </OpsSurfaceCard>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: ops.radiusLg,
              bgcolor: 'background.paper',
              boxShadow: ops.shadowCard
            }}
          >
            {detailLoading && !detail ? (
              <Typography color='text.secondary'>Loading session story…</Typography>
            ) : detail ? (
              <>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent='space-between' alignItems={{ md: 'flex-start' }}>
                  <Box>
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                      {detail.live ? <Chip size='small' color='error' label='LIVE NOW' /> : <Chip size='small' label='Ended' />}
                      {detail.isInstant ? <Chip size='small' variant='outlined' label='Instant' /> : null}
                      <Chip size='small' variant='outlined' label={detail.status || '—'} />
                    </Stack>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: 20, md: 24 }, mt: 1, letterSpacing: '-0.5px' }}>
                      {personLabel(detail.trainer)} ↔ {personLabel(detail.trainee)}
                    </Typography>
                    <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute, mt: 0.5 }}>
                      session {detail.sessionId}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                      Joined {detail.bothJoinedAt ? moment(detail.bothJoinedAt).format('MMM D YYYY · HH:mm:ss') : '—'}
                      {detail.actualEndAt
                        ? ` · ended ${moment(detail.actualEndAt).format('HH:mm:ss')}`
                        : detail.live
                          ? ' · still in lesson'
                          : ''}
                    </Typography>
                  </Box>
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Button size='small' variant='outlined' onClick={() => void copyText(detail.sessionId).then(() => toast.success('Session id copied'))}>
                      Copy id
                    </Button>
                    <Button size='small' variant='contained' onClick={() => void onCopyPack()}>
                      Copy share pack
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      href={`/apps/call-diagnostics?sessionId=${encodeURIComponent(detail.sessionId)}`}
                    >
                      Call diagnostics
                    </Button>
                  </Stack>
                </Stack>
                <ObservabilityLinks sessionId={detail.sessionId} dense />

                {(detail.heuristics || []).length > 0 ? (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.softAmber }}>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Auto hints</Typography>
                    {(detail.heuristics || []).map((h, i) => (
                      <Typography key={i} variant='body2' sx={{ mb: 0.25 }}>
                        · {h}
                      </Typography>
                    ))}
                  </Box>
                ) : null}

                {(detail.latencyLines || []).length > 0 ? (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.softSky || ops.canvasSoft2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Sync latency</Typography>
                    {(detail.latencyLines || []).slice(0, 10).map((l, i) => (
                      <Typography key={i} variant='body2' sx={{ fontFamily: ops.mono, fontSize: 11, mb: 0.25 }}>
                        {l}
                      </Typography>
                    ))}
                  </Box>
                ) : null}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.5,
                    mt: 2
                  }}
                >
                  <PersonCard label='Coach' person={detail.trainer} rollup={detail.byRole?.trainer} />
                  <PersonCard label='Trainee' person={detail.trainee} rollup={detail.byRole?.trainee} />
                </Box>
              </>
            ) : (
              <Typography color='text.secondary'>Could not load this session.</Typography>
            )}
          </Box>

          {detail ? (
            <Box
              sx={{
                borderRadius: ops.radiusLg,
                bgcolor: 'background.paper',
                boxShadow: ops.shadowCard,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${ops.hairline}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
                  Full lesson story
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.35 }}>
                  Created → both joined → mute/camera/stream → annotations → clips → game plan PDF → end.
                </Typography>
                <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mt: 1.5 }}>
                  {[
                    { id: 'all', label: `All (${story.length})` },
                    { id: 'lifecycle', label: 'Life / join / ops' },
                    { id: 'media', label: 'Media / draw / plan' },
                    { id: 'clip', label: 'Clips' },
                    { id: 'call', label: 'Call quality' },
                    { id: 'problems', label: 'Problems only' }
                  ].map(f => (
                    <Chip
                      key={f.id}
                      size='small'
                      label={f.label}
                      onClick={() => setStoryFilter(f.id)}
                      color={storyFilter === f.id ? 'primary' : 'default'}
                      variant={storyFilter === f.id ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>

              {filteredStory.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography color='text.secondary'>
                    No story events yet for this filter. Media/mute/draw/plan rows appear once clients with the new
                    telemetry are in a live lesson.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 640, overflow: 'auto' }}>
                  {filteredStory.map((item, i) => (
                    <StoryRow key={`${item.ts}-${item.title}-${i}`} item={item} />
                  ))}
                </Box>
              )}
            </Box>
          ) : null}

          {detail?.shareText ? (
            <Box
              sx={{
                p: 2,
                borderRadius: ops.radiusLg,
                bgcolor: 'background.paper',
                boxShadow: ops.shadowCard
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Share pack (for chat / tickets)</Typography>
              <Box
                component='textarea'
                readOnly
                value={detail.shareText}
                onFocus={e => e.target.select()}
                sx={{
                  width: '100%',
                  minHeight: 160,
                  maxHeight: 280,
                  p: 1.5,
                  fontSize: 11,
                  fontFamily: ops.mono,
                  borderRadius: ops.radiusSm,
                  border: `1px solid ${ops.hairline}`,
                  bgcolor: ops.canvasSoft,
                  resize: 'vertical'
                }}
              />
            </Box>
          ) : null}
        </Stack>
      )}
    </AdminPageShell>
  )
}
