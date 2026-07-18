import { Chip, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import React, { useEffect, useMemo } from 'react'
import Link from 'next/link'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  OpsMetricTile,
  OpsSurfaceCard
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { useCommon } from 'src/hooks/useCommon'
import { updateTicketBaseUrl } from 'src/utils/utils'
import TicketStatusComponent from 'src/pages/components/ticket-status'
import { ops } from 'src/styles/opsSurface'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function WriteByUsers() {
  const common = useCommon()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const { writeByUsers, getWriteByUsers } = common

  useEffect(() => {
    getWriteByUsers()
  }, [])

  const filteredRows = useMemo(() => {
    let rows = writeByUsers ?? []
    if (statusFilter) {
      rows = rows.filter(r => String(r.ticket_status || '').toLowerCase() === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => {
      const hay = [row.name, row.email, row.subject, row.description, row.user_info?.email, row.user_info?.fullName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [writeByUsers, search, statusFilter])

  const openCount = useMemo(() => {
    return (writeByUsers ?? []).filter(r =>
      ['open', 'in_progress', 'pending'].includes(String(r.ticket_status || '').toLowerCase())
    ).length
  }, [writeByUsers])

  const columns = [
    {
      field: 'identity',
      headerName: 'From',
      flex: 1,
      minWidth: 180,
      sortable: false,
      renderCell: p => (
        <Stack sx={{ minWidth: 0, py: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
            {p.row.name || p.row.user_info?.fullName || '—'}
          </Typography>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
            {p.row.email || p.row.user_info?.email || '—'}
          </Typography>
        </Stack>
      )
    },
    { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 160 },
    {
      field: 'account_type',
      headerName: 'Role',
      width: 110,
      renderCell: params => (
        <Chip
          size='small'
          label={params?.row?.user_info?.account_type || '—'}
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10 }}
        />
      )
    },
    {
      field: 'user360',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: params => {
        const uid = params?.row?.user_id?._id || params?.row?.user_id
        if (!uid) return '—'
        return (
          <MuiLink component={Link} href={`/apps/users/${uid}`} variant='body2' sx={{ fontSize: 12 }}>
            User 360
          </MuiLink>
        )
      }
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      width: 180,
      renderCell: params => (
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.constact_us} cb={getWriteByUsers} />
      )
    }
  ]

  return (
    <AdminPageShell
      bare
      icon='mdi:message-text-outline'
      eyebrow='Operations'
      title='User feedback'
      subtitle='Contact-us tickets — search, filter status, update inline, open User 360.'
      actions={
        <Chip
          component={Link}
          href='/apps/concern-by-user'
          label='Support tickets'
          clickable
          variant='outlined'
          size='small'
        />
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:inbox-outline'
            label='Total'
            value={fmtInt((writeByUsers ?? []).length)}
            hint='All feedback'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:alert-circle-outline'
            label='Open-ish'
            value={fmtInt(openCount)}
            hint='open / in_progress / pending'
            tone={openCount > 0 ? 'warn' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile icon='mdi:filter-variant' label='Showing' value={fmtInt(filteredRows.length)} hint='After filters' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name, email, subject…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
            onRefresh={() => getWriteByUsers()}
            resultCount={filteredRows.length}
            helperText='Update ticket status inline; changes sync to the user record.'
          >
            {[
              { v: '', l: 'Any status' },
              { v: 'open', l: 'Open' },
              { v: 'in_progress', l: 'In progress' },
              { v: 'resolved', l: 'Resolved' },
              { v: 'closed', l: 'Closed' }
            ].map(s => (
              <Chip
                key={s.v || 'any'}
                size='small'
                clickable
                label={s.l}
                onClick={() => setStatusFilter(s.v)}
                sx={{
                  height: 28,
                  fontFamily: ops.mono,
                  fontSize: 11,
                  bgcolor: statusFilter === s.v ? ops.softIndigo : ops.canvas,
                  color: statusFilter === s.v ? ops.indigoDeep : ops.body,
                  border: `1px solid ${statusFilter === s.v ? ops.indigo : ops.hairline}`
                }}
              />
            ))}
          </AdminFilterBar>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={filteredRows}
              columns={columns}
              getRowHeight={() => 64}
              emptyMessage='No feedback match'
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
