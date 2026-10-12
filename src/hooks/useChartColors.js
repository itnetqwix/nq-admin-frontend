import { useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import { tokensForMode } from 'src/theme/tokens'

/**
 * Literal colors for the current light/dark mode.
 *
 * ApexCharts and recharts take color strings straight into SVG/canvas options and cannot
 * resolve `var(--nq-*)`, so charts read hex values from here instead of from `ops.*`.
 */
export default function useChartColors() {
  const mode = useTheme().palette.mode

  return useMemo(() => {
    const t = tokensForMode(mode)
    return {
      mode,
      text: t.body,
      muted: t.mute,
      grid: t.hairline,
      surface: t.canvas,
      // Ordered categorical series: first slot is the brand accent, then distinguishable hues.
      series: [t.indigo, t.live, t.clay, t.infoFg, t.violetFg, t.error],
      success: t.successFg,
      warning: t.warningFg,
      danger: t.dangerFg,
      info: t.infoFg,
      accent: t.indigo,
      live: t.live
    }
  }, [mode])
}
