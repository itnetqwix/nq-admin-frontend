import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { MOBILE_FRAME, IMAGE_SPECS } from './contentPlacementConfig'

/** Matches mobile BlogPostScreen — hero + WebView body. */
export default function BlogPostPreview({ form, dark = false }) {
  const title = form?.title?.trim() || 'Article title'
  const bodyHtml = form?.body_html || '<p>Body content…</p>'
  const imageUrl = resolveCmsImageUrl(form?.cover_image_url)
  const heroH = IMAGE_SPECS['page.blog_cover'].previewHeight || 200
  const textColor = dark ? '#f5f5f5' : '#1a1a2e'

  const docHtml = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>body{font-family:-apple-system,sans-serif;padding:16px;color:${textColor};line-height:1.65;font-size:15px}
      img{max-width:100%;height:auto} h2{font-size:17px;margin:16px 0 8px} p{margin:0 0 12px}</style></head>
      <body>${bodyHtml}</body></html>`,
    [bodyHtml, textColor]
  )

  return (
    <Box sx={{ bgcolor: dark ? '#121218' : '#f4f6f9' }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ px: 2, pt: 1, display: 'block' }}>
        Article detail
      </Typography>
      {imageUrl ? (
        <Box
          component='img'
          src={imageUrl}
          alt=''
          sx={{
            width: MOBILE_FRAME.contentWidth,
            mx: 'auto',
            display: 'block',
            height: heroH,
            objectFit: 'cover'
          }}
        />
      ) : (
        <Box sx={{ height: heroH, bgcolor: '#e8eaf6', mx: `${MOBILE_FRAME.contentPadding}px`, borderRadius: 1 }} />
      )}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography fontWeight={800} fontSize={18} color={dark ? '#fff' : 'text.primary'}>
          {title}
        </Typography>
      </Box>
      <Box
        component='iframe'
        title='blog-body-preview'
        srcDoc={docHtml}
        sx={{
          width: '100%',
          height: 220,
          border: 'none',
          bgcolor: dark ? '#121218' : '#fff'
        }}
      />
    </Box>
  )
}
