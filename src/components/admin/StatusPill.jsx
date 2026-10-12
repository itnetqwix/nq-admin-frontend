import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'

const TONES = {
  success: { bg: ops.successBg, fg: ops.successFg, border: ops.successBorder },
  warning: { bg: ops.warningBg, fg: ops.warningFg, border: ops.warningBorder },
  danger: { bg: ops.dangerBg, fg: ops.dangerFg, border: ops.dangerBorder },
  info: { bg: ops.infoBg, fg: ops.infoFg, border: ops.infoBorder },
  neutral: { bg: ops.neutralBg, fg: ops.neutralFg, border: ops.neutralBorder },
  violet: { bg: ops.violetBg, fg: ops.violetFg, border: ops.neutralBorder },
  live: { bg: ops.successBg, fg: ops.successFg, border: ops.successBorder }
}

/** The one status chip: same colours for the same meaning on every screen, in light and dark. */
export default function StatusPill({ tone = 'neutral', children, dot = false, pulse = false, size = 'md', sx }) {
  const t = TONES[tone] || TONES.neutral
  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'sm' ? 0.875 : 1.125,
        py: size === 'sm' ? 0.125 : 0.25,
        borderRadius: ops.radiusPill,
        border: `1px solid ${t.border}`,
        bgcolor: t.bg,
        color: t.fg,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        ...sx
      }}
    >
      {dot || pulse ? (
        <Box
          component='span'
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'currentColor',
            flexShrink: 0,
            ...(pulse
              ? {
                  animation: 'nqPulse 1.6s ease-in-out infinite',
                  '@keyframes nqPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
                }
              : {})
          }}
        />
      ) : null}
      {children}
    </Box>
  )
}

export const STATUS_TONES = Object.keys(TONES)
