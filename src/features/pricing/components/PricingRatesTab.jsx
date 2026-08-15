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
import PricingEscrowPolicyTab from './PricingEscrowPolicyTab'
import PricingLessonSplit from './PricingLessonSplit'
import { PRICING_REGIONS } from 'src/constants/pricingAdmin'

export default function PricingRatesTab({
  config,
  canEdit,
  isDirty,
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

      <Alert severity='info' sx={{ borderRadius: ops.radiusSm }}>
        Do this in order: <strong>1)</strong> set commission and the two fees for this region.{' '}
        <strong>2)</strong> confirm the $60 lesson.{' '}
        <strong>3)</strong> checkout/tax only if you need them.{' '}
        <strong>4)</strong> escrow is when the coach is paid, not how much. Save at the top — website and app
        use the next quote.
      </Alert>

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          1 · {title} commission & platform fees
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Applied to every new booking in {title}. Coaches with a custom rate in Manage trainers keep their
          override. Floor stops anyone going below the minimum %.
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
      </OpsSurfaceCard>

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          2 · Same $60 lesson, live
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Flip 15 / 30 min. This is a preview — nobody is charged. Profit check adds AWS/video on top of
          these numbers.
        </Typography>
        <PricingLessonSplit
          config={config}
          isDirty={isDirty}
          canEdit={false}
          lockedRegion={region}
          compact
          showCommissionControls={false}
        />
      </OpsSurfaceCard>

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          3 · Checkout & tax
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Processing can sit on the enthusiast or come out of your margin. Tax rates below are ignored if
          Stripe Tax is on.
        </Typography>
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

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          4 · When the coach is paid
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Not the take-rate. After a completed lesson: both ratings or 7 days, then this clearance wait.
          Earnings go to the NetQwix wallet — bank payouts are off.
        </Typography>
        <PricingEscrowPolicyTab
          policy={config.escrowPolicy}
          canEdit={canEdit}
          onPatch={onPatchEscrowPolicy}
        />
      </OpsSurfaceCard>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>5 · Advanced — {title} payment & storage</Typography>
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
          <Typography sx={{ fontWeight: 600 }}>6 · Advanced — product fees & quote tolerance</Typography>
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
