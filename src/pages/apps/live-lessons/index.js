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

export default function LiveLessonsPage() {
  const router = useRouter()
  const [hours, setHours] = useState(48)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
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

  const clipRows = (detail?.clipEvents || []).map((e, i) => ({
    id: `${e.at || i}-${i}`,
    at: e.at,
    role: e.role || '—',
    user: personLabel(e.user),
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
    { field: 'user', headerName: 'User', width: 140, headerClassName: styles['header-class'], cellClassName: styles['cell-class'] },
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
      subtitle='Both joined participants, client kind (web/ios/android), clip play/pause media logs, and ops timeline. Prefer this over raw call-diagnostics when debugging clip sync.'
      actions={
        <Stack direction='row' spacing={1}>
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
              Row click → both users + clip log. Look for <code>play_fail</code> / <code>stuck_paused</code> on one side only
              (trainer plays / trainee frozen and reverse). Cross-check call diagnostics for RTT.
            </Typography>
          </Grid>
        </Grid>

        <Box className='admin-data-grid' sx={{ height: selectedId ? 280 : 520, width: '100%', mb: 2 }}>
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Session {selectedId}
              </Typography>
              {detail?.live ? <Chip size='small' color='error' label='LIVE now' /> : null}
              <Button size='small' onClick={() => selectSession('')}>
                Clear
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
                <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant='caption' color='text.secondary'>
                        Coach
                      </Typography>
                      <Typography variant='body1'>{personLabel(detail.trainer)}</Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                        {detail.trainer?.email || detail.trainer?.id || ''}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant='caption' color='text.secondary'>
                        Trainee
                      </Typography>
                      <Typography variant='body1'>{personLabel(detail.trainee)}</Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                        {detail.trainee?.email || detail.trainee?.id || ''}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Clients in room
                </Typography>
                <Box className='admin-data-grid' sx={{ height: Math.min(180, 52 + participantRows.length * 42), width: '100%', mb: 2 }}>
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

                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Clip play / pause log ({clipRows.length})
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  Browser console on each client: filter <code>[clipPlayback]</code>. Server: <code>[ClipPlayback]</code>.
                </Typography>
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

                {detail.timeline?.opsEvents?.length || detail.timeline?.events?.length ? (
                  <>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Session timeline (ops + joins)
                    </Typography>
                    <Box
                      component='pre'
                      sx={{
                        m: 0,
                        p: 1.5,
                        maxHeight: 240,
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
