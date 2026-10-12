import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import { formatInt, formatPct } from 'src/utils/format'

export const FUNNEL_LABELS = {
  trainer_profile_viewed: 'Viewed a coach',
  slot_selected: 'Picked a time',
  checkout_started: 'Started checkout',
  booking_created: 'Booked',
  lesson_completed: 'Completed lesson'
}

/** Booking funnel: bar width = users at the step; the pill is conversion from the previous step. */
export function funnelRows(steps = []) {
  const top = Math.max(...steps.map(s => Number(s.users) || 0), 0)
  return steps.map((s, i) => {
    const users = Number(s.users) || 0
    const prev = i > 0 ? Number(steps[i - 1].users) || 0 : null
    return {
      step: s.step,
      label: FUNNEL_LABELS[s.step] || s.step,
      users,
      widthPct: top > 0 ? Math.max(2, Math.round((users / top) * 100)) : 0,
      conversion: prev && prev > 0 ? users / prev : null
    }
  })
}

export default function FunnelBars({ steps }) {
  const rows = funnelRows(steps)
  if (!rows.length || rows.every(r => r.users === 0)) {
    return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No funnel activity recorded in this period.</Typography>
  }
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {rows.map(r => (
        <Box key={r.step}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{r.label}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {formatInt(r.users)}
              {r.conversion != null ? ` · ${formatPct(r.conversion, 0)} of previous` : ''}
            </Typography>
          </Box>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: ops.canvasSoft2 }}>
            <Box sx={{ height: '100%', width: `${r.widthPct}%`, borderRadius: 4, bgcolor: ops.accent }} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}
