import { Box, Chip, Stack, Typography } from '@mui/material'
import moment from 'moment'
import { ops } from 'src/styles/opsSurface'

export function personLabel(p) {
  if (!p) return '—'
  return p.name || p.email || p.id || '—'
}

export function shortId(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}

export async function copyText(text) {
  if (!text) throw new Error('Nothing to copy')
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('Copy failed')
}

export const KIND_META = {
  lifecycle: { label: 'Lifecycle', color: ops.indigo, bg: ops.softIndigo },
  join: { label: 'Join', color: '#0f766e', bg: ops.softMint },
  clip: { label: 'Clip', color: '#0369a1', bg: ops.softSky },
  call: { label: 'Call', color: ops.clay, bg: ops.softAmber },
  ops: { label: 'Ops', color: ops.indigoDeep, bg: ops.softIndigo },
  extension: { label: 'Ext', color: ops.indigoDeep, bg: ops.softIndigo },
  note: { label: 'Note', color: ops.mute, bg: ops.canvasSoft2 }
}

export const SEV_DOT = {
  info: ops.mute,
  ok: ops.live,
  warn: ops.warning,
  error: ops.error
}

export const LOOKBACK_PRESETS = [
  { hours: 24, label: '24h' },
  { hours: 72, label: '3d' },
  { hours: 168, label: '7d' },
  { hours: 360, label: '15d' },
  { hours: 720, label: '30d' }
]

export const DEFAULT_HOURS = 360

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

export function StoryRow({ item }) {
  const kind = KIND_META[item.kind] || KIND_META.note
  const when = item.at ? moment(item.at).format('HH:mm:ss') : '—'
  const day = item.at ? moment(item.at).format('MMM D') : ''
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '64px 1fr', sm: '72px 72px 1fr' },
        gap: 1.25,
        py: 1.25,
        px: 1.5,
        borderBottom: `1px solid ${ops.hairline}`,
        bgcolor: item.severity === 'error' ? ops.errorSoft : item.severity === 'warn' ? ops.softAmber : 'transparent',
        '&:hover': { bgcolor: ops.canvasSoft }
      }}
    >
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>{day}</Typography>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontWeight: 600, color: ops.ink }}>{when}</Typography>
      </Box>
      <Box>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: { sm: 'none' } }}>
          {day} {when}
        </Typography>
        <Chip
          size='small'
          label={kind.label}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: kind.bg,
            color: kind.color,
            borderRadius: ops.radiusSm
          }}
        />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: SEV_DOT[item.severity] || SEV_DOT.info,
              flexShrink: 0
            }}
          />
          <Typography sx={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.2px' }}>{item.title}</Typography>
          {item.role ? (
            <Chip size='small' variant='outlined' label={item.role} sx={{ height: 20, fontSize: 10 }} />
          ) : null}
        </Stack>
        {item.detail ? (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.35, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {item.detail}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}

export function PersonCard({ label, person, rollup }) {
  const lastFail = Array.isArray(rollup?.failures) ? rollup.failures[rollup.failures.length - 1] : null
  return (
    <Box sx={{ p: 2, borderRadius: ops.radiusMd, bgcolor: ops.canvasSoft, boxShadow: ops.shadowCard, height: '100%' }}>
      <Typography sx={{ fontSize: 11, fontFamily: ops.mono, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 17, mt: 0.5, letterSpacing: '-0.3px' }}>{personLabel(person)}</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-all' }}>
        {person?.email || '—'}
      </Typography>
      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mt: 0.75 }}>{person?.id || '—'}</Typography>
      <Stack direction='row' spacing={0.75} flexWrap='wrap' useFlexGap sx={{ mt: 1.25 }}>
        {rollup?.env?.os || rollup?.env?.country ? (
          <Chip size='small' label={[rollup.env.os, rollup.env.country].filter(Boolean).join(' · ')} />
        ) : null}
        {rollup?.client ? <Chip size='small' label={rollup.client} /> : null}
        {(rollup?.buildIds || []).slice(0, 2).map(b => (
          <Chip key={b} size='small' variant='outlined' label={`build ${b}`} sx={{ fontFamily: ops.mono, fontSize: 10 }} />
        ))}
        <Chip size='small' variant='outlined' label={`${rollup?.clipEventCount ?? 0} clip logs`} />
        {(rollup?.failureCount ?? 0) > 0 ? (
          <Chip size='small' color='warning' label={`${rollup.failureCount} fail`} />
        ) : (
          <Chip size='small' variant='outlined' label='no fails' />
        )}
      </Stack>
      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
        quality {rollup?.quality?.avgScore ?? '—'} · rtt {rollup?.quality?.avgRttMs ?? '—'}ms
      </Typography>
      {lastFail ? (
        <Typography sx={{ mt: 1, fontFamily: ops.mono, fontSize: 10, color: ops.warning, lineHeight: 1.4, wordBreak: 'break-word' }}>
          last fail: {lastFail.action}
          {lastFail.error ? ` err=${lastFail.error}` : ''}
        </Typography>
      ) : null}
    </Box>
  )
}
