import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import styles from 'styles/common.module.css'
import moment from 'moment'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ObservabilityLinks from 'src/layouts/components/ObservabilityLinks'
import { getLiveLessonDebug, getLiveLessons } from 'src/services/user360Api'

function personLabel(p) {
  if (!p) return '—'
  return p.name || p.email || p.id || '—'
}

function clipActionLabel(cp) {
  if (!cp) return '—'
  const a = cp.action || '—'
  const bits = [a]
  if (cp.source) bits.push(`src:${cp.source}`)
  if (cp.videoPaused != null) bits.push(cp.videoPaused ? 'paused' : 'playing')
  if (cp.readyState != null) bits.push(`rs:${cp.readyState}`)
  if (cp.error) bits.push(String(cp.error))
  return bits.join(' · ')
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

function RoleCard({ title, rollup }) {
  if (!rollup) return null
  const failActions = Object.entries(rollup.actionCounts || {})
    .filter(([k]) => k === 'play_fail' || k === 'stuck_paused' || k === 'play_gesture')
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.5 }}>
        <Typography variant='caption' color='text.secondary'>
          {title}
        </Typography>
        {rollup.failureCount > 0 ? (
          <Chip size='small' color='warning' label={`${rollup.failureCount} fail`} />
        ) : (
          <Chip size='small' variant='outlined' label='no fails' />
        )}
        {rollup.client ? <Chip size='small' label={rollup.client} /> : null}
      </Stack>
      <Typography variant='body1' sx={{ fontWeight: 600 }}>
        {personLabel(rollup.user)}
      </Typography>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
        {rollup.user?.email || '—'}
      </Typography>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
        id: {rollup.user?.id || '—'}
      </Typography>
      <Typography variant='body2' sx={{ mt: 1, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
        clip events: {rollup.clipEventCount} · {JSON.stringify(rollup.actionCounts || {})}
      </Typography>
      {failActions ? (
        <Typography variant='body2' color='warning.main' sx={{ fontSize: 12 }}>
          fails: {failActions}
        </Typography>
      ) : null}
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
        quality score {rollup.quality?.avgScore ?? '—'} · rtt {rollup.quality?.avgRttMs ?? '—'}ms · relay{' '}
        {rollup.quality?.relayPct ?? '—'}%
      </Typography>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', mt: 0.5, wordBreak: 'break-all' }}
        title={rollup.env?.userAgent || ''}
      >
        ua: {rollup.env?.userAgent ? String(rollup.env.userAgent).slice(0, 100) : '—'}
      </Typography>
    </Box>
  )
}

