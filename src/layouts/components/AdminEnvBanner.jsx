import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { getAdminApiEnvBannerCopy } from 'src/configs/adminEnv'

/** Always-visible API environment strip (NET-32 harden). */
export default function AdminEnvBanner() {
  const { tag, host, kind } = getAdminApiEnvBannerCopy()
  const severity = kind === 'production' ? 'error' : kind === 'staging' ? 'warning' : kind === 'local' ? 'info' : 'warning'

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, pt: 2, pb: 0 }}>
      <Alert
        severity={severity}
        icon={false}
        sx={{
          py: 0.75,
          fontWeight: kind === 'production' ? 700 : 500,
          border: kind === 'production' ? '2px solid' : undefined,
          borderColor: kind === 'production' ? 'error.main' : undefined
        }}
      >
        <Chip
          size='small'
          label={tag}
          color={kind === 'production' ? 'error' : kind === 'staging' ? 'warning' : 'default'}
          sx={{ mr: 1, fontWeight: 700 }}
        />
        Talking to <strong>{host}</strong>
        {kind === 'production' ? ' — live customer data. Double-check before refunds / broadcasts.' : null}
      </Alert>
    </Box>
  )
}
