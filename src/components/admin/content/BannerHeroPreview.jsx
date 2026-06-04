import React from 'react'
import { Box, Typography } from '@mui/material'

/**
 * Mobile hero carousel card preview (Blinkit / marketplace style).
 */
export default function BannerHeroPreview({ form }) {
  const title = form?.title?.trim() || 'Banner title'
  const body = form?.body?.trim()
  const imageUrl = form?.image_url?.trim()
  const ctas = Array.isArray(form?.ctas)
    ? form.ctas.filter(c => c?.label?.trim())
    : form?.cta_label?.trim()
      ? [{ label: form.cta_label.trim() }]
      : []

  return (
    <Box sx={{ px: 1, py: 1 }}>
      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
        Hero carousel (home)
      </Typography>
      <Box
        sx={{
          position: 'relative',
          height: 140,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: imageUrl ? '#e0e0e0' : '#fff8e1',
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 1.5
          }}
        >
          <Typography fontWeight={800} fontSize={15} color='#fff'>
            {title}
          </Typography>
          {body ? (
            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
              {body.slice(0, 80)}
              {body.length > 80 ? '…' : ''}
            </Typography>
          ) : null}
          {ctas.length ? (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
              {ctas.slice(0, 2).map((c, i) => (
                <Box
                  key={i}
                  sx={{
                    px: 1,
                    py: 0.35,
                    borderRadius: 10,
                    bgcolor: 'rgba(25,118,210,0.9)',
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
