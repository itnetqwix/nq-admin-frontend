import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button, Chip, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  OpsMetricTile,
  OpsSurfaceCard,
  useAdminConfirm
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { useCommon } from 'src/hooks/useCommon'
import RefundPopups from 'src/pages/components/modal/RefundPopups'
import BookingDetailDrawer from 'src/pages/components/modal/BookingDetailDrawer'
import { FilterChip } from 'src/features/users/chips'
import {
  isRefundTerminal,
  personDisplayName,
  refundReasonLabel,
  refundStatusLabel
} from 'src/features/bookings/refundLabels'
import { cancelAdminBooking, createAdminRefund, getPaymentIntentDetails } from 'src/services/bookingApi'
import { refundWalletSession } from 'src/services/financeApi'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { BookedSession, isCurrentDateBefore } from 'src/utils/utils'
import { ops } from 'src/styles/opsSurface'

void refundWalletSession

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'booked', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'refund', label: 'Refunds' }
]

const STATUS_TONE = {
  booked: { bg: ops.softIndigo, color: ops.indigoDeep },
  confirmed: { bg: ops.softMint, color: '#0B7A4B' },
  completed: { bg: ops.canvasSoft2, color: ops.body },
  canceled: { bg: ops.errorSoft, color: ops.error }
}

function matchesSearch(row, q) {
  const s = String(q || '')
    .trim()
    .toLowerCase()
  if (!s) return true
  const blobs = [
    row._id,
    row.status,
    row.refund_status,
    row.refund_reason,
    row.payment_intent_id,
    row.trainer_info?.fullName,
    row.trainer_info?.email,
    row.trainee_info?.fullName,
    row.trainee_info?.email
  ]
  return blobs.some(v => String(v || '').toLowerCase().includes(s))
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.completed
  return (
    <Chip
      size='small'
      label={status || '—'}
      sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: tone.bg, color: tone.color }}
    />
  )
}

function PersonCell({ info, id }) {
  const name = personDisplayName(info, id)
  const email = info?.email
  if (!id && name === '—') return '—'
  return (
    <Box sx={{ lineHeight: 1.25, py: 0.5 }}>
      {id ? (
        <MuiLink component={Link} href={`/apps/users/${id}`} onClick={e => e.stopPropagation()} underline='hover'>
          {name}
        </MuiLink>
      ) : (
        <Typography variant='body2'>{name}</Typography>
      )}
      {email ? (
        <Typography variant='caption' display='block' color='text.secondary' noWrap>
          {email}
        </Typography>
      ) : null}
    </Box>
  )
}

