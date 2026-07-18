import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

function FeeCard({ label, title, body, accent }) {
  return (
    <OpsSurfaceCard>
      <Chip
        size='small'
        label={label}
        sx={{
          mb: 1,
          fontFamily: ops.mono,
          fontSize: 11,
          bgcolor: accent ? ops.ink : ops.canvasSoft2,
          color: accent ? '#fff' : ops.body
        }}
      />
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.75 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>{body}</Typography>
    </OpsSurfaceCard>
  )
}

export default function PricingFeeExplainer() {
  return (
    <Box>
      <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 0.5 }}>
        How fees stack on a lesson.
      </Typography>
      <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, maxWidth: 720, lineHeight: 1.5 }}>
        Trainees see one checkout total. Coaches see net earnings after commission. Platform keeps
        commission + platform fees; card processing is either absorbed or passed through per your
        checkout settings below.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='1 · Base'
            title='Session subtotal'
            body='Coach hourly rate × duration. Promo discounts apply here first.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='2 · Surge'
            title='Peak / demand pricing'
            accent
            body='Optional % on subtotal after promo — configured under Surge & peak. Held in escrow separately.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='3 · Platform'
            title='Platform fees'
            body='Fixed trainee + coach fees per region, plus % commission on the session.'
          />
        </Grid>
      </Grid>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 2 }}>
        <Chip size='small' variant='outlined' label='US · CA · GB · EU regions' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
        <Chip size='small' variant='outlined' label='Per-coach commission override' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
        <Chip size='small' variant='outlined' label='Quote preview in Profit check' sx={{ fontFamily: ops.mono, fontSize: 11 }} />
      </Stack>
    </Box>
  )
}
