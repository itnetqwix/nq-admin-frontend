import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'

function marketLabel(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'trainer') return 'Trainer'
  if (t === 'trainee') return 'Trainee'
  return 'Admin-only'
}

export function buildAdminRoleColumns({ canAssign, busyId, roleList, onAssign, openOverride, setDevicesUser }) {
  return [
    {
      field: 'fullname',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: p => (
        <Typography
          component={Link}
          href={`/apps/users/${p.row.id}`}
          sx={{ fontSize: 13, color: ops.ink, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {p.row.fullname || '—'}
        </Typography>
      )
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'invite_status',
      headerName: 'Status',
      width: 110,
      renderCell: p => {
        const invited = p.row.invite_status === 'invited'
        return (
          <Chip
            size='small'
            label={invited ? 'Invited' : 'Active'}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: invited ? ops.softAmber : ops.lime,
              color: ops.night
            }}
          />
        )
      }
    },
    {
      field: 'account_type',
      headerName: 'Marketplace',
      width: 120,
      renderCell: p => (
        <Chip
          size='small'
          label={marketLabel(p.row.account_type)}
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.canvasSoft2 }}
        />
      )
    },
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
      field: 'last_action',
      headerName: 'Last action',
      width: 180,
      sortable: false,
      renderCell: p => {
        const a = p.row.last_action
        if (!a?.action) return <Typography sx={{ fontSize: 12, color: ops.mute }}>—</Typography>
        return (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 11, lineHeight: 1.35 }} title={a.reason || ''}>
            {a.action}
            <br />
            {a.at ? formatOpsDateTime(a.at, { withSeconds: false }) : ''}
          </Typography>
        )
      }
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
      width: 180,
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
      field: 'activity',
      headerName: 'Activity',
      width: 100,
      sortable: false,
      renderCell: p => (
        <Button
          component={Link}
          href={`/apps/logs?tab=admin&userId=${p.row.id}`}
          size='small'
          sx={{ textTransform: 'none', fontSize: 12 }}
        >
          Logs
        </Button>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      valueGetter: p => formatOpsDateTime(p.row.invited_at || p.row.createdAt, { withSeconds: false })
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
}
