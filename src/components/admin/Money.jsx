import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'
import { formatMinor } from 'src/utils/format'

/**
 * Money from the API (minor units) in tabular figures so columns of amounts line up.
 * `tone` colours direction only where it carries meaning (money in/out), never decoratively.
 */
export default function Money({ minor, currency = 'USD', compact = false, signed = false, tone, sx }) {
  const color = tone === 'in' ? ops.successFg : tone === 'out' ? ops.dangerFg : tone === 'risk' ? ops.warningFg : 'inherit'
  return (
    <Box component='span' sx={{ fontVariantNumeric: 'tabular-nums', color, whiteSpace: 'nowrap', ...sx }}>
      {formatMinor(minor, { currency, compact, signed })}
    </Box>
  )
}
