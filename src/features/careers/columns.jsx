import { Box, Chip, IconButton, Stack, Switch, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { ops } from 'src/styles/opsSurface'
import { APPLICATION_STATUSES, DEPARTMENTS, EMPLOYMENT_TYPES, JOB_STATUSES, LOCATION_TYPES, labelOf, statusChip } from './helpers'

export function buildJobColumns({ openEdit, requestDelete, handleToggle }) {
  return [
    {
      field: 'title',
      headerName: 'Role',
      flex: 1.6,
      minWidth: 220,
      renderCell: p => (
        <Box sx={{ minWidth: 0, py: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: ops.ink }} noWrap>
            {p.value}
          </Typography>
          <Typography sx={{ fontSize: 11, color: ops.mute }} noWrap>
            /{p.row.slug}
          </Typography>
        </Box>
      )
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 130,
      renderCell: p => (
        <Chip
          label={labelOf(DEPARTMENTS, p.value)}
          size='small'
          sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: ops.softIndigo, color: ops.indigoDeep }}
        />
      )
    },
    {
      field: 'employment_type',
      headerName: 'Type',
      width: 120,
      valueGetter: p => labelOf(EMPLOYMENT_TYPES, p.value)
    },
    {
      field: 'location_type',
      headerName: 'Location',
      width: 140,
      renderCell: p => (
        <Typography sx={{ fontSize: 12 }} noWrap>
          {labelOf(LOCATION_TYPES, p.row.location_type)}
          {p.row.location ? ` · ${p.row.location}` : ''}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: p => statusChip(p.value, JOB_STATUSES)
    },
    {
      field: 'published',
      headerName: 'Live',
      width: 80,
      sortable: false,
      renderCell: p => (
        <Switch
          size='small'
          checked={p.row.status === 'published'}
          onChange={() => handleToggle(p.row)}
          inputProps={{ 'aria-label': 'Publish job' }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: p => (
        <Stack direction='row' spacing={0.5}>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => openEdit(p.row)}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => requestDelete(p.row)}>
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ]
}

export function buildApplicationColumns({ openDetail }) {
  return [
    {
      field: 'full_name',
      headerName: 'Applicant',
      flex: 1.4,
      minWidth: 180,
      renderCell: p => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
            {p.value}
          </Typography>
          <Typography sx={{ fontSize: 11, color: ops.mute }} noWrap>
            {p.row.email}
          </Typography>
        </Box>
      )
    },
    {
      field: 'job_title',
      headerName: 'Role',
      flex: 1,
      minWidth: 160
    },
    {
      field: 'years_experience',
      headerName: 'Exp.',
      width: 80,
      renderCell: p => `${p.value ?? 0}y`
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: p => statusChip(p.value, APPLICATION_STATUSES)
    },
    {
      field: 'createdAt',
      headerName: 'Applied',
      width: 130,
      renderCell: p => (p.value ? new Date(p.value).toLocaleDateString() : '—')
    },
    {
      field: 'open',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: p => (
        <Chip size='small' label='Open' clickable onClick={() => openDetail(p.row)} />
      )
    }
  ]
}
