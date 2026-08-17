import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

export const PRICING_FLOW = [
  { tab: 0, label: 'Configure', hint: 'Commission, lesson fees, cash-out fee' },
  { tab: 1, label: 'Peak', hint: 'Optional extra % on busy hours' },
  { tab: 2, label: 'Profit', hint: 'Same $60 lesson after infra' },
  { tab: 3, label: 'History', hint: 'What you published' }
]

export function PricingFlowStrip({ tab, onGoTab }) {
  const current = PRICING_FLOW[tab] || PRICING_FLOW[0]
  const next = PRICING_FLOW[tab + 1]
  const copy =
    tab === 0
      ? 'Set rates, watch the tape, save at the top. Website and app pick this up on the next checkout.'
      : tab === 1
        ? 'Peak is an extra % on the session before fees. Off by default. Coaches can opt out in Manage trainers.'
        : tab === 2
          ? 'Review profit on the $60 ticket, then save. History is the audit trail.'
          : 'Each save is a new version. Paid bookings keep the snapshot they were charged under.'

  return (
    <OpsSurfaceCard sx={{ mb: 2.5, bgcolor: ops.canvasSoft }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent='space-between'>
        <Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {current.label} · {tab + 1} of {PRICING_FLOW.length}
          </Typography>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mt: 0.25 }}>{current.hint}</Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5, maxWidth: 640 }}>
            {copy}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {PRICING_FLOW.map(step => (
            <Chip
              key={step.tab}
              size='small'
              label={step.label}
              onClick={() => onGoTab(step.tab)}
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                cursor: 'pointer',
                bgcolor: step.tab === tab ? ops.ink : ops.canvas,
                color: step.tab === tab ? '#fff' : ops.body
              }}
            />
          ))}
          {next ? (
            <Button size='small' variant='contained' onClick={() => onGoTab(next.tab)} sx={{ textTransform: 'none', bgcolor: ops.ink }}>
              Next: {next.label}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </OpsSurfaceCard>
  )
}
