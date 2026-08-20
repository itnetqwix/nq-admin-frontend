import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { setUserStorage } from 'src/services/user360Api'
import { useAdminConfirm } from 'src/components/admin/useAdminConfirm'
import { OpsSurfaceCard } from './user360Shared'
import { KeyValueRow } from './user360Parts'

const PLAN_OPTIONS = [
  { id: 'free', label: 'Free' },
  { id: 'plus_5gb', label: 'Plus (5 GB)' },
  { id: 'pro_10gb', label: 'Pro (10 GB)' },
  { id: 'max_25gb', label: 'Max (25 GB)' }
]

function formatGb(bytes) {
  if (bytes == null || !Number.isFinite(Number(bytes))) return '—'
  const gb = Number(bytes) / (1024 * 1024 * 1024)
  return gb >= 10 ? `${Math.round(gb)} GB` : `${gb.toFixed(1)} GB`
}

export default function User360StoragePanel({ userId, storage, onRefresh }) {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [planId, setPlanId] = useState(storage?.plan || 'free')
  const [interval, setInterval] = useState(storage?.billingInterval || 'monthly')
  const [periodEnd, setPeriodEnd] = useState(
    storage?.periodEnd ? String(storage.periodEnd).slice(0, 10) : ''
  )
  const [busy, setBusy] = useState(false)

  const usedLabel = useMemo(
    () => `${formatGb(storage?.usedBytes)} / ${formatGb(storage?.quotaBytes)}`,
    [storage]
  )

  const save = async () => {
    const ok = await confirm({
      title: 'Update storage plan?',
      message: `Set this user to ${planId}${periodEnd ? ` through ${periodEnd}` : ''}.`,
      confirmLabel: 'Update storage',
      variant: 'warning',
      reasonRequired: true,
      reasonLabel: 'Why change storage?'
    })
    if (!ok) return
    setBusy(true)
    try {
      await setUserStorage(userId, {
        planId,
        interval: planId === 'free' ? null : interval,
        periodEnd: periodEnd || null,
        syncQuotaFromCatalog: true,
        sendEmail: planId !== 'free'
      })
      toast.success('Storage updated')
      onRefresh?.()
    } catch (e) {
      toast.error(e?.message || 'Storage update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {ConfirmDialog}
      <OpsSurfaceCard sx={{ mb: 3, bgcolor: ops.canvasSoft }}>
        <Typography sx={{ fontWeight: 600, mb: 1.5, letterSpacing: '-0.28px' }}>
          Storage plan
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {KeyValueRow('Current', storage?.plan || 'free')}
          {KeyValueRow('Usage', usedLabel)}
          {KeyValueRow(
            'Period end',
            storage?.periodEnd ? formatOpsDateTime(storage.periodEnd) : '—'
          )}
          {KeyValueRow('Billing', storage?.billingInterval || '—')}
          {KeyValueRow('Stripe sub', storage?.stripeSubscriptionId || '—')}
          {KeyValueRow(
            'Last payment',
            storage?.lastInvoiceAmountCents != null
              ? `$${(Number(storage.lastInvoiceAmountCents) / 100).toFixed(2)} (${storage.lastPaymentMethod || '—'})`
              : '—'
          )}
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              label='Plan'
              value={planId}
              onChange={e => setPlanId(e.target.value)}
            >
              {PLAN_OPTIONS.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {planId !== 'free' ? (
            <FormControl size='small' sx={{ minWidth: 140 }}>
              <InputLabel>Interval</InputLabel>
              <Select
                label='Interval'
                value={interval || 'monthly'}
                onChange={e => setInterval(e.target.value)}
              >
                <MenuItem value='monthly'>Monthly</MenuItem>
                <MenuItem value='yearly'>Yearly</MenuItem>
                <MenuItem value='one_time'>One-time</MenuItem>
              </Select>
            </FormControl>
          ) : null}
          {planId !== 'free' ? (
            <TextField
              size='small'
              type='date'
              label='Period end'
              InputLabelProps={{ shrink: true }}
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
            />
          ) : null}
        </Stack>
        <Box>
          <Button
            size='small'
            variant='contained'
            disabled={busy || !userId}
            onClick={() => void save()}
          >
            {busy ? 'Saving…' : 'Save storage'}
          </Button>
        </Box>
      </OpsSurfaceCard>
    </>
  )
}
