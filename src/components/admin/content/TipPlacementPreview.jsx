import React from 'react'
import { Box, Typography } from '@mui/material'

import TipOffersCarouselPreview from './TipOffersCarouselPreview'
import TipListRowPreview from './TipListRowPreview'

/**
 * Both mobile tip surfaces — marketplace carousel + trainer list.
 */
export default function TipPlacementPreview({ form, mode = 'all' }) {
  return (
    <Box>
      {mode === 'all' || mode === 'offers' ? (
        <Box sx={{ mb: mode === 'all' ? 2 : 0 }}>
          {mode === 'all' ? (
            <Typography variant='caption' color='text.secondary' sx={{ px: 2, display: 'block', mb: 0.5 }}>
              Surface 1 · Offers carousel
            </Typography>
          ) : null}
          <TipOffersCarouselPreview form={form} />
        </Box>
      ) : null}
      {mode === 'all' || mode === 'list' ? (
        <Box>
          {mode === 'all' ? (
            <Typography variant='caption' color='text.secondary' sx={{ px: 2, display: 'block', mb: 0.5 }}>
              Surface 2 · Trainer dashboard list
            </Typography>
          ) : null}
          <TipListRowPreview form={form} />
        </Box>
      ) : null}
    </Box>
  )
}
