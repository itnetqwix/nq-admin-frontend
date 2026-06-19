import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography
} from '@mui/material'

import { SectionShell, EmptyHint, downloadCsv } from '../user360Shared'
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
      action={<ToolbarRefreshExport busy={loadingAssets} onRefresh={onRefresh} onExport={() => downloadCsv(clipsItems, 'admin-clips.csv')} />}
    >
      <QueryToolbar section='assets' sectionQuery={query?.assets} onQueryChange={onQueryChange} lessonSortOptions={false} />
      <Divider sx={{ my: 2 }} />
      {loadingAssets ? (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : null}
      {!loadingAssets && clipsItems.length ? (
        <Grid container spacing={2}>
          {clipsItems.map(item => (
            <Grid item xs={12} sm={6} lg={4} key={item?._id}>
              <Card variant='outlined' sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    position: 'relative',
                    pt: '56.25%',
                    bgcolor: 'grey.100',
                    backgroundImage: item?.thumbnail ? `url(${safeImg(item.thumbnail)})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3 }}>{item?.title || 'Untitled'}</Typography>
                  <Typography variant='caption' color='text.secondary'>{item?.category || '—'} · {item?.file_type || '—'}</Typography>
                  <Typography variant='caption' sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{item?.file_name || '—'}</Typography>
                  <Stack direction='row' spacing={1} sx={{ mt: 'auto', pt: 1 }} flexWrap='wrap' useFlexGap>
                    <Button size='small' variant='contained' onClick={() => onPlayClip(String(item._id))} sx={{ textTransform: 'none' }}>
                      Play
                    </Button>
                    <DeleteActions entityType='clip' entityId={item?._id} onDeleted={onRefresh} hardDeletePolicy={hardDeletePolicy} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}
      {!loadingAssets && !clipsItems.length ? (
        <EmptyHint icon={InboxOutlinedIcon} title='No clips' hint='Try clearing search or confirm clips are not soft-deleted.' />
      ) : null}
      <PaginationBar section='assets' pagination={assets?.clips?.pagination} onQueryChange={onQueryChange} />
    </SectionShell>
  )
}
