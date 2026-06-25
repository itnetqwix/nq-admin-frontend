import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  CA_PAYMENT_METHODS,
  US_PAYMENT_METHODS,
  STORAGE_PLAN_IDS,
  centsToInput,
  decimalToPctInput,
  decimalToTaxPctInput,
  inputToCents,
  pctInputToDecimal,
  taxPctInputToDecimal
} from 'src/constants/pricingAdmin'

export default function PricingRegionTab({
  regionKey,
  title,
  currency,
  region,
  canEdit = true,
  onPatchRegion,
  onPatchPaymentMethod,
  onPatchStoragePlan,
  onPatchTaxRate,
  /** core = commission & fees only; payments | storage | checkout | tax = single section */
  section = 'all'
}) {
  if (!region) return null

  const showCore = section === 'all' || section === 'core'
  const showCheckout = section === 'all' || section === 'checkout'
  const showTax = section === 'all' || section === 'tax'
  const showPayments = section === 'all' || section === 'payments'
  const showStorage = section === 'all' || section === 'storage'

  const paymentMethods = regionKey === 'CA' ? CA_PAYMENT_METHODS : US_PAYMENT_METHODS
  const currencySymbol = currency === 'CAD' ? 'C$' : '$'

  const pmRows = paymentMethods.map(m => {
    const fee = region.paymentMethodFees?.[m.id] || { bps: 0, fixedMinor: 0 }
    return {
      id: m.id,
      label: m.label,
      bps: fee.bps,
      fixedMinor: fee.fixedMinor,
      displayRate: `${(fee.bps / 100).toFixed(2)}% + ${currencySymbol}${(fee.fixedMinor / 100).toFixed(2)}`
    }
  })

  const pmCols = [
    { field: 'label', headerName: 'Payment method', flex: 1, minWidth: 180 },
    {
      field: 'bps',
      headerName: 'Rate (bps)',
      width: 120,
      editable: true,
      type: 'number'
    },
    {
      field: 'fixedMinor',
      headerName: 'Fixed (¢)',
      width: 110,
      editable: true,
      type: 'number'
    },
    { field: 'displayRate', headerName: 'Effective', width: 160 }
  ]

  const storageRows = STORAGE_PLAN_IDS.map(planId => {
    const plan = region.storagePlans?.[planId] || {}
    return {
      id: planId,
      label: plan.label || planId,
      monthlyMinor: plan.monthlyMinor ?? 0,
      yearlyMinor: plan.yearlyMinor ?? 0,
      quotaGb: plan.quotaBytes ? (plan.quotaBytes / (1024 ** 3)).toFixed(0) : '—'
    }
  })

  const storageCols = [
    { field: 'label', headerName: 'Plan', width: 120 },
    { field: 'quotaGb', headerName: 'Quota (GB)', width: 100 },
    {
      field: 'monthlyMinor',
      headerName: 'Monthly (¢)',
      width: 130,
      editable: true,
      type: 'number'
    },
    {
      field: 'yearlyMinor',
      headerName: 'Yearly (¢)',
      width: 130,
      editable: true,
      type: 'number'
    }
  ]

  return (
    <Stack spacing={0}>
      {showCore ? (
      <AdminPageSection title={section === 'core' ? undefined : `${title} — platform & commission`}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={`Trainee platform fee (${currencySymbol})`}
              type='number'
              inputProps={{ step: '0.01', min: 0 }}
              value={centsToInput(region.traineePlatformFeeMinor)}
              onChange={e =>
                onPatchRegion(regionKey, { traineePlatformFeeMinor: inputToCents(e.target.value) })
              }
              helperText='Added to trainee checkout'
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={`Coach platform fee (${currencySymbol})`}
              type='number'
              inputProps={{ step: '0.01', min: 0 }}
              value={centsToInput(region.trainerPlatformFeeMinor)}
              onChange={e =>
                onPatchRegion(regionKey, { trainerPlatformFeeMinor: inputToCents(e.target.value) })
              }
              helperText='Deducted from coach payout'
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label='Default commission (%)'
              type='number'
              inputProps={{ step: '0.1', min: 0, max: 100 }}
              value={decimalToPctInput(region.defaultCommissionRate)}
              onChange={e =>
                onPatchRegion(regionKey, { defaultCommissionRate: pctInputToDecimal(e.target.value) })
              }
              helperText='When coach has no override'
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label='Min commission floor (%)'
              type='number'
              inputProps={{ step: '0.1', min: 0, max: 100 }}
              value={decimalToPctInput(region.minCommissionRateFloor)}
              onChange={e =>
                onPatchRegion(regionKey, { minCommissionRateFloor: pctInputToDecimal(e.target.value) })
              }
              disabled={!canEdit}
            />
          </Grid>
        </Grid>
      </AdminPageSection>
      ) : null}

      {showCheckout ? (
      <AdminPageSection title={section === 'checkout' ? undefined : 'Checkout policy'}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!region.passProcessingFeeToTrainee}
                  onChange={e =>
                    onPatchRegion(regionKey, { passProcessingFeeToTrainee: e.target.checked })
                  }
                  disabled={!canEdit}
                />
              }
              label='Pass Stripe processing fee to trainee'
            />
            <Typography variant='caption' color='text.secondary' display='block' sx={{ ml: 4.5 }}>
              When off, platform absorbs processing from commission margin.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!region.stripeTaxEnabled}
                  onChange={e => onPatchRegion(regionKey, { stripeTaxEnabled: e.target.checked })}
                  disabled={!canEdit}
                />
              }
              label='Enable Stripe Tax (requires dashboard registration)'
            />
          </Grid>
        </Grid>
      </AdminPageSection>
      ) : null}

      {showTax ? (
      <AdminPageSection title={section === 'tax' ? undefined : 'Estimated sales tax rates'}>
        {region.stripeTaxEnabled ? (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Stripe Tax is enabled — rates below are ignored at checkout. Stripe calculates tax live.
          </Typography>
        ) : (
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Used when Stripe Tax is off. Edit state/province rates (as %). Applies to new quotes only.
          </Typography>
        )}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size='small'
              label='Default rate when state/province unknown (%)'
              type='number'
              inputProps={{ step: '0.001', min: 0, max: 30 }}
              value={decimalToTaxPctInput(
                region.defaultSalesTaxRate ??
                  region.salesTaxRates?.DEFAULT ??
                  (regionKey === 'CA' ? 0.13 : 0.08)
              )}
              onChange={e =>
                onPatchRegion(regionKey, {
                  defaultSalesTaxRate: taxPctInputToDecimal(e.target.value)
                })
              }
              disabled={!canEdit}
            />
          </Grid>
        </Grid>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight
            rows={Object.entries(region.salesTaxRates || {})
              .filter(([code]) => code !== 'DEFAULT')
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, rate]) => ({
                id: code,
                code,
                ratePct: Number(rate || 0) * 100,
                displayRate: `${(Number(rate || 0) * 100).toFixed(3)}%`
              }))}
            columns={[
              { field: 'code', headerName: regionKey === 'CA' ? 'Province' : 'State', width: 120 },
              {
                field: 'ratePct',
                headerName: 'Rate (%)',
                width: 130,
                editable: true,
                type: 'number'
              },
              { field: 'displayRate', headerName: 'Effective', width: 120 }
            ]}
            hideFooter
            isCellEditable={() => canEdit && !region.stripeTaxEnabled}
            processRowUpdate={newRow => {
              onPatchTaxRate(regionKey, newRow.code, taxPctInputToDecimal(newRow.ratePct))
              return {
                ...newRow,
                displayRate: `${Number(newRow.ratePct).toFixed(3)}%`
              }
            }}
            onProcessRowUpdateError={() => {}}
          />
        </AdminGridContainer>
      </AdminPageSection>
      ) : null}

      {showPayments ? (
      <AdminPageSection title={section === 'payments' ? undefined : 'Payment processing fees'}>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Edit rate (basis points) and fixed fee in cents. 290 bps = 2.9%.
        </Typography>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight
            rows={pmRows}
            columns={pmCols}
            hideFooter
            isCellEditable={() => canEdit}
            processRowUpdate={newRow => {
              onPatchPaymentMethod(regionKey, newRow.id, {
                bps: Number(newRow.bps) || 0,
                fixedMinor: Number(newRow.fixedMinor) || 0
              })
              return {
                ...newRow,
                displayRate: `${(Number(newRow.bps) / 100).toFixed(2)}% + ${currencySymbol}${(
                  Number(newRow.fixedMinor) / 100
                ).toFixed(2)}`
              }
            }}
            onProcessRowUpdateError={() => {}}
          />
        </AdminGridContainer>
      </AdminPageSection>
      ) : null}

      {showStorage ? (
      <AdminPageSection title={section === 'storage' ? undefined : 'Storage plan prices'}>
        <AdminGridContainer>
          <AdminDataGrid
            autoHeight
            rows={storageRows}
            columns={storageCols}
            hideFooter
            isCellEditable={() => canEdit}
            processRowUpdate={newRow => {
              onPatchStoragePlan(regionKey, newRow.id, {
                monthlyMinor: Number(newRow.monthlyMinor) || 0,
                yearlyMinor: Number(newRow.yearlyMinor) || 0
              })
              return newRow
            }}
            onProcessRowUpdateError={() => {}}
          />
        </AdminGridContainer>
      </AdminPageSection>
      ) : null}
    </Stack>
  )
}
