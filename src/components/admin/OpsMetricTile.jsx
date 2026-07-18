import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'

/**
 * Compact Ops Surface metric tile — icon + soft tint for denser dashboards.
 */
export default function OpsMetricTile({
  label,
  value,
  hint,
  onClick,
  tone = 'default', // default | warn | danger | accent | success
  icon
}) {
  const tones = {
    default: { value: ops.ink, hint: ops.mute, soft: ops.canvasSoft2, icon: ops.body },
    warn: { value: '#ab570a', hint: ops.mute, soft: '#ffefcf', icon: '#ab570a' },
    danger: { value: ops.error, hint: ops.mute, soft: ops.errorSoft, icon: ops.error },
    accent: { value: ops.indigoDeep, hint: ops.mute, soft: '#ebe6ff', icon: ops.indigo },
    success: { value: '#1A8F76', hint: ops.mute, soft: '#AAFFEC', icon: '#29bc9b' }
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
        transition: 'background-color 0.12s ease, transform 0.12s ease',
        '&:hover': onClick ? { bgcolor: ops.canvasSoft, transform: 'translateY(-1px)' } : undefined
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography
          sx={{
            fontFamily: ops.mono,
            fontSize: 11,
            color: ops.mute,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          {label}
        </Typography>
        {icon ? (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: ops.radiusSm,
              bgcolor: t.soft,
              color: t.icon,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon icon={icon} fontSize={16} />
          </Box>
        ) : null}
      </Box>
      <Typography
        sx={{
          fontSize: { xs: 22, md: 26 },
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
