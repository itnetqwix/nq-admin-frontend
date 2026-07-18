import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material'
import { AdminLoadingState } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'

import { SectionShell, EmptyHint, OpsSurfaceCard, downloadCsv } from '../user360Shared'
import { DeleteActions, safeImg } from '../user360Parts'
import { QueryToolbar, PaginationBar, ToolbarRefreshExport } from '../user360Toolbars'

export default function User360ClipsTab({
  assets = {
    clips: { items: [], pagination: { page: 1, limit: 20, total: 0 } }
  },
  loadingAssets = false,
  query,
  onQueryChange,
  onRefresh,
  hardDeletePolicy,
  onPlayClip
}) {
  const clipsItems = assets?.clips?.items || []

  return (
    <SectionShell
      title='Video clips'
      subtitle='Thumbnails use the same CDN rules as the main product. Play opens a signed or public stream.'
      action={
        <ToolbarRefreshExport
          busy={loadingAssets}
          onRefresh={onRefresh}
          onExport={() => downloadCsv(clipsItems, 'admin-clips.csv')}
        />
      }
    >
      <QueryToolbar
        section='assets'
        sectionQuery={query?.assets}
        onQueryChange={onQueryChange}
        lessonSortOptions={false}
      />
      <Divider sx={{ my: 2, borderColor: ops.hairline }} />
      {loadingAssets ? <AdminLoadingState message='Loading clips…' minHeight={180} /> : null}
      {!loadingAssets && clipsItems.length ? (
        <Grid container spacing={2}>
          {clipsItems.map(item => (
            <Grid item xs={12} sm={6} lg={4} key={item?._id}>
              <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    position: 'relative',
                    pt: '56.25%',
                    bgcolor: ops.canvasSoft2,
                    backgroundImage: item?.thumbnail ? `url(${safeImg(item.thumbnail)})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', lineHeight: 1.3 }}>
                    {item?.title || 'Untitled'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: ops.mute }}>
                    {item?.category || '—'} · {item?.file_type || '—'}
                  </Typography>
                  <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.body, wordBreak: 'break-all' }}>
                    {item?.file_name || '—'}
                  </Typography>
                  <Stack direction='row' spacing={1} sx={{ mt: 'auto', pt: 1 }} flexWrap='wrap' useFlexGap>
                    <Button
                      size='small'
                      variant='contained'
                      onClick={() => onPlayClip(String(item._id))}
                      sx={{ textTransform: 'none' }}
                    >
                      Play
                    </Button>
                    <DeleteActions
                      entityType='clip'
                      entityId={item?._id}
                      onDeleted={onRefresh}
                      hardDeletePolicy={hardDeletePolicy}
                    />
                  </Stack>
                </Box>
              </OpsSurfaceCard>
            </Grid>
          ))}
        </Grid>
      ) : null}
      {!loadingAssets && !clipsItems.length ? (
        <EmptyHint
          icon={InboxOutlinedIcon}
          title='No clips'
          hint='Try clearing search or confirm clips are not soft-deleted.'
        />
      ) : null}
      <PaginationBar section='assets' pagination={assets?.clips?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
