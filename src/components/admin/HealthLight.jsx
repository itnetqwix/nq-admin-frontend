import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

const LEVELS = {
  ok: { label: 'Healthy', color: ops.live },
  degraded: { label: 'Degraded', color: ops.warningFg },
  down: { label: 'Down', color: ops.error },
  unknown: { label: 'Unknown', color: ops.mute }
}

/** A single system's status: coloured dot, name, and one line of detail. Optionally a link. */
export default function HealthLight({ label, level = 'unknown', detail, onClick }) {
  const l = LEVELS[level] || LEVELS.unknown
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.5,
        borderRadius: ops.radiusMd,
        bgcolor: ops.canvas,
        border: `1px solid ${ops.hairline}`,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: ops.canvasSoft } : undefined,
        '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: 2 }
      }}
    >
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color, flexShrink: 0 }} aria-hidden />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
          {label} <Box component='span' sx={{ color: l.color, fontWeight: 500 }}>· {l.label}</Box>
        </Typography>
        {detail ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }} noWrap title={detail}>
            {detail}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}