export default function Booking() {
  const router = useRouter()
  const ability = useContext(AbilityContext)
  const canRefund = ability?.can('update', 'admin-action-refund') ?? true
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const { bookingList, getBookingList } = useCommon()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [openRefundPopup, setOpenRefundPopup] = useState(false)
  const [paymentIntentDetails, setPaymentIntentDetails] = useState({})
  const [refundRow, setRefundRow] = useState(null)
  const [detailId, setDetailId] = useState(null)

  useEffect(() => {
    void getBookingList()
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query?.bookingId
    if (typeof q === 'string' && q.trim()) setDetailId(q.trim())
  }, [router.isReady, router.query?.bookingId])

  const rows = useMemo(() => {
    const list = Array.isArray(bookingList) ? bookingList : []
    return list.filter(row => {
      if (!matchesSearch(row, search)) return false
      if (!statusFilter) return true
      if (statusFilter === 'refund') return Boolean(row.refund_status)
      return String(row.status) === statusFilter
    })
  }, [bookingList, search, statusFilter])

  const counts = useMemo(() => {
    const list = Array.isArray(bookingList) ? bookingList : []
    const by = { booked: 0, confirmed: 0, completed: 0, canceled: 0, refund: 0 }
    for (const row of list) {
      if (by[row.status] != null) by[row.status] += 1
      if (row.refund_status) by.refund += 1
    }
    return { total: list.length, ...by }
  }, [bookingList])

  const detailRow = useMemo(
    () => (Array.isArray(bookingList) ? bookingList.find(r => String(r._id) === String(detailId)) : null),
    [bookingList, detailId]
  )

  const openDetail = id => {
    if (!id) return
    setDetailId(String(id))
    void router.replace({ pathname: '/apps/booking', query: { bookingId: String(id) } }, undefined, { shallow: true })
  }

  const closeDetail = () => {
    setDetailId(null)
    const q = { ...router.query }
    delete q.bookingId
    void router.replace({ pathname: '/apps/booking', query: q }, undefined, { shallow: true })
  }

  const showRefundPopup = row => {
    if (!row?._id || !canRefund) return
    if (isRefundTerminal(row.refund_status)) {
      toast.error('Refund already completed or in progress for this booking')
      return
    }
    setRefundRow(row)
    setOpenRefundPopup(true)
    setPaymentIntentDetails({})
    if (row.payment_intent_id) {
      void getPaymentIntentDetails(row.payment_intent_id).then(setPaymentIntentDetails).catch(() => setPaymentIntentDetails({}))
    }
  }

  const requestCancel = async id => {
    const ok = await confirm({
      title: 'Cancel this session?',
      message:
        'Cancels the booking and starts a refund to the enthusiast. Wallet credits are usually instant; card refunds take 5–10 business days. The coach cannot take this slot afterward.',
      detail: `Booking: ${id}`,
      confirmLabel: 'Cancel and refund',
      variant: 'danger',
      reasonRequired: true,
      reasonLabel: 'Why is ops canceling?'
    })
    if (!ok) return
    try {
      const result = await cancelAdminBooking(id, ok.reason)
      if (result?.refunded) toast.success('Session canceled and refund started')
      else if (result?.refundError)
        toast.error(`Canceled, but refund failed: ${result.refundError}`)
      else toast.success('Session canceled')
      void getBookingList()
    } catch (e) {
      toast.error(e?.message || 'Cancel failed')
    }
  }

  const onConformRefund = async (paymentIntentId, reason) => {
    if (!refundRow?._id) return
    try {
      await createAdminRefund({
        bookingId: refundRow._id,
        paymentIntentId,
        reason
      })
      toast.success('Refund submitted. Wallet is instant; cards take 5–10 business days.')
      setOpenRefundPopup(false)
      setRefundRow(null)
      void getBookingList()
    } catch (e) {
      toast.error(e?.message || 'Refund was not completed')
    }
  }

  const columns = [
      {
        field: '_id',
        headerName: 'Booking',
        width: 128,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{String(p.row._id).slice(-8)}</Typography>
        )
      },
      {
        field: 'is_instant',
        headerName: 'Type',
        width: 120,
        renderCell: p => (
          <Typography variant='body2'>{p.row.is_instant ? (p.row.instant_phase ? `Instant · ${p.row.instant_phase}` : 'Instant') : 'Scheduled'}</Typography>
        )
      },
      {
        field: 'start_time',
        headerName: 'When',
        width: 168,
        renderCell: p => (
          <Box>
            <Typography variant='body2'>{formatOpsDateTime(p.row.start_time || p.row.booked_date, { withSeconds: false })}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {p.row.session_start_time || ''}
              {p.row.session_end_time ? `–${p.row.session_end_time}` : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'trainer_info',
        headerName: 'Coach',
        flex: 1,
        minWidth: 150,
        renderCell: p => <PersonCell info={p.row.trainer_info} id={p.row.trainer_id} />
      },
      {
        field: 'trainee_info',
        headerName: 'Enthusiast',
        flex: 1,
        minWidth: 150,
        renderCell: p => <PersonCell info={p.row.trainee_info} id={p.row.trainee_id} />
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 90,
        renderCell: p => (p.row.amount != null ? `$${Number(p.row.amount).toFixed(2)}` : '—')
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: p => <StatusChip status={p.row.status} />
      },
      {
        field: 'refund_status',
        headerName: 'Refund',
        width: 200,
        renderCell: p => {
          if (!p.row.refund_status && !p.row.refund_reason) return '—'
          return (
            <Box sx={{ py: 0.5 }}>
              <Typography variant='body2'>{refundStatusLabel(p.row.refund_status)}</Typography>
              <Tooltip title={p.row.refund_reason || ''}>
                <Typography variant='caption' color='text.secondary' noWrap display='block'>
                  {refundReasonLabel(p.row.refund_reason)}
                </Typography>
              </Tooltip>
            </Box>
          )
        }
      },
      {
        field: 'actions',
        headerName: '',
        width: 210,
        sortable: false,
        renderCell: p => {
          const refundDone = isRefundTerminal(p.row.refund_status)
          const refundFailed = String(p.row.refund_status || '').toLowerCase() === 'failed'
          const canCancelRow =
            p.row.status === BookedSession.booked || p.row.status === BookedSession.confirmed
          const showRefund =
            canRefund &&
            !refundDone &&
            (p.row.status === BookedSession.canceled ||
              refundFailed ||
              (p.row.status === BookedSession.booked && !isCurrentDateBefore(p.row.start_time)))
          return (
            <Stack direction='row' spacing={0.5} onClick={e => e.stopPropagation()}>
              <Button size='small' onClick={() => openDetail(p.row._id)}>
                View
              </Button>
              {canCancelRow ? (
                <Button size='small' color='error' onClick={() => void requestCancel(p.row._id)}>
                  Cancel
                </Button>
              ) : null}
              {showRefund ? (
                <Button size='small' color='warning' onClick={() => showRefundPopup(p.row)}>
                  {refundFailed ? 'Retry' : 'Refund'}
                </Button>
              ) : null}
            </Stack>
          )
        }
      }
    ]

  return (
    <>
      <AdminPageShell
        bare
        icon='mdi:calendar-clock-outline'
        eyebrow='Operations · bookings'
        title='Bookings'
        subtitle='Open a row for the full case: people, payment path, refund reason, and timeline. Finance deep-links land here.'
        actions={
          <Stack direction='row' spacing={1}>
            <Chip component={Link} href='/apps/finance?tab=refunds' label='Refund queue' clickable variant='outlined' size='small' />
            <Chip component={Link} href='/apps/finance?tab=escrow' label='Escrow' clickable variant='outlined' size='small' />
          </Stack>
        }
      >
        <Stack direction='row' spacing={1.5} useFlexGap flexWrap='wrap' sx={{ mb: 2 }}>
          <Box sx={{ flex: '1 1 140px', minWidth: 120 }}>
            <OpsMetricTile label='Sessions' value={String(counts.total)} hint='Loaded' />
          </Box>
          <Box sx={{ flex: '1 1 140px', minWidth: 120 }}>
            <OpsMetricTile label='Pending' value={String(counts.booked)} hint='Awaiting coach' tone='warn' onClick={() => setStatusFilter('booked')} />
          </Box>
          <Box sx={{ flex: '1 1 140px', minWidth: 120 }}>
            <OpsMetricTile label='Canceled' value={String(counts.canceled)} hint='Need refund check' />
          </Box>
          <Box sx={{ flex: '1 1 140px', minWidth: 120 }}>
            <OpsMetricTile label='Refunds' value={String(counts.refund)} hint='Any refund status' tone='accent' onClick={() => setStatusFilter('refund')} />
          </Box>
        </Stack>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Booking id, name, email, PI…'
              searchValue={search}
              onSearchChange={e => setSearch(e.target.value)}
              onRefresh={() => void getBookingList()}
              resultCount={rows.length}
              helperText='Click a row for the case drawer. Cancel requires a reason and starts the refund. Coaches confirm from the app.'
            >
              {STATUS_CHIPS.map(s => (
                <FilterChip
                  key={s.value || 'all'}
                  active={statusFilter === s.value}
                  label={s.label}
                  count={s.value ? counts[s.value] : counts.total}
                  onClick={() => setStatusFilter(s.value)}
                />
              ))}
            </AdminFilterBar>
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={rows}
                columns={columns}
                getRowId={r => r._id || r.id}
                getRowHeight={() => 64}
                onRowClick={p => openDetail(p.row._id)}
                emptyMessage='No bookings match'
                emptyDescription='Clear filters or search by booking id, name, or email.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>
      </AdminPageShell>

      <BookingDetailDrawer
        open={Boolean(detailId)}
        bookingId={detailId}
        listRow={detailRow}
        canRefund={canRefund}
        onClose={closeDetail}
        onRequestCancel={requestCancel}
        onRequestRefund={showRefundPopup}
        onActionComplete={() => void getBookingList()}
      />

      <RefundPopups
        paymentIntentDetails={paymentIntentDetails}
        bookingPreview={refundRow}
        handleClose={() => {
          setOpenRefundPopup(false)
          setRefundRow(null)
        }}
        open={openRefundPopup}
        onConform={onConformRefund}
      />
      {ConfirmDialog}
    </>
  )
}
