import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import Money from 'src/components/admin/Money'
import { formatInt } from 'src/utils/format'

const ROWS = [
  { key: 'heldMinor', label: 'Held in escrow', hint: 'Waiting for the lesson and clearance', href: '/apps/finance?tab=escrow&escrowStatus=held' },
  { key: 'releasingMinor', label: 'Releasing to coaches', hint: 'In flight', href: '/apps/finance?tab=escrow&escrowStatus=releasing' },
  { key: 'disputedMinor', label: 'Disputed', hint: 'Frozen until resolved', href: '/apps/finance?tab=escrow&escrowStatus=disputed', danger: true },
  { key: 'pendingPayoutMinor', label: 'Payouts awaiting action', hint: 'countKey:pendingPayoutCount', href: '/apps/finance?tab=payouts' },
  { key: 'openRefundMinor', label: 'Open refunds', hint: 'countKey:openRefundCount', href: '/apps/finance?tab=refunds' }
]

/** Where the money is that has not settled, split by why, each line linking to the queue. */
export default function MoneyAtRiskCard({ data }) {
  if (!data) return null
  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontFamily: ops.scoreboard, fontSize: 34, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          <Money minor={data.totalMinor} />
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>total not yet settled</Typography>
      </Box>
      <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.5 }}>
        {ROWS.map(row => {
          const hint = row.hint.startsWith('countKey:') ? `${formatInt(data[row.hint.slice(9)])} items` : row.hint
          return (
            <li key={row.key}>
              <Box
                component={NextLink}
                href={row.href}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: ops.radiusSm,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { bgcolor: ops.canvasSoft }
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: ops.mute }}>{hint}</Typography>
                </Box>
                <Money minor={data[row.key]} tone={row.danger && data[row.key] > 0 ? 'out' : undefined} sx={{ fontSize: 14, fontWeight: 600 }} />
              </Box>
            </li>
          )
        })}
      </Box>
    </Box>
  )
}
