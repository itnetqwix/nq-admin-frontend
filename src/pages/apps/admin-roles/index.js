import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import {
  assignAdminRole,
  createCustomRole,
  deleteCustomRole,
  getRolesMatrix,
  listAdminRoles,
  updateAdminPermissions,
  updateCustomRole
} from 'src/services/adminLogsApi'
import { revokeUserSession } from 'src/services/user360Api'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'
import { ALL_PERMISSION_KEYS, PERM_GROUPS, ROLE_MATRIX } from 'src/configs/adminRoleMatrix'
import Grid from '@mui/material/Grid'

const BUILTIN_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Operator', 'Support', 'Auditor']

function emptyPerms() {
  return Object.fromEntries(ALL_PERMISSION_KEYS.map(k => [k, false]))
}

function cellTone(role, key, matrixSource) {
  if (role === 'SuperAdmin') return { label: 'ALL', bg: ops.lime, color: ops.night }
  const map = matrixSource?.[role] || ROLE_MATRIX[role]
  if (!map) return { label: '—', bg: ops.canvasSoft2, color: ops.mute }
  const v = map[key]
  if (v === true) return { label: '✓', bg: '#AAFFEC', color: '#1A8F76' }
  if (v === false) return { label: '✗', bg: ops.errorSoft, color: ops.error }
  return { label: '✗', bg: ops.errorSoft, color: ops.error }
}

