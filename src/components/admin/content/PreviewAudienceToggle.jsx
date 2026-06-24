import React from 'react'
import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

const OPTIONS = [
  { value: 'guest', label: 'Guest' },
  { value: 'trainee', label: 'Trainee' },
  { value: 'trainer', label: 'Trainer' }
]

/** Simulate which audience sees a placement in mobile preview. */
export default function PreviewAudienceToggle({ value, onChange, sx = {} }) {
  return (
    <>
      <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
        Preview as
      </Typography>
      <ToggleButtonGroup
        size='small'
        exclusive
        value={value}
        onChange={(_e, next) => {
          if (next) onChange(next)
        }}
        sx={sx}
      >
        {OPTIONS.map(opt => (
          <ToggleButton key={opt.value} value={opt.value} sx={{ px: 1.25, py: 0.25, fontSize: 11 }}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  )
}

export function bannerVisibleForAudience(audiences, previewRole) {
  const aud = Array.isArray(audiences) && audiences.length ? audiences : ['all']
  if (aud.includes('all')) return true
  if (previewRole === 'guest') return aud.includes('guest')
  if (previewRole === 'trainee') return aud.includes('trainee')
  if (previewRole === 'trainer') return aud.includes('trainer')
  return true
}
