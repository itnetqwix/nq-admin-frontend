import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import { OpsMetricTile, OpsSurfaceCard } from 'src/components/admin'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fmtMoney, fmtPct } from 'src/constants/pricingAdmin'
import { ops } from 'src/styles/opsSurface'

function RegionCard({ title, subtitle, chip, feeTrainee, feeCoach, commission, currency, onEdit }) {
  return (
    <OpsSurfaceCard>
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
        <Box>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: ops.body, mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        {chip}
      </Stack>
      <Stack spacing={0.5} sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 13 }}>
          Trainee fee: <strong>{fmtMoney(feeTrainee, currency)}</strong>
        </Typography>
        <Typography sx={{ fontSize: 13 }}>
          Coach fee: <strong>{fmtMoney(feeCoach, currency)}</strong>
        </Typography>
        <Typography sx={{ fontSize: 13 }}>
          Commission: <strong>{fmtPct(commission)}</strong>
        </Typography>
      </Stack>
      <Button size='small' sx={{ mt: 1.5, textTransform: 'none', px: 0 }} onClick={onEdit}>
        Edit settings →
      </Button>
    </OpsSurfaceCard>
  )
}

export default function PricingOverviewTab({ config, onGoTab }) {
  const router = useRouter()
  const us = config?.regions?.US
  const ca = config?.regions?.CA

  return (
    <Stack spacing={3}>
      <AdminPageSection title='At a glance'>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <OpsMetricTile
              label='Config version'
              value={`v${config?.version ?? 1}`}
              hint={`Quote tolerance: ${config?.quoteToleranceMinor ?? 5}¢`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <RegionCard
              title='United States'
              subtitle='USD checkout'
              chip={<Chip size='small' label='US' sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.ink, color: '#fff' }} />}
              feeTrainee={us?.traineePlatformFeeMinor}
              feeCoach={us?.trainerPlatformFeeMinor}
              commission={us?.defaultCommissionRate}
              currency='USD'
              onEdit={() => onGoTab(1)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <RegionCard
              title='Canada'
              subtitle='CAD checkout'
              chip={<Chip size='small' label='CA' sx={{ fontFamily: ops.mono, fontSize: 11 }} variant='outlined' />}
              feeTrainee={ca?.traineePlatformFeeMinor}
              feeCoach={ca?.trainerPlatformFeeMinor}
              commission={ca?.defaultCommissionRate}
              currency='CAD'
              onEdit={() => onGoTab(2)}
            />
          </Grid>
        </Grid>
      </AdminPageSection>

      <AdminPageSection title='Quick actions'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap='wrap' useFlexGap>
          <Button variant='outlined' onClick={() => onGoTab(4)}>
            Open quote simulator
          </Button>
          <Button variant='contained' onClick={() => onGoTab(5)}>
            Unit economics
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(3)}>
            Edit session product fees
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(6)}>
            View config history
          </Button>
          <Button variant='outlined' onClick={() => router.push('/apps/finance')}>
            Open finance & escrow
          </Button>
          <Button variant='outlined' onClick={() => router.push('/apps/manage-trainer')}>
            Per-trainer commission
          </Button>
        </Stack>
      </AdminPageSection>

      <AdminPageSection title='How fees flow'>
        <Typography sx={{ fontSize: 13, color: ops.body, maxWidth: 900, lineHeight: 1.7 }}>
          Trainees pay session price + trainee platform fee + processing + tax. Coaches receive session
          price minus % commission minus coach platform fee. All amounts are editable below and apply to
          new bookings only — existing escrow holds keep their saved snapshot.
        </Typography>
      </AdminPageSection>
    </Stack>
  )
}
