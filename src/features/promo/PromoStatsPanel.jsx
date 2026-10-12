import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'
import KpiTile from 'src/components/admin/KpiTile'
import MiniSparkline from 'src/components/admin/MiniSparkline'
import StatusPill from 'src/components/admin/StatusPill'
import { getPromoCodeStats } from 'src/services/promoStatsApi'
import { ops } from 'src/styles/opsSurface'
import { HEALTH, healthLine, reconciliationNote, statTiles } from './promoStatsView'

/** What one promo code has done: who used it, what it cost, what it brought in. */
export default function PromoStatsPanel({ promoId }) {
  const q = useQuery({ queryKey: ['promo', 'stats', promoId], queryFn: () => getPromoCodeStats(promoId), enabled: Boolean(promoId) })

  if (q.isError) {
    return <AdminEmptyState title='Couldn’t load the results' description={q.error?.message} actionLabel='Try again' onAction={() => q.refetch()} />
  }
  if (q.isLoading || !q.data) return <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading results…</Typography>

  const s = q.data
  const health = HEALTH[s.health.state] || HEALTH.live
  const note = reconciliationNote(s)
  return (
    <Box sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <StatusPill tone={health.tone} size='sm'>{health.label}</StatusPill>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{healthLine(s.health)}</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 11, color: ops.mute }}>Lessons using this code, last {s.days} days</Typography>
        <MiniSparkline values={s.daily.map(d => d.bookings)} width={96} />
      </Box>
      <Grid container spacing={1.5}>
        {statTiles(s).map(t => (
          <Grid item xs={6} md={4} key={t.key}>
            <KpiTile label={t.label} value={t.value} hint={t.hint || undefined} />
          </Grid>
        ))}
      </Grid>
      {s.capped ? <Typography sx={{ fontSize: 12, color: ops.warningFg }}>Showing the most recent 5,000 lessons only.</Typography> : null}
      {note ? <Typography sx={{ fontSize: 12, color: ops.mute }}>{note}</Typography> : null}
    </Box>
  )
}
