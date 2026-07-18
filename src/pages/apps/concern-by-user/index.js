import { Chip, Link as MuiLink, Stack } from '@mui/material'
import React, { useEffect } from 'react'

import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import { CustomButton } from 'src/pages/components/common'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { useCommon } from 'src/hooks/useCommon'
import moment from 'moment'
import { updateTicketBaseUrl } from 'src/utils/utils'
import TicketStatusComponent from 'src/pages/components/ticket-status'

export default function ConcernByUsers() {
  const common = useCommon()
  const [search, setSearch] = React.useState('')
  const [reasonFilter, setReasonFilter] = React.useState('')
  const { concernByUsers, getConcernByUsers } = common

  useEffect(() => {
    getConcernByUsers()
  }, [])

  const filteredRows = React.useMemo(() => {
    let rows = concernByUsers ?? []
    if (reasonFilter) {
      rows = rows.filter(row => String(row.reason ?? '') === reasonFilter)
    }
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => {
      const hay = [
        row.name,
        row.email,
        row.subject,
        row.reason,
        row.description,
        row.user_info?.email,
        row.user_info?.fullName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [concernByUsers, search, reasonFilter])

  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone_number', headerName: 'Phone Number', width: 200 },
    { field: 'reason', headerName: 'Reason', width: 200 },
    { field: 'is_releted_to_refund', headerName: 'Refund Request', width: 150 },
    { field: 'subject', headerName: 'Subject', width: 200 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'user_info',
      headerName: 'Ticket Raised By',
      width: 200,
      renderCell: params => params?.row?.user_info?.fullName
    },
    {
      field: 'account_type',
      headerName: 'Account Type',
      width: 150,
      renderCell: params => params?.row?.user_info?.account_type
    },
    {
      field: 'user360',
      headerName: 'User 360',
      width: 110,
      sortable: false,
      renderCell: params => {
        const uid = params?.row?.user_id?._id || params?.row?.user_id
        if (!uid) return '—'
        return (
          <MuiLink component={Link} href={`/apps/users/${uid}`} variant='body2'>
            Open
          </MuiLink>
        )
      }
    },
    {
      field: '_id',
      headerName: 'Booking ID',
      width: 300,
      renderCell: params => params?.row?.booking_details?._id
    },
    {
      field: 'booking_details',
      headerName: 'Booking Date',
      width: 200,
      renderCell: params =>
        params?.row?.booking_details?.booked_date
          ? moment(params.row.booking_details.booked_date).format('MM-DD-YY')
          : '—'
    },
    {
      field: 'status',
      headerName: 'Booking status',
      width: 200,
      renderCell: params => params?.row?.booking_details?.status
    },
    {
      field: 'amount',
      headerName: 'Booking Amount',
      width: 200,
      renderCell: params => params?.row?.booking_details?.amount
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      width: 200,
      renderCell: params => (
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.raise_concern} cb={getConcernByUsers} />
      )
    }
  ]

  return (
    <form noValidate autoComplete='off'>
      <AdminPageShell
        icon='mdi:lifebuoy'
        title='Support tickets'
        subtitle='Raise concern workflow: status, refunds, and links to User 360.'
        actions={
          <CustomButton component={Link} variant='contained' href='/apps/write-by-user' startIcon={<MenuIcon />}>
            User feedback
          </CustomButton>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Search name, email, subject, reason…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
            resultCount={filteredRows.length}
          >
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Chip
                size='small'
                label='All reasons'
                color={reasonFilter === '' ? 'primary' : 'default'}
                onClick={() => setReasonFilter('')}
              />
              <Chip
                size='small'
                label='Coach left session'
                color={reasonFilter === 'coach_left_session' ? 'primary' : 'default'}
                onClick={() =>
                  setReasonFilter(prev => (prev === 'coach_left_session' ? '' : 'coach_left_session'))
                }
              />
            </Stack>
          </AdminFilterBar>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={filteredRows}
              columns={columns}
              getRowHeight={() => 56}
              columnHeaderHeight={48}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </AdminPageShell>
    </form>
  )
}
