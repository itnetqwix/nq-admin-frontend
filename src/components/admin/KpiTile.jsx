import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import NextLink from 'next/link'
import { ops } from 'src/styles/opsSurface'
import { deltaTone } from 'src/utils/format'
import MiniSparkline from 'src/components/admin/MiniSparkline'

const DELTA_COLOR = { success: ops.successFg, danger: ops.dangerFg, neutral: ops.mute }

/**
 * Headline number with a change-vs-previous-period line, an optional sparkline and an optional
 * drill-down link. `deltaLabel` is pre-formatted by the caller (percent for amounts, points for
 * rates); `delta` is the raw ratio used only to colour it.
 */
export default function KpiTile({
  label,
  value,
  deltaLabel,
  delta,
  higherIsBetter = true,
  hint,
  series,
  href,
  loading = false,
  tone
}) {
  const colorKey = deltaTone(delta, { higherIsBetter })
  const body = (
    <Box
      sx={{
        p: 2,
        height: '100%',
        bgcolor: ops.canvas,
        borderRadius: ops.radiusLg,
        boxShadow: ops.shadowCard,
        border: `1px solid ${ops.hairline}`,
        transition: 'background-color .12s ease, transform .12s ease',
        ...(href ? { '&:hover': { bgcolor: ops.canvasSoft, transform: 'translateY(-1px)' } } : {})
      }}
    >
      <Typography
        sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant='text' width='60%' height={44} />
      ) : (
        <Typography
          sx={{
            mt: 0.5,
            fontFamily: ops.scoreboard,
            fontSize: { xs: 28, md: 34 },
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.4px',
            fontVariantNumeric: 'tabular-nums',
            color: tone === 'danger' ? ops.error : 'text.primary'
          }}
        >
          {value}
        </Typography>
      )}
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 22 }}>
        <Typography sx={{ fontSize: 12, color: deltaLabel ? DELTA_COLOR[colorKey] : ops.mute, fontWeight: deltaLabel ? 600 : 400 }}>
          {deltaLabel ? `${deltaLabel} vs previous` : hint || ''}
        </Typography>
        {series?.length > 1 ? <MiniSparkline values={series} color={ops.accent} /> : null}
      </Box>
    </Box>
  )

  return href ? (
    <Box component={NextLink} href={href} sx={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
      {body}
    </Box>
  ) : (
    body
  )
}
