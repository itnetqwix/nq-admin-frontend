import { Avatar, Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { getImageUrl } from 'src/utils/utils'
import { formatOpsDateTime } from 'src/utils/opsDateTime'
import { ops } from 'src/styles/opsSurface'
import moment from 'moment'
import { fmtInt, STATUS_TONE } from './chips'

export function buildUserColumns({ copyId, openPreview, requestDelete }) {
  return [
      {
        field: 'identity',
        headerName: 'User',
        flex: 1.4,
        minWidth: 240,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ minWidth: 0, py: 0.5 }}>
            <Avatar
              alt={p.row.fullname || 'User'}
              src={getImageUrl(p.row.profile_picture)}
              sx={{ width: 40, height: 40, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: ops.ink }} noWrap>
                {p.row.fullname || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }} noWrap>
                {p.row.email || '—'}
              </Typography>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                  {String(p.row.id || '').slice(0, 10)}…
                </Typography>
                <IconButton size='small' onClick={e => copyId(e, p.row.id)} sx={{ p: 0.25 }}>
                  <ContentCopyIcon sx={{ fontSize: 12, color: ops.mute }} />
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        )
      },
      {
        field: 'account_type',
        headerName: 'Type',
        width: 100,
        renderCell: p => (
          <Chip
            size='small'
            label={p.value === 'trainer' ? 'Trainer' : 'Trainee'}
            sx={{
              height: 22,
              fontFamily: ops.mono,
              fontSize: 10,
              bgcolor: p.value === 'trainer' ? ops.softIndigo : ops.canvasSoft2,
              color: p.value === 'trainer' ? ops.indigoDeep : ops.body
            }}
          />
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: p => {
          const t = STATUS_TONE[String(p.value || '').toLowerCase()] || {
            bg: ops.canvasSoft2,
            color: ops.body
          }
          return (
            <Chip
              size='small'
              label={p.value || '—'}
              sx={{ height: 22, fontFamily: ops.mono, fontSize: 10, bgcolor: t.bg, color: t.color, fontWeight: 600 }}
            />
          )
        }
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        sortable: false,
        renderCell: p => {
          const loc = [p.row.city, p.row.region, p.row.country].filter(Boolean).join(', ')
          return (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: ops.body }} noWrap>
                {loc || '—'}
              </Typography>
              <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }} noWrap>
                {p.row.time_zone || p.row.last_ip || ''}
              </Typography>
            </Box>
          )
        }
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 100,
        valueGetter: p => p.row.category || '—'
      },
      {
        field: 'session_count',
        headerName: 'Sessions',
        width: 90,
        renderCell: p => (
          <Typography sx={{ fontFamily: ops.mono, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {fmtInt(p.row.session_count ?? 0)}
          </Typography>
        )
      },
      {
        field: 'wallet_amount',
        headerName: 'Wallet',
        width: 100,
        valueGetter: p =>
          p.row.wallet_amount != null ? `$${Number(p.row.wallet_amount).toFixed(0)}` : '—'
      },
      {
        field: 'signals',
        headerName: 'Signals',
        width: 120,
        sortable: false,
        renderCell: p => (
          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
            {p.row.is_kyc_completed ? (
              <Chip size='small' label='KYC' sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }} />
            ) : null}
            {p.row.is_registered_with_stript ? (
              <Chip size='small' label='Stripe' sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }} />
            ) : null}
            {p.row.login_type ? (
              <Chip
                size='small'
                label={String(p.row.login_type).slice(0, 8)}
                sx={{ height: 20, fontSize: 9, fontFamily: ops.mono }}
              />
            ) : null}
          </Stack>
        )
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        width: 140,
        renderCell: p => (
          <Box>
            <Typography sx={{ fontSize: 12 }}>
              {p.row.createdAt ? formatOpsDateTime(p.row.createdAt, { withSeconds: false }) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute }}>
              {p.row.lastSeen
                ? `seen ${moment(p.row.lastSeen).fromNow()}`
                : p.row.last_login_at
                  ? `login ${moment(p.row.last_login_at).fromNow()}`
                  : ''}
            </Typography>
          </Box>
        )
      },
      {
        field: 'actions',
        headerName: '',
        width: 96,
        sortable: false,
        renderCell: params => (
          <Stack direction='row' spacing={0.25}>
            <Tooltip title='Quick preview'>
              <IconButton size='small' onClick={e => void openPreview(e, params.row.id)}>
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                size='small'
                color='error'
                onClick={e => void requestDelete(e, params.row.id, params.row.fullname)}
              >
                <DeleteOutlineIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ]
}
