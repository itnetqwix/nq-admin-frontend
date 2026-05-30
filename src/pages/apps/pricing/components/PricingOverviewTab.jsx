import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useRouter } from 'next/router'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { fmtMoney, fmtPct } from 'src/constants/pricingAdmin'

function SummaryCard({ title, subtitle, children, action }) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
          <Box>
            <Typography variant='subtitle2' color='text.secondary'>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Stack>
        <Box sx={{ mt: 2 }}>{children}</Box>
      </CardContent>
    </Card>
  )
}

export default function PricingOverviewTab({ config, onGoTab }) {
  const router = useRouter()
  const us = config?.regions?.US
  const ca = config?.regions?.CA

  return (
    <Stack spacing={3}>
      <AdminPageSection title='At a glance'>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <SummaryCard title='Config version' subtitle='Active pricing snapshot'>
              <Typography variant='h4' fontWeight={700}>
                v{config?.version ?? 1}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Quote tolerance: {config?.quoteToleranceMinor ?? 5}¢
              </Typography>
            </SummaryCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title='United States'
              subtitle='USD checkout'
              action={<Chip size='small' label='US' color='primary' variant='outlined' />}
            >
              <Typography variant='body2'>
                Trainee platform fee: <strong>{fmtMoney(us?.traineePlatformFeeMinor, 'USD')}</strong>
              </Typography>
              <Typography variant='body2'>
                Coach platform fee: <strong>{fmtMoney(us?.trainerPlatformFeeMinor, 'USD')}</strong>
              </Typography>
              <Typography variant='body2'>
                Default commission: <strong>{fmtPct(us?.defaultCommissionRate)}</strong>
              </Typography>
              <Button size='small' sx={{ mt: 1.5 }} onClick={() => onGoTab(1)}>
                Edit US settings
              </Button>
            </SummaryCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title='Canada'
              subtitle='CAD checkout'
              action={<Chip size='small' label='CA' color='secondary' variant='outlined' />}
            >
              <Typography variant='body2'>
                Trainee platform fee: <strong>{fmtMoney(ca?.traineePlatformFeeMinor, 'CAD')}</strong>
              </Typography>
              <Typography variant='body2'>
                Coach platform fee: <strong>{fmtMoney(ca?.trainerPlatformFeeMinor, 'CAD')}</strong>
              </Typography>
              <Typography variant='body2'>
                Default commission: <strong>{fmtPct(ca?.defaultCommissionRate)}</strong>
              </Typography>
              <Button size='small' sx={{ mt: 1.5 }} onClick={() => onGoTab(2)}>
                Edit Canada settings
              </Button>
            </SummaryCard>
          </Grid>
        </Grid>
      </AdminPageSection>

      <AdminPageSection title='Quick actions'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap='wrap'>
          <Button variant='outlined' onClick={() => onGoTab(4)}>
            Open quote simulator
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(3)}>
            Edit session product fees
          </Button>
          <Button variant='outlined' onClick={() => onGoTab(5)}>
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
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 900, lineHeight: 1.7 }}>
          Trainees pay session price + trainee platform fee + processing + tax. Coaches receive session
          price minus % commission minus coach platform fee. All amounts are editable below and apply to
          new bookings only — existing escrow holds keep their saved snapshot.
        </Typography>
      </AdminPageSection>
    </Stack>
  )
}
