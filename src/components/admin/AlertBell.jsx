import { useContext } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Icon from 'src/@core/components/icon'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import { useInvalidateOnAdminEvent } from 'src/hooks/useAdminLive'
import { getAlertCount } from 'src/services/commandApi'
import { queryKeys } from 'src/services/queryKeys'

/** Open-alert count in the top bar. Hidden entirely for roles that cannot open the inbox. */
export default function AlertBell() {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const allowed = ability?.can('read', 'admin-nav-ops-logs') ?? true
  const { socketConnected } = useAdminRealtime()

  const { data } = useQuery({
    queryKey: queryKeys.alertCount,
    queryFn: getAlertCount,
    enabled: allowed,
    retry: false,
    refetchInterval: socketConnected ? 120_000 : 45_000
  })
  useInvalidateOnAdminEvent('ADMIN_OPS_EVENT_CREATED', queryKeys.alertCount, { throttleMs: 3000 })

  if (!allowed) return null
  const open = data?.open ?? 0
  return (
    <Tooltip title={open ? `${open} open alert${open === 1 ? '' : 's'}` : 'No open alerts'} arrow>
      <IconButton
        onClick={() => router.push('/apps/alerts')}
        aria-label={open ? `${open} open alerts` : 'Alerts'}
        sx={{ p: 1, borderRadius: '8px', color: 'text.primary' }}
      >
        <Badge badgeContent={open} color='error' max={99} invisible={!open}>
          <Icon icon='mdi:bell-outline' fontSize={22} />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}
