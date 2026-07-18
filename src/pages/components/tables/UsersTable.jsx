import { Avatar, Box, Button, Chip, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import { getImageUrl } from 'src/utils/utils'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'

export default function ActiveUsersTable() {
  const router = useRouter()
  const { onlineUsers, socketConnected, refreshOnlineUsers } = useAdminRealtime()
  const [trainerList, setTrainerList] = useState([])
  const [tableData, setTableData] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const rows = (onlineUsers || []).map(u => ({
      ...u,
      id: u._id || u.id,
      presence: 'Online'
    }))
    setTrainerList(rows)
  }, [onlineUsers])

  useEffect(() => {
    setTableData(trainerList)
  }, [trainerList])

  const handleSearch = searchText => {
    const filteredData = trainerList.filter(trainer =>
      trainer.fullname.toLowerCase().includes(searchText.toLowerCase())
    )
    setTableData(filteredData)
  }

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 100,
      renderCell: params => (
        <Avatar
          alt={params?.row?.fullname || 'User'}
          src={
            getImageUrl(params?.row?.profile_picture) ??
            'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
          }
          sx={{ width: 44, height: 44 }}
        />
      )
    },
    { field: 'fullname', headerName: 'Full Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'mobile_no', headerName: 'Mobile Number', width: 150 },
    { field: 'category', headerName: 'Category', width: 100 },
    { field: 'wallet_amount', headerName: 'Wallet Amount', width: 150 },
    { field: 'commission', headerName: 'Commission (%)', width: 150 },
    { field: 'login_type', headerName: 'Login Type', width: 150 },
    { field: 'account_type', headerName: 'Account Type', width: 150 },
    {
      field: 'presence',
      headerName: 'Presence',
      width: 110,
      renderCell: () => <Chip size='small' label='Online' color='success' variant='outlined' />
    }
  ]

  return (
    <Box sx={{ mt: 4, width: '100%' }}>
      <AdminPageShell
        icon='mdi:account-multiple-check-outline'
        title='Who is online now'
        subtitle='Trainers and trainees currently connected. Data refreshes over the admin realtime channel.'
        actions={
          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
            <Chip
              size='small'
              label={socketConnected ? 'Live · WebSocket' : 'Connecting…'}
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                bgcolor: socketConnected ? ops.lime : ops.canvasSoft2,
                color: ops.night,
                fontWeight: 700
              }}
            />
            <Button size='small' variant='outlined' onClick={() => void refreshOnlineUsers()}>
              Refresh from API
            </Button>
          </Stack>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name…'
            searchValue={search}
            onSearchChange={e => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
            resultCount={tableData.length}
          />
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={tableData ?? []}
              columns={columns}
              onRowClick={p => {
                const id = p.row?.id || p.row?._id
                if (id) router.push(`/apps/users/${id}`)
              }}
              clickableRows
            />
          </AdminGridContainer>
        </AdminPageSection>
      </AdminPageShell>
    </Box>
  )
}
