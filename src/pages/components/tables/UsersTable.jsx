import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import { getImageUrl } from 'src/utils/utils'
import { useAdminRealtime } from 'src/context/AdminRealtimeContext'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { ops } from 'src/styles/opsSurface'

/**
 * Online trainers/trainees table.
 * `embedded` — render as a dashboard panel (no nested page shell).
 */
export default function ActiveUsersTable({ embedded = false }) {
  const router = useRouter()
  const { onlineUsers, socketConnected, refreshOnlineUsers } = useAdminRealtime()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const base = (onlineUsers || []).map(u => ({
      ...u,
      id: u._id || u.id,
      presence: 'Online'
    }))
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter(u => {
      const blob = [u.fullname, u.email, u.account_type, u.category, u.mobile_no]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [onlineUsers, search])

  const columns = [
    {
      field: 'image',
      headerName: 'Avatar',
      width: 80,
      sortable: false,
      renderCell: params => (
        <Avatar
          alt={params?.row?.fullname || 'User'}
          src={
            getImageUrl(params?.row?.profile_picture) ??
            'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
          }
          sx={{ width: 40, height: 40 }}
        />
      )
    },
    {
      field: 'fullname',
      headerName: 'Name',
      flex: 1,
      minWidth: 140,
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500 }} noWrap>
            {p.row.fullname || '—'}
          </Typography>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
            {p.row.email || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'account_type',
      headerName: 'Role',
      width: 110,
      renderCell: p => (
        <Chip
          size='small'
          label={p.row.account_type || '—'}
          sx={{ fontFamily: ops.mono, fontSize: 10, height: 22 }}
        />
      )
    },
    { field: 'category', headerName: 'Category', width: 100 },
    {
      field: 'wallet_amount',
      headerName: 'Wallet',
      width: 100,
      valueGetter: p =>
        p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(0)}` : '—'
    },
    {
      field: 'presence',
      headerName: 'Presence',
      width: 100,
      renderCell: () => (
        <Chip
          size='small'
          label='Online'
          sx={{
            fontFamily: ops.mono,
            fontSize: 10,
            height: 22,
            bgcolor: '#AAFFEC',
            color: '#1A8F76'
          }}
        />
      )
    }
  ]

  const filterBar = (
    <AdminFilterBar
      searchPlaceholder='Name, email, role…'
      searchValue={search}
      onSearchChange={e => setSearch(e.target.value)}
      onRefresh={() => void refreshOnlineUsers()}
      resultCount={rows.length}
      helperText='Click a row to open User 360.'
    />
  )

  const grid = (
    <AdminGridContainer height={embedded ? 360 : undefined}>
      <AdminDataGrid
        autoHeight={false}
        rows={rows}
        columns={columns}
        onRowClick={p => {
          const id = p.row?.id || p.row?._id
          if (id) router.push(`/apps/users/${id}`)
        }}
        clickableRows
        emptyMessage='Nobody online right now'
        emptyDescription='Presence updates when trainers or trainees connect.'
      />
    </AdminGridContainer>
  )

  if (embedded) {
    return (
      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16 }}>
                Who is online
              </Typography>
              <Typography sx={{ fontSize: 13, color: ops.mute, mt: 0.5 }}>
                Trainers and trainees with an active session
              </Typography>
            </Box>
            <Chip
              size='small'
              label={socketConnected ? 'Live' : 'Polling'}
              sx={{
                fontFamily: ops.mono,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: socketConnected ? ops.lime : ops.canvasSoft2,
                color: ops.night
              }}
            />
          </Stack>
        </Box>
        <Box sx={{ px: 2.5, pb: 2 }}>
          {filterBar}
          {grid}
        </Box>
      </OpsSurfaceCard>
    )
  }

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
              label={socketConnected ? 'Live · connected' : 'Connecting…'}
              sx={{
                fontFamily: ops.mono,
                fontSize: 11,
                bgcolor: socketConnected ? ops.lime : ops.canvasSoft2,
                color: ops.night,
                fontWeight: 700
              }}
            />
            <Button size='small' variant='outlined' onClick={() => void refreshOnlineUsers()}>
              Refresh
            </Button>
          </Stack>
        }
        contentSx={{ p: 0 }}
      >
        <AdminPageSection>
          {filterBar}
          {grid}
        </AdminPageSection>
      </AdminPageShell>
    </Box>
  )
}
