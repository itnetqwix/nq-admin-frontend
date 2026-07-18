import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import { assignAdminRole, getRolesMatrix, listAdminRoles } from 'src/services/adminLogsApi'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'
import { ROLE_MATRIX } from 'src/configs/adminRoleMatrix'

const ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Operator', 'Support', 'Auditor']

const PERM_GROUPS = [
  {
    title: 'Navigation',
    keys: [
      'nav_home',
      'nav_people',
      'nav_trainers',
      'nav_trainees',
      'nav_operations',
      'nav_bookings',
      'nav_logs',
      'nav_audit_logs',
      'nav_ops_logs',
      'nav_business',
      'nav_finance',
      'nav_cms',
      'nav_clips',
      'nav_broadcasts',
      'nav_referrals',
      'nav_promo_codes',
      'nav_user_feedback',
      'nav_support_tickets',
      'nav_call_diagnostics'
    ]
  },
  {
    title: 'Actions',
    keys: [
      'can_manage_commission',
      'can_manage_pricing',
      'can_process_refund',
      'can_soft_delete_entities',
      'can_hard_delete',
      'can_export_logs',
      'can_view_security_logs',
      'can_resolve_ops',
      'can_assign_admin_roles'
    ]
  }
]

function cellTone(role, key) {
  if (role === 'SuperAdmin') return { label: 'ALL', bg: ops.lime, color: ops.night }
  const map = ROLE_MATRIX[role]
  if (!map) return { label: '—', bg: ops.canvasSoft2, color: ops.mute }
  const v = map[key]
  if (v === true) return { label: '✓', bg: '#AAFFEC', color: '#1A8F76' }
  if (v === false) return { label: '✗', bg: ops.errorSoft, color: ops.error }
  return { label: '—', bg: ops.canvasSoft2, color: ops.mute }
}

export default function AdminRolesPage() {
  const [items, setItems] = useState([])
  const [matrix, setMatrix] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [focusRole, setFocusRole] = useState('Auditor')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [admins, roles] = await Promise.all([listAdminRoles(), getRolesMatrix()])
      setItems((admins?.items || []).map(a => ({ ...a, id: a.id })))
      setMatrix(roles?.matrix || ROLE_MATRIX)
    } catch (e) {
      toast.error(e?.message || 'Unable to load admin roles (Super Admin only)')
      setItems([])
      setMatrix(ROLE_MATRIX)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onAssign = async (userId, admin_role) => {
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

  const roleCounts = useMemo(() => {
    const c = Object.fromEntries(ROLES.map(r => [r, 0]))
    items.forEach(a => {
      const r = a.admin_role || 'SuperAdmin'
      c[r] = (c[r] || 0) + 1
    })
    return c
  }, [items])

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
      field: 'createdAt',
      headerName: 'Joined',
      width: 160,
      valueGetter: p => formatOpsDateTime(p.row.createdAt, { withSeconds: false })
    },
    {
      field: 'assign',
      headerName: 'Assign',
      width: 200,
      sortable: false,
      renderCell: params => (
        <TextField
          select
          size='small'
          value={params.row.admin_role || 'SuperAdmin'}
          disabled={busyId === params.row.id}
          onChange={e => void onAssign(params.row.id, e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {ROLES.map(r => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
      )
    }
  ]

  const matrixSource = matrix || ROLE_MATRIX

  return (
    <AdminPageShell
      eyebrow='Settings · RBAC'
      icon='mdi:shield-account-outline'
      title='Admin roles.'
      subtitle='Dynamic permission matrix by role. Super Admin assigns roles; audit log records each change.'
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 3 }}>
        {ROLES.map(r => (
          <Chip
            key={r}
            clickable
            onClick={() => setFocusRole(r)}
            label={`${r} · ${roleCounts[r] || 0}`}
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              bgcolor: focusRole === r ? ops.ink : ops.canvasSoft2,
              color: focusRole === r ? '#fff' : ops.body
            }}
          />
        ))}
      </Stack>

      <AdminPageSection title='Administrators' subtitle='Assign a role — permissions expand from the matrix.'>
        <AdminGridContainer>
          <AdminDataGrid
            rows={items}
            columns={columns}
            loading={loading}
            pageSizeOptions={[25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          />
        </AdminGridContainer>
      </AdminPageSection>

      <AdminPageSection
        title='Permission matrix'
        subtitle={`Focus: ${focusRole}. SuperAdmin always has full access (no restriction map).`}
      >
        <OpsSurfaceCard sx={{ p: 0, overflow: 'auto' }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.canvasSoft, minWidth: 200 }}>
                  Permission
                </TableCell>
                {ROLES.map(r => (
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
                      colSpan={ROLES.length + 1}
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
                      {ROLES.map(r => {
                        const tone = cellTone(r, key)
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
        {focusRole !== 'SuperAdmin' && matrixSource[focusRole] ? (
          <Typography sx={{ mt: 1.5, fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
            {focusRole} denials:{' '}
            {Object.entries(matrixSource[focusRole])
              .filter(([, v]) => v === false)
              .map(([k]) => k)
              .join(', ') || 'none'}
          </Typography>
        ) : null}
      </AdminPageSection>
    </AdminPageShell>
  )
}

AdminRolesPage.acl = {
  action: 'read',
  subject: 'admin-nav-admin-settings'
}
