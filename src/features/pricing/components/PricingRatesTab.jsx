import { useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
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
import { PRICING_REGIONS, PAYOUT_PROCESSING_FEES, fmtMoney, fmtPct, withdrawalSettlement } from 'src/constants/pricingAdmin'

function TapeLine({ label, value, mute, strong }) {
  return (
    <Stack direction='row' justifyContent='space-between' gap={2}>
      <Typography sx={{ color: mute ? ops.onNightMuted : ops.onNight, fontSize: 12 }}>{label}</Typography>
      <Typography sx={{ color: ops.onNight, fontSize: 12, fontWeight: strong ? 700 : 500 }}>{value}</Typography>
    </Stack>
  )
}

function SettlementTape({ region, regionKey, currency }) {
  const commissionRate = Number(region?.defaultCommissionRate || 0)
  const lesson = 6000
  const commission = Math.round(lesson * commissionRate)
  const coachWallet = lesson - commission
  const wdExample = 10000
  const payoutFee = PAYOUT_PROCESSING_FEES[regionKey] || PAYOUT_PROCESSING_FEES.US
  const wd = withdrawalSettlement(wdExample, payoutFee.fixedMinor, payoutFee.bps)

  return (
    <Box
      sx={{
        fontFamily: ops.mono,
        bgcolor: ops.night,
        color: ops.onNight,
        borderRadius: ops.radiusMd,
        p: 2.25,
        backgroundImage: `linear-gradient(180deg, ${ops.nightLift} 0%, ${ops.night} 100%)`
      }}
    >
      <Typography sx={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ops.lime, mb: 1.5 }}>
        Settlement tape · {currency}
      </Typography>
      <Stack spacing={0.75}>
        <TapeLine label='$60 lesson' value={fmtMoney(lesson, currency)} />
        <TapeLine label={`Commission ${fmtPct(commissionRate)}`} value={`−${fmtMoney(commission, currency)}`} mute />
        <TapeLine label='Coach wallet' value={fmtMoney(coachWallet, currency)} strong />
        <Box sx={{ borderTop: `1px dashed ${ops.onNightMuted}`, my: 1 }} />
        <TapeLine label='$100 cash-out' value={fmtMoney(wdExample, currency)} />
        <TapeLine
          label='Payout processing'
          value={wd.feeMinor ? `−${fmtMoney(wd.feeMinor, currency)}` : 'none'}
          mute
        />
        <TapeLine label='Tax on withdrawal' value='none' mute />
        <TapeLine label='Coach receives' value={fmtMoney(wd.netMinor, currency)} strong />
      </Stack>
    </Box>
  )
}

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

      <SettlementTape region={regionData} regionKey={region} currency={currency} />

      <OpsSurfaceCard>
        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
          Configure · {title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Lesson fees hit the enthusiast at checkout. Cash-out processing is taken from the amount the coach withdraws — not a separate Admin rate.
          Custom coach commission in Manage trainers still wins, down to the floor.
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
          Preview · $60 lesson
        </Typography>
        <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
          Nobody is charged. Profit check adds AWS/video on top.
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

      <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' }, border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusMd }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Checkout, tax, and when the coach is paid</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
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
            <PricingEscrowPolicyTab policy={config.escrowPolicy} canEdit={canEdit} onPatch={onPatchEscrowPolicy} />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' }, border: `1px solid ${ops.hairline}`, borderRadius: ops.radiusMd }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Advanced · cards, storage, per-product fees</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
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
              helperText='Allowed drift between checkout preview and final charge'
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}
