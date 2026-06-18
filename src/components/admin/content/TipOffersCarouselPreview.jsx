import React from 'react'
import { Box, Typography } from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

/**
 * Matches mobile HomeOffersCarousel card (72% content width, 48×48 thumb).
 */
export default function TipOffersCarouselPreview({ form }) {
  const frame = useMobilePreviewFrame()
  const title = form?.title?.trim() || 'Tip title'
  const body = form?.body?.trim()
  const cta = form?.cta_label?.trim()
  const imageUrl = resolveCmsImageUrl(form?.image_url)
  const cardW = Math.round(frame.contentWidth * 0.72)

  return (
    <Box sx={{ px: `${frame.contentPadding}px`, py: 1.5, bgcolor: '#eef1f6' }}>
      <Typography
        align='center'
        fontWeight={800}
        fontSize={12}
        letterSpacing={0.6}
        color='#000080'
        sx={{ mb: 1 }}
      >
        ✦ OFFERS FOR YOU ✦
      </Typography>
      <Box
        sx={{
          display: 'flex',
          width: cardW,
          p: 2,
          borderRadius: 2,
          border: '1px solid #d8dce3',
          bgcolor: '#fff',
          gap: 1.5,
          alignItems: 'flex-start'
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: '#e8eaf6',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {imageUrl ? (
            <Box component='img' src={imageUrl} alt='' sx={{ width: 48, height: 48, objectFit: 'cover' }} />
          ) : (
            <LocalOfferOutlinedIcon sx={{ color: '#000080', fontSize: 22 }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize={14} lineHeight={1.3} noWrap>
            {title}
          </Typography>
          {body ? (
            <Typography variant='body2' color='text.secondary' fontSize={12} sx={{ mt: 0.25 }}>
              {body.slice(0, 90)}
              {body.length > 90 ? '…' : ''}
            </Typography>
          ) : null}
          {cta ? (
            <Typography variant='caption' color='primary' fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>
              {cta} →
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
