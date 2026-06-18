import { Box, Button, Chip, Link as MuiLink, Stack } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import { AbilityContext } from 'src/layouts/components/acl/Can'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  useAdminConfirm
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import { CustomButton } from 'src/pages/components/common'
import { useCommon } from 'src/hooks/useCommon'
import moment from 'moment'
import RefundPopups from 'src/pages/components/modal/RefundPopups'
import toast from 'react-hot-toast'
import authConfig from 'src/configs/auth'
import { refundWalletSession } from 'src/services/financeApi'
import { BookedSession, debouncedSearchMedicine, isCurrentDateBefore } from 'src/utils/utils'
import BookingDetailDrawer from 'src/pages/components/modal/BookingDetailDrawer'

const STATUS_COLORS = {
  canceled: 'error',
  booked: 'info',
  confirmed: 'success',
  completed: 'warning'
}

export default function Booking() {
  const ability = useContext(AbilityContext)
  const canRefund = ability?.can('update', 'admin-action-refund') ?? true
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const [openRefundPopup, setOpenRefundPopup] = useState(false)
  const [paymentIntentDetails, setPaymentIntentDetails] = useState({})
  const [bookingId, setBookingId] = useState(null)
  const [refundRow, setRefundRow] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailBookingId, setDetailBookingId] = useState(null)
  const [detailListRow, setDetailListRow] = useState(null)

  const common = useCommon()
  const { bookingList, getBookingList } = common

  useEffect(() => {
    getBookingList()
  }, [])

  const showRefundPopup = row => {
    if (!canRefund) return
    if (!row?.payment_intent_id) {
      void handleWalletRefund(row)
      return
    }
    setRefundRow(row)
    setOpenRefundPopup(true)
    setBookingId(row._id)
    getPaymentIntentDetails({ payment_intent_id: row.payment_intent_id })
  }

  const handleWalletRefund = async row => {
    const traineeId = row?.trainee_id || row?.trainee_info?._id || row?.trainee_info?.id
    if (!row?._id || !traineeId) {
      toast.error('Missing session or trainee id for wallet refund')
      return
    }
    const ok = await confirm({
      title: 'Refund wallet-paid session?',
      message: 'Funds return to the trainee wallet or escrow path.',
      detail: `Booking ${row._id}`,
      confirmLabel: 'Refund',
      variant: 'warning'
    })
    if (!ok) return
    try {
      await refundWalletSession({
        sessionId: String(row._id),
        traineeId: String(traineeId),
        kind: 'booking',
        reason: 'admin_booking_wallet_refund'
      })
      toast.success('Wallet refund submitted')
      getBookingList()
    } catch (e) {
      toast.error(e?.message || 'Wallet refund failed')
    }
  }

  const requestConfirmBooking = async id => {
    const ok = await confirm({
      title: 'Confirm this booking?',
      message: 'The trainer will be notified and the session moves to confirmed.',
      detail: `Booking ${id}`,
      confirmLabel: 'Confirm',
      variant: 'default'
    })
    if (!ok) return
    onConfirmBooking(id)
  }

  const requestCancelBooking = async id => {
    const ok = await confirm({
      title: 'Cancel this session?',
      message: 'The session will be marked canceled. Refunds may be required separately.',
      detail: `Booking ${id}`,
      confirmLabel: 'Cancel session',
      variant: 'danger'
    })
    if (!ok) return
    onCancelBooking(id)
  }

  const openBookingDetail = row => {
    setDetailBookingId(row._id)
    setDetailListRow(row)
    setDetailOpen(true)
  }

  const columns = [
    {
      field: '_id',
      headerName: 'Booking Id',
      width: 250,
      renderCell: params => (
        <MuiLink
          component='button'
          type='button'
          variant='body2'
          onClick={() => openBookingDetail(params.row)}
          sx={{ textAlign: 'left' }}
        >
          {params.row._id}
        </MuiLink>
      )
    },
    {
      field: 'booked_date',
      headerName: 'Booking Date',
      width: 150,
      renderCell: params => moment(params.row.booked_date).format('MM-DD-YY')
    },
    { field: 'session_start_time', headerName: 'Start Time', width: 150 },
    { field: 'session_end_time', headerName: 'End Time', width: 150 },
    {
      field: 'trainer_info',
      headerName: 'Trainer Name',
      width: 200,
      renderCell: params => params?.row?.trainer_info?.fullName
    },
    {
      field: 'trainee_info',
      headerName: 'Trainee Name',
      width: 200,
      renderCell: params => params?.row?.trainee_info?.fullName
    },
    {
      field: 'status',
      headerName: 'Actions',
      width: 380,
      sortable: false,
      renderCell: params => (
        <Stack direction='row' spacing={0.75} alignItems='center' flexWrap='wrap' useFlexGap>
          <Chip
            size='small'
            label={params.row.status}
            color={STATUS_COLORS[params.row.status] || 'default'}
          />
          {params.row.status === 'canceled' ? (
            params?.row?.refund_status === 'refunded' ? (
              <Chip size='small' label={params.row.refund_status} variant='outlined' />
            ) : canRefund ? (
              <Button size='small' variant='outlined' onClick={() => showRefundPopup(params.row)}>
                Start refund
              </Button>
            ) : (
              <Chip size='small' label='Refund restricted' variant='outlined' />
            )
          ) : null}
          {params.row.status === BookedSession.booked ? (
            isCurrentDateBefore(params.row.start_time) ? (
              <>
                <Button
                  size='small'
                  variant='contained'
                  onClick={() => void requestConfirmBooking(params.row._id)}
                >
                  {BookedSession.confirm}
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  onClick={() => void requestCancelBooking(params.row._id)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Chip size='small' label='Not accepted' color='error' variant='outlined' />
                {params?.row?.refund_status === 'refunded' ? (
                  <Chip size='small' label={params.row.refund_status} variant='outlined' />
                ) : canRefund ? (
                  <Button size='small' variant='outlined' onClick={() => showRefundPopup(params.row)}>
                    Start refund
                  </Button>
                ) : (
                  <Chip size='small' label='Refund restricted' variant='outlined' />
                )}
              </>
            )
          ) : null}
          {params.row.status === BookedSession.confirmed ? (
            <Button
              size='small'
              variant='outlined'
              color='error'
              onClick={() => void requestCancelBooking(params.row._id)}
            >
              Cancel
            </Button>
          ) : null}
        </Stack>
      )
    }
  ]

  const handleCloseRefundPopup = () => {
    setOpenRefundPopup(false)
    setRefundRow(null)
  }

  const onConformRefund = (paymentIntentId, reason) => {
    startRefund({ payment_intent_id: paymentIntentId, booking_id: bookingId, reason })
  }

  const getPaymentIntentDetails = params => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {})
      },
      body: JSON.stringify(params)
    }
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/transaction/get-payment-intent', options)
      .then(data => data.json())
      .then(response => {
        if (response.code === 400) return
        setPaymentIntentDetails(response?.data ?? {})
      })
      .catch(() => {})
  }

  function onConfirmBooking(id) {
    updateBooking({ booked_status: 'confirmed', id })
  }

  function onCancelBooking(id) {
    updateBooking({ booked_status: 'canceled', id })
  }

  const updateBooking = params => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify(params)
    }
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + `/user/update-booked-session/${params.id}`, options)
      .then(data => data.json())
      .then(() => getBookingList())
      .catch(() => {})
  }

  const startRefund = params => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (!storedToken) {
      toast.error('Sign in required to process refunds')
      return
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`
      },
      body: JSON.stringify(params)
    }
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/transaction/create-refund', options)
      .then(data => data.json())
      .then(response => {
        if (response.code === 400 || response.code === 403 || String(response?.status).toLowerCase() === 'fail') {
          toast.error(response?.error || 'Refund was not completed')
          return
        }
        toast.success('Refund completed; amount returns to the trainee funding source.', { duration: 2000 })
        getBookingList()
        setBookingId(null)
        setPaymentIntentDetails({})
        setOpenRefundPopup(false)
      })
      .catch(e => {
        toast.error(e?.message || 'Refund request failed')
      })
  }

  const [tableData, setTableData] = useState([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (bookingList) setTableData(bookingList)
  }, [bookingList])

  async function getSearchValue(value) {
    const searchResults = await debouncedSearchMedicine(value, bookingList, '_id')
    setTableData(searchResults)
  }

  return (
    <>
      <form noValidate autoComplete='off'>
        <AdminPageShell
          title='Bookings'
          subtitle='Sessions, confirmations, cancellations, and refunds. Search by booking id.'
          actions={
            <CustomButton component={Link} variant='contained' href='/apps/booking' startIcon={<MenuIcon />}>
              Settings
            </CustomButton>
          }
          contentSx={{ p: 0 }}
        >
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Booking id…'
              searchValue={searchText}
              onSearchChange={e => {
                setSearchText(e.target.value)
                void getSearchValue(e.target.value)
              }}
              resultCount={tableData?.length}
              helperText='Click a booking id to open the detail drawer with escrow and finance links.'
            />
            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={tableData ?? []}
                columns={columns}
                getRowHeight={() => 56}
                columnHeaderHeight={48}
                clickableRows
                onRowClick={p => openBookingDetail(p.row)}
              />
            </AdminGridContainer>
          </AdminPageSection>
        </AdminPageShell>
      </form>

      <RefundPopups
        paymentIntentDetails={paymentIntentDetails}
        bookingPreview={refundRow}
        handleClose={handleCloseRefundPopup}
        open={openRefundPopup}
        onConform={onConformRefund}
      />

      <BookingDetailDrawer
        open={detailOpen}
        bookingId={detailBookingId}
        listRow={detailListRow}
        canRefund={canRefund}
        onClose={() => {
          setDetailOpen(false)
          setDetailBookingId(null)
          setDetailListRow(null)
        }}
        onConfirm={requestConfirmBooking}
        onRequestCancel={requestCancelBooking}
        onRequestRefund={row => showRefundPopup(row)}
        onActionComplete={() => getBookingList()}
      />

      {ConfirmDialog}
    </>
  )
}
