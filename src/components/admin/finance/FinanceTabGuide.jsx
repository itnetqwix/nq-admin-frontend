import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const TAB_GUIDES = {
  0: {
    title: 'Overview',
    body:
      'Start here for escrow totals, anomaly counts, and one-click reconcile jobs. Use the metric cards to jump into filtered escrow or queue tabs.'
  },
  1: {
    title: 'Ledger',
    body:
      'Immutable wallet ledger entries — credits, debits, escrow holds, releases, and payouts. Filter by reference type when tracing a session or top-up.'
  },
  2: {
    title: 'Transactions',
    body:
      'Stripe PaymentIntents and checkout records. Search by PI id, user id, or session id to find a charge before opening escrow or refunds.'
  },
  3: {
    title: 'Escrow',
    body:
      'Active and historical holds with full fee breakdown (subtotal, surge, processing, tax). Release to coach, refund trainee, or flag a dispute.'
  },
  4: {
    title: 'Refunds',
    body:
      'Refund queue and status — pending, processing, completed, or failed. Pair with Transactions when a refund looks stuck.'
  },
  5: {
    title: 'Payouts',
    body:
      'Coach payout batches awaiting approval or already sent to Stripe Connect. Approve after verifying escrow was released.'
  },
  6: {
    title: 'Stuck top-ups',
    body:
      'Wallet top-ups pending longer than 30 minutes. Run reconcile from Overview or release manually after confirming Stripe state.'
  },
  7: {
    title: 'Top-up history',
    body:
      'Historical wallet top-ups for support lookups — amount, status, and Stripe reference.'
  },
  8: {
    title: 'Audit log',
    body:
      'Finance admin actions — wallet adjustments, escrow overrides, and migration events.'
  }
}

export default function FinanceTabGuide({ tab }) {
  const guide = TAB_GUIDES[tab]
  if (!guide) return null

  return (
    <Alert severity='info' icon={false} sx={{ mb: 2, py: 1.5 }}>
      <Typography variant='subtitle2' fontWeight={700}>
        {guide.title}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        {guide.body}
      </Typography>
    </Alert>
  )
}

export function FinanceTabLegend() {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant='caption' color='text.secondary'>
        Tip: Overview → Escrow for release blockers · Transactions for PI lookup · Refunds for failed
        wallet returns
      </Typography>
    </Box>
  )
}
