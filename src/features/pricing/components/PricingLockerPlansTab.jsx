import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { PRICING_REGIONS, STORAGE_PLAN_IDS, centsToInput, inputToCents } from 'src/constants/pricingAdmin'
import AdminPageSection from 'src/components/admin/AdminPageSection'

const MB = 1024 * 1024
const GB = 1024 * MB

const ENTITLEMENT_FIELDS = [
  { key: 'recordingEnabled', label: 'Recording enabled', type: 'bool', role: 'trainee', enforced: true },
  { key: 'recordingMaxLongEdge', label: 'Recording max long edge (px)', type: 'number', role: 'trainee', enforced: true },
  { key: 'maxClipFileBytes', label: 'Max clip (trainee, MB)', type: 'mb', role: 'trainee', enforced: true },
  { key: 'maxClipFileBytesTrainer', label: 'Max clip (expert, MB)', type: 'mb', role: 'trainer', enforced: true },
  { key: 'friendShareDailyLimit', label: 'Friend shares / day (0=∞)', type: 'number', role: 'both', enforced: true },
  { key: 'emailShareDailyLimit', label: 'Email shares / day (0=∞)', type: 'number', role: 'both', enforced: true },
  { key: 'gamePlanPdfDownloadEnabled', label: 'Download Game Plan PDF', type: 'bool', role: 'trainee', enforced: true },
  { key: 'recordingDownloadEnabled', label: 'Download recordings', type: 'bool', role: 'trainee', enforced: true },
  { key: 'recordingDownloadMaxLongEdge', label: 'Download max long edge', type: 'number', role: 'trainee', enforced: true },
  { key: 'sharableRecordingEnabled', label: 'Share session recording', type: 'bool', role: 'trainee', enforced: true },
  { key: 'sharableRecordingExpiryDays', label: 'Share link expiry (days)', type: 'number', role: 'trainee', enforced: false },
  { key: 'gamePlanHistoryLimit', label: 'Game Plan history (0=∞)', type: 'number', role: 'both', enforced: true },
  { key: 'toolsPack', label: 'Tools pack', type: 'select', options: ['basic', 'standard', 'pro', 'max'], role: 'both', enforced: true },
  { key: 'analyticsLevel', label: 'Analytics level', type: 'select', options: ['basic', 'standard', 'advanced', 'full'], role: 'trainer', enforced: true },
  { key: 'featuredByNetqwix', label: 'Featured by NetQwix', type: 'bool', role: 'trainer', enforced: true },
  { key: 'listingBoost', label: 'Listing boost', type: 'number', role: 'trainer', enforced: true },
  { key: 'instantPriorityBoost', label: 'Instant priority boost', type: 'number', role: 'both', enforced: true },
  { key: 'sessionExtensionDiscountBps', label: 'Extension discount (bps)', type: 'number', role: 'trainee', enforced: true },
  { key: 'traineePlatformFeeDiscountBps', label: 'Trainee fee discount (bps)', type: 'number', role: 'trainee', enforced: true },
  { key: 'trainerCommissionDiscountBps', label: 'Commission discount (bps)', type: 'number', role: 'trainer', enforced: true },
  { key: 'payoutFeeDiscountBps', label: 'Payout fee discount (bps)', type: 'number', role: 'trainer', enforced: true },
  { key: 'walletTopUpBonusBps', label: 'Wallet top-up bonus (bps)', type: 'number', role: 'both', enforced: true },
  { key: 'pointsMultiplierBps', label: 'Points multiplier (bps)', type: 'number', role: 'both', enforced: true },
  { key: 'brandedGamePlanPdf', label: 'Branded Game Plan PDF', type: 'bool', role: 'trainer', enforced: true },
  { key: 'maxPortfolioMedia', label: 'Portfolio media slots', type: 'number', role: 'trainer', enforced: true },
  { key: 'recordingMarketedForTrainer', label: 'Market recording to experts', type: 'bool', role: 'trainer', enforced: false }
]

function readEnt(plan, key, fallback) {
  const e = plan?.entitlements || {}
  if (e[key] != null) return e[key]
  return fallback
}

