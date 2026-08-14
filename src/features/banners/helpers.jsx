import { Chip } from '@mui/material'
import { ops } from 'src/styles/opsSurface'

export const SEVERITIES = ['info', 'promo', 'maintenance', 'critical', 'success']
export const AUDIENCES = ['guest', 'trainee', 'trainer', 'all']
export const PLACEMENTS = [
  { value: 'hero', label: 'Hero carousel', hint: 'Large cards under search (auto-advance)' },
  { value: 'strip', label: 'Announcement strip', hint: 'Compact bar on login / alerts' },
  { value: 'sticky_bottom', label: 'Sticky bottom promo', hint: 'Slim bar above tab bar' }
]

export const EMPTY_FORM = {
  title: '',
  body: '',
  image_url: '',
  background_image_url: '',
  background_color: '',
  image_height: '140',
  image_fit: 'cover',
  text_align: 'left',
  overlay_opacity: '0.45',
  audience: ['all'],
  placement: 'hero',
  auto_advance_sec: '5',
  severity: 'info',
  ctas: [],
  cta_label: '',
  cta_url: '',
  dismissible: true,
  is_active: true,
  sort_order: '0',
  start_date: '',
  end_date: '',
  experiment_key: '',
  variant_label: ''
}

export function normalizeCtasFromRow(row) {
  if (Array.isArray(row?.ctas) && row.ctas.length) {
    return row.ctas.map(c => ({
      label: c.label || '',
      url: c.url || '',
      variant: c.variant || 'primary'
    }))
  }
  if (row?.cta_label && row?.cta_url) {
    return [{ label: row.cta_label, url: row.cta_url, variant: 'primary' }]
  }
  return []
}

export function buildCtasPayload(ctas) {
  return (ctas || [])
    .map(c => ({
      label: String(c.label || '').trim(),
      url: String(c.url || '').trim(),
      variant: ['primary', 'secondary', 'ghost'].includes(c.variant) ? c.variant : 'primary'
    }))
    .filter(c => c.label && c.url)
    .slice(0, 4)
}

export function severityChip(s) {
  const map = {
    info: { bg: ops.softIndigo, color: ops.indigoDeep },
    promo: { bg: '#ebe6ff', color: ops.indigo },
    maintenance: { bg: '#ffefcf', color: '#ab570a' },
    critical: { bg: ops.errorSoft, color: ops.error },
    success: { bg: '#AAFFEC', color: '#1A8F76' }
  }
  const t = map[s] || { bg: ops.canvasSoft2, color: ops.body }
  return (
    <Chip
      label={s}
      size='small'
      sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: t.bg, color: t.color, fontWeight: 600 }}
    />
  )
}

export function FilterChip({ active, label, onClick }) {
  return (
    <Chip
      size='small'
      clickable
      onClick={onClick}
      label={label}
      sx={{
        height: 28,
        fontFamily: ops.mono,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        bgcolor: active ? ops.softIndigo : ops.canvas,
        color: active ? ops.indigoDeep : ops.body,
        border: `1px solid ${active ? ops.indigo : ops.hairline}`
      }}
    />
  )
}
