import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { MOBILE_FRAME } from './contentPlacementConfig'

/** Static CMS page — full WebView (About, Methodology, etc.). */
export default function StaticPagePreview({ form, dark = false }) {
  const title = form?.title?.trim() || 'Page title'
  const bodyHtml = form?.body_html || '<p>Page content…</p>'
  const textColor = dark ? '#f5f5f5' : '#1a1a2e'

  const docHtml = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>body{font-family:-apple-system,sans-serif;padding:16px 18px;color:${textColor};line-height:1.65;font-size:15px}
      h1{font-size:22px;margin:0 0 16px} h2{font-size:17px;margin:20px 0 8px} p{margin:0 0 12px}
      ul,ol{margin:0 0 12px;padding-left:20px} a{color:#000080}</style></head>
      <body><h1>${title}</h1>${bodyHtml}</body></html>`,
    [title, bodyHtml, textColor]
  )

  return (
    <Box sx={{ bgcolor: dark ? '#121218' : '#f4f6f9', minHeight: 320 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ px: 2, pt: 1, display: 'block' }}>
        Static page · slug: {form?.slug || 'about-us'}
      </Typography>
      <Box
        component='iframe'
        title='static-page-preview'
        srcDoc={docHtml}
        sx={{
          width: MOBILE_FRAME.width,
          height: 380,
          border: 'none',
          display: 'block'
        }}
      />
    </Box>
  )
}
