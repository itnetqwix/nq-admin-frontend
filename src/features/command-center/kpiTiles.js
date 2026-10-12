import { formatDelta, formatInt, formatMinor, formatPct, formatPoints } from 'src/utils/format'

/**
 * The Command Center's headline numbers, as plain data so they can be tested.
 * Money tiles are dropped (not shown as $0) when the API redacted the figures for this role.
 */
export function buildKpiTiles(kpis, daily = []) {
  if (!kpis?.current) return []
  const { totals, rates } = kpis.current
  const d = kpis.deltas || {}
  const moneyVisible = totals.gmvMinor !== null && totals.gmvMinor !== undefined

  const gmvSeries = daily.map(x => x.gmvMinor)
  const bookingSeries = daily.map(x => x.bookings)

  const tiles = [
    {
      key: 'gmv',
      money: true,
      label: 'GMV',
      value: formatMinor(totals.gmvMinor, { compact: true }),
      delta: d.gmvMinor,
      deltaLabel: formatDelta(d.gmvMinor),
      series: gmvSeries,
      href: '/apps/kpis'
    },
    {
      key: 'revenue',
      money: true,
      label: 'Platform revenue',
      value: formatMinor(totals.revenueMinor, { compact: true }),
      delta: d.revenueMinor,
      deltaLabel: formatDelta(d.revenueMinor),
      href: '/apps/kpis'
    },
    {
      key: 'bookings',
      label: 'Bookings',
      value: formatInt(totals.bookings),
      delta: d.bookings,
      deltaLabel: formatDelta(d.bookings),
      series: bookingSeries,
      href: '/apps/booking'
    },
    {
      key: 'completion',
      label: 'Completion rate',
      value: formatPct(rates.completionRate),
      delta: d.completionRate,
      deltaLabel: formatPoints(d.completionRate),
      href: '/apps/booking'
    },
    {
      key: 'trainers',
      label: 'Active coaches',
      value: formatInt(totals.activeTrainers),
      delta: d.activeTrainers,
      deltaLabel: formatDelta(d.activeTrainers),
      href: '/apps/manage-trainer'
    },
    {
      key: 'trainees',
      label: 'Active trainees',
      value: formatInt(totals.activeTrainees),
      delta: d.activeTrainees,
      deltaLabel: formatDelta(d.activeTrainees),
      href: '/apps/manage-trainee'
    },
    {
      key: 'take',
      money: true,
      label: 'Take rate',
      value: formatPct(rates.takeRate),
      delta: d.takeRate,
      deltaLabel: formatPoints(d.takeRate),
      href: '/apps/pricing'
    },
    {
      key: 'refunds',
      money: true,
      label: 'Refund rate',
      value: formatPct(rates.refundRate),
      delta: d.refundRate,
      deltaLabel: formatPoints(d.refundRate),
      higherIsBetter: false,
      href: '/apps/finance?tab=refunds'
    }
  ]
  return tiles.filter(t => moneyVisible || !t.money)
}
