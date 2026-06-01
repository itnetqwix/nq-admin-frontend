import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'

const SEVERITY_BG = {
  info: '#e8eaf6',
  promo: '#e8eaf6',
  maintenance: '#fff4e5',
  critical: '#fdecea',
  success: '#e6f6ee'
}

const SEVERITY_FG = {
  info: '#000080',
  promo: '#000080',
  maintenance: '#7a4d00',
  critical: '#8a1c12',
  success: '#0e6b3e'
}

/**
 * Mirrors mobile HomeBannerStrip (approximate).
 */
export default function BannerPreviewStrip({ form }) {
  const severity = form?.severity || 'info'
  const bg = SEVERITY_BG[severity] || SEVERITY_BG.info
  const fg = SEVERITY_FG[severity] || SEVERITY_FG.info
  const title = form?.title?.trim() || 'Banner title'
  const body = form?.body?.trim()
  const ctas = Array.isArray(form?.ctas)
    ? form.ctas.filter(c => c?.label?.trim())
    : form?.cta_label?.trim()
      ? [{ label: form.cta_label.trim() }]
      : []

  return (
    <Box sx={{ px: 1, py: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: bg
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <CampaignOutlinedIcon sx={{ fontSize: 18, color: fg }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} fontSize={14} color={fg} noWrap>
            {title}
          </Typography>
          {body ? (
            <Typography variant='body2' sx={{ color: fg, opacity: 0.92 }} fontSize={13}>
              {body.slice(0, 160)}
              {body.length > 160 ? '…' : ''}
            </Typography>
          ) : null}
          {ctas.length ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {ctas.map((c, i) => (
                <Typography key={i} variant='caption' sx={{ color: fg, fontWeight: 600 }}>
                  {c.label} →
                </Typography>
              ))}
            </Box>
          ) : null}
        </Box>
        {form?.dismissible !== false ? (
          <IconButton size='small' sx={{ color: fg }} disabled>
            <CloseIcon fontSize='small' />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  )
}
