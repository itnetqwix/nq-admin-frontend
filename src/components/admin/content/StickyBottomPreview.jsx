import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

/**
 * Mirrors mobile StickyBottomPromoBar — pricetag icon, no CMS image.
 */
export default function StickyBottomPreview({ form, embedded = false }) {
  const frame = useMobilePreviewFrame()
  const title = form?.title?.trim() || 'Promo title'
  const body = form?.body?.trim()
  const line = body ? `${title} · ${body}` : title

  return (
    <Box sx={{ px: embedded ? `${frame.contentPadding}px` : 1, py: 1 }}>
      {!embedded ? (
        <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
          Sticky bottom promo (above tab bar)
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderRadius: 2,
          bgcolor: '#fff8e1',
          border: '1px solid #ffe082',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <LocalOfferOutlinedIcon sx={{ fontSize: 18, color: '#000080' }} />
        </Box>
        <Typography variant='body2' fontWeight={700} sx={{ flex: 1, color: '#000080', fontSize: 13 }} noWrap>
          {line.slice(0, 72)}
          {line.length > 72 ? '…' : ''}
        </Typography>
        {form?.dismissible !== false ? (
          <IconButton size='small' disabled sx={{ color: '#000080' }}>
            <CloseIcon fontSize='small' />
          </IconButton>
        ) : null}
      </Box>
      {!embedded ? (
        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
          Uploaded images are not displayed on this placement.
        </Typography>
      ) : null}
    </Box>
  )
}
