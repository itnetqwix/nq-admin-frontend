import { Box, Chip, IconButton, Stack, Switch, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { ops } from 'src/styles/opsSurface'
import { computeScheduleStatus, scheduleStatusChip } from 'src/components/admin/content/scheduleStatus'
import { severityChip } from './helpers'

export function buildBannerColumns({ openEdit, setPreviewRow, requestDelete, handleToggle }) {
  return [
      {
        field: 'title',
        headerName: 'Banner',
        flex: 1.6,
        minWidth: 240,
        renderCell: p => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: ops.ink }} noWrap>
              {p.value}
            </Typography>
            <Typography sx={{ fontSize: 11, color: ops.mute }} noWrap>
              {p.row.body?.slice(0, 80)}
              {p.row.body?.length > 80 ? '…' : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'schedule',
        headerName: 'Schedule',
        width: 110,
        renderCell: p => {
          const status = computeScheduleStatus(p.row)
          const meta = scheduleStatusChip(status)
          return (
            <Chip
              label={meta.label}
              size='small'
              sx={{ height: 22, fontFamily: ops.mono, fontSize: 10 }}
              color={meta.color}
            />
          )
        }
      },
      {
        field: 'placement',
        headerName: 'Placement',
        width: 130,
        renderCell: p => (
          <Chip
            label={p.value || 'hero'}
            size='small'
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: ops.softIndigo,
              color: ops.indigoDeep
            }}
          />
        )
      },
      {
        field: 'audience',
        headerName: 'Audience',
        width: 180,
        renderCell: p => (
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {(p.value || []).map(a => (
              <Chip
                key={a}
                label={a}
                size='small'
                sx={{ height: 20, fontFamily: ops.mono, fontSize: 9, bgcolor: ops.canvasSoft2 }}
              />
            ))}
          </Stack>
        )
      },
      {
        field: 'severity',
        headerName: 'Severity',
        width: 110,
        renderCell: p => severityChip(p.value)
      },
      {
        field: 'is_active',
        headerName: 'Active',
        width: 90,
        renderCell: p => (
          <Switch
            size='small'
            checked={!!p.value}
            onChange={() => handleToggle(p.row)}
            onClick={e => e.stopPropagation()}
          />
        )
      },
      {
        field: 'date_range',
        headerName: 'Window',
        width: 170,
        renderCell: p => {
          const s = p.row.start_date ? new Date(p.row.start_date).toLocaleDateString() : 'Always'
          const e = p.row.end_date ? new Date(p.row.end_date).toLocaleDateString() : 'Always'
          return (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
              {s} – {e}
            </Typography>
          )
        }
      },
      {
        field: 'actions',
        headerName: '',
        width: 120,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Preview'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  setPreviewRow(p.row)
                }}
              >
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  openEdit(p.row)
                }}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                size='small'
                color='error'
                onClick={e => {
                  e.stopPropagation()
                  void requestDelete(p.row)
                }}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ]
}
