import NextLink from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StatusPill from 'src/components/admin/StatusPill'
import { ops } from 'src/styles/opsSurface'
import { getUser360Summary } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { timeAgo } from 'src/utils/format'
import { DrawerError, DrawerLoading, FactList } from './shared'

const STATUS_TONE = { approved: 'success', pending: 'warning', rejected: 'danger' }

/** Quick look at a person without leaving the page; User 360 has the full picture. */
export default function UserDrawer({ id }) {
  const q = useQuery({ queryKey: queryKeys.user(id), queryFn: () => getUser360Summary(id) })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const u = q.data?.user || q.data || {}
  const status = String(u.status || '').toLowerCase()
  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{u.fullname || u.name || 'Unnamed user'}</Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
          {u.account_type ? <StatusPill tone='info'>{u.account_type}</StatusPill> : null}
          {status ? <StatusPill tone={STATUS_TONE[status] || 'neutral'}>{status}</StatusPill> : null}
        </Box>
      </Box>
      <FactList
        rows={[
          { label: 'Email', value: u.email },
          { label: 'Phone', value: u.mobile_no },
          { label: 'Joined', value: u.createdAt ? `${new Date(u.createdAt).toLocaleDateString()} (${timeAgo(u.createdAt)})` : null },
          { label: 'Last seen', value: u.lastSeen ? timeAgo(u.lastSeen) : null },
          { label: 'Time zone', value: u.time_zone }
        ]}
      />
      <Box component={NextLink} href={`/apps/users/${id}`} sx={{ fontSize: 13, color: ops.link }}>
        Open full profile (User 360) →
      </Box>
    </Box>
  )
}
