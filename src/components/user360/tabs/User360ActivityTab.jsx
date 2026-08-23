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
import Link from 'next/link'
import { useState } from 'react'

import { ops } from 'src/styles/opsSurface'
import { TIMELINE_CATEGORY_META } from '../constants'
import { SectionShell, EmptyHint, downloadCsv } from '../user360Shared'
import { timelineDotColor, timelineDotBg } from '../user360Parts'
import { ActivityToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

function entityHref(userId, entity) {
  if (!entity?.type || !entity?.id) return null
  const id = String(entity.id)
  if (entity.type === 'session') return `/apps/users/${userId}?tab=1`
  if (entity.type === 'clip') return `/apps/users/${userId}?tab=3`
  if (entity.type === 'report' || entity.type === 'saved_session') return `/apps/users/${userId}?tab=4`
  return null
}

function categoryLabel(category) {
  return TIMELINE_CATEGORY_META[category]?.label || category || 'Other'
}

export default function User360ActivityTab({
  userId,
  timeline = { items: [], pagination: { page: 1, limit: 30, total: 0 }, retention: null },
  loadingTimeline = false,
  query,
  onQueryChange,
  onRefresh
}) {
  const theme = useTheme()
  const timelineItems = timeline?.items || []
  const retention = timeline?.retention
  const [metaOpenId, setMetaOpenId] = useState(null)

  return (
    <SectionShell
      title='Unified activity timeline'
      subtitle='Wallet, bookings, profile, support, verification, social, admin actions, and security — newest first.'
      action={(
        <ToolbarRefreshExport
          busy={loadingTimeline}
          onRefresh={onRefresh}
          exportLabel='Export timeline'
          onExport={() =>
            downloadCsv(
              timelineItems.map(row => ({
                category: row.category,
                type: row.type,
                at: row.at,
                title: row.title,
                source: row.source,
                actor: row.actor?.label,
                meta: JSON.stringify(row.meta || {})
              })),
              'admin-user-timeline.csv'
            )
          }
        />
      )}
    >
      {retention?.note ? (
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 2 }}>
          {retention.note}
        </Typography>
      ) : null}
      <ActivityToolbar query={query} onQueryChange={onQueryChange} userId={userId} />
      <Divider sx={{ my: 2 }} />
      {loadingTimeline ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      {!loadingTimeline && timelineItems.length ? (
        <Stack spacing={0} sx={{ position: 'relative' }}>
          {timelineItems.map((item, idx) => {
            const dotKey = item.category || item.type
            const dot = timelineDotColor(dotKey)
            const rowKey = item.id || `${item.at}-${item.type}-${idx}`
            const hasMeta = item.meta && Object.keys(item.meta).length > 0
            const entityLink = userId ? entityHref(userId, item.entity) : null
            return (
              <Stack key={rowKey} direction='row' spacing={2} sx={{ pb: 2.5 }}>
                <Stack alignItems='center' sx={{ width: 24, flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: timelineDotBg(dotKey, theme),
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
                    {item.category ? (
                      <Chip
                        label={categoryLabel(item.category)}
                        size='small'
                        color={dot === 'default' ? 'default' : dot}
                        variant='outlined'
                        sx={{ fontWeight: 600 }}
                      />
                    ) : null}
                    <Typography variant='body1' sx={{ fontWeight: 600 }}>{item.title}</Typography>
                    {item.source ? (
                      <Chip
                        label={item.source}
                        size='small'
                        sx={{ fontFamily: ops.mono, fontSize: 10, height: 20 }}
                      />
                    ) : null}
                  </Stack>
                  {item.actor?.label && item.actor.label !== '—' ? (
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                      Actor: {item.actor.label}
                    </Typography>
                  ) : null}
                  {entityLink ? (
                    <Button
                      size='small'
                      component={Link}
                      href={entityLink}
                      sx={{ mt: 0.5, textTransform: 'none', p: 0, minWidth: 0 }}
                    >
                      View {item.entity.type} →
                    </Button>
                  ) : null}
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
        <EmptyHint title='Nothing in this view' hint='Clear filters or widen the category. New events appear after user actions are instrumented.' />
      ) : null}
      <PaginationBar section='activity' pagination={timeline?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
