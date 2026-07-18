import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

/**
 * Compact Ops Surface metric tile — replaces loud Materio stat cards.
 */
export default function OpsMetricTile({
  label,
  value,
  hint,
  onClick,
  tone = 'default' // default | warn | danger | accent
}) {
  const tones = {
    default: { value: ops.ink, hint: ops.mute },
    warn: { value: ops.warning, hint: ops.mute },
    danger: { value: ops.error, hint: ops.mute },
    accent: { value: ops.indigo, hint: ops.mute }
  }
  const t = tones[tone] || tones.default

  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      sx={{
        p: 2,
        height: '100%',
        bgcolor: ops.canvas,
        borderRadius: ops.radiusLg,
        boxShadow: ops.shadowCard,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.12s ease',
        '&:hover': onClick ? { bgcolor: ops.canvasSoft } : undefined
      }}
    >
      <Typography
        sx={{
          fontFamily: ops.mono,
          fontSize: 11,
          color: ops.mute,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 1
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 22, md: 28 },
          fontWeight: 600,
          letterSpacing: '-0.96px',
          color: t.value,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.15
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography sx={{ mt: 0.75, fontSize: 12, color: t.hint, lineHeight: 1.4 }}>{hint}</Typography>
      ) : null}
    </Box>
  )
}
