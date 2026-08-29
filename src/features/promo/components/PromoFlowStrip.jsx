import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

export function PromoFlowStrip() {
  return (
    <OpsSurfaceCard sx={{ mb: 2.5, bgcolor: ops.canvasSoft }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent='space-between'>
        <Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Promo workflow
          </Typography>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mt: 0.25 }}>
            Create → scope booking type → set dates → toggle active
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mt: 0.5, lineHeight: 1.5, maxWidth: 680 }}>
            <strong>Instant / scheduled</strong> promos stack with Locker fee discounts at checkout.{' '}
            <strong>Session extension</strong> promos use best-of vs the plan extension % configured in Pricing.
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip component={Link} href='/apps/pricing?tab=locker' clickable size='small' label='Locker extension %' variant='outlined' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
          <Chip component={Link} href='/apps/pricing?tab=rates' clickable size='small' label='Lesson fees' variant='outlined' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
          <Chip component={Link} href='/apps/pricing?tab=history' clickable size='small' label='Pricing history' variant='outlined' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
        </Stack>
      </Stack>
    </OpsSurfaceCard>
  )
}
