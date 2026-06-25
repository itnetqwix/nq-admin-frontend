import React from 'react'
import { Box, Typography } from '@mui/material'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

/**
 * Mobile hero carousel card — uses admin image_height when set.
 */
export default function BannerHeroPreview({ form, embedded = false }) {
  const frame = useMobilePreviewFrame()
  const title = form?.title?.trim() || 'Banner title'
  const body = form?.body?.trim()
  const fgUrl = resolveCmsImageUrl(form?.image_url)
  const bgUrl = resolveCmsImageUrl(form?.background_image_url)
  const imageHeight = Math.min(320, Math.max(64, Number(form?.image_height) || 140))
  const imageFit = form?.image_fit === 'contain' ? 'contain' : 'cover'
  const textAlign = form?.text_align === 'center' ? 'center' : 'left'
  const overlay = Math.min(1, Math.max(0, Number(form?.overlay_opacity) ?? 0.45))
  const bgColor = form?.background_color?.trim() || (bgUrl ? '#e0e0e0' : '#fff8e1')
  const ctas = Array.isArray(form?.ctas)
    ? form.ctas.filter(c => c?.label?.trim())
    : form?.cta_label?.trim()
      ? [{ label: form.cta_label.trim() }]
      : []
  const cardW = embedded ? frame.contentWidth : '100%'
  const hasBgLayer = Boolean(bgUrl)
  const cardMinH = hasBgLayer ? imageHeight + 72 : imageHeight + (body || ctas.length ? 88 : 48)

  return (
    <Box sx={{ px: embedded ? `${frame.contentPadding}px` : 1, py: embedded ? 1 : 1 }}>
      {!embedded ? (
        <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
          Hero carousel · {frame.contentWidth}×{cardMinH}pt
        </Typography>
      ) : null}
      <Box
        sx={{
          position: 'relative',
          width: cardW,
          minHeight: cardMinH,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: bgColor,
          backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
          backgroundSize: imageFit,
          backgroundPosition: 'center',
          mx: embedded ? 0 : 'auto'
        }}
      >
        {bgUrl ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: `rgba(0,0,0,${overlay})`,
              pointerEvents: 'none'
            }}
          />
        ) : null}
        {fgUrl ? (
          <Box
            component='img'
            src={fgUrl}
            alt=''
            sx={{
              display: 'block',
              width: '100%',
              height: imageHeight,
              objectFit: imageFit
            }}
          />
        ) : null}
        <Box
          sx={{
            position: hasBgLayer ? 'absolute' : 'relative',
            inset: hasBgLayer ? 0 : undefined,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: hasBgLayer ? 'flex-end' : 'flex-start',
            p: 1.5,
            textAlign
          }}
        >
          <Typography
            fontWeight={800}
            fontSize={15}
            color={hasBgLayer ? '#fff' : 'text.primary'}
            sx={{ lineHeight: 1.25 }}
          >
            {title}
          </Typography>
          {body ? (
            <Typography
              variant='body2'
              sx={{
                color: hasBgLayer ? 'rgba(255,255,255,0.92)' : 'text.secondary',
                fontSize: 12,
                mt: 0.25
              }}
            >
              {body.slice(0, 80)}
              {body.length > 80 ? '…' : ''}
            </Typography>
          ) : null}
          {ctas.length ? (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                mt: 0.75,
                flexWrap: 'wrap',
                justifyContent: textAlign === 'center' ? 'center' : 'flex-start'
              }}
            >
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
