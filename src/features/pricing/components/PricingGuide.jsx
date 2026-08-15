import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

export const PRICING_FLOW = [
  { tab: 0, label: 'Understand', hint: 'How a dollar actually moves' },
  { tab: 1, label: 'Set rates', hint: 'Commission, fees, when coach is paid' },
  { tab: 2, label: 'Peak (optional)', hint: 'Extra % on busy hours' },
  { tab: 3, label: 'Check profit', hint: '$60 lesson at 15 or 30 min' },
  { tab: 4, label: 'History', hint: 'What you published' }
]

export function PricingFlowStrip({ tab, onGoTab }) {
  const current = PRICING_FLOW[tab] || PRICING_FLOW[0]
  const next = PRICING_FLOW[tab + 1]

  return (
    <OpsSurfaceCard sx={{ mb: 2.5, bgcolor: ops.canvasSoft }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent='space-between'>
        <Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Step {tab + 1} of {PRICING_FLOW.length}
          </Typography>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mt: 0.25 }}>
            {current.label} — {current.hint}
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5, maxWidth: 640 }}>
            {tab === 0
              ? 'Read this first. Then set rates. Website and app charge the saved numbers on the next checkout — they do not use a separate price list.'
              : tab === 1
                ? 'Change commission and the two platform fees. Watch the $60 lesson update. Escrow below is when the coach is paid, not how much.'
                : tab === 2
                  ? 'Optional. Peak is an extra % on the session before fees. Off by default. Coaches can opt out in Manage trainers.'
                  : tab === 3
                    ? 'Same $60 ticket the enthusiast will see. “Before infra” is take-rate minus Stripe. “After infra” subtracts AWS and video.'
                    : 'Each save is a new version. Existing bookings keep the snapshot they were charged under.'}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {PRICING_FLOW.map(step => (
            <Chip
              key={step.tab}
              size='small'
              label={`${step.tab + 1} · ${step.label}`}
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

export function PricingMentalModel() {
  const steps = [
    {
      n: '1',
      title: 'Enthusiast pays now',
      body: 'Card, wallet, or both. Stripe captures the card immediately — it is not an authorization we capture later.'
    },
    {
      n: '2',
      title: 'We hold it on our ledger',
      body: 'Called “escrow” in admin. Stripe already has the cash. This hold is our rulebook, not Stripe holding the lesson.'
    },
    {
      n: '3',
      title: 'Lesson fails to start → full refund',
      body: 'Money goes back the way it came (card to card, wallet to wallet). No partial refunds in the product.'
    },
    {
      n: '4',
      title: 'Lesson completes → coach wallet later',
      body: 'After both ratings or 7 days, plus 24 hours clearance. Earnings stay in the NetQwix wallet — not a bank — until we ship payouts.'
    }
  ]

  return (
    <Grid container spacing={2}>
      {steps.map(s => (
        <Grid item xs={12} sm={6} md={3} key={s.n}>
          <OpsSurfaceCard>
            <Chip size='small' label={`Life of a dollar · ${s.n}`} sx={{ mb: 1, fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }} />
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>{s.title}</Typography>
            <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>{s.body}</Typography>
          </OpsSurfaceCard>
        </Grid>
      ))}
    </Grid>
  )
}

export function PricingMixups() {
  const rows = [
    ['Stripe holds the lesson until class ends', 'We charge now. Escrow is our internal ledger.'],
    ['Coach is paid at checkout', 'Coach is paid after the lesson + ratings/7 days + 24h, into wallet.'],
    ['Connecting a card pays a coach', 'Cards take money in. Bank payouts need Stripe Connect — off for now.'],
    ['Website and app have different prices', 'Same backend quote. Save here, both sides pick it up next checkout.']
  ]

  return (
    <OpsSurfaceCard>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>Easy to mix up</Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, mb: 1.5, lineHeight: 1.5 }}>
        If a number on this page surprises you, it is usually one of these.
      </Typography>
      <Stack spacing={1.25}>
        {rows.map(([wrong, right]) => (
          <Stack key={wrong} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Typography sx={{ flex: 1, fontSize: 13, color: ops.mute }}>Not: {wrong}</Typography>
            <Typography sx={{ flex: 1, fontSize: 13, color: ops.body }}>
              <strong>Is:</strong> {right}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </OpsSurfaceCard>
  )
}
