import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PricingRegionTab from './PricingRegionTab'
import PricingProductsTab from './PricingProductsTab'
import PricingFeeExplainer from './PricingFeeExplainer'

export default function PricingRatesTab({
  config,
  canEdit,
  onPatchRegion,
  onPatchPaymentMethod,
  onPatchStoragePlan,
  onPatchProductFee,
  onPatchGlobal
}) {
  const [region, setRegion] = useState('US')
  const title = region === 'CA' ? 'Canada' : 'United States'
  const currency = region === 'CA' ? 'CAD' : 'USD'
  const regionData = config.regions?.[region]

  return (
    <Stack spacing={3}>
      <PricingFeeExplainer />

      <Alert severity='info'>
        Start with <strong>commission %</strong> and the two <strong>platform fees</strong>. Everything
        else is optional — expand Advanced only when you need Stripe bps, storage plans, or per-product
        overrides.
      </Alert>

      <ToggleButtonGroup
        exclusive
        value={region}
        onChange={(_, v) => v && setRegion(v)}
        size='small'
        color='primary'
      >
        <ToggleButton value='US'>United States (USD)</ToggleButton>
        <ToggleButton value='CA'>Canada (CAD)</ToggleButton>
      </ToggleButtonGroup>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            {title} — core rates
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Applied to every new booking in {title}. Coaches with a custom commission keep their override.
          </Typography>
          <PricingRegionTab
            regionKey={region}
            title={title}
            currency={currency}
            region={regionData}
            canEdit={canEdit}
            section='core'
            onPatchRegion={onPatchRegion}
            onPatchPaymentMethod={onPatchPaymentMethod}
            onPatchStoragePlan={onPatchStoragePlan}
          />
          <PricingRegionTab
            regionKey={region}
            title={title}
            currency={currency}
            region={regionData}
            canEdit={canEdit}
            section='checkout'
            onPatchRegion={onPatchRegion}
            onPatchPaymentMethod={onPatchPaymentMethod}
            onPatchStoragePlan={onPatchStoragePlan}
          />
        </CardContent>
      </Card>

      <Accordion disableGutters variant='outlined'>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Advanced — {title} payment & storage</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PricingRegionTab
            regionKey={region}
            title={title}
            currency={currency}
            region={regionData}
            canEdit={canEdit}
            section='payments'
            onPatchRegion={onPatchRegion}
            onPatchPaymentMethod={onPatchPaymentMethod}
            onPatchStoragePlan={onPatchStoragePlan}
          />
          <PricingRegionTab
            regionKey={region}
            title={title}
            currency={currency}
            region={regionData}
            canEdit={canEdit}
            section='storage'
            onPatchRegion={onPatchRegion}
            onPatchPaymentMethod={onPatchPaymentMethod}
            onPatchStoragePlan={onPatchStoragePlan}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters variant='outlined'>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>Advanced — product fees & quote tolerance</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <PricingProductsTab
              productFees={config.productFees}
              canEdit={canEdit}
              onPatchProductFee={onPatchProductFee}
              hideTitle
            />
            <TextField
              size='small'
              type='number'
              label='Quote tolerance (¢)'
              value={config.quoteToleranceMinor ?? 5}
              onChange={e => onPatchGlobal({ quoteToleranceMinor: Number(e.target.value) || 0 })}
              disabled={!canEdit}
              sx={{ maxWidth: 280 }}
              helperText='Max allowed drift between checkout quote preview and final charge'
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}
