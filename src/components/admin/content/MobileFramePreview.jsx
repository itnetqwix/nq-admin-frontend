import React, { useMemo, useState } from 'react'
import { Box, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { DEVICE_PRESETS, getDeviceFrame } from './contentPlacementConfig'
import { MobilePreviewFrameProvider } from './MobilePreviewFrameContext'

/**
 * iPhone-style frame for CMS “testing phase” previews with device width toggle.
 */
export default function MobileFramePreview({
  children,
  label = 'Mobile preview',
  subtitle,
  scale = 0.92,
  dark = false,
  footer,
  defaultDevice = 'standard',
  showDeviceToggle = true
}) {
  const [deviceId, setDeviceId] = useState(defaultDevice)
  const frame = useMemo(() => getDeviceFrame(deviceId), [deviceId])
  const w = frame.width
  const h = frame.height

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: 'stretch', flexWrap: 'wrap' }}>
        <Typography variant='subtitle2' fontWeight={700}>
          {label}
        </Typography>
        <Chip size='small' label={`${w}×${h}pt`} variant='outlined' />
        {showDeviceToggle ? (
          <ToggleButtonGroup
            size='small'
            exclusive
            value={deviceId}
            onChange={(_e, next) => {
              if (next) setDeviceId(next)
            }}
            sx={{ ml: 'auto' }}
          >
            {Object.values(DEVICE_PRESETS).map(p => (
              <ToggleButton key={p.id} value={p.id} sx={{ px: 1.25, py: 0.25, fontSize: 11 }}>
                {p.shortLabel}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : null}
        {subtitle ? (
          <Typography variant='caption' color='text.secondary' sx={{ flex: 1, minWidth: 160 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          width: w * scale,
          borderRadius: 3,
          border: '10px solid',
          borderColor: dark ? '#1a1a2e' : '#111',
          bgcolor: dark ? '#0f0f14' : '#f4f6f9',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            height: 28,
            bgcolor: dark ? '#1a1a2e' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ width: 72, height: 6, borderRadius: 3, bgcolor: dark ? '#333' : '#e0e0e0' }} />
        </Box>
        <Box
          sx={{
            minHeight: h * scale - 28 - 20,
            maxHeight: 520,
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: dark ? '#121218' : '#f4f6f9',
            color: dark ? '#f5f5f5' : 'inherit'
          }}
        >
          <MobilePreviewFrameProvider frame={frame}>{children}</MobilePreviewFrameProvider>
        </Box>
        {footer !== false ? (
          <Box
            sx={{
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: dark ? '#1a1a2e' : '#fff',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ width: 100, height: 4, borderRadius: 2, bgcolor: dark ? '#444' : '#ccc' }} />
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}
