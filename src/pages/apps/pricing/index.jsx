import { useContext, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AdminPageShell from 'src/layouts/components/AdminPageShell'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { usePricingConfig } from 'src/hooks/usePricingConfig'
import { ops } from 'src/styles/opsSurface'
import { formatDiffValue, pricingConfigDiff } from 'src/utils/pricingDiff'
import PricingDashboardTab from './components/PricingDashboardTab'
import PricingPromoSponsorTab from './components/PricingPromoSponsorTab'
import PricingRatesTab from './components/PricingRatesTab'
import PricingProfitCheckTab from './components/PricingProfitCheckTab'
import PricingHistoryTab from './components/PricingHistoryTab'
import PricingSurgeTab from './components/PricingSurgeTab'

const TAB_LABELS = ['Overview', 'Rates & fees', 'Surge & peak', 'Profit check', 'History']
const TAB_SLUGS = ['overview', 'rates', 'surge', 'profit', 'history']

const PricingPage = () => {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const fullAccess = ability?.can('manage', 'all') ?? false
  const canEdit = fullAccess || (ability?.can('update', 'admin-action-pricing') ?? false)
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (!router.isReady) return
    const slug = String(router.query.tab || '').toLowerCase()
    const idx = TAB_SLUGS.indexOf(slug)
    if (idx >= 0) setTab(idx)
  }, [router.isReady, router.query.tab])

  const syncTab = next => {
    setTab(next)
    void router.replace(
      { pathname: '/apps/pricing', query: { ...router.query, tab: TAB_SLUGS[next] || 'overview' } },
      undefined,
      { shallow: true }
    )
  }

  const {
    config,
    savedConfig,
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

  const dirtyDiff = useMemo(
    () => (isDirty && savedConfig && config ? pricingConfigDiff(savedConfig, config) : []),
    [isDirty, savedConfig, config]
  )

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
      detail:
        dirtyDiff.length > 0
          ? `${dirtyDiff.length} field(s) vs last publish:\n${dirtyDiff
              .slice(0, 12)
              .map(d => `${d.path}: ${formatDiffValue(d.from)} → ${formatDiffValue(d.to)}`)
              .join('\n')}${dirtyDiff.length > 12 ? `\n…and ${dirtyDiff.length - 12} more` : ''}`
          : '',
      confirmLabel: 'Save',
      variant: 'warning'
    })
    if (!ok) return
    void save()
  }

  if (loading || !config) {
    return (
      <AdminPageShell bare eyebrow='Revenue · pricing' icon='mdi:currency-usd' title='Pricing & fees.' subtitle='Loading…'>
        <Typography color='text.secondary'>Loading…</Typography>
      </AdminPageShell>
    )
  }

  return (
    <>
      <AdminPageShell
        bare
        eyebrow='Revenue · pricing'
        icon='mdi:currency-usd'
        title='Pricing & fees.'
        subtitle='Commission, platform fees, surge — saved config applies to future checkouts. Tabs sync to the URL.'
        actions={
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip component={Link} href='/apps/finance' label='Finance' clickable variant='outlined' size='small' />
            <Chip component={Link} href='/apps/promo-codes' label='Promos' clickable variant='outlined' size='small' />
            {canEdit ? (
              <>
                <Button variant='outlined' onClick={() => void confirmReset()} disabled={saving} sx={{ textTransform: 'none' }}>
                  Load defaults
                </Button>
                <Button variant='outlined' onClick={() => void confirmDiscard()} disabled={!isDirty || saving} sx={{ textTransform: 'none' }}>
                  Discard
                </Button>
                <Button
                  variant='contained'
                  onClick={() => void confirmSave()}
                  disabled={!isDirty || saving}
                  sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </>
            ) : (
              <Chip label='View only' size='small' sx={{ fontFamily: ops.mono }} />
            )}
          </Stack>
        }
      >
        {isDirty ? (
          <Alert severity='warning' sx={{ mb: 2 }}>
            You have unsaved changes
            {dirtyDiff.length ? ` (${dirtyDiff.length} field${dirtyDiff.length === 1 ? '' : 's'})` : ''}.
            Save before leaving, or Discard to revert.
            {dirtyDiff.length ? (
              <Box
                component='pre'
                sx={{
                  mt: 1,
                  mb: 0,
                  fontFamily: ops.mono,
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 120,
                  overflow: 'auto'
                }}
              >
                {dirtyDiff
                  .slice(0, 8)
                  .map(d => `${d.path}: ${formatDiffValue(d.from)} → ${formatDiffValue(d.to)}`)
                  .join('\n')}
                {dirtyDiff.length > 8 ? `\n…+${dirtyDiff.length - 8} more` : ''}
              </Box>
            ) : null}
          </Alert>
        ) : null}

        <AdminTabs
          value={tab}
          onChange={syncTab}
          tabs={TAB_LABELS.map((label, i) => ({ value: i, label }))}
          sx={{ mb: 3 }}
        />

        {tab === 0 ? (
          <Stack spacing={3}>
            <PricingDashboardTab config={config} onGoTab={syncTab} />
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
          <PricingSurgeTab config={config} canEdit={canEdit} onPatchGlobal={patchGlobal} isDirty={isDirty} />
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
            borderTop: `1px solid ${ops.hairline}`,
            bgcolor: ops.canvas
          }}
        >
          <Stack direction='row' alignItems='center' justifyContent='space-between' maxWidth={1680} mx='auto'>
            <Typography variant='body2' fontWeight={600}>
              Unsaved pricing changes
            </Typography>
            <Stack direction='row' spacing={1}>
              <Button size='small' onClick={() => void confirmDiscard()} disabled={saving} sx={{ textTransform: 'none' }}>
                Discard
              </Button>
              <Button
                size='small'
                variant='contained'
                onClick={() => void confirmSave()}
                disabled={saving}
                sx={{ textTransform: 'none', bgcolor: ops.ink }}
              >
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
