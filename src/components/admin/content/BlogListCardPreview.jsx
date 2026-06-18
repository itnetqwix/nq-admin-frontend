import React from 'react'
import { Box, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

/** Matches mobile BlogsScreen list row (88×88 thumb). */
export default function BlogListCardPreview({ form }) {
  const frame = useMobilePreviewFrame()
  const title = form?.title?.trim() || 'Post title'
  const excerpt = form?.excerpt?.trim() || 'Excerpt appears here…'
  const imageUrl = resolveCmsImageUrl(form?.cover_image_url)
  const thumb = 88

  return (
    <Box sx={{ px: `${frame.contentPadding}px`, py: 1 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ mb: 0.75, display: 'block' }}>
        Blog list card
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid #d8dce3',
          bgcolor: '#fff'
        }}
      >
        <Box
          sx={{
            width: thumb,
            height: thumb,
            borderRadius: 1.5,
            bgcolor: '#e8eaf6',
            flexShrink: 0,
            overflow: 'hidden'
          }}
        >
          {imageUrl ? (
            <Box component='img' src={imageUrl} alt='' sx={{ width: thumb, height: thumb, objectFit: 'cover' }} />
          ) : null}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize={14} noWrap>
            {title}
          </Typography>
          <Typography variant='body2' color='text.secondary' fontSize={12} sx={{ mt: 0.25 }}>
            {excerpt.slice(0, 80)}
            {excerpt.length > 80 ? '…' : ''}
          </Typography>
        </Box>
        <ChevronRightIcon fontSize='small' color='action' />
      </Box>
    </Box>
  )
}
