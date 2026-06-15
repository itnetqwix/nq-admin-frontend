import { useContext, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { usePricingConfig } from 'src/hooks/usePricingConfig'
import PricingDashboardTab from './components/PricingDashboardTab'
import PricingRatesTab from './components/PricingRatesTab'
import PricingProfitCheckTab from './components/PricingProfitCheckTab'
import PricingHistoryTab from './components/PricingHistoryTab'

const TAB_LABELS = ['Overview', 'Rates & fees', 'Profit check', 'History']

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
        subtitle='Set commission and platform fees, preview checkout totals, and confirm each lesson is profitable.'
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

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {TAB_LABELS.map(label => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>

        {tab === 0 ? <PricingDashboardTab config={config} onGoTab={setTab} /> : null}
        {tab === 1 ? (
          <PricingRatesTab
            config={config}
            canEdit={canEdit}
            onPatchRegion={patchRegion}
            onPatchPaymentMethod={patchPaymentMethod}
            onPatchStoragePlan={patchStoragePlan}
            onPatchProductFee={patchProductFee}
            onPatchGlobal={patchGlobal}
          />
        ) : null}
        {tab === 2 ? <PricingProfitCheckTab config={config} isDirty={isDirty} /> : null}
        {tab === 3 ? <PricingHistoryTab /> : null}
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
