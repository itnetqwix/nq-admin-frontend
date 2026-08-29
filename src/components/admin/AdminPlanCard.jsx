import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'

/**
 * Selectable plan tile for Locker (or similar) plan pickers.
 * meta: optional array of { label, value } summary rows.
 */
export default function AdminPlanCard({
  title,
  subtitle,
  selected = false,
  onClick,
  meta = [],
  disabled = false,
  sx
}) {
  return (
    <Box
      role='button'
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        disabled
          ? undefined
          : e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
      }
      sx={{
        p: 1.75,
        borderRadius: ops.radiusMd,
        bgcolor: selected ? ops.softSky : ops.canvas,
        boxShadow: selected
          ? `inset 0 0 0 2px ${ops.ink}, ${ops.shadowCard}`
          : ops.shadowCard,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background-color 0.12s ease, box-shadow 0.12s ease',
        '&:hover': disabled
          ? undefined
          : { bgcolor: selected ? ops.softSky : ops.canvasSoft },
        ...sx
      }}
    >
      <Typography sx={{ fontWeight: 700, letterSpacing: '-0.28px', fontSize: 15, color: ops.ink }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ fontSize: 12, color: ops.mute, mt: 0.25, fontFamily: ops.mono }}>
          {subtitle}
        </Typography>
      ) : null}
      {meta.length > 0 ? (
        <Stack spacing={0.5} sx={{ mt: 1.25 }}>
          {meta.map(row => (
            <Stack key={row.label} direction='row' justifyContent='space-between' gap={1}>
              <Typography sx={{ fontSize: 11, color: ops.mute }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: ops.ink, fontFamily: ops.mono }}>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Box>
  )
}
