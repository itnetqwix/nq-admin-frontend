import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'

export default function PricingPromoSponsorTab() {
  return (
    <AdminPageSection title='Promo discounts — who pays?'>
      <Stack spacing={2}>
        <Card variant='outlined'>
          <CardContent>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
              <Chip size='small' label='Platform-sponsored' color='primary' />
              <Typography variant='subtitle1' fontWeight={700}>
                NetQwix absorbs the discount
              </Typography>
            </Stack>
            <Typography variant='body2' color='text.secondary'>
              Trainee pays less at checkout. Coach still earns commission on the <strong>pre-discount</strong>{' '}
              session price. Platform margin is reduced by the promo amount.
            </Typography>
          </CardContent>
        </Card>
        <Card variant='outlined'>
          <CardContent>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
              <Chip size='small' label='Coach-sponsored' color='secondary' />
              <Typography variant='subtitle1' fontWeight={700}>
                Coach absorbs the discount
              </Typography>
            </Stack>
            <Typography variant='body2' color='text.secondary'>
              Trainee pays less. Coach payout is calculated on the <strong>discounted</strong> session
              subtotal — shown as &quot;Coach promo&quot; on checkout breakdown. Use Manage Promos to set
              sponsor per code.
            </Typography>
          </CardContent>
        </Card>
        <Typography variant='caption' color='text.secondary'>
          Sponsor is stored on each booking as <code>promo_sponsor_type</code> and reflected in quote
          breakdown + trainer earnings. Profit check tab simulates both paths.
        </Typography>
      </Stack>
    </AdminPageSection>
  )
}
