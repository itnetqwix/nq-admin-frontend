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
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
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
        {rollup?.client ? <Chip size='small' label={rollup.client} /> : null}
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
    </Box>
  )
}

export default function LiveLessonsPage() {
  const router = useRouter()
  const [hours, setHours] = useState(48)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [storyFilter, setStoryFilter] = useState('all')

  const selectedId = useMemo(() => {
    if (!router.isReady) return ''
    const q = router.query.sessionId
    return q ? String(Array.isArray(q) ? q[0] : q) : ''
  }, [router.isReady, router.query.sessionId])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLiveLessons({ hours, limit: 60 })
      setRows(data?.items || [])
    } catch (e) {
      toast.error(e?.message || 'Failed to load live lessons')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [hours])

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
    if (!router.isReady) return
    void loadList()
  }, [router.isReady, loadList])

  useEffect(() => {
    if (!router.isReady) return
    void loadDetail(selectedId)
  }, [router.isReady, selectedId, loadDetail])

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => {
      const blob = [
        r.title,
        r.sessionId,
        r.trainer?.name,
        r.trainer?.email,
        r.trainee?.name,
        r.trainee?.email,
        r.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search])

  const story = detail?.story || []
  const filteredStory = useMemo(() => {
    if (storyFilter === 'all') return story
    if (storyFilter === 'clip') return story.filter(s => s.kind === 'clip')
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

  const listView = !selectedId

  return (
    <AdminPageShell
      title='Live lessons'
      eyebrow='OPS · LESSONS'
      icon='mdi:record-rec'
      subtitle={
        listView
          ? 'Every live session as coach ↔ trainee. Open one to see the full story: created → join → play/pause → call quality.'
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
          <Button variant='outlined' onClick={() => void loadList()} disabled={loading}>
            Refresh list
          </Button>
          {selectedId ? (
            <Button variant='contained' onClick={() => void loadDetail(selectedId)} disabled={detailLoading}>
              Refresh story
            </Button>
          ) : null}
        </Stack>
      }
    >
      {listView ? (
        <Box
          sx={{
            borderRadius: ops.radiusLg,
            bgcolor: 'background.paper',
            boxShadow: ops.shadowCard,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
              Recent live sessions
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, mb: 2 }}>
              Sorted by both joined. Search by coach, trainee, email, or session id. Click a row for the full story.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size='small'
                placeholder='Search coach, trainee, session…'
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mdi:magnify' fontSize={18} />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                select
                size='small'
                label='Lookback'
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                sx={{ minWidth: 120 }}
              >
                {[12, 24, 48, 72, 168].map(h => (
                  <MenuItem key={h} value={h}>
                    {h}h
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {loading ? (
              <Typography color='text.secondary'>Loading…</Typography>
            ) : filteredRows.length === 0 ? (
              <Typography color='text.secondary'>No live lessons in this window.</Typography>
            ) : (
              <Stack spacing={0}>
                {filteredRows.map(r => {
                  const coach = personLabel(r.trainer)
                  const trainee = personLabel(r.trainee)
                  return (
                    <Box
                      key={r.sessionId}
                      onClick={() => selectSession(r.sessionId)}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: 'minmax(0,1.4fr) minmax(0,1.2fr) 140px 100px 110px'
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
                          {(r.clipFailEvents || 0) > 0 ? (
                            <Chip size='small' color='warning' label={`${r.clipFailEvents} clip issues`} />
                          ) : null}
                        </Stack>
                        <Typography sx={{ fontWeight: 700, fontSize: 16, mt: 0.75, letterSpacing: '-0.3px' }}>
                          {coach}{' '}
                          <Box component='span' sx={{ color: ops.mute, fontWeight: 500 }}>
                            ↔
                          </Box>{' '}
                          {trainee}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ display: { md: 'none' } }}>
                          {shortId(r.sessionId)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>session</Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 13 }}>{r.sessionId}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>both joined</Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          {r.bothJoinedAt ? moment(r.bothJoinedAt).format('MMM D · HH:mm') : '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>clip log</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.clipPlaybackEvents ?? 0}</Typography>
                      </Box>
                      <Box sx={{ textAlign: { md: 'right' } }}>
                        <Button size='small' endIcon={<Icon icon='mdi:chevron-right' />}>
                          Open story
                        </Button>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>
        </Box>
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
                  Created → both joined → clip play/pause → call quality → end. Filter to scan faster.
                </Typography>
                <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mt: 1.5 }}>
                  {[
                    { id: 'all', label: `All (${story.length})` },
                    { id: 'lifecycle', label: 'Life / join / ops' },
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
                    No story events yet for this filter. Clip rows appear after both web clients play with the new
                    telemetry deployed.
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
