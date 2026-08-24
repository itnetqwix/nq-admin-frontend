import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

import { SectionShell, EmptyHint, downloadCsv } from '../user360Shared'
import { DeleteActions } from '../user360Parts'
import { QueryToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

export default function User360PlansTab({
  assets = {
    reports: { items: [], pagination: { page: 1, limit: 20, total: 0 } },
    savedSessions: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
  loadingAssets = false,
  query,
  onQueryChange,
  onRefresh,
  hardDeletePolicy
}) {
  const reportItems = assets?.reports?.items || []
  const savedItems = assets?.savedSessions?.items || []

  return (
    <SectionShell
      title='PDF plans & saved sessions'
      subtitle='Reports and saved session files for this user. Pagination applies to both lists together.'
      action={(
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <ToolbarRefreshExport
            busy={loadingAssets}
            onRefresh={onRefresh}
            exportLabel='Export reports'
            onExport={() => downloadCsv(reportItems, 'admin-pdf-reports.csv')}
          />
          <Button size='small' variant='outlined' startIcon={<FileDownloadOutlinedIcon />} onClick={() => downloadCsv(savedItems, 'admin-saved-sessions.csv')} disabled={loadingAssets} sx={{ textTransform: 'none' }}>
            Export saved
          </Button>
        </Stack>
      )}
    >
      <QueryToolbar section='assets' sectionQuery={query?.assets} onQueryChange={onQueryChange} lessonSortOptions={false} />
      <Divider sx={{ my: 2 }} />
      {loadingAssets ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Session reports</Typography>
      {!loadingAssets && reportItems.length ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Trainee</TableCell>
                <TableCell>Recording</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportItems.map(item => (
                <TableRow key={item?._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{item?.title || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item?.sessions?._id || '—'}</TableCell>
                  <TableCell>{item?.trainer?.fullname || '—'}</TableCell>
                  <TableCell>{item?.trainee?.fullname || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 280, wordBreak: 'break-all', fontSize: 12 }}>
                    {(() => {
                      const takes = Array.isArray(item?.session_recordings)
                        ? item.session_recordings
                        : []
                      if (!takes.length) {
                        return item?.sessionRecordingUrl
                          ? `legacy · ${String(item.sessionRecordingUrl).slice(0, 40)}…`
                          : '—'
                      }
                      return takes
                        .map((t) => {
                          const owner = t?.owner_id
                            ? String(t.owner_id).slice(-6)
                            : '?'
                          const bytes = Number(t?.bytes || 0)
                          const mb = bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : '—'
                          return `owner…${owner} · ${t?.status || '?'} · ${mb}`
                        })
                        .join('; ')
                    })()}
                  </TableCell>
                  <TableCell align='right'>
                    <DeleteActions entityType='report' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {!loadingAssets && !reportItems.length ? (
        <EmptyHint title='No reports' hint='No PDF / session reports for this filter.' />
      ) : null}

      <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Saved sessions</Typography>
      {!loadingAssets && savedItems.length ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Trainer</TableCell>
                <TableCell>Trainee</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {savedItems.map(item => (
                <TableRow key={item?._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{item?.file_name || '—'}</TableCell>
                  <TableCell>{item?.trainer_name || '—'}</TableCell>
                  <TableCell>{item?.trainee_name || '—'}</TableCell>
                  <TableCell align='right'>
                    <DeleteActions entityType='saved_session' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {!loadingAssets && !savedItems.length ? (
        <EmptyHint title='No saved sessions' hint='Saved session files will appear here when present.' />
      ) : null}
      <PaginationBar section='assets' pagination={assets?.reports?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
