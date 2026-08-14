import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { OpsSurfaceCard } from 'src/components/admin'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'

export default function PricingPromoSponsorTab() {
  return (
    <AdminPageSection title='Promo discounts — who pays?'>
      <Stack spacing={2}>
        <OpsSurfaceCard>
          <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
            <Chip
              size='small'
              label='Platform-sponsored'
              sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.ink, color: '#fff' }}
            />
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>
              NetQwix absorbs the discount
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
            Trainee pays less at checkout. Coach still earns commission on the <strong>pre-discount</strong>{' '}
            session price. Platform margin is reduced by the promo amount.
          </Typography>
        </OpsSurfaceCard>
        <OpsSurfaceCard>
          <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
            <Chip size='small' label='Coach-sponsored' sx={{ fontFamily: ops.mono, fontSize: 11 }} variant='outlined' />
            <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>Coach absorbs the discount</Typography>
          </Stack>
          <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
            Trainee pays less. Coach payout is calculated on the <strong>discounted</strong> session
            subtotal — shown as &quot;Coach promo&quot; on checkout breakdown. Use Manage Promos to set
            sponsor per code.
          </Typography>
        </OpsSurfaceCard>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
          Sponsor is stored on each booking as <code>promo_sponsor_type</code> and reflected in quote
          breakdown + trainer earnings. Profit check tab simulates both paths.
        </Typography>
      </Stack>
    </AdminPageSection>
  )
}
