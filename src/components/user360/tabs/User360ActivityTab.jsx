import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { useState } from 'react'

import { SectionShell, EmptyHint, downloadCsv } from '../user360Shared'
import { timelineDotColor, timelineDotBg } from '../user360Parts'
import { ActivityToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

export default function User360ActivityTab({
  timeline = { items: [], pagination: { page: 1, limit: 30, total: 0 } },
  loadingTimeline = false,
  query,
  onQueryChange,
  onRefresh
}) {
  const theme = useTheme()
  const timelineItems = timeline?.items || []
  const [metaOpenId, setMetaOpenId] = useState(null)

  return (
    <SectionShell
      title='Unified activity timeline'
      subtitle='Newest first: bookings, clips, reports, admin actions, online snapshots, and instrumented user events. Use quick filters or a custom substring.'
      action={(
        <ToolbarRefreshExport
          busy={loadingTimeline}
          onRefresh={onRefresh}
          exportLabel='Export timeline'
          onExport={() =>
            downloadCsv(
              timelineItems.map(row => ({
                type: row.type,
                at: row.at,
                title: row.title,
                meta: JSON.stringify(row.meta || {})
              })),
              'admin-user-timeline.csv'
            )
          }
        />
      )}
    >
      <ActivityToolbar query={query} onQueryChange={onQueryChange} />
      <Divider sx={{ my: 2 }} />
      {loadingTimeline ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      {!loadingTimeline && timelineItems.length ? (
        <Stack spacing={0} sx={{ position: 'relative' }}>
          {timelineItems.map((item, idx) => {
            const dot = timelineDotColor(item.type)
            const rowKey = `${item.at}-${item.type}-${idx}`
            const hasMeta = item.meta && Object.keys(item.meta).length > 0
            return (
              <Stack key={rowKey} direction='row' spacing={2} sx={{ pb: 2.5 }}>
                <Stack alignItems='center' sx={{ width: 24, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: timelineDotBg(item.type, theme),
                      mt: 0.75,
                      boxShadow: 1
                    }}
                  />
                  {idx < timelineItems.length - 1 ? (
                    <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: 'divider', mt: 0.5 }} />
                  ) : null}
                </Stack>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    {item.at ? new Date(item.at).toLocaleString() : '—'}
                  </Typography>
                  <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
                    <Chip label={item.type} size='small' color={dot === 'default' ? 'default' : dot} variant='outlined' sx={{ fontWeight: 600 }} />
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>{item.title}</Typography>
                  </Stack>
                  {hasMeta ? (
                    <>
                      <Button size='small' onClick={() => setMetaOpenId(metaOpenId === rowKey ? null : rowKey)} sx={{ mt: 1, textTransform: 'none', p: 0, minWidth: 0 }}>
                        {metaOpenId === rowKey ? 'Hide details' : 'Show details'}
                      </Button>
                      <Collapse in={metaOpenId === rowKey}>
                        <Box
                          component='pre'
                          sx={{
                            p: 1.5,
                            mt: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.common.black, 0.04),
                            fontSize: 12,
                            overflow: 'auto',
                            maxHeight: 280,
                            fontFamily: 'ui-monospace, Menlo, monospace'
                          }}
                        >
                          {JSON.stringify(item.meta, null, 2)}
                        </Box>
                      </Collapse>
                    </>
                  ) : null}
                </Box>
              </Stack>
            )
          })}
        </Stack>
      ) : null}
      {!loadingTimeline && !timelineItems.length ? (
        <EmptyHint title='Nothing in this view' hint='Clear filters or widen the event type. New events appear after user actions are instrumented.' />
      ) : null}
      <PaginationBar section='activity' pagination={timeline?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
