import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'
import StatusPill from 'src/components/admin/StatusPill'
import { formatInt, timeAgo } from 'src/utils/format'

const TONE = { critical: 'danger', warning: 'warning', info: 'info' }
const BAR = { critical: ops.error, warning: ops.warningFg, info: ops.infoFg }

/** The worklist: what needs a human, worst first, each row one click from the place to act. */
export default function AttentionList({ items = [] }) {
  if (!items.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{ color: ops.live, mb: 0.5 }}>
          <Icon icon='mdi:check-circle-outline' fontSize={32} />
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>All clear</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Nothing is waiting on you right now.</Typography>
      </Box>
    )
  }
  return (
    <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75 }}>
      {items.map(item => (
        <li key={item.key}>
          <Box
            component={NextLink}
            href={item.href}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              pl: 1.5,
              borderRadius: ops.radiusMd,
              border: `1px solid ${ops.hairline}`,
              borderLeft: `3px solid ${BAR[item.severity]}`,
              bgcolor: ops.canvas,
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { bgcolor: ops.canvasSoft },
              '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: 2 }
            }}
          >
            <Typography
              sx={{ fontFamily: ops.scoreboard, fontSize: 24, fontWeight: 600, minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatInt(item.count)}
            </Typography>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }} noWrap title={item.label}>
                {item.label}
              </Typography>
              {item.oldestAt ? (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Oldest waiting {timeAgo(item.oldestAt)}</Typography>
              ) : null}
            </Box>
            <StatusPill tone={TONE[item.severity]} size='sm'>
              {item.severity}
            </StatusPill>
            <Icon icon='mdi:chevron-right' fontSize={18} />
          </Box>
        </li>
      ))}
    </Box>
  )
}
