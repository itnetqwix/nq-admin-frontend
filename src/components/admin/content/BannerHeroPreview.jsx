import React from 'react'
import { Box, Typography } from '@mui/material'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { IMAGE_SPECS, MOBILE_FRAME } from './contentPlacementConfig'

/**
 * Mobile hero carousel card — width × 0.45 aspect (HomeHeroCarousel).
 */
export default function BannerHeroPreview({ form, embedded = false }) {
  const title = form?.title?.trim() || 'Banner title'
  const body = form?.body?.trim()
  const imageUrl = resolveCmsImageUrl(form?.image_url)
  const ctas = Array.isArray(form?.ctas)
    ? form.ctas.filter(c => c?.label?.trim())
    : form?.cta_label?.trim()
      ? [{ label: form.cta_label.trim() }]
      : []
  const cardH = IMAGE_SPECS['banner.hero'].previewHeight
  const cardW = embedded ? MOBILE_FRAME.contentWidth : '100%'

  return (
    <Box sx={{ px: embedded ? `${MOBILE_FRAME.contentPadding}px` : 1, py: embedded ? 1 : 1 }}>
      {!embedded ? (
        <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
          Hero carousel · {MOBILE_FRAME.contentWidth}×{cardH}pt
        </Typography>
      ) : null}
      <Box
        sx={{
          position: 'relative',
          width: cardW,
          height: cardH,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: imageUrl ? '#e0e0e0' : '#fff8e1',
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mx: embedded ? 0 : 'auto'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.6) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 1.5
          }}
        >
          <Typography fontWeight={800} fontSize={15} color='#fff' sx={{ lineHeight: 1.25 }}>
            {title}
          </Typography>
          {body ? (
            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, mt: 0.25 }}>
              {body.slice(0, 80)}
              {body.length > 80 ? '…' : ''}
            </Typography>
          ) : null}
          {ctas.length ? (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
              {ctas.slice(0, 2).map((c, i) => (
                <Box
                  key={i}
                  sx={{
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 10,
                    bgcolor: 'rgba(25,118,210,0.92)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  {c.label}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
