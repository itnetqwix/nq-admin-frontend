import { useQuery } from '@tanstack/react-query'
import Typography from '@mui/material/Typography'
import { searchAdmin } from 'src/services/commandApi'
import LessonDrawer from './LessonDrawer'
import { DrawerError, DrawerLoading } from './shared'

/**
 * A payment is opened by its Stripe id (pi_…). It resolves to the lesson it paid for and shows that
 * lesson's Money tab, so there is one place that explains where a payment's money is.
 */
export default function PaymentDrawer({ id }) {
  const q = useQuery({ queryKey: ['payment-resolve', id], queryFn: () => searchAdmin(id), retry: false })
  if (q.isLoading) return <DrawerLoading />
  if (q.isError) return <DrawerError error={q.error} onRetry={q.refetch} />
  const booking = q.data?.bookings?.[0]
  if (!booking) {
    return (
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        No lesson is linked to <code>{id}</code>. It may be a wallet top-up or tip rather than a lesson payment. Look it up in Finance → Transactions.
      </Typography>
    )
  }
  return <LessonDrawer id={booking.id} initialTab='money' />
}
