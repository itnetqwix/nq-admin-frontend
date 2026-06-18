import React, { useMemo } from 'react'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import { MOBILE_FRAME } from './contentPlacementConfig'

/**
 * Legal document preview — matches mobile LegalDocumentScreen WebView.
 */
export default function LegalDocumentPreview({
  title = 'Legal document',
  bodyHtml = '<p>Content…</p>',
  version,
  dark: darkProp,
  onDarkChange
}) {
  const [darkInternal, setDarkInternal] = React.useState(false)
  const dark = darkProp !== undefined ? darkProp : darkInternal
  const setDark = onDarkChange || setDarkInternal
  const textColor = dark ? '#f5f5f5' : '#1a1a2e'

  const docHtml = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        body{font-family:-apple-system,sans-serif;padding:16px 18px;color:${textColor};line-height:1.65;font-size:15px}
        h1{font-size:22px;margin:0 0 16px} h2{font-size:17px;margin:20px 0 8px} h3{font-size:15px;margin:16px 0 6px}
        p{margin:0 0 12px} ul,ol{margin:0 0 12px;padding-left:20px} li{margin-bottom:6px}
        a{color:#000080;text-decoration:underline}
      </style></head><body><h1>${title}</h1>${bodyHtml}</body></html>`,
    [title, bodyHtml, textColor]
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
        <Typography variant='caption' color='text.secondary'>
          {version != null ? `Version ${version} · ` : ''}
          Settings · Signup · Guest settings
        </Typography>
        <FormControlLabel
          control={<Switch size='small' checked={dark} onChange={e => setDark(e.target.checked)} />}
          label={<Typography variant='caption'>Dark preview</Typography>}
        />
      </Box>
      <Box
        component='iframe'
        title='legal-preview'
        srcDoc={docHtml}
        sx={{
          width: '100%',
          maxWidth: MOBILE_FRAME.width,
          height: 420,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: dark ? '#121218' : '#fff'
        }}
      />
    </Box>
  )
}
