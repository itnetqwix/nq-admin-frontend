import { getPendingTraineeCount } from 'src/services/clipsAdminApi'
import { listBroadcasts } from 'src/services/broadcastApi'
import { getPendingVerificationCount } from 'src/services/verificationApi'

function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

/**
 * Actionable admin alerts for the app-bar notification menu — pending reviews
 * and recent broadcast deliveries. Not a personal inbox; each row deep-links
 * to the relevant admin screen.
 */
export async function fetchAdminActionAlerts() {
  const [trainerPending, traineePending, broadcastsRes] = await Promise.allSettled([
    getPendingVerificationCount(),
    getPendingTraineeCount(),
    listBroadcasts({ page: 1, limit: 5, status: 'sent' })
  ])

  const alerts = []

  if (trainerPending.status === 'fulfilled' && trainerPending.value > 0) {
    alerts.push({
      id: 'trainer-verifications',
      title: 'Trainer verifications pending',
      subtitle: `${trainerPending.value} expert${trainerPending.value === 1 ? '' : 's'} awaiting review`,
      meta: 'Review',
      href: '/apps/trainer-verifications',
      avatarIcon: 'mdi:account-check-outline',
      avatarColor: 'warning'
    })
  }

  if (traineePending.status === 'fulfilled' && traineePending.value > 0) {
    alerts.push({
      id: 'trainee-reviews',
      title: 'Trainee accounts pending',
      subtitle: `${traineePending.value} account${traineePending.value === 1 ? '' : 's'} need approval`,
      meta: 'Review',
      href: '/apps/trainee-account-reviews',
      avatarIcon: 'mdi:account-school-outline',
      avatarColor: 'info'
    })
  }

  if (broadcastsRes.status === 'fulfilled') {
    const rows = broadcastsRes.value?.result?.broadcasts ?? []
    for (const row of rows.slice(0, 3)) {
      const sentAt = row.sent_at ?? row.updatedAt ?? row.createdAt
      alerts.push({
        id: `broadcast-${row._id}`,
        title: row.title || 'Broadcast sent',
        subtitle: row.body || row.stats?.push
          ? `Push ${row.stats?.push?.sent ?? 0} sent`
          : 'Campaign delivered',
        meta: relativeTime(sentAt),
        href: '/apps/broadcasts',
        avatarIcon: 'mdi:bullhorn-outline',
        avatarColor: 'primary'
      })
    }
  }

  return alerts
}
