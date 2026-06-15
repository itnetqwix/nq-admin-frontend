import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import PricingSimulatorTab from './PricingSimulatorTab'
import PricingUnitEconomicsTab from './PricingUnitEconomicsTab'

export default function PricingProfitCheckTab({ config, isDirty }) {
  return (
    <Stack spacing={4}>
      <AdminPageSection title='Step 1 — Preview one booking'>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Pick a region and session price. See what the trainee pays, what the coach receives, and what
          NetQwix keeps before infrastructure costs.
        </Typography>
        <PricingSimulatorTab config={config} isDirty={isDirty} variant='simple' />
      </AdminPageSection>

      <AdminPageSection title='Step 2 — Check profitability'>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Compare your rates against real session data and infrastructure costs. Adjust lessons per month
          if your volume differs from the default assumption.
        </Typography>
        <PricingUnitEconomicsTab config={config} isDirty={isDirty} />
      </AdminPageSection>
    </Stack>
  )
}
