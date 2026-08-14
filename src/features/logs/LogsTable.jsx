import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { SURFACE_FILTERS } from './clientSurface'

export default function LogsTable(p) {
  const {
    tab, total, loadTab, loading, presetName, setPresetName, saveCurrentPreset, applyFilters,
    emptyFilters, setFilters, setPage, syncUrl, filters, showRichFilters, showApiFilters,
    showSecFilters, showNotifFilters, showFileFilters, presets, applyPreset, deletePreset,
    rows, columns, page, pageSize, setPageSize, setDetail, sessions
  } = p
  return (
        <Stack spacing={2}>
          <AdminFilterBar
            resultCount={total}
            onRefresh={() => void loadTab(true)}
            refreshLoading={loading}
            helperText='Filters sync into the URL. Save presets to reuse across devices.'
            endAdornment={
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <TextField
                  size='small'
                  placeholder='Preset name'
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  sx={{ width: 140 }}
                />
                <Button size='small' variant='outlined' onClick={saveCurrentPreset} sx={{ textTransform: 'none' }}>
                  Save preset
                </Button>
                <Button size='small' variant='contained' onClick={applyFilters} sx={{ textTransform: 'none', bgcolor: ops.indigo }}>
                  Apply
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => {
                    const cleared = emptyFilters()
                    setFilters(cleared)
                    setPage(0)
                    syncUrl(tab, cleared, 0)
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Stack>
            }
          >
            {showRichFilters ? (
              <>
                {SURFACE_FILTERS.map(s => (
                  <Chip
                    key={s.value || 'all'}
                    size='small'
                    clickable
                    label={s.label}
                    onClick={() => setFilters(f => ({ ...f, surface: s.value }))}
                    sx={{
                      height: 28,
                      fontFamily: ops.mono,
                      fontSize: 11,
                      bgcolor: filters.surface === s.value ? ops.softMint : ops.canvas,
                      color: filters.surface === s.value ? ops.live : ops.body,
                      border: `1px solid ${filters.surface === s.value ? ops.live : ops.hairline}`
                    }}
                  />
                ))}
                {showApiFilters ? (
                  <>
                    <TextField
                      size='small'
                      label='Path'
                      value={filters.path}
                      onChange={e => setFilters(f => ({ ...f, path: e.target.value }))}
                      sx={{ minWidth: 160 }}
                    />
                    <TextField
                      size='small'
                      select
                      label='Method'
                      value={filters.method}
                      onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}
                      sx={{ minWidth: 110 }}
                    >
                      <MenuItem value=''>Any</MenuItem>
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size='small'
                      select
                      label='Min status'
                      value={filters.minStatus}
                      onChange={e => setFilters(f => ({ ...f, minStatus: e.target.value }))}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value=''>Any</MenuItem>
                      <MenuItem value='400'>4xx+</MenuItem>
                      <MenuItem value='500'>5xx+</MenuItem>
                    </TextField>
                  </>
                ) : null}
                {showSecFilters || showNotifFilters ? (
                  <TextField
                    size='small'
                    label='Search'
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    sx={{ minWidth: 160 }}
                  />
                ) : null}
                {showSecFilters ? (
                  <TextField
                    size='small'
                    select
                    label='Action'
                    value={filters.action}
                    onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value=''>All</MenuItem>
                    {tab === 'admin' ? (
                      [
                        ['login', 'Signed in'],
                        ['login_failed', 'Login failed'],
                        ['invite_admin', 'Invite'],
                        ['assign_admin_role', 'Role change'],
                        ['update_admin_permissions', 'Permissions']
                      ].map(([v, l]) => (
                        <MenuItem key={v} value={v}>
                          {l}
                        </MenuItem>
                      ))
                    ) : (
                      <>
                        <MenuItem value='login'>login</MenuItem>
                        <MenuItem value='login_failed'>login_failed</MenuItem>
                        <MenuItem value='login_locked'>login_locked</MenuItem>
                      </>
                    )}
                  </TextField>
                ) : null}
                {showFileFilters ? (
                  <TextField
                    size='small'
                    select
                    label='Action'
                    value={filters.action}
                    onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value=''>All uploads</MenuItem>
                    <MenuItem value='clip_created'>clip_created</MenuItem>
                    <MenuItem value='session_uploaded'>session_uploaded</MenuItem>
                  </TextField>
                ) : null}
                {showApiFilters || showSecFilters ? (
                  <TextField
                    size='small'
                    label='IP'
                    value={filters.ip}
                    onChange={e => setFilters(f => ({ ...f, ip: e.target.value }))}
                    sx={{ minWidth: 130 }}
                  />
                ) : null}
                <TextField
                  size='small'
                  label='User id'
                  value={filters.userId}
                  onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  size='small'
                  type='date'
                  label='From'
                  InputLabelProps={{ shrink: true }}
                  value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                />
                <TextField
                  size='small'
                  type='date'
                  label='To'
                  InputLabelProps={{ shrink: true }}
                  value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                />
              </>
            ) : (
              <TextField
                size='small'
                label='User id'
                value={filters.userId}
                onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                sx={{ minWidth: 200 }}
              />
            )}
          </AdminFilterBar>

          {presets.length ? (
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1 }}>
              {presets.map(p => (
                <Chip
                  key={p.id || p.name}
                  size='small'
                  label={`${p.name} · ${p.tab || 'api'}`}
                  onClick={() => applyPreset(p)}
                  onDelete={() => deletePreset(p.id)}
                  sx={{ fontFamily: ops.mono, fontSize: 11 }}
                />
              ))}
            </Stack>
          ) : null}

          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, color: ops.mute }}>
            {total.toLocaleString()} rows
            {tab === 'api' ? ' · retention 14d' : ''}
          </Typography>

          <AdminGridContainer>
            <AdminDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              paginationMode='server'
              rowCount={total}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={m => {
                setPage(m.page)
                setPageSize(m.pageSize)
              }}
              onRowClick={params => setDetail(params.row)}
              emptyMessage='No log rows'
              emptyDescription='Widen filters or switch tab.'
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' }
              }}
            />
          </AdminGridContainer>

          {tab === 'login' && sessions.length ? (
            <AdminPageSection title='Active / recent sessions' subtitle='From auth_session for filtered user.'>
              <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
                <Stack spacing={0}>
                  {sessions.map(s => (
                    <Box
                      key={s.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${ops.hairline}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap'
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {s.deviceLabel || 'Device'} · {s.platform || '—'}
                        </Typography>
                        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                          {s.publicId} · {s.ipAddress || 'no ip'} · {s.loginMethod || '—'}
                          {s.revokedAt ? ' · revoked' : ''}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }}>
                        last {s.lastUsedAt ? formatOpsDateTime(s.lastUsedAt, { withSeconds: false }) : '—'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </OpsSurfaceCard>
            </AdminPageSection>
          ) : null}
        </Stack>
  )
}
