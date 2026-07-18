import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'

/** Tiny SVG sparkline — no chart lib. */
export default function MiniSparkline({ values = [], width = 72, height = 22, color = ops.indigo }) {
  const nums = (values || []).map(Number).filter(n => Number.isFinite(n))
  if (nums.length < 2) {
    return (
      <Box component='span' sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
        —
      </Box>
    )
  }
  const max = Math.max(...nums, 1)
  const min = Math.min(...nums, 0)
  const span = Math.max(max - min, 1)
  const pts = nums
    .map((v, i) => {
      const x = (i / (nums.length - 1)) * width
      const y = height - ((v - min) / span) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(' ')
  return (
    <Box
      component='svg'
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      sx={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <polyline fill='none' stroke={color} strokeWidth='1.5' strokeLinejoin='round' points={pts} />
    </Box>
  )
}

/** Fill last `days` from [{date, count|sent}] rows. */
export function fillDailySeries(rows, days = 14, valueKey = 'count') {
  const map = Object.fromEntries((rows || []).map(d => [d.date, Number(d[valueKey] ?? d.count ?? d.sent) || 0]))
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(map[d.toISOString().slice(0, 10)] || 0)
  }
  return out
}

/** Bucket used_by.used_at into last `days` daily counts. */
export function sparkFromUsedBy(usedBy, days = 14) {
  const counts = Array(days).fill(0)
  const now = Date.now()
  const dayMs = 86_400_000
  for (const row of usedBy || []) {
    const t = new Date(row.used_at || row.usedAt || 0).getTime()
    if (!Number.isFinite(t)) continue
    const age = Math.floor((now - t) / dayMs)
    if (age >= 0 && age < days) counts[days - 1 - age] += 1
  }
  return counts
}

/** Channel sent counts as a short series for broadcast rows. */
export function sparkFromBroadcastStats(stats) {
  if (!stats || typeof stats !== 'object') return []
  return ['email', 'sms', 'whatsapp', 'in_app', 'push'].map(ch => Number(stats[ch]?.sent || 0))
}
