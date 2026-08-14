import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import moment from 'moment'
import { ops, categoryChipSx } from 'src/styles/opsSurface'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { clientSurfaceFromRow } from './clientSurface'

function StatusChip({ status }) {
  if (status == null || status === '') return <Typography sx={{ color: ops.mute }}>—</Typography>
  const n = Number(status)
  const err = Number.isFinite(n) ? n >= 400 : /fail|error|denied/i.test(String(status))
  return (
    <Chip
      size='small'
      label={status}
      sx={{
        fontFamily: ops.mono,
        fontSize: 11,
        height: 22,
        bgcolor: err ? ops.errorSoft : ops.canvasSoft2,
        color: err ? ops.error : ops.ink
      }}
    />
  )
}

export function buildLogColumns(tab) {
    if (tab === 'api') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        { field: 'method', headerName: 'Method', width: 88 },
        { field: 'path', headerName: 'Path', flex: 1, minWidth: 160 },
        {
          field: 'status',
          headerName: 'Status',
          width: 90,
          renderCell: p => <StatusChip status={p.row.status} />
        },
        {
          field: 'duration_ms',
          headerName: 'ms',
          width: 80,
          renderCell: p => (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {p.row.duration_ms ?? '—'}
            </Typography>
          )
        },
        { field: 'ip', headerName: 'IP', width: 120 },
        {
          field: 'location',
          headerName: 'Location',
          width: 130,
          valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
        },
        {
          field: 'device',
          headerName: 'Device',
          width: 150,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.device || p.row.browser || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {[clientSurfaceFromRow(p.row), p.row.browser, p.row.os, p.row.platform, p.row.client_type]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
          )
        },
        {
          field: 'actor',
          headerName: 'Who',
          width: 200,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.actor?.fullname || p.row.actor?.label || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.actor?.email || p.row.actor?.id || ''}
              </Typography>
            </Box>
          )
        }
      ]
    }
    if (tab === 'security' || tab === 'login' || tab === 'admin') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        {
          field: 'action',
          headerName: 'Action',
          width: 140,
          renderCell: p => (
            <Chip
              size='small'
              label={String(p.row.action || '').replace(/_/g, ' ')}
              sx={{
                ...categoryChipSx(
                  String(p.row.action || '').includes('fail') || String(p.row.action || '').includes('lock')
                    ? 'admin'
                    : 'logins'
                ),
                ...(String(p.row.action || '').includes('fail') || String(p.row.action || '').includes('lock')
                  ? { bgcolor: ops.errorSoft, color: ops.error }
                  : {})
              }}
            />
          )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 100 },
        { field: 'ip', headerName: 'IP', width: 120 },
        {
          field: 'location',
          headerName: 'Location',
          width: 130,
          valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
        },
        {
          field: 'device',
          headerName: 'Device',
          width: 150,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.device || p.row.browser || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {[p.row.browser, p.row.os, p.row.platform].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          )
        },
        {
          field: 'actor',
          headerName: 'Who',
          width: 200,
          renderCell: p => (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12 }} noWrap>
                {p.row.actor?.fullname || p.row.actor?.label || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.actor?.email || p.row.actor?.id || ''}
              </Typography>
            </Box>
          )
        },
        ...(tab === 'admin'
          ? [
              {
                field: 'target',
                headerName: 'Target',
                width: 200,
                renderCell: p => (
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12 }} noWrap>
                      {p.row.target?.fullname || p.row.target?.label || '—'}
                    </Typography>
                    <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                      {p.row.target?.email || ''}
                    </Typography>
                  </Box>
                )
              }
            ]
          : [])
      ]
    }
    if (tab === 'notifications') {
      return [
        {
          field: 'at',
          headerName: 'When',
          width: 168,
          renderCell: p => (
            <Box>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
                {formatOpsDateTime(p.row.at, { withSeconds: false })}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
                {p.row.at ? moment(p.row.at).fromNow() : ''}
              </Typography>
            </Box>
          )
        },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 140 },
        {
          field: 'channel',
          headerName: 'Channel',
          width: 120,
          renderCell: p => (
            <Chip size='small' label={p.row.channel || '—'} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
          )
        },
        {
          field: 'status',
          headerName: 'Status',
          width: 100,
          renderCell: p => <StatusChip status={p.row.status} />
        },
        {
          field: 'user_id',
          headerName: 'User',
          width: 160,
          renderCell: p => (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11 }} noWrap>
              {p.row.user_id || '—'}
            </Typography>
          )
        }
      ]
    }
    return [
      {
        field: 'at',
        headerName: 'When',
        width: 168,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 12 }}>
              {formatOpsDateTime(p.row.at, { withSeconds: false })}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.at ? moment(p.row.at).fromNow() : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'action',
        headerName: 'Action',
        width: 150,
        renderCell: p => (
          <Chip size='small' label={String(p.row.action || '').replace(/_/g, ' ')} sx={categoryChipSx('other')} />
        )
      },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 120 },
      {
        field: 'actor',
        headerName: 'Who',
        width: 200,
        renderCell: p => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12 }} noWrap>
              {p.row.actor?.fullname || p.row.actor?.label || '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
              {p.row.actor?.email || p.row.actor?.id || ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'entity',
        headerName: 'Entity',
        width: 160,
        valueGetter: p => (p.row.entity ? `${p.row.entity.type}:${p.row.entity.id}` : '—')
      },
      { field: 'ip', headerName: 'IP', width: 110 },
      {
        field: 'location',
        headerName: 'Location',
        width: 120,
        valueGetter: p => [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ') || '—'
      }
    ]
  

}

export { StatusChip }
