import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { ops } from 'src/styles/opsSurface'
import AdminEmptyState from 'src/components/admin/AdminEmptyState'

/** Card frame for any chart: title, optional right-hand control, and loading / error / empty states. */
export default function ChartCard({ title, subtitle, actions, loading, error, empty, emptyText = 'No data for this period', height = 260, children }) {
  let content = children
  if (loading) content = <Skeleton variant='rounded' height={height} />
  else if (error) {
    content = (
      <Box sx={{ minHeight: height, display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
        <Typography sx={{ color: ops.dangerFg, fontSize: 13 }}>{String(error?.message || error)}</Typography>
      </Box>
    )
  } else if (empty) {
    content = (
      <Box sx={{ minHeight: height, display: 'grid', placeItems: 'center' }}>
        <AdminEmptyState title={emptyText} description='' compact />
      </Box>
    )
  }
  return (
    <Box sx={{ p: 2.25, bgcolor: ops.canvas, borderRadius: ops.radiusLg, boxShadow: ops.shadowCard, border: `1px solid ${ops.hairline}`, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
          {subtitle ? <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography> : null}
        </Box>
        {actions}
      </Box>
      {content}
    </Box>
  )
}
