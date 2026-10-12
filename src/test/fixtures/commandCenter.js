/** Mirrors the backend's loadCommandCenter() output (nq-backend-main commandCenterService.ts). */
export const commandCenterFixture = (over = {}) => ({
  generatedAt: '2026-10-11T12:00:00.000Z',
  windowDays: 7,
  kpis: {
    current: {
      totals: { bookings: 120, completed: 100, cancelled: 10, activeTrainees: 80, activeTrainers: 12, gmvMinor: 1234500, revenueMinor: 185000 },
      rates: { takeRate: 0.15, completionRate: 0.909, cancellationRate: 0.08, refundRate: 0.02, noShowRate: 0.01, instantAcceptanceRate: 0.7, repeatBookingRate: 0.4 }
    },
    previous: {
      totals: { bookings: 100, completed: 90, cancelled: 8, activeTrainees: 70, activeTrainers: 12, gmvMinor: 1000000, revenueMinor: 150000 },
      rates: { takeRate: 0.15, completionRate: 0.9, cancellationRate: 0.07, refundRate: 0.01, noShowRate: 0.01, instantAcceptanceRate: 0.7, repeatBookingRate: 0.38 }
    },
    deltas: { gmvMinor: 0.25, revenueMinor: 0.2, bookings: 0.2, completed: 0.11, activeTrainers: 0, activeTrainees: 0.1428, completionRate: 0.009, takeRate: 0, refundRate: 0.01 }
  },
  daily: [
    { date: '2026-10-09', bookings: 14, gmvMinor: 150000 },
    { date: '2026-10-10', bookings: 21, gmvMinor: 230000 }
  ],
  funnel: [
    { step: 'trainer_profile_viewed', users: 400 },
    { step: 'slot_selected', users: 200 },
    { step: 'checkout_started', users: 120 },
    { step: 'booking_created', users: 100 },
    { step: 'lesson_completed', users: 90 }
  ],
  health: {
    level: 'degraded',
    reasons: ['Stale cron jobs: escrow-release'],
    api: { errorRate24h: 0.012, avgMs24h: 180, estRequests24h: 52000 },
    apiSeries: [
      { hour: '2026-10-11T10:00:00Z', estRequests: 2000, errors5xx: 10, errors4xx: 4, errorRate: 0.005, avgMs: 160, slowShare: 0.01 },
      { hour: '2026-10-11T11:00:00Z', estRequests: 2200, errors5xx: 40, errors4xx: 6, errorRate: 0.018, avgMs: 210, slowShare: 0.03 }
    ]
  },
  attention: [
    { key: 'disputes', severity: 'critical', label: 'Open payment disputes / chargebacks', count: 2, href: '/apps/finance/disputes' },
    { key: 'trainer_review', severity: 'warning', label: 'Trainers waiting for review', count: 5, href: '/apps/trainer-verifications', oldestAt: '2026-10-08T12:00:00.000Z' },
    { key: 'tickets', severity: 'info', label: 'Open support tickets', count: 9, href: '/apps/concern-by-user', oldestAt: null }
  ],
  live: {
    summary: { live: 3, waiting: 1, late: 1, upcoming: 2, withQualityIssues: 1, instantPending: 2, noShows24h: 1 },
    lessons: [
      { sessionId: '64b000000000000000000001', state: 'late', trainer: { id: 't1', name: 'Tara Coach' }, trainee: { id: 'u1', name: 'Tim Trainee' }, isInstant: false, startsAt: '2026-10-11T11:50:00.000Z', startedAt: null, firstJoinedAt: null, lowQualityEvents30m: 0, lastEventType: null, lastEventAt: null },
      { sessionId: '64b000000000000000000002', state: 'live', trainer: { id: 't2', name: 'Sam Coach' }, trainee: { id: 'u2', name: 'Tina Trainee' }, isInstant: true, startsAt: '2026-10-11T11:30:00.000Z', startedAt: '2026-10-11T11:31:00.000Z', firstJoinedAt: '2026-10-11T11:30:00.000Z', lowQualityEvents30m: 4, lastEventType: 'CALL_QUALITY_LOW', lastEventAt: '2026-10-11T11:58:00.000Z' }
    ]
  },
  moneyAtRisk: { heldMinor: 500000, releasingMinor: 20000, disputedMinor: 30000, pendingPayoutMinor: 80000, openRefundMinor: 12000, openRefundCount: 3, pendingPayoutCount: 4, totalMinor: 642000 },
  recentAlerts: [
    { _id: 'e1', event_type: 'STRIPE_DISPUTE', title: 'Dispute opened on pi_123', severity: 'critical', category: 'payment', stream: 'business', createdAt: '2026-10-11T11:00:00.000Z' },
    { _id: 'e2', event_type: 'CALL_QUALITY_LOW', title: 'Low call quality', severity: 'warning', category: 'call', stream: 'lesson', session_id: '64b000000000000000000002', createdAt: '2026-10-11T11:58:00.000Z' }
  ],
  ...over
})

/** What the backend returns for a Support-role caller (money redacted, no health). */
export const redactedForSupport = base => ({
  ...base,
  kpis: {
    ...base.kpis,
    current: { totals: { ...base.kpis.current.totals, gmvMinor: null, revenueMinor: null }, rates: { ...base.kpis.current.rates, takeRate: null, refundRate: null } },
    previous: { totals: { ...base.kpis.previous.totals, gmvMinor: null, revenueMinor: null }, rates: { ...base.kpis.previous.rates, takeRate: null, refundRate: null } },
    deltas: { ...base.kpis.deltas, gmvMinor: null, revenueMinor: null, takeRate: null, refundRate: null }
  },
  daily: base.daily.map(d => ({ ...d, gmvMinor: null })),
  health: null,
  attention: base.attention.filter(a => a.key === 'tickets'),
  moneyAtRisk: null
})
