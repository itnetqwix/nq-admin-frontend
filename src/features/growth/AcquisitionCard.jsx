import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import ChartCard from 'src/components/admin/charts/ChartCard'
import { getGrowthAcquisition } from 'src/services/peopleApi'
import { ops } from 'src/styles/opsSurface'
import { formatInt, formatPct } from 'src/utils/format'
import { acquisitionNote, acquisitionRows } from './acquisitionView'

/** Where new trainees came from, and how many of each source went on to book a lesson. */
export default function AcquisitionCard({ days }) {
  const q = useQuery({ queryKey: ['growth', 'acquisition', days], queryFn: () => getGrowthAcquisition(days) })
  const rows = acquisitionRows(q.data)
  const note = acquisitionNote(q.data)
  return (
    <ChartCard title='Where new trainees come from' subtitle={`Joined in the last ${days} days`} loading={q.isLoading} error={q.error} empty={q.data && !rows.length}>
      <Table size='small' aria-label='Signup sources'>
        <TableHead>
          <TableRow>
            {['Source', 'Signups', 'Booked a lesson'].map((h, i) => (
              <TableCell key={h} align={i ? 'right' : 'left'} sx={{ fontFamily: ops.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: ops.mute }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.key}>
              <TableCell sx={{ color: r.tracked ? 'inherit' : ops.mute }}>{r.label}</TableCell>
              <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatInt(r.signups)}</TableCell>
              <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatInt(r.booked)}
                <Box component='span' sx={{ color: ops.mute }}> · {r.bookedShare === null ? '—' : formatPct(r.bookedShare, 0)}</Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {note ? <Typography sx={{ fontSize: 12, color: ops.mute, mt: 1.5 }}>{note}</Typography> : null}
    </ChartCard>
  )
}
