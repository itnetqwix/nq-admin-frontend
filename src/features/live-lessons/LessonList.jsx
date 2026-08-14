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
import moment from 'moment'
import {
  AdminEmptyState,
  AdminFilterBar,
  OpsMetricTile,
  OpsSurfaceCard
} from 'src/components/admin'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import Icon from 'src/@core/components/icon'
import { FilterChip, LOOKBACK_PRESETS, personLabel, shortId } from './parts'

export default function LessonList(p) {
  const {
    total, summary, usingDateRange, hours, live, setLive, setSkip, setHasClipIssues, setFiltersOpen,
    setPresetHours, qInput, setQInput, scheduleDebounced, setQ, loadList, loading, kind, setKind,
    filtersOpen, activeAdvanced, trainerInput, setTrainerInput, traineeInput, setTraineeInput,
    applyNameFilters, fromDate, setFromDate, toDate, setToDate, limit, setLimit, hasClipIssues,
    clearAdvanced, rows, selectSession, page, canPrev, canNext
  } = p
  return (
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
                tone={summary.live ? 'live' : 'default'}
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
                              <Chip size='small' label='LIVE' sx={{ bgcolor: ops.softMint, color: ops.live, fontWeight: 700 }} />
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
  )
}
