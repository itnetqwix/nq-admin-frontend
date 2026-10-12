import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { formatInt, timeAgo } from 'src/utils/format'

export const LESSON_STATE = {
  live: { label: 'Live', tone: 'live', pulse: true },
  waiting: { label: 'Waiting', tone: 'warning' },
  late: { label: 'Late', tone: 'danger' },
  upcoming: { label: 'Starting soon', tone: 'info' }
}

const Stat = ({ label, value, tone }) => (
  <Box sx={{ textAlign: 'center', flex: 1 }}>
    <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 28, fontWeight: 600, lineHeight: 1, color: tone || 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
      {formatInt(value)}
    </Typography>
    <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.5 }}>{label}</Typography>
  </Box>
)

/** Headline lesson counts and the few lessons most worth looking at right now. */
export default function LiveNowCard({ live }) {
  if (!live) return null
  const s = live.summary || {}
  return (
    <Box>
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Stat label='Live' value={s.live} tone={ops.live} />
        <Stat label='Waiting' value={s.waiting} tone={s.waiting ? ops.warningFg : undefined} />
        <Stat label='Late' value={s.late} tone={s.late ? ops.error : undefined} />
        <Stat label='Instant requests' value={s.instantPending} />
      </Box>
      {live.lessons?.length ? (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75 }}>
          {live.lessons.map(l => {
            const st = LESSON_STATE[l.state] || LESSON_STATE.upcoming
            return (
              <li key={l.sessionId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft }}>
                  <StatusPill tone={st.tone} pulse={st.pulse} size='sm'>{st.label}</StatusPill>
                  <Box sx={{ minWidth: 0, flex: 1, fontSize: 13 }}>
                    <EntityLink type='lesson' id={l.sessionId}>
                      {l.trainer?.name || 'Trainer'} <Box component='span' sx={{ color: ops.mute }}>with</Box> {l.trainee?.name || 'Trainee'}
                    </EntityLink>
                  </Box>
                  {l.lowQualityEvents30m > 0 ? (
                    <StatusPill tone='warning' size='sm'>{l.lowQualityEvents30m} quality alerts</StatusPill>
                  ) : null}
                  <Typography sx={{ fontSize: 11, color: ops.mute, whiteSpace: 'nowrap' }}>
                    {timeAgo(l.startedAt || l.startsAt)}
                  </Typography>
                </Box>
              </li>
            )
          })}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', py: 1 }}>No lessons in progress.</Typography>
      )}
      <Box sx={{ mt: 1.5, textAlign: 'right' }}>
        <Box component={NextLink} href='/apps/live-lessons' sx={{ fontSize: 12, color: ops.link, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Open Live Ops →
        </Box>
      </Box>
    </Box>
  )
}
