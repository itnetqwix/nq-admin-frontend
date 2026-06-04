import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'

/**
 * Mirrors mobile StickyBottomPromoBar (slim bar above tab bar).
 */
export default function StickyBottomPreview({ form }) {
  const title = form?.title?.trim() || 'Promo title'
  const imageUrl = resolveCmsImageUrl(form?.image_url)

  return (
    <Box sx={{ px: 1, py: 1 }}>
      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
        Sticky bottom promo
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: '#fff8e1',
          border: '1px solid #ffe082',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {imageUrl ? (
          <Box
            component='img'
            src={imageUrl}
            alt=''
            sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : null}
        <Typography
          variant='body2'
          fontWeight={700}
          sx={{ flex: 1, color: '#000080', fontSize: 13 }}
          noWrap
        >
          {title}
        </Typography>
        {form?.dismissible !== false ? (
          <IconButton size='small' disabled sx={{ color: '#000080' }}>
            <CloseIcon fontSize='small' />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  )
}
