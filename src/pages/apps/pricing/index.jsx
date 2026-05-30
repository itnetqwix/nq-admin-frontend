import { useContext, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { usePricingConfig } from 'src/hooks/usePricingConfig'
import PricingOverviewTab from './components/PricingOverviewTab'
import PricingRegionTab from './components/PricingRegionTab'
import PricingProductsTab from './components/PricingProductsTab'
import PricingSimulatorTab from './components/PricingSimulatorTab'
import PricingHistoryTab from './components/PricingHistoryTab'

const TAB_LABELS = ['Overview', 'United States', 'Canada', 'Session products', 'Quote simulator', 'History']

const PricingPage = () => {
  const ability = useContext(AbilityContext)
  const canEdit = ability?.can('update', 'admin-action-pricing') ?? true
  const [tab, setTab] = useState(0)

  const {
    config,
    loading,
    saving,
    isDirty,
    save,
    discard,
    resetToDefaults,
    patchRegion,
    patchProductFee,
    patchPaymentMethod,
    patchStoragePlan,
    patchGlobal
  } = usePricingConfig()

  if (loading || !config) {
    return (
      <AdminPageShell title='Pricing & fees' subtitle='Loading pricing configuration…'>
        <Typography color='text.secondary'>Loading…</Typography>
      </AdminPageShell>
    )
  }

  return (
    <>
      <AdminPageShell
        title='Pricing & fees'
        subtitle='Manage platform fees, commissions, Stripe processing rates, storage prices, and preview checkout totals for US & Canada.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {canEdit ? (
              <>
                <Button variant='outlined' color='inherit' onClick={() => void resetToDefaults()} disabled={saving}>
                  Load defaults
                </Button>
                <Button variant='outlined' onClick={discard} disabled={!isDirty || saving}>
                  Discard
                </Button>
                <Button variant='contained' onClick={() => void save()} disabled={!isDirty || saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </>
            ) : (
              <Chip label='View only' size='small' />
            )}
          </Stack>
        }
      >
        {isDirty ? (
          <Alert severity='warning' sx={{ mb: 2 }}>
            You have unsaved changes. Save before leaving this page, or use Discard to revert.
          </Alert>
        ) : null}

        <Box sx={{ mb: 2 }}>
          <TextField
            size='small'
            type='number'
            label='Quote tolerance (¢)'
            value={config.quoteToleranceMinor ?? 5}
            onChange={e => patchGlobal({ quoteToleranceMinor: Number(e.target.value) || 0 })}
            disabled={!canEdit}
            sx={{ width: 200 }}
            helperText='Max drift between quote and checkout'
          />
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {TAB_LABELS.map(label => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        {tab === 0 ? <PricingOverviewTab config={config} onGoTab={setTab} /> : null}
        {tab === 1 ? (
          <PricingRegionTab
            regionKey='US'
            title='United States'
            currency='USD'
            region={config.regions?.US}
            canEdit={canEdit}
            onPatchRegion={patchRegion}
            onPatchPaymentMethod={patchPaymentMethod}
            onPatchStoragePlan={patchStoragePlan}
          />
        ) : null}
        {tab === 2 ? (
          <PricingRegionTab
            regionKey='CA'
            title='Canada'
            currency='CAD'
            region={config.regions?.CA}
            canEdit={canEdit}
            onPatchRegion={patchRegion}
            onPatchPaymentMethod={patchPaymentMethod}
            onPatchStoragePlan={patchStoragePlan}
          />
        ) : null}
        {tab === 3 ? (
          <PricingProductsTab
            productFees={config.productFees}
            canEdit={canEdit}
            onPatchProductFee={patchProductFee}
          />
        ) : null}
        {tab === 4 ? <PricingSimulatorTab config={config} isDirty={isDirty} /> : null}
        {tab === 5 ? <PricingHistoryTab /> : null}
      </AdminPageShell>

      {isDirty && canEdit ? (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            py: 1.5,
            px: 3,
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Stack direction='row' alignItems='center' justifyContent='space-between' maxWidth={1680} mx='auto'>
            <Typography variant='body2' fontWeight={600}>
              Unsaved pricing changes
            </Typography>
            <Stack direction='row' spacing={1}>
              <Button size='small' onClick={discard} disabled={saving}>
                Discard
              </Button>
              <Button size='small' variant='contained' onClick={() => void save()} disabled={saving}>
                {saving ? 'Saving…' : 'Save now'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </>
  )
}

export default PricingPage
