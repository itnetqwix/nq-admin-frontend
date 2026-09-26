import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { getAdminApiEnvBannerCopy } from 'src/configs/adminEnv'

/** Compact API-env chip for the app bar (always visible, no page-content shift). */
export default function AdminEnvBanner() {
  const { tag, host, kind } = getAdminApiEnvBannerCopy()
  const color = kind === 'production' ? 'error' : kind === 'staging' ? 'warning' : 'default'
  const hint =
    kind === 'production'
      ? `Talking to ${host} — live customer data. Double-check before refunds / broadcasts.`
      : `Talking to ${host}`

  return (
    <Tooltip title={hint} arrow>
      <Chip
        size='small'
        label={tag}
        color={color}
        variant='outlined'
        sx={{
          height: 26,
          fontWeight: 700,
          fontSize: '0.6875rem',
          letterSpacing: '0.06em',
          flexShrink: 0,
          borderRadius: '6px',
          borderWidth: '1px'
        }}
      />
    </Tooltip>
  )
}