export default function AdminRolesPage() {
  const ability = useContext(AbilityContext)
  const canAssign = ability?.can('update', 'admin-nav-admin-settings') ?? false
  const [items, setItems] = useState([])
  const [matrix, setMatrix] = useState(null)
  const [roleList, setRoleList] = useState(BUILTIN_ROLES)
  const [customRoles, setCustomRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [focusRole, setFocusRole] = useState('Auditor')
  const [overrideUser, setOverrideUser] = useState(null)
  const [draftPerms, setDraftPerms] = useState({})
  const [savingOverride, setSavingOverride] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleLabel, setNewRoleLabel] = useState('')
  const [newRolePerms, setNewRolePerms] = useState(() => emptyPerms())
  const [savingRole, setSavingRole] = useState(false)
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [devicesUser, setDevicesUser] = useState(null)
  const [revokingSessionId, setRevokingSessionId] = useState(null)
  const [adminSearch, setAdminSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [admins, roles] = await Promise.all([listAdminRoles(), getRolesMatrix()])
      setItems((admins?.items || []).map(a => ({ ...a, id: a.id })))
      setMatrix(roles?.matrix || ROLE_MATRIX)
      const all = roles?.roles?.length ? roles.roles : BUILTIN_ROLES
      setRoleList(all)
      setCustomRoles(roles?.custom || [])
    } catch (e) {
      toast.error(e?.message || 'Unable to load admin roles')
      setItems([])
      setMatrix(ROLE_MATRIX)
      setRoleList(BUILTIN_ROLES)
      setCustomRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onAssign = async (userId, admin_role) => {
    if (!canAssign) {
      toast.error('You cannot assign roles')
      return
    }
    setBusyId(userId)
    try {
      await assignAdminRole(userId, admin_role)
      toast.success(`Role set to ${admin_role}`)
      await load()
    } catch (e) {
      toast.error(e?.message || 'Assign failed')
    } finally {
      setBusyId(null)
    }
  }

  const openOverride = row => {
    const role = row.admin_role || 'Admin'
    const base = matrix?.[role] || ROLE_MATRIX[role] || emptyPerms()
    const current = row.admin_permissions && typeof row.admin_permissions === 'object' ? row.admin_permissions : base
    setDraftPerms({ ...base, ...current })
    setOverrideUser(row)
  }

  const saveOverride = async () => {
    if (!overrideUser || !canAssign) return
    setSavingOverride(true)
    try {
      await updateAdminPermissions(overrideUser.id, draftPerms)
      toast.success('Permissions updated')
      setOverrideUser(null)
      await load()
    } catch (e) {
      toast.error(e?.message || 'Update failed')
    } finally {
      setSavingOverride(false)
    }
  }

  const openCreateRole = () => {
    setNewRoleName('')
    setNewRoleLabel('')
    setNewRolePerms(emptyPerms())
    setCreateOpen(true)
  }

  const saveCreateRole = async () => {
    if (!canAssign) return
    setSavingRole(true)
    try {
      await createCustomRole({
        name: newRoleName.trim(),
        label: newRoleLabel.trim() || newRoleName.trim(),
        permissions: newRolePerms
      })
      toast.success(`Role ${newRoleName} created`)
      setCreateOpen(false)
      setFocusRole(newRoleName.trim())
      await load()
    } catch (e) {
      toast.error(e?.message || 'Create failed')
    } finally {
      setSavingRole(false)
    }
  }

  const openEditTemplate = () => {
    if (!customRoles.includes(focusRole)) return
    setNewRolePerms({ ...(matrix?.[focusRole] || emptyPerms()) })
    setNewRoleLabel(focusRole)
    setEditTemplateOpen(true)
  }

  const saveEditTemplate = async () => {
    if (!canAssign || !customRoles.includes(focusRole)) return
    setSavingRole(true)
    try {
      const data = await updateCustomRole(focusRole, {
        permissions: newRolePerms,
        push_to_assigned: true
      })
      const n = data?.pushed_to_assigned ?? 0
      toast.success(`Template ${focusRole} updated · pushed to ${n} admin(s)`)
      setEditTemplateOpen(false)
      await load()
    } catch (e) {
      toast.error(e?.message || 'Update failed')
    } finally {
      setSavingRole(false)
    }
  }

  const onDeleteCustom = async () => {
    if (!canAssign || !customRoles.includes(focusRole)) return
    const ok = window.confirm(`Delete custom role "${focusRole}"? Admins must be reassigned first.`)
    if (!ok) return
    try {
      await deleteCustomRole(focusRole)
      toast.success('Role deleted')
      setFocusRole('Auditor')
      await load()
    } catch (e) {
      toast.error(e?.message || 'Delete failed')
    }
  }

  const roleCounts = useMemo(() => {
    const c = Object.fromEntries(roleList.map(r => [r, 0]))
    items.forEach(a => {
      const r = a.admin_role || 'SuperAdmin'
      c[r] = (c[r] || 0) + 1
    })
    return c
  }, [items, roleList])

  const filteredAdmins = useMemo(() => {
    const q = adminSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter(a =>
      [a.fullname, a.email, a.admin_role, a.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [items, adminSearch])

  const columns = [
    { field: 'fullname', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'admin_role',
      headerName: 'Role',
      width: 140,
      renderCell: p => (
        <Chip
          size='small'
          label={p.row.admin_role || 'SuperAdmin'}
          sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft2 }}
        />
      )
    },
    {
      field: 'overrides',
      headerName: 'Overrides',
      width: 100,
      renderCell: p =>
        p.row.has_overrides || p.row.admin_permissions ? (
          <Chip size='small' label='Custom' sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.softAmber }} />
        ) : (
          <Typography sx={{ fontSize: 12, color: ops.mute }}>—</Typography>
        )
    },
    {
      field: 'devices',
      headerName: 'Devices',
      width: 200,
      sortable: false,
      renderCell: p => {
        const s = p.row.session_summary || {}
        return (
          <Button
            size='small'
            onClick={() => setDevicesUser(p.row)}
            sx={{ textTransform: 'none', fontFamily: ops.mono, fontSize: 11 }}
          >
            {s.active_count != null ? `${s.active_count} active` : '—'}
            {s.last_device ? ` · ${String(s.last_device).slice(0, 18)}` : ''}
          </Button>
        )
      }
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      valueGetter: p => formatOpsDateTime(p.row.createdAt, { withSeconds: false })
    },
    {
      field: 'assign',
      headerName: 'Assign',
      width: 180,
      sortable: false,
      renderCell: params =>
        canAssign ? (
          <TextField
            select
            size='small'
            value={params.row.admin_role || 'SuperAdmin'}
            disabled={busyId === params.row.id}
            onChange={e => void onAssign(params.row.id, e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {roleList.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Typography sx={{ fontSize: 12, color: ops.mute }}>Read only</Typography>
        )
    },
    {
      field: 'edit_perms',
      headerName: 'Permissions',
      width: 120,
      sortable: false,
      renderCell: p =>
        canAssign && p.row.admin_role !== 'SuperAdmin' ? (
          <Button size='small' onClick={() => openOverride(p.row)} sx={{ textTransform: 'none' }}>
            Edit
          </Button>
        ) : (
          '—'
        )
    }
  ]

  const matrixSource = matrix || ROLE_MATRIX

  return (
    <AdminPageShell
      bare
      eyebrow='Admin access · RBAC'
      icon='mdi:shield-account-outline'
      title='Admin roles.'
      subtitle='Page access + CRUD actions. Deny-by-default when restricted. Changes write to the audit trail.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {canAssign ? (
            <Button
              size='small'
              variant='contained'
              onClick={openCreateRole}
              sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
            >
              New role
            </Button>
          ) : null}
          <Chip
            component={Link}
            href='/apps/audit-logs?action=role'
            label='Role audit'
            clickable
            variant='outlined'
            size='small'
          />
          <Chip
            component={Link}
            href='/apps/audit-logs?action=permission'
            label='Permission audit'
            clickable
            variant='outlined'
            size='small'
          />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:account-group' label='Admins' value={String(items.length)} tone='accent' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:shield-key' label='SuperAdmins' value={String(roleCounts.SuperAdmin || 0)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:pencil-lock'
            label='Can assign'
            value={canAssign ? 'Yes' : 'No'}
            tone={canAssign ? 'success' : 'warn'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:shield-plus' label='Custom roles' value={String(customRoles.length)} tone='accent' />
        </Grid>
      </Grid>

      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }} alignItems='center'>
        {roleList.map(r => (
          <Chip
            key={r}
            clickable
            onClick={() => setFocusRole(r)}
            label={`${r} · ${roleCounts[r] || 0}${customRoles.includes(r) ? ' ★' : ''}`}
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              bgcolor: focusRole === r ? ops.ink : ops.canvasSoft2,
              color: focusRole === r ? '#fff' : ops.body
            }}
          />
        ))}
      </Stack>
      {canAssign && customRoles.includes(focusRole) ? (
        <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
          <Button size='small' onClick={openEditTemplate} sx={{ textTransform: 'none' }}>
            Edit template
          </Button>
          <Button size='small' color='error' onClick={() => void onDeleteCustom()} sx={{ textTransform: 'none' }}>
            Delete role
          </Button>
        </Stack>
      ) : null}

      <AdminPageSection title='Administrators' subtitle='Assign a role or edit per-user permission overrides.'>
        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
            <AdminFilterBar
              searchPlaceholder='Search name, email, role…'
              searchValue={adminSearch}
              onSearchChange={e => setAdminSearch(e.target.value)}
              resultCount={filteredAdmins.length}
              onRefresh={() => void load()}
              refreshLoading={loading}
            />
          </Box>
          <AdminGridContainer>
            <AdminDataGrid
              autoHeight={false}
              rows={filteredAdmins}
              columns={columns}
              loading={loading}
              pageSizeOptions={[25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              emptyMessage='No administrators match.'
            />
          </AdminGridContainer>
        </OpsSurfaceCard>
      </AdminPageSection>

      <AdminPageSection
        title='Permission matrix'
        subtitle={`Focus: ${focusRole}. SuperAdmin = unrestricted. Missing keys deny for all other roles.`}
      >
        <OpsSurfaceCard sx={{ p: 0, overflow: 'auto', maxHeight: 560 }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft, minWidth: 220 }}>
                  Permission
                </TableCell>
                {roleList.map(r => (
                  <TableCell
                    key={r}
                    align='center'
                    sx={{
                      fontFamily: ops.mono,
                      fontSize: 11,
                      bgcolor: focusRole === r ? ops.canvasSoft2 : ops.canvasSoft,
                      fontWeight: focusRole === r ? 700 : 400
                    }}
                  >
                    {r}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PERM_GROUPS.map(group => (
                <Fragment key={group.title}>
                  <TableRow>
                    <TableCell
                      colSpan={roleList.length + 1}
                      sx={{
                        bgcolor: ops.night,
                        color: ops.onNight,
                        fontFamily: ops.mono,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {group.title}
                    </TableCell>
                  </TableRow>
                  {group.keys.map(key => (
                    <TableRow key={key} hover>
                      <TableCell sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</TableCell>
                      {roleList.map(r => {
                        const tone = cellTone(r, key, matrixSource)
                        return (
                          <TableCell key={`${r}-${key}`} align='center'>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: tone.bg,
                                color: tone.color,
                                fontFamily: ops.mono,
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 36,
                                justifyContent: 'center'
                              }}
                            >
                              {tone.label}
                            </Box>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </OpsSurfaceCard>
      </AdminPageSection>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Create custom role</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              size='small'
              label='Role name (PascalCase)'
              placeholder='FinanceOps'
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              helperText='Letters, numbers, underscore — not a built-in name'
            />
            <TextField
              size='small'
              label='Display label'
              value={newRoleLabel}
              onChange={e => setNewRoleLabel(e.target.value)}
            />
          </Stack>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={newRolePerms[key] === true}
                        onChange={e => setNewRolePerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingRole || !newRoleName.trim()}
            onClick={() => void saveCreateRole()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Create role
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editTemplateOpen} onClose={() => setEditTemplateOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Edit template · {focusRole}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Saving pushes this permission set to every admin currently assigned this role.
          </Typography>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={newRolePerms[key] === true}
                        onChange={e => setNewRolePerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTemplateOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingRole}
            onClick={() => void saveEditTemplate()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Save template
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(overrideUser)} onClose={() => setOverrideUser(null)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ fontFamily: ops.sans }}>
          Edit permissions · {overrideUser?.fullname || overrideUser?.email}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 480 }}>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Role: {overrideUser?.admin_role}. Toggles write explicit overrides (deny-by-default for off).
          </Typography>
          {PERM_GROUPS.map(group => (
            <Box key={group.title} sx={{ mb: 2 }}>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1, textTransform: 'uppercase' }}>
                {group.title}
              </Typography>
              <Stack spacing={0.25}>
                {group.keys.map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size='small'
                        checked={draftPerms[key] === true}
                        onChange={e => setDraftPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={<Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>{key}</Typography>}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideUser(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={savingOverride}
            onClick={() => void saveOverride()}
            sx={{ textTransform: 'none', bgcolor: ops.ink }}
          >
            Save overrides
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(devicesUser)} onClose={() => setDevicesUser(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          Devices · {devicesUser?.fullname || devicesUser?.email}
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, fontSize: 13, color: ops.mute }}>
            Auth sessions for this admin — device, IP, location, last used. Revoke kicks that device off immediately.
          </Typography>
          {(devicesUser?.sessions || []).length ? (
            <Stack spacing={1.5}>
              {(devicesUser.sessions || []).map(s => (
                <Box
                  key={s.id}
                  sx={{
                    borderBottom: `1px solid ${ops.hairline}`,
                    pb: 1.25
                  }}
                >
                  <Stack direction='row' justifyContent='space-between' gap={1} flexWrap='wrap' alignItems='flex-start'>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {s.deviceLabel || 'Device'} · {s.platform || '—'}
                        {s.revokedAt ? ' · revoked' : s.trusted ? ' · trusted' : ''}
                      </Typography>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
                        {[
                          s.ipAddress || 'no ip',
                          s.loginMethod,
                          [s.city, s.region, s.country].filter(Boolean).join(', '),
                          s.browser,
                          s.os,
                          s.appVersion
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                        {[s.publicId, s.clientType, s.timezone].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                    <Stack alignItems='flex-end' spacing={0.5}>
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body }}>
                        {s.lastUsedAt ? formatOpsDateTime(s.lastUsedAt, { withSeconds: false }) : '—'}
                      </Typography>
                      {!s.revokedAt && devicesUser?.id ? (
                        <Button
                          size='small'
                          color='error'
                          disabled={revokingSessionId === s.id}
                          sx={{ textTransform: 'none', minWidth: 0 }}
                          onClick={async () => {
                            setRevokingSessionId(s.id)
                            try {
                              await revokeUserSession(devicesUser.id, s.id)
                              toast.success('Session revoked')
                              setDevicesUser(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      sessions: (prev.sessions || []).map(row =>
                                        row.id === s.id ? { ...row, revokedAt: new Date().toISOString() } : row
                                      )
                                    }
                                  : prev
                              )
                              void load()
                            } catch (e) {
                              toast.error(e?.message || 'Revoke failed')
                            } finally {
                              setRevokingSessionId(null)
                            }
                          }}
                        >
                          {revokingSessionId === s.id ? '…' : 'Revoke'}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, color: ops.mute }}>No sessions on record.</Typography>
          )}
          {devicesUser?.id ? (
            <Button
              component={Link}
              href={`/apps/logs?tab=login&userId=${devicesUser.id}`}
              size='small'
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Full login history →
            </Button>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDevicesUser(null)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  )
}

AdminRolesPage.acl = {
  action: 'read',
  subject: 'admin-nav-admin-settings'
}
