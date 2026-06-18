import { Link as MuiLink } from '@mui/material'
import React, { useEffect } from 'react'

import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import { CustomButton } from 'src/pages/components/common'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { useCommon } from 'src/hooks/useCommon'
import { updateTicketBaseUrl } from 'src/utils/utils'
import TicketStatusComponent from 'src/pages/components/ticket-status'

export default function WriteByUsers() {
  const common = useCommon()
  const [search, setSearch] = React.useState('')
  const { writeByUsers, getWriteByUsers } = common

  useEffect(() => {
    getWriteByUsers()
  }, [])

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return writeByUsers ?? []
    return (writeByUsers ?? []).filter(row => {
      const hay = [row.name, row.email, row.subject, row.description, row.user_info?.email, row.user_info?.fullName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [writeByUsers, search])

  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone_number', headerName: 'Phone Number', width: 200 },
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
      field: 'ticket_status',
      headerName: 'Status',
      width: 200,
      renderCell: params => (
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.constact_us} cb={getWriteByUsers} />
      )
    }
  ]

  return (
    <form noValidate autoComplete='off'>
      <AdminPageShell
        title='User feedback'
        subtitle='Contact-us tickets and status. Open User 360 for full context.'
        actions={
          <CustomButton component={Link} variant='contained' href='/apps/concern-by-user' startIcon={<MenuIcon />}>
            Support tickets
          </CustomButton>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Search name, email, subject…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
            resultCount={filteredRows.length}
            helperText='Update ticket status inline; changes sync to the user record.'
          />
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
