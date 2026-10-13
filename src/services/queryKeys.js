/**
 * One place for react-query keys so a screen, its refetch-on-socket-event hook and a mutation's
 * invalidation always agree. Prefix-based: invalidating ['alerts'] covers every alerts query.
 */
export const queryKeys = {
  commandCenter: days => ['command-center', days],
  commandCenterAll: ['command-center'],
  liveOps: ['live-ops'],
  systemHealth: ['system-health'],
  permissionRollout: ['system-health', 'permission-rollout'],
  apiHealth: hours => ['system-health', 'api', hours],
  alerts: filters => ['alerts', filters],
  alertsAll: ['alerts'],
  alertCount: ['alerts', 'count'],
  sentryStats: range => ['sentry', 'stats', range],
  sentrySearch: query => ['sentry', 'search', query],
  lesson: {
    booking: id => ['lesson', id, 'booking'],
    journey: id => ['lesson', id, 'journey'],
    quality: id => ['lesson', id, 'quality'],
    events: id => ['lesson', id, 'events'],
    errors: id => ['lesson', id, 'errors']
  },
  trace: q => ['trace', q],
  failedJob: (queue, id) => ['failed-job', queue, id],
  failedJobsGrouped: ['failed-jobs', 'grouped'],
  user: id => ['user', id],
  meta: ['admin-meta'],
  search: q => ['admin-search', q]
}
