import { useContext, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { usePricingConfig } from 'src/hooks/usePricingConfig'
import PricingDashboardTab from './components/PricingDashboardTab'
import PricingPromoSponsorTab from './components/PricingPromoSponsorTab'
import PricingRatesTab from './components/PricingRatesTab'
import PricingProfitCheckTab from './components/PricingProfitCheckTab'
import PricingHistoryTab from './components/PricingHistoryTab'
import PricingSurgeTab from './components/PricingSurgeTab'

const TAB_LABELS = ['Overview', 'Rates & fees', 'Surge & peak', 'Profit check', 'History']

const PricingPage = () => {
  const ability = useContext(AbilityContext)
  const canEdit = ability?.can('update', 'admin-action-pricing') ?? true
  const { confirm, ConfirmDialog } = useAdminConfirm()
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
    patchTaxRate,
    patchEscrowPolicy,
    patchGlobal
  } = usePricingConfig()

  const confirmReset = async () => {
    const ok = await confirm({
      title: 'Load default pricing?',
      message: 'All unsaved edits will be replaced with platform defaults.',
      confirmLabel: 'Load defaults',
      variant: 'danger'
    })
    if (!ok) return
    void resetToDefaults()
  }

  const confirmDiscard = async () => {
    const ok = await confirm({
      title: 'Discard unsaved changes?',
      message: 'Your edits on this page will be reverted to the last saved version.',
      confirmLabel: 'Discard',
      variant: 'warning'
    })
    if (!ok) return
    discard()
  }

  const confirmSave = async () => {
    const ok = await confirm({
      title: 'Save pricing changes?',
      message: 'New rates apply to future checkouts and sessions.',
      confirmLabel: 'Save',
      variant: 'warning'
    })
    if (!ok) return
    void save()
  }

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
        subtitle='Commission, platform fees, surge rules, and profit checks — saved config applies to all future checkouts.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            {canEdit ? (
              <>
                <Button variant='outlined' color='inherit' onClick={() => void confirmReset()} disabled={saving}>
                  Load defaults
                </Button>
                <Button variant='outlined' onClick={() => void confirmDiscard()} disabled={!isDirty || saving}>
                  Discard
                </Button>
                <Button variant='contained' onClick={() => void confirmSave()} disabled={!isDirty || saving}>
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

        <AdminTabs
          value={tab}
          onChange={setTab}
          tabs={TAB_LABELS.map((label, i) => ({ value: i, label }))}
          sx={{ mb: 3 }}
        />

        {tab === 0 ? (
          <Stack spacing={3}>
            <PricingDashboardTab config={config} onGoTab={setTab} />
            <PricingPromoSponsorTab />
          </Stack>
        ) : null}
        {tab === 1 ? (
          <PricingRatesTab
            config={config}
            canEdit={canEdit}
            onPatchRegion={patchRegion}
            onPatchPaymentMethod={patchPaymentMethod}
            onPatchStoragePlan={patchStoragePlan}
            onPatchProductFee={patchProductFee}
            onPatchGlobal={patchGlobal}
            onPatchTaxRate={patchTaxRate}
            onPatchEscrowPolicy={patchEscrowPolicy}
          />
        ) : null}
        {tab === 2 ? (
          <PricingSurgeTab
            config={config}
            canEdit={canEdit}
            onPatchGlobal={patchGlobal}
            isDirty={isDirty}
          />
        ) : null}
        {tab === 3 ? <PricingProfitCheckTab config={config} isDirty={isDirty} /> : null}
        {tab === 4 ? <PricingHistoryTab /> : null}
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
              <Button size='small' onClick={() => void confirmDiscard()} disabled={saving}>
                Discard
              </Button>
              <Button size='small' variant='contained' onClick={() => void confirmSave()} disabled={saving}>
                {saving ? 'Saving…' : 'Save now'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {ConfirmDialog}
    </>
  )
}

export default PricingPage