export default function LiveLessonsPage() {
  const router = useRouter()
  const [hours, setHours] = useState(48)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const selectedId = useMemo(() => {
    if (!router.isReady) return ''
    const q = router.query.sessionId
    return q ? String(Array.isArray(q) ? q[0] : q) : ''
  }, [router.isReady, router.query.sessionId])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLiveLessons({ hours, limit: 50 })
      const items = data?.items || []
      setRows(
        items.map(r => ({
          id: r.sessionId,
          live: !!r.live,
          status: r.status || '—',
          bothJoinedAt: r.bothJoinedAt,
          actualEndAt: r.actualEndAt,
          trainer: personLabel(r.trainer),
          trainee: personLabel(r.trainee),
          clipPlaybackEvents: r.clipPlaybackEvents ?? 0,
          isInstant: !!r.isInstant
        }))
      )
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

  const shareText = detail?.shareText || ''
  const shareJson = useMemo(() => {
    if (!detail?.sharePack) return ''
    try {
      return JSON.stringify(detail.sharePack, null, 2)
    } catch {
      return ''
    }
  }, [detail])

  const onCopyPack = async () => {
    try {
      await copyText(shareText || shareJson)
      toast.success(`Copied share pack (${(shareText || shareJson).length} chars)`)
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const onCopyJson = async () => {
    try {
      await copyText(shareJson || shareText)
      toast.success('Copied raw JSON pack')
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const onCopySessionId = async () => {
    try {
      await copyText(selectedId)
      toast.success('Session id copied')
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const onCopyFailuresOnly = async () => {
    if (!detail) return
    const coach = detail.byRole?.trainer
    const trainee = detail.byRole?.trainee
    const lines = [
      `=== CLIP FAILURES ONLY · session ${detail.sessionId} ===`,
      `Coach: ${coach?.user?.email || coach?.user?.name || coach?.user?.id || '—'}`,
      ...(coach?.failures || []).map(
        f =>
          `  [coach] ${f.at} ${f.action} err=${f.error ?? '—'} rs=${f.readyState ?? '—'} paused=${f.videoPaused ?? '—'}`
      ),
      `Trainee: ${trainee?.user?.email || trainee?.user?.name || trainee?.user?.id || '—'}`,
      ...(trainee?.failures || []).map(
        f =>
          `  [trainee] ${f.at} ${f.action} err=${f.error ?? '—'} rs=${f.readyState ?? '—'} paused=${f.videoPaused ?? '—'}`
      ),
      '',
      ...(detail.heuristics || []).map(h => `- ${h}`)
    ]
    try {
      await copyText(lines.join('\n'))
      toast.success('Copied failures + heuristics')
    } catch (e) {
      toast.error(e?.message || 'Copy failed')
    }
  }

  const listColumns = [
    {
      field: 'live',
      headerName: 'Live',
      width: 90,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p =>
        p.value ? <Chip size='small' color='error' label='LIVE' /> : <Chip size='small' label='ended' variant='outlined' />
    },
    {
      field: 'bothJoinedAt',
      headerName: 'Both joined',
      width: 160,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      valueFormatter: p => (p.value ? moment(p.value).format('MM-DD HH:mm:ss') : '—')
    },
    {
      field: 'trainer',
      headerName: 'Coach',
      flex: 1,
      minWidth: 140,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    },
    {
      field: 'trainee',
      headerName: 'Trainee',
      flex: 1,
      minWidth: 140,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    },
    {
      field: 'clipPlaybackEvents',
      headerName: 'Clip log',
      width: 90,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    },
    {
      field: 'id',
      headerName: 'Session',
      width: 220,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    }
  ]

  const filteredClipEvents = useMemo(() => {
    let list = detail?.clipEvents || []
    if (roleFilter === 'trainer' || roleFilter === 'trainee') {
      list = list.filter(e => e.role === roleFilter)
    }
    if (actionFilter === 'fails') {
      list = list.filter(e =>
        ['play_fail', 'stuck_paused', 'play_gesture'].includes(String(e.clipPlayback?.action || ''))
      )
    } else if (actionFilter !== 'all') {
      list = list.filter(e => String(e.clipPlayback?.action || '') === actionFilter)
    }
    return list
  }, [detail, roleFilter, actionFilter])

  const clipRows = filteredClipEvents.map((e, i) => ({
    id: `${e.at || i}-${i}`,
    at: e.at,
    role: e.role || '—',
    user: personLabel(e.user),
    email: e.user?.email || '—',
    action: e.clipPlayback?.action || '—',
    detail: clipActionLabel(e.clipPlayback),
    t: e.clipPlayback?.currentTime,
    readyState: e.clipPlayback?.readyState,
    ua: e.clipPlayback?.ua ? String(e.clipPlayback.ua).slice(0, 48) : '—'
  }))

  const clipColumns = [
    {
      field: 'at',
      headerName: 'When',
      width: 160,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      valueFormatter: p => (p.value ? moment(p.value).format('HH:mm:ss.SSS') : '—')
    },
    { field: 'role', headerName: 'Role', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'user', headerName: 'User', width: 120, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'email', headerName: 'Email', width: 160, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'action', headerName: 'Action', width: 120, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    {
      field: 'detail',
      headerName: 'Media snapshot',
      flex: 1,
      minWidth: 220,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class']
    },
    { field: 't', headerName: 't(s)', width: 70, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
    { field: 'readyState', headerName: 'RS', width: 60, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
  ]

  const participantRows = (detail?.participants || []).map((p, i) => ({
    id: p.userId || i,
    role: p.role || '—',
    userId: p.userId || '—',
    client: p.client || '—',
    updatedAt: p.updatedAt ? moment(p.updatedAt).format('HH:mm:ss') : '—'
  }))

  return (
    <AdminPageShell
      title='Live lessons'
      subtitle='One session → both users → clip/console-style logs. Copy the share pack and paste it in chat for root-cause triage.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' onClick={() => void loadList()}>
            Refresh list
          </Button>
          {selectedId ? (
            <Button variant='contained' onClick={() => void loadDetail(selectedId)} disabled={detailLoading}>
              Refresh session
            </Button>
          ) : null}
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              size='small'
              fullWidth
              label='Lookback'
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            >
              {[12, 24, 48, 72, 168].map(h => (
                <MenuItem key={h} value={h}>
                  {h}h
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant='body2' color='text.secondary' sx={{ pt: 1 }}>
              Click a row → coach + trainee cards → <strong>Copy full share pack</strong> (includes console-style clip
              log, UAs, quality, heuristics). Only that session’s two users.
            </Typography>
          </Grid>
        </Grid>

        <Box className='admin-data-grid' sx={{ height: selectedId ? 260 : 520, width: '100%', mb: 2 }}>
          <DataGrid
            rows={rows}
            columns={listColumns}
            loading={loading}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            disableRowSelectionOnClick
            onRowClick={p => selectSession(p.id)}
            getRowClassName={p => (p.id === selectedId ? 'Mui-selected' : '')}
          />
        </Box>

        {selectedId ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ sm: 'center' }}
              flexWrap='wrap'
              useFlexGap
              sx={{ mb: 1.5 }}
            >
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Session {selectedId}
              </Typography>
              {detail?.live ? <Chip size='small' color='error' label='LIVE now' /> : null}
              <Button size='small' onClick={() => selectSession('')}>
                Clear
              </Button>
              <Button size='small' variant='outlined' onClick={() => void onCopySessionId()}>
                Copy session id
              </Button>
              <Button
                size='small'
                variant='contained'
                color='primary'
                onClick={() => void onCopyPack()}
                disabled={!shareText && !shareJson}
              >
                Copy full share pack
              </Button>
              <Button size='small' variant='outlined' onClick={() => void onCopyJson()} disabled={!shareJson}>
                Copy JSON
              </Button>
              <Button size='small' variant='outlined' color='warning' onClick={() => void onCopyFailuresOnly()}>
                Copy failures only
              </Button>
              <Button
                size='small'
                variant='outlined'
                href={`/apps/call-diagnostics?sessionId=${encodeURIComponent(selectedId)}`}
              >
                Call diagnostics
              </Button>
            </Stack>
            <ObservabilityLinks sessionId={selectedId} />

            {detailLoading && !detail ? (
              <Typography variant='body2' color='text.secondary'>
                Loading…
              </Typography>
            ) : detail ? (
              <>
                {(detail.heuristics || []).length > 0 ? (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'warning.main'
                    }}
                  >
                    <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                      Auto hints for this lesson
                    </Typography>
                    {(detail.heuristics || []).map((h, i) => (
                      <Typography key={i} variant='body2' sx={{ mb: 0.25 }}>
                        · {h}
                      </Typography>
                    ))}
                  </Box>
                ) : null}

                <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <RoleCard title='Coach (this lesson)' rollup={detail.byRole?.trainer} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RoleCard title='Trainee (this lesson)' rollup={detail.byRole?.trainee} />
                  </Grid>
                </Grid>

                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Share pack preview — select + copy, or use the button above
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  Paste this entire block here for diagnosis. Browser filter <code>[clipPlayback]</code> · server{' '}
                  <code>[ClipPlayback]</code>.
                </Typography>
                <Box
                  component='textarea'
                  readOnly
                  value={shareText || '(no pack — refresh after backend deploy)'}
                  onFocus={e => e.target.select()}
                  sx={{
                    display: 'block',
                    width: '100%',
                    minHeight: 220,
                    maxHeight: 360,
                    mb: 2,
                    p: 1.5,
                    fontSize: 11.5,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: 1.45,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                    resize: 'vertical'
                  }}
                />

                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Clients in room
                </Typography>
                <Box
                  className='admin-data-grid'
                  sx={{ height: Math.min(180, 52 + Math.max(participantRows.length, 1) * 42), width: '100%', mb: 2 }}
                >
                  <DataGrid
                    rows={participantRows}
                    columns={[
                      { field: 'role', headerName: 'Role', width: 100, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
                      { field: 'client', headerName: 'Client', width: 100, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
                      { field: 'userId', headerName: 'User id', flex: 1, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
                      { field: 'updatedAt', headerName: 'Seen', width: 90, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] }
                    ]}
                    hideFooter
                    disableRowSelectionOnClick
                  />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }} alignItems={{ sm: 'center' }}>
                  <Typography variant='subtitle2' sx={{ flex: 1 }}>
                    Clip play / pause log ({clipRows.length}
                    {filteredClipEvents.length !== (detail.clipEvents || []).length
                      ? ` filtered / ${detail.clipEvents?.length || 0}`
                      : ''}
                    )
                  </Typography>
                  <TextField
                    select
                    size='small'
                    label='Role'
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value='all'>Both users</MenuItem>
                    <MenuItem value='trainer'>Coach only</MenuItem>
                    <MenuItem value='trainee'>Trainee only</MenuItem>
                  </TextField>
                  <TextField
                    select
                    size='small'
                    label='Actions'
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value='all'>All actions</MenuItem>
                    <MenuItem value='fails'>Fails only</MenuItem>
                    <MenuItem value='play_ok'>play_ok</MenuItem>
                    <MenuItem value='play_fail'>play_fail</MenuItem>
                    <MenuItem value='stuck_paused'>stuck_paused</MenuItem>
                    <MenuItem value='remote_play'>remote_play</MenuItem>
                    <MenuItem value='play_intent'>play_intent</MenuItem>
                  </TextField>
                </Stack>
                <Box className='admin-data-grid' sx={{ height: 360, width: '100%', mb: 2 }}>
                  <DataGrid
                    rows={clipRows}
                    columns={clipColumns}
                    pageSizeOptions={[25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    disableRowSelectionOnClick
                    getRowClassName={p =>
                      p.row.action === 'play_fail' || p.row.action === 'stuck_paused' ? 'MuiDataGrid-row--error' : ''
                    }
                  />
                </Box>

                {detail.timeline ? (
                  <>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Session timeline (ops + joins)
                    </Typography>
                    <Box
                      component='pre'
                      sx={{
                        m: 0,
                        p: 1.5,
                        maxHeight: 200,
                        overflow: 'auto',
                        fontSize: 12,
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }}
                    >
                      {JSON.stringify(
                        {
                          bothJoinedAt: detail.bothJoinedAt,
                          actualEndAt: detail.actualEndAt,
                          timeline: detail.timeline
                        },
                        null,
                        2
                      )}
                    </Box>
                  </>
                ) : null}
              </>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No detail for this session.
              </Typography>
            )}
          </>
        ) : null}
      </AdminPageSection>
    </AdminPageShell>
  )
}
