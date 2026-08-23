import { Chip, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import moment from 'moment'
import toast from 'react-hot-toast'

import {
  AdminDataGrid,
  AdminFilterBar,
  AdminGridContainer,
  OpsMetricTile,
  OpsSurfaceCard
} from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { updateTicketBaseUrl } from 'src/utils/utils'
import TicketStatusComponent from 'src/pages/components/ticket-status'
import { ops } from 'src/styles/opsSurface'
import { useAppDispatch, useAppSelector } from 'src/store/hooks'
import { useAdminListUrlSync } from 'src/hooks/useAdminListUrlSync'
import {
  fetchRaiseConcern,
  selectRaiseConcern,
  setRaiseConcernFilters,
  setRaiseConcernPage,
  setRaiseConcernSearch
} from 'src/store/slices/supportSlice'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function ConcernByUsers() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items, total, page, limit, search, filters, counts, loading, error } =
    useAppSelector(selectRaiseConcern)
  const searchTimer = useRef(null)
  const [searchInput, setSearchInput] = useState('')
  const reasonFilter = filters.reason || ''

  const { pushQuery } = useAdminListUrlSync({
    router,
    pathname: '/apps/concern-by-user',
    queryMap: { reason: 'reason' },
    onHydrate: values => {
      if (values.search) {
        setSearchInput(values.search)
        dispatch(setRaiseConcernSearch(values.search))
      }
      if (values.reason) dispatch(setRaiseConcernFilters({ reason: values.reason }))
      if (values.page) dispatch(setRaiseConcernPage({ page: Number(values.page) }))
    }
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    void dispatch(fetchRaiseConcern())
  }, [dispatch, page, limit, search, reasonFilter])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const reload = () => void dispatch(fetchRaiseConcern())

  const scheduleSearch = value => {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      dispatch(setRaiseConcernSearch(value.trim()))
      pushQuery({ search: value.trim(), reason: reasonFilter, page: 1 })
    }, 400)
  }

  const setReason = reason => {
    dispatch(setRaiseConcernFilters({ reason }))
    pushQuery({ search, reason, page: 1 })
  }

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
        p.value === 'yes' || p.value === true ? (
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
          {p.row?.booking_details?._id ? String(p.row.booking_details._id).slice(0, 10) + '…' : '—'}
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
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.raise_concern} cb={reload} />
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
            value={fmtInt(counts?.total)}
            hint='All concerns'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:cash-refund'
            label='Refund related'
            value={fmtInt(counts?.refund_related)}
            hint='Flagged'
            tone={(counts?.refund_related || 0) > 0 ? 'warn' : 'default'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:account-arrow-left'
            label='Coach left'
            value={fmtInt(counts?.coach_left)}
            hint='Reason filter'
            onClick={() => setReason('coach_left_session')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:filter-variant' label='Matching' value={fmtInt(total)} hint='After filters' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name, email, subject, reason…'
            searchValue={searchInput}
            onSearchChange={e => scheduleSearch(e.target.value)}
            onRefresh={reload}
            resultCount={total}
            helperText='Server-paginated. Update status inline. Open User 360 for full context.'
          >
            <Chip
              size='small'
              clickable
              label='All reasons'
              onClick={() => setReason('')}
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
              label={`Coach left · ${fmtInt(counts?.coach_left)}`}
              onClick={() => setReason(reasonFilter === 'coach_left_session' ? '' : 'coach_left_session')}
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
              rows={items}
              columns={columns}
              loading={loading}
              getRowHeight={() => 64}
              emptyMessage='No tickets match'
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page: page - 1, pageSize: limit }}
              onPaginationModelChange={m => {
                dispatch(setRaiseConcernPage({ page: m.page + 1, limit: m.pageSize }))
                pushQuery({ search, reason: reasonFilter, page: m.page + 1 })
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
