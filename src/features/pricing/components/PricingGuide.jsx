import { AdminContextBanner } from 'src/components/admin'
import { PRICING_TAB_FLOW } from 'src/constants/revenueAdmin'

export { PRICING_TAB_FLOW as PRICING_FLOW }

const COPY_BY_TAB = {
  0: 'Set commission, product fees, and payment-method costs per region. Use the settlement tape to sanity-check coach payouts before you save.',
  1: 'Edit Locker tiers (Free → Max). US defaults: Plus $3.99/50 GB, Pro $8.99/200 GB, Max $13.99/500 GB. Marketing bullets show in Settings and on the locker plan strip. Save to publish.',
  2: 'Peak pricing adds an optional % on busy hours. Coaches can opt out individually in Manage trainers.',
  3: 'Run a $60 lesson through infra costs. Confirm margin before publishing.',
  4: 'Every Save creates a version. Existing bookings keep the snapshot they were charged under.'
}

export function PricingFlowStrip({ tab, onGoTab }) {
  const current = PRICING_TAB_FLOW[tab] || PRICING_TAB_FLOW[0]
  const next = PRICING_TAB_FLOW[tab + 1]
  const copy = COPY_BY_TAB[tab] || COPY_BY_TAB[0]

  return (
    <AdminContextBanner
      stepLabel={`${current.label} · step ${tab + 1} of ${PRICING_TAB_FLOW.length}`}
      title={current.hint}
      description={copy}
      nextLabel={next ? `Next: ${next.label}` : undefined}
      onNext={next ? () => onGoTab(next.tab) : undefined}
      links={[{ href: '/apps/promo-codes', label: 'Promo codes →' }]}
    />
  )
}
