import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ChartCard from 'src/components/admin/charts/ChartCard'
import StatusPill from 'src/components/admin/StatusPill'
import { getPermissionRollout } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'
import { ops } from 'src/styles/opsSurface'
import { formatInt, timeAgo } from 'src/utils/format'

export const ROLLOUT_STATE = {
  ready: { tone: 'success', label: 'Ready to enforce' },
  not_ready: { tone: 'warning', label: 'Not yet' },
  enforcing: { tone: 'info', label: 'Enforcing' }
}

/** Should ADMIN_ENFORCE_PERMISSIONS be switched on? Shows who would be blocked, so it is a decision, not a guess. */
export default function PermissionRolloutCard() {
  const q = useQuery({ queryKey: queryKeys.permissionRollout, queryFn: () => getPermissionRollout(7), retry: false, refetchInterval: 5 * 60_000 })
  if (q.isError) return null // the viewer's role cannot see this; hide rather than show an error
  const r = q.data
  const state = r ? ROLLOUT_STATE[r.state] : null

  return (
    <ChartCard
      title='Permission rollout'
      subtitle='Finance reads and ticket edits are being locked down gradually'
      loading={q.isLoading}
      actions={state ? <StatusPill tone={state.tone}>{state.label}</StatusPill> : null}
    >
      {r ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{r.headline}</Typography>
          {r.groups.length ? (
            <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
              {r.groups.map(g => (
                <li key={`${g.permission}:${g.role}`}>
                  <Box sx={{ p: 1.25, borderRadius: ops.radiusMd, border: `1px solid ${ops.hairline}` }}>
                    <Typography sx={{ fontSize: 13 }}>
                      <strong>{g.role}</strong> needs <code>{g.permission}</code>
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {formatInt(g.count)} requests from {formatInt(g.admins)} admin{g.admins === 1 ? '' : 's'}
                      {g.lastAt ? ` · last ${timeAgo(g.lastAt)}` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: ops.mute, fontFamily: ops.mono, mt: 0.5 }}>{g.routes.join(' · ')}</Typography>
                  </Box>
                </li>
              ))}
            </Box>
          ) : null}
          {r.advice.map(a => (
            <Typography key={a} sx={{ fontSize: 12.5, color: 'text.secondary' }}>• {a}</Typography>
          ))}
        </Box>
      ) : null}
    </ChartCard>
  )
}
