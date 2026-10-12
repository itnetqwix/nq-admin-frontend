import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import AreaTrend from 'src/components/admin/charts/AreaTrend'
import ChartCard from 'src/components/admin/charts/ChartCard'
import { getApiHistory, getGrowthHistory } from 'src/services/peopleApi'
import { ops } from 'src/styles/opsSurface'
import { apiCharts, apiSummary, businessCharts, gapNote, HISTORY_RANGES } from './historyView'

function RangeToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup size='small' exclusive value={value} onChange={(_, v) => v && onChange(v)} aria-label='History range'>
      {HISTORY_RANGES.map(r => (
        <ToggleButton key={r.value} value={r.value} sx={{ px: 1.25, py: 0.25, textTransform: 'none', fontSize: 12 }}>{r.label}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const Gap = ({ note }) => (note ? <Typography sx={{ fontSize: 12, color: ops.mute, mt: 1 }}>{note}</Typography> : null)

/** Signups, lessons and money by day, from the nightly summary, so it reaches back months. */
export function BusinessHistory() {
  const [days, setDays] = useState(90)
  const q = useQuery({ queryKey: ['growth', 'history', days], queryFn: () => getGrowthHistory(days), placeholderData: keepPreviousData })
  const c = useMemo(() => businessCharts(q.data), [q.data])
  const note = gapNote(q.data?.missingDays)
  const empty = q.data && q.data.missingDays?.length === q.data.series.length
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Long-range trends</Typography>
          <RangeToggle value={days} onChange={setDays} />
        </Box>
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCard title='Lessons booked per day' subtitle='Counted on the day the booking was made' loading={q.isLoading} error={q.error} empty={empty}>
          <AreaTrend series={c.bookings} categories={c.categories} type='bar' height={240} />
        </ChartCard>
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCard title='Money per day' subtitle='GMV (kept bookings) and platform revenue (completed lessons)' loading={q.isLoading} error={q.error} empty={empty}>
          <AreaTrend series={c.money} categories={c.categories} format='money' height={240} />
        </ChartCard>
      </Grid>
      <Grid item xs={12}>
        <ChartCard title='Signups per day' subtitle='Trainees and coaches' loading={q.isLoading} error={q.error} empty={empty}>
          <AreaTrend series={c.signups} categories={c.categories} type='bar' stacked height={220} />
        </ChartCard>
        <Gap note={note} />
      </Grid>
    </Grid>
  )
}

/** API error rate and latency by day, kept after the access log itself expires. */
export function ApiHistory() {
  const [days, setDays] = useState(90)
  const q = useQuery({ queryKey: ['system-health', 'api-history', days], queryFn: () => getApiHistory(days), placeholderData: keepPreviousData })
  const c = useMemo(() => apiCharts(q.data), [q.data])
  const empty = q.data && q.data.missingDays?.length === q.data.series.length
  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>API health, day by day</Typography>
            <Typography sx={{ fontSize: 12, color: ops.mute }}>{apiSummary(q.data) || 'Kept after the raw request logs expire after 7 days.'}</Typography>
          </Box>
          <RangeToggle value={days} onChange={setDays} />
        </Box>
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCard title='Server errors' subtitle='Share of requests that failed with a 5xx' loading={q.isLoading} error={q.error} empty={empty}>
          <AreaTrend series={c.errorRate} categories={c.categories} format='pct' height={220} />
        </ChartCard>
      </Grid>
      <Grid item xs={12} lg={6}>
        <ChartCard title='Response time' subtitle='Average per day' loading={q.isLoading} error={q.error} empty={empty}>
          <AreaTrend series={c.latency} categories={c.categories} format='ms' height={220} />
        </ChartCard>
        <Gap note={gapNote(q.data?.missingDays)} />
      </Grid>
    </Grid>
  )
}
