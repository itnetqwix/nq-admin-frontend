import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import moment from 'moment'
import ObservabilityLinks from 'src/layouts/components/ObservabilityLinks'
import { ops } from 'src/styles/opsSurface'
import { copyText, PersonCard, personLabel, StoryRow } from './parts'

export default function LessonStory(p) {
  const { detail, detailLoading, storyFilter, setStoryFilter, filteredStory, story, onCopyPack } = p
  return (
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
                      {detail.live ? <Chip size='small' label='LIVE NOW' sx={{ bgcolor: ops.softMint, color: ops.live, fontWeight: 700 }} /> : <Chip size='small' label='Ended' />}
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
  )
}
