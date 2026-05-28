import React from 'react'
import { Box, Typography } from '@mui/material'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'

/**
 * Mirrors mobile TipsCarousel card (approximate).
 */
export default function TipPreviewCard({ form }) {
  const title = form?.title?.trim() || 'Tip title'
  const body = form?.body?.trim() || 'Tip body appears here…'
  const cta = form?.cta_label?.trim()

  return (
    <Box
      sx={{
        width: 260,
        minHeight: 148,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 1
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: '#e8eaf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5
        }}
      >
        <LightbulbOutlinedIcon fontSize='small' color='primary' />
      </Box>
      <Typography fontWeight={700} fontSize={15} gutterBottom noWrap>
        {title}
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ minHeight: 48 }}>
        {body.slice(0, 120)}
        {body.length > 120 ? '…' : ''}
      </Typography>
      {cta ? (
        <Typography variant='caption' color='primary' fontWeight={600} sx={{ mt: 1, display: 'block' }}>
          {cta} →
        </Typography>
      ) : null}
    </Box>
  )
}
