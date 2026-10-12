import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import { formatInt } from 'src/utils/format'
import { cohortUsersLink, heatBackground } from './growthView'

/**
 * Retention heatmap: one row per signup week/month, one column per period since joining.
 * Darker = more of that group came back. A blank cell is the future (unknown), never zero.
 */
export default function CohortHeatmap({ table, cohorts, kind, role, unit = 'week' }) {
  if (!table.rows.length) return null
  const cols = table.columns
  const cell = {
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    borderRadius: '4px'
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        role='table'
        aria-label='Cohort retention'
        sx={{ display: 'grid', gridTemplateColumns: `130px 64px repeat(${cols}, minmax(52px, 1fr))`, gap: '3px', minWidth: 130 + 64 + cols * 55 }}
      >
        <Box role='row' sx={{ display: 'contents' }}>
          <Box role='columnheader' sx={{ fontSize: 11, color: ops.mute }}>Signed up</Box>
          <Box role='columnheader' sx={{ fontSize: 11, color: ops.mute, textAlign: 'right', pr: 1 }}>People</Box>
          {Array.from({ length: cols }, (_, n) => (
            <Box key={n} role='columnheader' sx={{ fontSize: 11, color: ops.mute, textAlign: 'center' }}>
              {n === 0 ? 'Joined' : `+${n} ${unit}${n > 1 ? 's' : ''}`}
            </Box>
          ))}
        </Box>
        {table.rows.map((row, i) => (
          <Box key={row.start} role='row' sx={{ display: 'contents' }}>
            <Box role='rowheader' sx={{ ...cell, justifyContent: 'flex-start', fontSize: 12.5, fontWeight: 500 }}>
              {row.size > 0 ? (
                <Box component={NextLink} href={cohortUsersLink(cohorts[i], kind, role)} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} title='See these people'>
                  {row.label}
                </Box>
              ) : (
                row.label
              )}
            </Box>
            <Box role='cell' sx={{ ...cell, justifyContent: 'flex-end', pr: 1, color: 'text.secondary' }}>{formatInt(row.size)}</Box>
            {row.cells.map((c, n) =>
              c ? (
                <Box key={n} role='cell' title={c.title} sx={{ ...cell, bgcolor: heatBackground(c.pct) || ops.canvasSoft, color: 'text.primary' }}>
                  {c.text}
                </Box>
              ) : (
                <Box key={n} role='cell' aria-label='not yet observed' sx={{ ...cell, border: `1px dashed ${ops.hairline}` }} />
              )
            )}
          </Box>
        ))}
        <Box role='row' sx={{ display: 'contents' }}>
          <Box role='rowheader' sx={{ ...cell, justifyContent: 'flex-start', fontWeight: 700, fontSize: 12.5 }}>All cohorts</Box>
          <Box role='cell' />
          {table.average.map((c, n) => (
            <Box key={n} role='cell' title={c?.title} sx={{ ...cell, fontWeight: 700, bgcolor: ops.canvasSoft2 }}>
              {c ? c.text : ''}
            </Box>
          ))}
        </Box>
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: 11.5, color: ops.mute }}>
        A person counts as active in a period if they made a booking (cancelled bookings don’t count). Dashed cells haven’t happened yet.
      </Typography>
    </Box>
  )
}
