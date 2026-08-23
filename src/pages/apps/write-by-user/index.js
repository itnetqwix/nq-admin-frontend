import { Chip, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
  fetchWriteUs,
  selectWriteUs,
  setWriteUsFilters,
  setWriteUsPage,
  setWriteUsSearch
} from 'src/store/slices/supportSlice'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

export default function WriteByUsers() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items, total, page, limit, search, filters, counts, loading, error } = useAppSelector(selectWriteUs)
  const searchTimer = useRef(null)
  const [searchInput, setSearchInput] = useState('')
  const statusFilter = filters.status || ''

  const { pushQuery } = useAdminListUrlSync({
    router,
    pathname: '/apps/write-by-user',
    queryMap: { status: 'status' },
    onHydrate: values => {
      if (values.search) {
        setSearchInput(values.search)
        dispatch(setWriteUsSearch(values.search))
      }
      if (values.status) dispatch(setWriteUsFilters({ status: values.status }))
      if (values.page) dispatch(setWriteUsPage({ page: Number(values.page) }))
    }
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    void dispatch(fetchWriteUs())
  }, [dispatch, page, limit, search, statusFilter])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const reload = () => void dispatch(fetchWriteUs())

  const scheduleSearch = value => {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      dispatch(setWriteUsSearch(value.trim()))
      pushQuery({ search: value.trim(), status: statusFilter, page: 1 })
    }, 400)
  }

  const setStatus = value => {
    dispatch(setWriteUsFilters({ status: value }))
    pushQuery({ search, status: value, page: 1 })
  }

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
    { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 140 },
    {
      field: 'kind',
      headerName: 'Type',
      width: 130,
      renderCell: p => (
        <Chip
          size='small'
          label={p.row.kind === 'connect' ? 'Connect' : 'Contact'}
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10 }}
        />
      )
    },
    {
      field: 'company',
      headerName: 'Company',
      flex: 0.8,
      minWidth: 120,
      renderCell: p => p.row.company || '—'
    },
    {
      field: 'description',
      headerName: 'Message',
      flex: 1.4,
      minWidth: 200,
      sortable: false,
      renderCell: p => (
        <Typography sx={{ fontSize: 12, color: ops.body }} noWrap>
          {p.row.description || '—'}
        </Typography>
      )
    },
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
        <TicketStatusComponent params={params} base={updateTicketBaseUrl.write_us} cb={reload} />
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
            value={fmtInt(counts?.total)}
            hint='All feedback'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <OpsMetricTile
            icon='mdi:alert-circle-outline'
            label='Open-ish'
            value={fmtInt(counts?.open)}
            hint='open / in_progress / pending'
            tone={(counts?.open || 0) > 0 ? 'warn' : 'success'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <OpsMetricTile icon='mdi:filter-variant' label='Matching' value={fmtInt(total)} hint='After filters' />
        </Grid>
      </Grid>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <AdminFilterBar
            searchPlaceholder='Name, email, subject…'
            searchValue={searchInput}
            onSearchChange={e => scheduleSearch(e.target.value)}
            onRefresh={reload}
            resultCount={total}
            helperText='Server-paginated. Update ticket status inline; changes sync to the user record.'
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
                onClick={() => setStatus(s.v)}
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
              rows={items}
              columns={columns}
              loading={loading}
              getRowHeight={() => 64}
              emptyMessage='No feedback match'
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page: page - 1, pageSize: limit }}
              onPaginationModelChange={m => {
                dispatch(setWriteUsPage({ page: m.page + 1, limit: m.pageSize }))
                pushQuery({ search, status: statusFilter, page: m.page + 1 })
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </AdminGridContainer>
        </AdminPageSection>
      </OpsSurfaceCard>
    </AdminPageShell>
  )
}