export default function PricingLockerPlansTab({
  config,
  canEdit,
  onPatchStoragePlan
}) {
  const [regionKey, setRegionKey] = useState('US')
  const [planId, setPlanId] = useState('plus_5gb')
  const region = config?.regions?.[regionKey] || {}
  const plan = region.storagePlans?.[planId] || {}
  const currency = region.currency || 'USD'

  const patchEnt = (key, value) => {
    const next = { ...(plan.entitlements || {}), [key]: value }
    onPatchStoragePlan(regionKey, planId, { entitlements: next })
  }

  const patchMarketing = (role, text) => {
    const lines = String(text || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    const marketing = {
      trainee: plan.marketing?.trainee || [],
      trainer: plan.marketing?.trainer || [],
      [role]: lines
    }
    onPatchStoragePlan(regionKey, planId, { marketing })
  }

  const fields = useMemo(
    () => ENTITLEMENT_FIELDS.filter(f => f.role === 'both' || f.role === 'trainee' || f.role === 'trainer'),
    []
  )

  return (
    <Stack spacing={3}>
      <AdminPageSection title='Locker plans (entitlements)'>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Edit catalog prices/quotas and typed entitlements per region. Enforced fields
          affect live quotes, payouts, points, discovery ranking, and locker gates.
          Flag fields are stored for marketing / future tooling.
        </Typography>
        <Typography
          variant='body2'
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'warning.50',
            border: '1px solid',
            borderColor: 'warning.light',
            color: 'text.primary',
          }}
        >
          Changes apply to live quotes and gates only after you click <strong>Save</strong> on
          the Pricing page. Code defaults do not overwrite Mongo until Save or Reset defaults.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label='Region'
            size='small'
            value={regionKey}
            onChange={e => setRegionKey(e.target.value)}
            sx={{ minWidth: 160 }}
            disabled={!canEdit && false}
          >
            {PRICING_REGIONS.map(r => (
              <MenuItem key={r.key} value={r.key}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label='Plan'
            size='small'
            value={planId}
            onChange={e => setPlanId(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {STORAGE_PLAN_IDS.map(id => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label='Label'
            size='small'
            fullWidth
            value={plan.label || ''}
            disabled={!canEdit}
            onChange={e => onPatchStoragePlan(regionKey, planId, { label: e.target.value })}
          />
          <TextField
            label='Quota (GB)'
            size='small'
            type='number'
            fullWidth
            value={plan.quotaBytes ? Number((plan.quotaBytes / GB).toFixed(2)) : 0}
            disabled={!canEdit}
            onChange={e =>
              onPatchStoragePlan(regionKey, planId, {
                quotaBytes: Math.round(Number(e.target.value || 0) * GB)
              })
            }
          />
          <TextField
            label={`Monthly (${currency})`}
            size='small'
            type='number'
            fullWidth
            value={centsToInput(plan.monthlyMinor)}
            disabled={!canEdit}
            onChange={e =>
              onPatchStoragePlan(regionKey, planId, {
                monthlyMinor: inputToCents(e.target.value)
              })
            }
          />
          <TextField
            label={`Yearly (${currency})`}
            size='small'
            type='number'
            fullWidth
            value={centsToInput(plan.yearlyMinor)}
            disabled={!canEdit}
            onChange={e =>
              onPatchStoragePlan(regionKey, planId, {
                yearlyMinor: inputToCents(e.target.value)
              })
            }
          />
        </Stack>

        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Entitlements
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 1.5
          }}
        >
          {fields.map(f => {
            const raw = readEnt(plan, f.key, f.type === 'bool' ? false : f.type === 'select' ? f.options[0] : 0)
            const badge = (
              <Chip
                size='small'
                label={f.enforced ? 'Enforced' : 'Flag'}
                color={f.enforced ? 'success' : 'default'}
                sx={{ ml: 1, height: 20 }}
              />
            )
            if (f.type === 'bool') {
              return (
                <FormControlLabel
                  key={f.key}
                  control={
                    <Checkbox
                      checked={!!raw}
                      disabled={!canEdit}
                      onChange={e => patchEnt(f.key, e.target.checked)}
                    />
                  }
                  label={
                    <span>
                      {f.label}
                      {badge}
                    </span>
                  }
                />
              )
            }
            if (f.type === 'select') {
              return (
                <TextField
                  key={f.key}
                  select
                  size='small'
                  label={f.label}
                  value={raw}
                  disabled={!canEdit}
                  onChange={e => patchEnt(f.key, e.target.value)}
                  helperText={f.enforced ? 'Enforced' : 'Flag / Phase 3'}
                >
                  {f.options.map(o => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              )
            }
            if (f.type === 'mb') {
              const mbVal = Math.round(Number(raw || 0) / MB)
              return (
                <TextField
                  key={f.key}
                  size='small'
                  type='number'
                  label={f.label}
                  value={mbVal}
                  disabled={!canEdit}
                  onChange={e => patchEnt(f.key, Math.round(Number(e.target.value || 0) * MB))}
                  helperText={f.enforced ? 'Enforced' : 'Flag'}
                />
              )
            }
            return (
              <TextField
                key={f.key}
                size='small'
                type='number'
                label={f.label}
                value={Number(raw) || 0}
                disabled={!canEdit}
                onChange={e => patchEnt(f.key, Number(e.target.value || 0))}
                helperText={f.enforced ? 'Enforced' : 'Flag / Phase 3'}
              />
            )
          })}
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <TextField
            label='Enthusiast marketing bullets (one per line)'
            multiline
            minRows={4}
            fullWidth
            disabled={!canEdit}
            value={(plan.marketing?.trainee || []).join('\n')}
            onChange={e => patchMarketing('trainee', e.target.value)}
          />
          <TextField
            label='Expert marketing bullets (one per line)'
            multiline
            minRows={4}
            fullWidth
            disabled={!canEdit}
            value={(plan.marketing?.trainer || []).join('\n')}
            onChange={e => patchMarketing('trainer', e.target.value)}
          />
        </Stack>
      </AdminPageSection>
    </Stack>
  )
}
