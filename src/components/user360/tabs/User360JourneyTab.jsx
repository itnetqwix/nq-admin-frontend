import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StatusPill from 'src/components/admin/StatusPill'
import { STAGE_META } from 'src/features/growth/growthView'
import { getUserTrajectory } from 'src/services/peopleApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt, timeAgo } from 'src/utils/format'
import { SectionShell } from '../user360Shared'

const Stat = ({ label, value }) => (
  <Box sx={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
    <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 28, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatInt(value)}</Typography>
    <Typography sx={{ fontSize: 11, color: ops.mute, mt: 0.5 }}>{label}</Typography>
  </Box>
)

/**
 * Where this person is in their life with NetQwix: a lifecycle stage plus a checklist of the
 * milestones they have and have not reached.
 */
export default function User360JourneyTab({ userId }) {
  const q = useQuery({ queryKey: ['user', userId, 'trajectory'], queryFn: () => getUserTrajectory(userId), enabled: Boolean(userId) })

  if (q.isLoading) return <SectionShell title='Journey' subtitle='Loading…' />
  if (q.isError) return <SectionShell title='Journey' subtitle={q.error?.message || 'Could not load this person’s journey.'} />
  const t = q.data
  const stage = STAGE_META[t.stage] || { label: t.stage, tone: 'neutral', help: '' }

  return (
    <SectionShell title='Journey' subtitle={t.role === 'Trainer' ? 'From signing up to teaching lessons.' : 'From signing up to coming back.'}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
        <StatusPill tone={stage.tone}>{stage.label}</StatusPill>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{stage.help}</Typography>
      </Box>
      <Box sx={{ display: 'flex', mb: 3, p: 1.5, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft }}>
        <Stat label='Bookings' value={t.stats.bookings} />
        <Stat label='Completed' value={t.stats.completed} />
        <Stat label='Cancelled' value={t.stats.cancelled} />
        <Stat label='Refunds' value={t.stats.refunds} />
      </Box>
      <Box component='ol' sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {t.milestones.map((m, i) => (
          <li key={m.key}>
            <Box sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: i === t.milestones.length - 1 ? 0 : 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    mt: 0.25,
                    border: `2px solid ${m.done ? ops.live : ops.hairline}`,
                    bgcolor: m.done ? ops.live : 'transparent'
                  }}
                />
                {i < t.milestones.length - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: ops.hairline, mt: 0.5 }} /> : null}
              </Box>
              <Box sx={{ minWidth: 0, opacity: m.done ? 1 : 0.65 }}>
                <Typography sx={{ fontSize: 14, fontWeight: m.done ? 600 : 500 }}>
                  {m.label}
                  {!m.done ? <Box component='span' sx={{ ml: 1, fontSize: 11, color: ops.mute, fontWeight: 400 }}>not yet</Box> : null}
                </Typography>
                {m.at ? (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {new Date(m.at).toLocaleDateString()} · {timeAgo(m.at)}
                  </Typography>
                ) : m.done ? (
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Done</Typography>
                ) : null}
                {m.detail ? <Typography sx={{ fontSize: 12, color: ops.mute }}>{m.detail}</Typography> : null}
              </Box>
            </Box>
          </li>
        ))}
      </Box>
    </SectionShell>
  )
}
