import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ReplayIcon from '@mui/icons-material/Replay'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import { STATUS_COLORS } from './constants'
import { deliverySuccessRate, exportDeliveryLogCsv, formatDateTime } from './utils'

export default function BroadcastDetailDrawer({
  open,
  onClose,
  data,
  loading,
  onResend,
  onDuplicate
}) {
  const [logChannel, setLogChannel] = useState('')
  const [logStatus, setLogStatus] = useState('')

  const logRows = useMemo(() => {
    let logs = data?.delivery_log || []
    if (logChannel) logs = logs.filter(l => l.channel === logChannel)
    if (logStatus) logs = logs.filter(l => l.status === logStatus)
    return logs.map((l, i) => ({ ...l, id: l._id || `log-${i}` }))
  }, [data, logChannel, logStatus])

  const successRate = deliverySuccessRate(data?.stats, data?.channels)

  const logColumns = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 160,
      renderCell: p =>
        p.row.user_id?.fullname || p.row.user_id?.email || String(p.row.user_id || '—')
    },
    { field: 'channel', headerName: 'Channel', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: p => (
        <Chip label={p.value} size='small' color={p.value === 'sent' ? 'success' : 'error'} />
      )
    },
    {
      field: 'error',
      headerName: 'Error',
      flex: 1,
      minWidth: 120,
      renderCell: p => (
        <Typography variant='caption' color='error.main' sx={{ whiteSpace: 'normal' }}>
          {p.value || '—'}
        </Typography>
      )
    },
    {
      field: 'sent_at',
      headerName: 'Time',
      width: 155,
      renderCell: p => formatDateTime(p.value)
    }
  ]

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 560, md: 720 } } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction='row' alignItems='flex-start' justifyContent='space-between' sx={{ mb: 2 }}>
          <Box sx={{ pr: 2, minWidth: 0 }}>
            <Typography variant='overline' color='text.secondary'>
              Broadcast details
            </Typography>
            <Typography variant='h6' fontWeight={700} sx={{ wordBreak: 'break-word' }}>
              {data?.title || (loading ? 'Loading…' : '—')}
            </Typography>
            {data?.status ? (
              <Chip
                label={data.status}
                size='small'
                color={STATUS_COLORS[data.status] || 'default'}
                sx={{ mt: 1 }}
              />
            ) : null}
          </Box>
          <IconButton onClick={onClose} edge='end'>
            <CloseIcon />
          </IconButton>
        </Stack>

        {loading ? (
          <Typography color='text.secondary'>Loading broadcast…</Typography>
        ) : data ? (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant='caption' color='text.secondary'>
                  Audience
                </Typography>
                <Typography variant='body2'>{data.audience}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant='caption' color='text.secondary'>
                  Recipients
                </Typography>
                <Typography variant='h6'>{data.stats?.total_recipients ?? 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant='caption' color='text.secondary'>
                  Success rate
                </Typography>
                <Typography variant='body2'>{successRate != null ? `${successRate}%` : '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant='caption' color='text.secondary'>
                  Sent at
                </Typography>
                <Typography variant='body2'>{formatDateTime(data.sent_at)}</Typography>
              </Grid>
            </Grid>

            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Per-channel stats
            </Typography>
            <Stack direction='row' flexWrap='wrap' gap={1} sx={{ mb: 2 }}>
              {(data.channels || []).map(ch => {
                const s = data.stats?.[ch] || {}
                return (
                  <Box
                    key={ch}
                    sx={{
                      px: 1.5,
                      py: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      minWidth: 100
                    }}
                  >
                    <Typography variant='caption' sx={{ textTransform: 'uppercase' }}>
                      {ch}
                    </Typography>
                    <Typography variant='body2' color='success.main'>
                      ✓ {s.sent ?? 0}
                    </Typography>
                    <Typography variant='caption' color='error.main'>
                      ✗ {s.failed ?? 0}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>

            {data.html_body ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                  Email content
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: 160,
                    overflow: 'auto',
                    fontSize: '0.875rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: data.html_body }}
                />
              </Box>
            ) : null}

            {data.body ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 0.5 }}>
                  Plain text
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    maxHeight: 100,
                    overflow: 'auto'
                  }}
                >
                  {data.body}
                </Box>
              </Box>
            ) : null}

            <Divider sx={{ my: 2 }} />

            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }} flexWrap='wrap' useFlexGap>
              <Typography variant='subtitle2' sx={{ flex: 1 }}>
                Delivery log ({logRows.length})
              </Typography>
              <FormControl size='small' sx={{ minWidth: 110 }}>
                <InputLabel>Channel</InputLabel>
                <Select label='Channel' value={logChannel} onChange={e => setLogChannel(e.target.value)}>
                  <MenuItem value=''>All</MenuItem>
                  {(data.channels || []).map(c => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 100 }}>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={logStatus} onChange={e => setLogStatus(e.target.value)}>
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='sent'>Sent</MenuItem>
                  <MenuItem value='failed'>Failed</MenuItem>
                </Select>
              </FormControl>
              <Button
                size='small'
                startIcon={<DownloadIcon />}
                variant='outlined'
                onClick={() => exportDeliveryLogCsv(data, data.delivery_log)}
                disabled={!data.delivery_log?.length}
              >
                CSV
              </Button>
            </Stack>

            <Box sx={{ flex: 1, minHeight: 200 }}>
              <AdminDataGrid
                rows={logRows}
                columns={logColumns}
                autoHeight
                pageSizeOptions={[10, 25]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                hideFooter={logRows.length <= 10}
              />
            </Box>

            <Stack direction='row' spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button startIcon={<ContentCopyIcon />} variant='outlined' onClick={() => onDuplicate(data)}>
                Duplicate
              </Button>
              {(data.status === 'failed' || data.status === 'completed') && (
                <Button color='warning' startIcon={<ReplayIcon />} onClick={() => onResend(data._id)}>
                  Send again
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button onClick={onClose}>Close</Button>
            </Stack>
          </>
        ) : null}
      </Box>
    </Drawer>
  )
}
