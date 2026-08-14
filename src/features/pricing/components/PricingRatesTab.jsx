import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'
import PricingRegionTab from './PricingRegionTab'
import PricingProductsTab from './PricingProductsTab'
import PricingFeeExplainer from './PricingFeeExplainer'
import PricingEscrowPolicyTab from './PricingEscrowPolicyTab'
import { PRICING_REGIONS } from 'src/constants/pricingAdmin'

export default function PricingRatesTab({
  config,
  canEdit,
  onPatchRegion,
  onPatchPaymentMethod,
  onPatchStoragePlan,
  onPatchProductFee,
  onPatchGlobal,
  onPatchTaxRate,
  onPatchEscrowPolicy
}) {
  const [region, setRegion] = useState('US')
  const regionMeta = PRICING_REGIONS.find(r => r.key === region) || PRICING_REGIONS[0]
  const title = regionMeta.label
  const currency = regionMeta.currency
  const regionData = config.regions?.[region]

  return (
    <Stack spacing={2.5}>
      <PricingFeeExplainer />

      <PricingEscrowPolicyTab
        policy={config.escrowPolicy}
        canEdit={canEdit}
        onPatch={onPatchEscrowPolicy}
      />

      <Alert severity='info' sx={{ borderRadius: ops.radiusSm }}>
        Start with <strong>commission %</strong> and the two <strong>platform fees</strong>. Everything else is
        optional — expand Advanced only when you need Stripe bps, storage plans, or per-product overrides.
      </Alert>

      <ToggleButtonGroup
        exclusive
        value={region}
        onChange={(_, v) => v && setRegion(v)}
        size='small'
        sx={{
          flexWrap: 'wrap',
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontFamily: ops.mono,
            fontSize: 12,
            borderColor: ops.hairline,
            '&.Mui-selected': { bgcolor: ops.ink, color: '#fff', '&:hover': { bgcolor: '#000' } }
          }
        }}
      >
        {PRICING_REGIONS.map(r => (
          <ToggleButton key={r.key} value={r.key}>
            {r.label} ({r.currency})
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          {title} — core rates.
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
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
          onPatchTaxRate={onPatchTaxRate}
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
          onPatchTaxRate={onPatchTaxRate}
        />
        <PricingRegionTab
          regionKey={region}
          title={title}
          currency={currency}
          region={regionData}
          canEdit={canEdit}
          section='tax'
          onPatchRegion={onPatchRegion}
          onPatchPaymentMethod={onPatchPaymentMethod}
          onPatchStoragePlan={onPatchStoragePlan}
          onPatchTaxRate={onPatchTaxRate}
        />
      </OpsSurfaceCard>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Advanced — {title} payment & storage</Typography>
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

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Advanced — product fees & quote tolerance</Typography>
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
