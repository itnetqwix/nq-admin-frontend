import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'
import { PRICING_TAB_FLOW } from 'src/constants/revenueAdmin'

export { PRICING_TAB_FLOW as PRICING_FLOW }

export function PricingFlowStrip({ tab, onGoTab }) {
  const current = PRICING_TAB_FLOW[tab] || PRICING_TAB_FLOW[0]
  const next = PRICING_TAB_FLOW[tab + 1]
  const copyByTab = {
    0: 'Set commission, product fees, and payment-method costs per region. Use the settlement tape to sanity-check coach payouts before you save.',
    1: 'Edit Locker tiers (Free → Max): storage, recording quality, extension discount %, and marketing bullets shown in Settings. Enforced fields gate live product behavior.',
    2: 'Peak pricing adds an optional % on busy hours. Coaches can opt out individually in Manage trainers.',
    3: 'Run a $60 lesson through infra costs. Confirm margin before publishing.',
    4: 'Every Save creates a version. Existing bookings keep the snapshot they were charged under.'
  }
  const copy = copyByTab[tab] || copyByTab[0]

  return (
    <OpsSurfaceCard sx={{ mb: 2.5, bgcolor: ops.canvasSoft }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent='space-between'>
        <Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {current.label} · step {tab + 1} of {PRICING_TAB_FLOW.length}
          </Typography>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mt: 0.25 }}>{current.hint}</Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5, maxWidth: 680 }}>
            {copy}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
          {PRICING_TAB_FLOW.map(step => (
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
          <Chip
            component={Link}
            href='/apps/promo-codes'
            clickable
            size='small'
            label='Promo codes →'
            variant='outlined'
            sx={{ fontFamily: ops.mono, fontSize: 11 }}
          />
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
