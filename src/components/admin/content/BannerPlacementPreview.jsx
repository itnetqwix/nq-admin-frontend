import React from 'react'
import { Box, Typography } from '@mui/material'

import BannerHeroPreview from './BannerHeroPreview'
import BannerPreviewStrip from './BannerPreviewStrip'
import StickyBottomPreview from './StickyBottomPreview'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'

const PLACEMENT_LABELS = {
  hero: 'Hero carousel',
  strip: 'Announcement strip',
  sticky_bottom: 'Sticky bottom promo'
}

function formWithResolvedImage(form) {
  if (!form?.image_url) return form
  const resolved = resolveCmsImageUrl(form.image_url)
  if (!resolved || resolved === form.image_url) return form
  return { ...form, image_url: resolved }
}

/**
 * Single placement-accurate preview (form editor + grid row drawer).
 */
export default function BannerPlacementPreview({ form, showLabel = true }) {
  const placement = form?.placement || 'hero'
  const resolvedForm = formWithResolvedImage(form)

  let preview = null
  if (placement === 'strip') {
    preview = <BannerPreviewStrip form={resolvedForm} />
  } else if (placement === 'sticky_bottom') {
    preview = <StickyBottomPreview form={resolvedForm} />
  } else {
    preview = <BannerHeroPreview form={resolvedForm} />
  }

  return (
    <Box>
      {showLabel ? (
        <Typography variant='caption' color='text.secondary' sx={{ px: 1, display: 'block', mb: 0.5 }}>
          Preview · {PLACEMENT_LABELS[placement] || placement}
        </Typography>
      ) : null}
      {preview}
    </Box>
  )
}
