import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
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
  inviteAdmin,
  listAdminRoles,
  updateAdminPermissions,
  updateCustomRole
} from 'src/services/adminLogsApi'
import { ops } from 'src/styles/opsSurface'
import { ALL_PERMISSION_KEYS, ROLE_MATRIX } from 'src/configs/adminRoleMatrix'
import Grid from '@mui/material/Grid'
import { buildAdminRoleColumns } from './columns'
import PermissionMatrix from './PermissionMatrix'
import RoleDialogs from './RoleDialogs'


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
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('Admin')
  const [inviting, setInviting] = useState(false)
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

  const onInvite = async () => {
    if (!canAssign) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }
    setInviting(true)
    try {
      const data = await inviteAdmin({ email, fullname: inviteName.trim(), admin_role: inviteRole })
      toast.success(
        data?.granted
          ? `Admin access granted to ${email}. They can sign in with their existing password.`
          : `Invite sent to ${email}`
      )
      setInviteOpen(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('Admin')
      await load()
    } catch (e) {
      toast.error(e?.message || 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  const inviteRoles = roleList.filter(r => r !== 'SuperAdmin')

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
      [a.fullname, a.email, a.admin_role, a.account_type, a.invite_status, a.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [items, adminSearch])

  const columns = buildAdminRoleColumns({
    canAssign, busyId, roleList, onAssign, openOverride, setDevicesUser
  })


  const matrixSource = matrix || ROLE_MATRIX

  return (
    <AdminPageShell
      bare
      eyebrow='Admin access · RBAC'
      icon='mdi:shield-account-outline'
      title='Admin roles.'
      subtitle='Invite by email (new admin or existing trainer/trainee), assign a role, then open the person to see what they are doing.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          {canAssign ? (
            <>
              <Button
                size='small'
                variant='contained'
                onClick={() => setInviteOpen(true)}
                sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
              >
                Invite sub-admin
              </Button>
              <Button
                size='small'
                variant='outlined'
                onClick={openCreateRole}
                sx={{ textTransform: 'none' }}
              >
                New role
              </Button>
            </>
          ) : null}
          <Chip
            component={Link}
            href='/apps/logs?tab=admin'
            label='Access log'
            clickable
            variant='outlined'
            size='small'
          />
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
          <OpsMetricTile
            icon='mdi:email-fast-outline'
            label='Invited'
            value={String(items.filter(a => a.invite_status === 'invited').length)}
            tone='warn'
          />
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

      <AdminPageSection title='Administrators' subtitle='Invited until they sign in. Click a name for User 360, Logs for their admin activity. Same email can be trainer/trainee and admin.'>
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

      <PermissionMatrix
        focusRole={focusRole}
        roleList={roleList}
        cellTone={cellTone}
        matrixSource={matrixSource}
      />


      <RoleDialogs
        inviteOpen={inviteOpen}
        setInviteOpen={setInviteOpen}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteName={inviteName}
        setInviteName={setInviteName}
        inviteRoles={inviteRoles}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        inviting={inviting}
        onInvite={onInvite}
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        newRoleName={newRoleName}
        setNewRoleName={setNewRoleName}
        newRoleLabel={newRoleLabel}
        setNewRoleLabel={setNewRoleLabel}
        newRolePerms={newRolePerms}
        setNewRolePerms={setNewRolePerms}
        savingRole={savingRole}
        saveCreateRole={saveCreateRole}
        editTemplateOpen={editTemplateOpen}
        setEditTemplateOpen={setEditTemplateOpen}
        saveEditTemplate={saveEditTemplate}
        focusRole={focusRole}
        overrideUser={overrideUser}
        setOverrideUser={setOverrideUser}
        draftPerms={draftPerms}
        setDraftPerms={setDraftPerms}
        saveOverride={saveOverride}
        savingOverride={savingOverride}
        devicesUser={devicesUser}
        setDevicesUser={setDevicesUser}
        revokingSessionId={revokingSessionId}
        setRevokingSessionId={setRevokingSessionId}
      />
    </AdminPageShell>
  )
}

AdminRolesPage.acl = {
  action: 'read',
  subject: 'admin-nav-admin-settings'
}
