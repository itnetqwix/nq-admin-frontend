import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ops } from 'src/styles/opsSurface'
import EntityLink from 'src/components/admin/EntityLink'
import StatusPill from 'src/components/admin/StatusPill'
import { timeAgo } from 'src/utils/format'

export const SEVERITY_TONE = { critical: 'danger', error: 'danger', warning: 'warning', info: 'info' }

export default function RecentAlerts({ alerts = [] }) {
  return (
    <Box>
      {alerts.length ? (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.75 }}>
          {alerts.map(a => (
            <li key={a._id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatusPill tone={SEVERITY_TONE[a.severity] || 'neutral'} size='sm'>{a.severity}</StatusPill>
                <Typography sx={{ fontSize: 13, flex: 1, minWidth: 0 }} noWrap title={a.title}>
                  {a.session_id ? <EntityLink type='lesson' id={String(a.session_id)}>{a.title}</EntityLink> : a.title}
                </Typography>
                <Typography sx={{ fontSize: 11, color: ops.mute, whiteSpace: 'nowrap' }}>{timeAgo(a.createdAt)}</Typography>
              </Box>
            </li>
          ))}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No open alerts.</Typography>
      )}
      <Box sx={{ mt: 1.5, textAlign: 'right' }}>
        <Box component={NextLink} href='/apps/alerts' sx={{ fontSize: 12, color: ops.link, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          All alerts →
        </Box>
      </Box>
    </Box>
  )
}
