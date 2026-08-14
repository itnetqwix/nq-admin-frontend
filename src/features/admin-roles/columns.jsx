import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'

export function buildAdminRoleColumns({ canAssign, busyId, roleList, onAssign, openOverride, setDevicesUser }) {
  return [
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

}
