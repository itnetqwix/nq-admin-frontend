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
        sx={{ height: 22, fontWeight: 700, fontSize: 10, letterSpacing: '0.04em', flexShrink: 0 }}
      />
    </Tooltip>
  )
}
