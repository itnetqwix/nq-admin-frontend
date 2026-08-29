import { useMemo, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { PRICING_REGIONS, STORAGE_PLAN_IDS, centsToInput, inputToCents } from 'src/constants/pricingAdmin'
import {
  bpsToMultiplier,
  bpsToPercent,
  lockerPlanLabel,
  multiplierToBps,
  percentToBps
} from 'src/constants/revenueAdmin'
import AdminPageSection from 'src/components/admin/AdminPageSection'

const MB = 1024 * 1024
const GB = 1024 * MB

const ENTITLEMENT_GROUPS = [
  {
    id: 'recording',
    title: 'Recording & clips',
    fields: [
      { key: 'recordingEnabled', label: 'Recording enabled', type: 'bool', role: 'trainee', enforced: true },
      { key: 'recordingMaxLongEdge', label: 'Recording max long edge (px)', type: 'number', role: 'trainee', enforced: true },
      { key: 'recordingDownloadEnabled', label: 'Download recordings', type: 'bool', role: 'trainee', enforced: true },
      { key: 'recordingDownloadMaxLongEdge', label: 'Download max long edge', type: 'number', role: 'trainee', enforced: true },
      { key: 'maxClipFileBytes', label: 'Max clip (trainee, MB)', type: 'mb', role: 'trainee', enforced: true },
      { key: 'maxClipFileBytesTrainer', label: 'Max clip (expert, MB)', type: 'mb', role: 'trainer', enforced: true },
      { key: 'recordingMarketedForTrainer', label: 'Market recording to experts', type: 'bool', role: 'trainer', enforced: false }
    ]
  },
  {
    id: 'sharing',
    title: 'Sharing & Game Plans',
    fields: [
      { key: 'sharableRecordingEnabled', label: 'Share session recording', type: 'bool', role: 'trainee', enforced: true },
      { key: 'sharableRecordingExpiryDays', label: 'Share link expiry (days)', type: 'number', role: 'trainee', enforced: true },
      { key: 'friendShareDailyLimit', label: 'Friend shares / day (0=∞)', type: 'number', role: 'both', enforced: true },
      { key: 'emailShareDailyLimit', label: 'Email shares / day (0=∞)', type: 'number', role: 'both', enforced: true },
      { key: 'gamePlanPdfDownloadEnabled', label: 'Download Game Plan PDF', type: 'bool', role: 'trainee', enforced: true },
      { key: 'gamePlanHistoryLimit', label: 'Game Plan history (0=∞)', type: 'number', role: 'both', enforced: true },
      { key: 'brandedGamePlanPdf', label: 'Branded Game Plan PDF', type: 'bool', role: 'trainer', enforced: true }
    ]
  },
  {
    id: 'money',
    title: 'Money perks',
    fields: [
      { key: 'sessionExtensionDiscountBps', label: 'Extension discount (%)', type: 'extension_percent', role: 'trainee', enforced: true },
      { key: 'traineePlatformFeeDiscountBps', label: 'Trainee platform fee discount (%)', type: 'bps_percent', role: 'trainee', enforced: true },
      { key: 'trainerCommissionDiscountBps', label: 'Commission discount (%)', type: 'bps_percent', role: 'trainer', enforced: true },
      { key: 'payoutFeeDiscountBps', label: 'Payout fee discount (%)', type: 'bps_percent', role: 'trainer', enforced: true },
      { key: 'walletTopUpBonusBps', label: 'Wallet top-up bonus (%)', type: 'bps_percent', role: 'both', enforced: true },
      { key: 'pointsMultiplierBps', label: 'Points multiplier (×)', type: 'bps_multiplier', role: 'both', enforced: true }
    ]
  },
  {
    id: 'discovery',
    title: 'Discovery & tools',
    fields: [
      { key: 'toolsPack', label: 'Tools pack (client nav gate)', type: 'select', options: ['basic', 'standard', 'pro', 'max'], role: 'both', enforced: false },
      { key: 'analyticsLevel', label: 'Analytics level', type: 'select', options: ['basic', 'standard', 'advanced', 'full'], role: 'trainer', enforced: true },
      { key: 'featuredByNetqwix', label: 'Featured by NetQwix', type: 'bool', role: 'trainer', enforced: true },
      { key: 'listingBoost', label: 'Listing boost', type: 'number', role: 'trainer', enforced: true },
      { key: 'instantPriorityBoost', label: 'Instant priority boost', type: 'number', role: 'both', enforced: true },
      { key: 'maxPortfolioMedia', label: 'Portfolio media slots', type: 'number', role: 'trainer', enforced: true }
    ]
  }
]

function readEnt(plan, key, fallback) {
  const e = plan?.entitlements || {}
  if (e[key] != null) return e[key]
  return fallback
}

function formatQuotaGb(quotaBytes) {
  const gb = Number(quotaBytes || 0) / GB
  if (gb >= 1024) return `${(gb / 1024).toFixed(gb >= 10240 ? 0 : 1)} TB`
  return `${gb >= 10 ? Math.round(gb) : gb.toFixed(1)} GB`
}

function recordingLabelFromLongEdge(px) {
  const long = Math.max(0, Math.round(Number(px) || 0))
  if (long <= 0) return '—'
  if (long <= 360) return '360p'
  if (long <= 720) return '720p'
  if (long <= 1080) return '1080p'
  return '2K'
}

function extensionPercentFromBps(bps) {
  return bpsToPercent(bps)
}

function entitlementPreview(plan) {
  const ent = plan?.entitlements || {}
  const quota = formatQuotaGb(plan?.quotaBytes)
  const recEnabled = !!ent.recordingEnabled
  const rec = recEnabled ? recordingLabelFromLongEdge(ent.recordingMaxLongEdge) : '—'
  const extensionPct = extensionPercentFromBps(ent.sessionExtensionDiscountBps)
  return { quota, rec, recEnabled, extensionPct }
}

function compareRow(region, planId) {
  const plan = region?.storagePlans?.[planId] || {}
  const p = entitlementPreview(plan)
  return {
    planId,
    label: lockerPlanLabel(planId),
    price: plan.monthlyMinor != null ? `$${(plan.monthlyMinor / 100).toFixed(2)}` : '—',
    storage: p.quota,
    recording: p.recEnabled ? p.rec : 'Off',
    extension: p.extensionPct > 0 ? `${p.extensionPct}%` : '—'
  }
}

function EntitlementField({ field, plan, canEdit, patchEnt }) {
  const raw = readEnt(plan, field.key, field.type === 'bool' ? false : field.type === 'select' ? field.options[0] : 0)
  const badge = (
    <Chip
      size='small'
      label={field.enforced ? 'Enforced' : 'Flag'}
      color={field.enforced ? 'success' : 'default'}
      sx={{ ml: 1, height: 20 }}
    />
  )

  if (field.type === 'bool') {
    return (
      <FormControlLabel
        control={
          <Checkbox checked={!!raw} disabled={!canEdit} onChange={e => patchEnt(field.key, e.target.checked)} />
        }
        label={
          <span>
            {field.label}
            {badge}
          </span>
        }
      />
    )
  }
  if (field.type === 'select') {
    return (
      <TextField
        select
        size='small'
        fullWidth
        label={field.label}
        value={raw}
        disabled={!canEdit}
        onChange={e => patchEnt(field.key, e.target.value)}
        helperText={field.enforced ? 'Enforced' : 'Flag / Phase 3'}
      >
        {field.options.map(o => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </TextField>
    )
  }
  if (field.type === 'mb') {
    const mbVal = Math.round(Number(raw || 0) / MB)
    return (
      <TextField
        size='small'
        fullWidth
        type='number'
        label={field.label}
        value={mbVal}
        disabled={!canEdit}
        onChange={e => patchEnt(field.key, Math.round(Number(e.target.value || 0) * MB))}
        helperText={field.enforced ? 'Enforced' : 'Flag'}
      />
    )
  }
  if (field.type === 'extension_percent' || field.type === 'bps_percent') {
    const pct = extensionPercentFromBps(raw)
    return (
      <TextField
        size='small'
        fullWidth
        type='number'
        label={field.label}
        value={pct}
        disabled={!canEdit}
        inputProps={{ min: 0, max: 100, step: 1 }}
        onChange={e => patchEnt(field.key, percentToBps(e.target.value))}
        helperText={
          field.type === 'extension_percent'
            ? 'Auto at live extension checkout (best-of vs promo)'
            : 'Enforced · stored as bps'
        }
      />
    )
  }
  if (field.type === 'bps_multiplier') {
    return (
      <TextField
        size='small'
        fullWidth
        type='number'
        label={field.label}
        value={bpsToMultiplier(raw)}
        disabled={!canEdit}
        inputProps={{ min: 0, step: 0.05 }}
        onChange={e => patchEnt(field.key, multiplierToBps(e.target.value))}
        helperText='1.00 = baseline · 1.25 = +25% points'
      />
    )
  }
  return (
    <TextField
      size='small'
      fullWidth
      type='number'
      label={field.label}
      value={Number(raw) || 0}
      disabled={!canEdit}
      onChange={e => patchEnt(field.key, Number(e.target.value || 0))}
      helperText={field.enforced ? 'Enforced' : 'Flag / Phase 3'}
    />
  )
}

export default function PricingLockerPlansTab({ config, canEdit, onPatchStoragePlan }) {
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

  const preview = useMemo(() => entitlementPreview(plan), [plan])
  const comparison = useMemo(
    () => STORAGE_PLAN_IDS.map(id => compareRow(region, id)),
    [region]
  )

  return (
    <Stack spacing={3}>
      <AdminPageSection title='Locker plans'>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Configure subscription tiers per region. <strong>Enforced</strong> fields gate live quotes, locker,
          recording, shares, and extension checkout. Click <strong>Save changes</strong> on the Pricing page to publish.
        </Typography>

        <Paper variant='outlined' sx={{ mb: 3, overflow: 'auto' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Monthly</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell>Recording</TableCell>
                <TableCell>Extension off</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparison.map(row => (
                <TableRow
                  key={row.planId}
                  selected={row.planId === planId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setPlanId(row.planId)}
                >
                  <TableCell sx={{ fontWeight: row.planId === planId ? 700 : 400 }}>{row.label}</TableCell>
                  <TableCell>{row.price}</TableCell>
                  <TableCell>{row.storage}</TableCell>
                  <TableCell>{row.recording}</TableCell>
                  <TableCell>{row.extension}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label='Region' size='small' value={regionKey} onChange={e => setRegionKey(e.target.value)} sx={{ minWidth: 180 }}>
            {PRICING_REGIONS.map(r => (
              <MenuItem key={r.key} value={r.key}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label='Plan to edit' size='small' value={planId} onChange={e => setPlanId(e.target.value)} sx={{ minWidth: 180 }}>
            {STORAGE_PLAN_IDS.map(id => (
              <MenuItem key={id} value={id}>
                {lockerPlanLabel(id)} ({id})
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label='Display label'
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
            onChange={e => onPatchStoragePlan(regionKey, planId, { monthlyMinor: inputToCents(e.target.value) })}
          />
          <TextField
            label={`Yearly (${currency})`}
            size='small'
            type='number'
            fullWidth
            value={centsToInput(plan.yearlyMinor)}
            disabled={!canEdit}
            onChange={e => onPatchStoragePlan(regionKey, planId, { yearlyMinor: inputToCents(e.target.value) })}
          />
        </Stack>

        <Typography variant='body2' sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
          <strong>{lockerPlanLabel(planId)}</strong> preview: Storage {preview.quota} · Recording{' '}
          {preview.recEnabled ? preview.rec : 'off'} · Extension discount{' '}
          {preview.extensionPct > 0 ? `${preview.extensionPct}%` : 'none'}
        </Typography>

        {ENTITLEMENT_GROUPS.map(group => (
          <Accordion key={group.id} defaultExpanded={group.id === 'money'} disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{group.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5
                }}
              >
                {group.fields.map(f => (
                  <EntitlementField key={f.key} field={f} plan={plan} canEdit={canEdit} patchEnt={patchEnt} />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <TextField
            label='Enthusiast marketing bullets (one per line)'
            multiline
            minRows={4}
            fullWidth
            disabled={!canEdit}
            value={(plan.marketing?.trainee || []).join('\n')}
            onChange={e => patchMarketing('trainee', e.target.value)}
            helperText='Shown in Settings · update if you change extension %'
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
