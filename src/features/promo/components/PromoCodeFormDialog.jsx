import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import Link from 'next/link'
import {
  BOOKING_TYPE_OPTIONS,
  PROMO_PRESETS,
  previewPromoDiscount
} from 'src/constants/revenueAdmin'

function SectionTitle({ children }) {
  return (
    <Typography variant='subtitle2' sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
      {children}
    </Typography>
  )
}

export default function PromoCodeFormDialog({
  open,
  editId,
  form,
  saving,
  onClose,
  onChange,
  onSave,
  onGenerateCode
}) {
  const preview = previewPromoDiscount(form, 50)
  const extensionOnly =
    form.applicable_booking_types?.length === 1 &&
    form.applicable_booking_types[0] === 'session_extension'

  const applyPreset = preset => {
    Object.entries(preset.form).forEach(([key, value]) => onChange(key, value))
  }

  const toggleBookingType = value => {
    const current = form.applicable_booking_types || []
    if (value === 'all') {
      onChange('applicable_booking_types', ['all'])
      return
    }
    let next = current.filter(t => t !== 'all')
    if (next.includes(value)) next = next.filter(t => t !== value)
    else next = [...next, value]
    if (next.length === 0) next = ['all']
    onChange('applicable_booking_types', next)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {editId ? 'Edit promo code' : 'Create promo code'}
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontWeight: 400 }}>
          Promos stack with Locker plan perks on <strong>new bookings</strong>. Live{' '}
          <strong>session extensions</strong> use best-of (plan % or promo — not both).
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {!editId ? (
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
            <Typography variant='caption' color='text.secondary' sx={{ width: '100%' }}>
              Quick start
            </Typography>
            {PROMO_PRESETS.map(p => (
              <Chip
                key={p.id}
                label={p.label}
                size='small'
                onClick={() => applyPreset(p)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        ) : null}

        <SectionTitle>Identity</SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Code'
              fullWidth
              size='small'
              value={form.code}
              onChange={e => onChange('code', e.target.value.toUpperCase())}
              disabled={!!editId}
              InputProps={{
                sx: { fontFamily: 'monospace' },
                endAdornment: !editId ? (
                  <Button size='small' onClick={onGenerateCode}>
                    Generate
                  </Button>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Display label'
              fullWidth
              size='small'
              value={form.display_label}
              onChange={e => onChange('display_label', e.target.value)}
              placeholder='e.g. Summer 20% off extensions'
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Internal description'
              fullWidth
              size='small'
              multiline
              rows={2}
              value={form.description}
              onChange={e => onChange('description', e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <SectionTitle>Discount</SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Type</InputLabel>
              <Select label='Type' value={form.discount_type} onChange={e => onChange('discount_type', e.target.value)}>
                <MenuItem value='percentage'>Percentage (%)</MenuItem>
                <MenuItem value='fixed_amount'>Fixed amount ($)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label={form.discount_type === 'percentage' ? 'Value (%)' : 'Value ($)'}
              fullWidth
              size='small'
              type='number'
              value={form.discount_value}
              onChange={e => onChange('discount_value', e.target.value)}
              inputProps={{ min: 0, max: form.discount_type === 'percentage' ? 100 : undefined }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Max discount ($)'
              fullWidth
              size='small'
              type='number'
              value={form.max_discount_amount}
              onChange={e => onChange('max_discount_amount', e.target.value)}
              helperText='0 = no cap (percentage only)'
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Min order ($)'
              fullWidth
              size='small'
              type='number'
              value={form.min_order_amount}
              onChange={e => onChange('min_order_amount', e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <Alert severity='info' sx={{ py: 0.5 }}>
              Preview on a <strong>$50</strong> session subtotal:{' '}
              {preview.eligible ? (
                <>
                  −${preview.discount.toFixed(2)} → customer pays ${preview.final.toFixed(2)}
                </>
              ) : (
                preview.reason
              )}
            </Alert>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <SectionTitle>Validity & limits</SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Start date'
              fullWidth
              size='small'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={form.start_date}
              onChange={e => onChange('start_date', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='End date'
              fullWidth
              size='small'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={form.end_date}
              onChange={e => onChange('end_date', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Total uses'
              fullWidth
              size='small'
              type='number'
              value={form.usage_limit}
              onChange={e => onChange('usage_limit', e.target.value)}
              helperText='0 = unlimited'
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Per user limit'
              fullWidth
              size='small'
              type='number'
              value={form.per_user_limit}
              onChange={e => onChange('per_user_limit', e.target.value)}
              helperText='0 = unlimited'
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <SectionTitle>Where it applies</SectionTitle>
        <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
          Pick one or more checkout surfaces. Extension-only codes never apply to new lesson bookings.
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          {BOOKING_TYPE_OPTIONS.map(opt => {
            const selected =
              opt.value === 'all'
                ? (form.applicable_booking_types || []).includes('all')
                : (form.applicable_booking_types || []).includes(opt.value)
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                size='small'
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => toggleBookingType(opt.value)}
                sx={{ cursor: 'pointer' }}
              />
            )
          })}
        </Stack>
        {extensionOnly ? (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Extension-only: competes with Locker plan extension % (best discount wins). Configure plan % under{' '}
            <Box component={Link} href='/apps/pricing?tab=locker' sx={{ fontWeight: 600 }}>
              Pricing → Locker plans
            </Box>
            .
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size='small'>
              <InputLabel>User types</InputLabel>
              <Select
                label='User types'
                multiple
                value={form.applicable_user_types}
                onChange={e => onChange('applicable_user_types', e.target.value)}
                renderValue={v => v.join(', ')}
              >
                <MenuItem value='All'>All</MenuItem>
                <MenuItem value='Trainee'>Trainee</MenuItem>
                <MenuItem value='Trainer'>Trainer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Locations (comma-separated)'
              fullWidth
              size='small'
              value={(form.applicable_locations || []).join(', ')}
              onChange={e =>
                onChange(
                  'applicable_locations',
                  e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                )
              }
              helperText='Leave empty for all regions'
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <SectionTitle>Visibility</SectionTitle>
        <Stack direction='row' spacing={3}>
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={e => onChange('is_active', e.target.checked)} />}
            label='Active (can be redeemed)'
          />
          <FormControlLabel
            control={<Switch checked={form.is_visible} onChange={e => onChange('is_visible', e.target.checked)} />}
            label='Visible in checkout promo picker'
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant='contained'
          onClick={onSave}
          disabled={saving}
          sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
        >
          {saving ? 'Saving…' : editId ? 'Update code' : 'Create code'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
