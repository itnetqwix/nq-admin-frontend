import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material'
import moment from 'moment'
import { AdminDataGrid, AdminFilterBar, AdminGridContainer } from 'src/components/admin'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { FilterChip, TYPE_CHIPS, STATUS_CHIPS, fmtInt } from './chips'

export default function DirectoryBody(p) {
  const {
    counts, setType, setStatus, pushQuery, search, typeFilter, statusFilter, fromDate, toDate,
    country, timeZone, category, loginType, setFiltersOpen, setPage, setDraft, setFromDate, setToDate,
    searchInput, scheduleSearch, load, loading, total, filtersOpen, activeAdvanced, draft,
    applyAdvanced, clearAdvanced, rows, columns, page, pageSize, setPageSize, router, setSearchInput
  } = p
  return (
    <>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:human-male-board'
              label='Trainers'
              value={counts ? fmtInt(counts.trainers) : '—'}
              hint='All time'
              tone='accent'
              onClick={() => setType('trainer')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-school-outline'
              label='Trainees'
              value={counts ? fmtInt(counts.trainees) : '—'}
              hint='All time'
              onClick={() => setType('trainee')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-clock-outline'
              label='Pending'
              value={counts ? fmtInt(counts.pending) : '—'}
              hint='Needs review'
              tone='warn'
              onClick={() => setStatus('pending')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:check-decagram-outline'
              label='Approved'
              value={counts ? fmtInt(counts.approved) : '—'}
              hint='Active'
              tone='success'
              onClick={() => setStatus('approved')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:close-octagon-outline'
              label='Rejected'
              value={counts ? fmtInt(counts.rejected) : '—'}
              hint='Denied'
              tone='danger'
              onClick={() => setStatus('rejected')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <OpsMetricTile
              icon='mdi:account-plus-outline'
              label='Joined 7d'
              value={counts ? fmtInt(counts.joined_7d) : '—'}
              hint='New accounts'
              tone='accent'
              onClick={() => {
                const to = moment().format('YYYY-MM-DD')
                const from = moment().subtract(7, 'days').format('YYYY-MM-DD')
                setDraft(d => ({ ...d, from, to }))
                setFromDate(from)
                setToDate(to)
                setFiltersOpen(true)
                setPage(1)
                pushQuery({
                  search,
                  account_type: typeFilter,
                  status: statusFilter,
                  from,
                  to,
                  country,
                  time_zone: timeZone,
                  category,
                  login_type: loginType
                })
              }}
            />
          </Grid>
        </Grid>

        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Name, email, mobile, user ID, referral…'
              searchValue={searchInput}
              onSearchChange={e => {
                const val = e.target.value
                setSearchInput(val)
                scheduleSearch(val)
              }}
              onRefresh={() => void load()}
              refreshLoading={loading}
              resultCount={total}
              helperText='Row click → User 360. Preview for a fast glance. Filters sync to the URL.'
            >
              {TYPE_CHIPS.map(t => (
                <FilterChip
                  key={t.value || 'all-type'}
                  active={typeFilter === t.value}
                  label={t.label}
                  count={
                    t.value === 'trainer'
                      ? counts?.trainers
                      : t.value === 'trainee'
                        ? counts?.trainees
                        : counts
                          ? (counts.trainers || 0) + (counts.trainees || 0)
                          : null
                  }
                  onClick={() => setType(t.value)}
                />
              ))}
              {STATUS_CHIPS.map(s => (
                <FilterChip
                  key={s.value || 'all-status'}
                  active={statusFilter === s.value}
                  label={s.label}
                  count={s.value ? counts?.[s.value] : null}
                  onClick={() => setStatus(s.value)}
                />
              ))}
              <Button
                size='small'
                variant={filtersOpen || activeAdvanced ? 'contained' : 'outlined'}
                onClick={() => setFiltersOpen(v => !v)}
                sx={{
                  textTransform: 'none',
                  height: 28,
                  fontSize: 12,
                  ...(filtersOpen || activeAdvanced
                    ? { bgcolor: ops.indigo, boxShadow: 'none' }
                    : {})
                }}
              >
                More filters{activeAdvanced ? ' · on' : ''}
              </Button>
            </AdminFilterBar>

            {filtersOpen ? (
              <Box
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: ops.radiusSm,
                  bgcolor: ops.canvas,
                  border: `1px solid ${ops.hairline}`
                }}
              >
                <Grid container spacing={1.5} alignItems='center'>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      size='small'
                      fullWidth
                      type='date'
                      label='Joined from'
                      InputLabelProps={{ shrink: true }}
                      value={draft.from}
                      onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      size='small'
                      fullWidth
                      type='date'
                      label='Joined to'
                      InputLabelProps={{ shrink: true }}
                      value={draft.to}
                      onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Country'
                      placeholder='US, IN…'
                      value={draft.country}
                      onChange={e => setDraft(d => ({ ...d, country: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Timezone'
                      placeholder='America/…'
                      value={draft.time_zone}
                      onChange={e => setDraft(d => ({ ...d, time_zone: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Category'
                      placeholder='sport…'
                      value={draft.category}
                      onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Login type'
                      placeholder='default / google'
                      value={draft.login_type}
                      onChange={e => setDraft(d => ({ ...d, login_type: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label='Min sessions'
                      inputProps={{ min: 0 }}
                      value={draft.min_sessions}
                      onChange={e => setDraft(d => ({ ...d, min_sessions: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label='Max sessions'
                      inputProps={{ min: 0 }}
                      value={draft.max_sessions}
                      onChange={e => setDraft(d => ({ ...d, max_sessions: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Stack direction='row' spacing={1}>
                      <Button
                        size='small'
                        variant='contained'
                        onClick={applyAdvanced}
                        sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
                      >
                        Apply
                      </Button>
                      <Button size='small' variant='outlined' onClick={clearAdvanced} sx={{ textTransform: 'none' }}>
                        Clear
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
                <Typography sx={{ mt: 1.25, fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                  Country = last login geo. Sessions = booked lessons (trainer or trainee role).
                </Typography>
              </Box>
            ) : null}

            <AdminGridContainer>
              <AdminDataGrid
                autoHeight={false}
                rows={rows}
                columns={columns}
                loading={loading}
                getRowHeight={() => 72}
                rowCount={total}
                paginationMode='server'
                paginationModel={{ page: page - 1, pageSize }}
                onPaginationModelChange={m => {
                  setPage(m.page + 1)
                  setPageSize(m.pageSize)
                }}
                onRowClick={p => {
                  const id = p.row?.id || p.row?._id
                  if (id) router.push(`/apps/users/${id}`)
                }}
                clickableRows
                emptyMessage='No users match these filters'
                emptyDescription='Try clearing dates, country, or status chips.'
              />
            </AdminGridContainer>
          </AdminPageSection>
        </OpsSurfaceCard>

    </>
  )
}
