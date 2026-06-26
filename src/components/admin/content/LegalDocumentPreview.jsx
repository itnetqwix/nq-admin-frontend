import React, { useMemo } from 'react'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

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
  const frame = useMobilePreviewFrame()
  const [darkInternal, setDarkInternal] = React.useState(false)
  const dark = darkProp !== undefined ? darkProp : darkInternal
  const setDark = onDarkChange || setDarkInternal
  const textColor = dark ? '#f5f5f5' : '#1a1a2e'

  const docHtml = useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        *{box-sizing:border-box}
        body{
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          margin:0;padding:20px 20px 32px;
          color:${textColor};background:${dark ? '#121218' : '#fff'};
          line-height:1.7;font-size:16px;
        }
        .wrap{max-width:680px;margin:0 auto}
        h1{font-size:26px;font-weight:800;margin:0 0 8px;line-height:1.25}
        .meta{font-size:13px;color:${dark ? '#a1a1aa' : '#6b7280'};margin:0 0 24px}
        h2{font-size:19px;font-weight:700;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid rgba(128,128,128,0.2)}
        h3{font-size:16px;font-weight:700;margin:20px 0 8px}
        p{margin:0 0 14px} ul,ol{margin:0 0 14px;padding-left:22px} li{margin-bottom:8px}
        a{color:#000080;text-decoration:underline}
        blockquote{margin:0 0 14px;padding:12px 14px;border-left:3px solid #000080;background:rgba(128,128,128,0.08);border-radius:0 8px 8px 0}
      </style></head>
      <body><div class="wrap"><h1>${title}</h1>${
        version != null ? `<p class="meta">Version ${version}</p>` : ''
      }${bodyHtml}</div></body></html>`,
    [title, bodyHtml, textColor, dark, version]
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
          maxWidth: frame.width,
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
