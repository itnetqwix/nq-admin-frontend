import React from 'react'
import { Box, Typography } from '@mui/material'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import { useMobilePreviewFrame } from './MobilePreviewFrameContext'

const ICON_MAP = {
  'bulb-outline': LightbulbOutlinedIcon,
  'megaphone-outline': LightbulbOutlinedIcon
}

/**
 * Matches mobile TipsForYouSection row (trainer dashboard) — icon only, no image.
 */
export default function TipListRowPreview({ form }) {
  const frame = useMobilePreviewFrame()
  const title = form?.title?.trim() || 'Tip title'
  const body = form?.body?.trim()
  const iconKey = form?.icon?.trim() || 'bulb-outline'
  const Icon = ICON_MAP[iconKey] || LightbulbOutlinedIcon

  return (
    <Box sx={{ px: `${frame.contentPadding}px`, py: 1 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ mb: 0.75, display: 'block' }}>
        Tips for you (trainer home)
      </Typography>
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid #d8dce3',
          bgcolor: '#fff',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 2,
            borderBottom: '1px solid #eee'
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
              flexShrink: 0
            }}
          >
            <Icon sx={{ fontSize: 18, color: '#000080' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={14}>
              {title}
            </Typography>
            {body ? (
              <Typography variant='body2' color='text.secondary' fontSize={12} sx={{ mt: 0.25 }}>
                {body.slice(0, 120)}
                {body.length > 120 ? '…' : ''}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>
      <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
        Icon field: {iconKey} · image_url not shown here
      </Typography>
    </Box>
  )
}
