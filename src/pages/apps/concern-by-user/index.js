import { Chip, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import React, { useEffect, useMemo } from 'react'
import Link from 'next/link'
import moment from 'moment'

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

export default function ConcernByUsers() {
  const common = useCommon()
  const [search, setSearch] = React.useState('')
  const [reasonFilter, setReasonFilter] = React.useState('')
  const { concernByUsers, getConcernByUsers } = common

  useEffect(() => {
    getConcernByUsers()
  }, [])

  const filteredRows = useMemo(() => {
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

  const refundRelated = useMemo(
    () => (concernByUsers ?? []).filter(r => r.is_releted_to_refund).length,
    [concernByUsers]
  )
  const coachLeft = useMemo(
    () => (concernByUsers ?? []).filter(r => r.reason === 'coach_left_session').length,
    [concernByUsers]
  )

  const columns = [
    {
      field: 'identity',
      headerName: 'From',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: p => (
        <Stack sx={{ minWidth: 0, py: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
            {p.row.name || p.row.user_info?.fullName || '—'}
          </Typography>
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
            {p.row.email || '—'}
          </Typography>
        </Stack>
      )
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 160,
      renderCell: p => (
        <Chip
          size='small'
          label={p.value || '—'}
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.canvasSoft2 }}
        />
      )
    },
    {
      field: 'is_releted_to_refund',
      headerName: 'Refund',
      width: 90,
      renderCell: p =>
        p.value ? (
          <Chip size='small' label='Yes' sx={{ height: 22, fontSize: 10, bgcolor: '#ffefcf', color: '#ab570a' }} />
        ) : (
          '—'
        )
    },
    { field: 'subject', headerName: 'Subject', width: 160 },
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
      field: 'booking',
      headerName: 'Booking',
      width: 140,
      sortable: false,
      renderCell: p => (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
          {p.row?.booking_details?._id
            ? String(p.row.booking_details._id).slice(0, 10) + '…'
            : '—'}
        </Typography>
      )
    },
    {
      field: 'booked_date',
      headerName: 'Booked',
      width: 110,
      renderCell: p =>
        p.row?.booking_details?.booked_date
          ? moment(p.row.booking_details.booked_date).format('MM-DD-YY')
          : '—'
    },
    {
      field: 'ticket_status',
      headerName: 'Status',
      width: 180,
      renderCell: params => (
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.raise_concern} cb={getConcernByUsers} />
      )
    }
  ]

  return (
    <AdminPageShell
      bare
      icon='mdi:lifebuoy'
      eyebrow='Operations'
      title='Support tickets'
      subtitle='Raise-concern queue — refunds, coach-left, status, User 360.'
      actions={
        <Chip
          component={Link}
          href='/apps/write-by-user'
          label='User feedback'
          clickable
          variant='outlined'
          size='small'
        />
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:lifebuoy'
            label='Total'
            value={fmtInt((concernByUsers ?? []).length)}
            hint='All concerns'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:cash-refund'
            label='Refund related'
            value={fmtInt(refundRelated)}
            hint='Flagged'
            tone={refundRelated > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:account-arrow-left'
            label='Coach left'
            value={fmtInt(coachLeft)}
            hint='Reason filter'
            onClick={() => setReasonFilter('coach_left_session')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:filter-variant' label='Showing' value={fmtInt(filteredRows.length)} hint='After filters' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name, email, subject, reason…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
            onRefresh={() => getConcernByUsers()}
            resultCount={filteredRows.length}
            helperText='Update status inline. Open User 360 for full context.'
          >
            <Chip
              size='small'
              clickable
              label='All reasons'
              onClick={() => setReasonFilter('')}
              sx={{
                height: 28,
                fontFamily: ops.mono,
                fontSize: 11,
                bgcolor: reasonFilter === '' ? ops.softIndigo : ops.canvas,
                color: reasonFilter === '' ? ops.indigoDeep : ops.body,
                border: `1px solid ${reasonFilter === '' ? ops.indigo : ops.hairline}`
              }}
            />
            <Chip
              size='small'
              clickable
              label={`Coach left · ${fmtInt(coachLeft)}`}
              onClick={() =>
                setReasonFilter(prev => (prev === 'coach_left_session' ? '' : 'coach_left_session'))
              }
              sx={{
                height: 28,
                fontFamily: ops.mono,
                fontSize: 11,
                bgcolor: reasonFilter === 'coach_left_session' ? ops.softIndigo : ops.canvas,
                color: reasonFilter === 'coach_left_session' ? ops.indigoDeep : ops.body,
                border: `1px solid ${reasonFilter === 'coach_left_session' ? ops.indigo : ops.hairline}`
              }}
            />
          </AdminFilterBar>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={filteredRows}
              columns={columns}
              getRowHeight={() => 64}
              emptyMessage='No tickets match'
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
