import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

function FeeCard({ label, title, body, color = 'default' }) {
  return (
    <Card variant='outlined' sx={{ height: '100%', borderColor: color === 'primary' ? 'primary.light' : undefined }}>
      <CardContent>
        <Chip size='small' label={label} color={color === 'primary' ? 'primary' : 'default'} sx={{ mb: 1 }} />
        <Typography variant='subtitle1' fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {body}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function PricingFeeExplainer() {
  return (
    <Box>
      <Typography variant='h6' fontWeight={700} sx={{ mb: 0.5 }}>
        How fees stack on a lesson
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2, maxWidth: 720 }}>
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
            color='primary'
            body='Optional % on subtotal after promo — configured under Surge & peak. Held in escrow separately.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='3 · Platform'
            title='Commission + service fees'
            color='primary'
            body='Commission % on coach earnings plus fixed platform fees from Rates & fees. Enforced minimum floor protects margin.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='4 · Checkout'
            title='Card processing & tax'
            body='Stripe bps + per-charge fee; tax via Stripe Tax when enabled, or editable state/province rates below. Wallet-only checkouts skip card processing.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='5 · Escrow'
            title='Hold until session ends'
            body='Funds stay held until the lesson completes (or dispute window). Release pays coach net; refunds return trainee share.'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FeeCard
            label='6 · Extensions'
            title='In-call add time'
            body='Same quote engine — separate PI/wallet hold linked to parent session. Mixed wallet+card not supported on extensions.'
          />
        </Grid>
      </Grid>
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 2 }}>
        <Chip size='small' variant='outlined' label='US + CA regions' />
        <Chip size='small' variant='outlined' label='Per-coach commission override' />
        <Chip size='small' variant='outlined' label='Quote preview in Profit check' />
      </Stack>
    </Box>
  )
}
