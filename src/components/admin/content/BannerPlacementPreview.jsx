import React from 'react'
import { Alert, Box, Typography } from '@mui/material'

import BannerHeroPreview from './BannerHeroPreview'
import BannerPreviewStrip from './BannerPreviewStrip'
import StickyBottomPreview from './StickyBottomPreview'
import { bannerVisibleForAudience } from './PreviewAudienceToggle'
import { resolveCmsImageUrl } from 'src/utils/cmsImageUrl'
import { BANNERS_PLACEMENT_HELP } from './contentPlacementConfig'

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

function renderPlacement(placement, form, embedded, previewAudience) {
  const resolvedForm = formWithResolvedImage(form)
  const visible = bannerVisibleForAudience(form?.audience, previewAudience)
  const inner = (() => {
    if (placement === 'strip') return <BannerPreviewStrip form={resolvedForm} embedded={embedded} />
    if (placement === 'sticky_bottom') return <StickyBottomPreview form={resolvedForm} embedded={embedded} />
    return <BannerHeroPreview form={resolvedForm} embedded={embedded} />
  })()
  if (visible) return inner
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ opacity: 0.35, pointerEvents: 'none' }}>{inner}</Box>
      <Alert severity='info' sx={{ mt: 1, fontSize: 12 }}>
        Hidden for {previewAudience} — audience is {Array.isArray(form?.audience) ? form.audience.join(', ') : 'all'}.
      </Alert>
    </Box>
  )
}

/**
 * Placement-accurate preview + optional all-placements test panel.
 */
export default function BannerPlacementPreview({
  form,
  showLabel = true,
  compareAll = false,
  embedded = false,
  previewAudience = 'trainee'
}) {
  const placement = form?.placement || 'hero'
  const help = BANNERS_PLACEMENT_HELP[placement]

  if (compareAll) {
    return (
      <Box>
        <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
          Test all placements
        </Typography>
        {['hero', 'strip', 'sticky_bottom'].map(p => (
          <Box key={p} sx={{ mb: 2, opacity: p === placement ? 1 : 0.72 }}>
            <Typography variant='caption' color={p === placement ? 'primary' : 'text.secondary'} fontWeight={700}>
              {PLACEMENT_LABELS[p]}
              {p === placement ? ' (selected)' : ''}
            </Typography>
            {renderPlacement(p, { ...form, placement: p }, true, previewAudience)}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box>
      {showLabel ? (
        <Typography variant='caption' color='text.secondary' sx={{ px: embedded ? 2 : 1, display: 'block', mb: 0.5 }}>
          Preview · {PLACEMENT_LABELS[placement] || placement}
          {help ? ` — ${help}` : ''}
        </Typography>
      ) : null}
      {renderPlacement(placement, form, embedded, previewAudience)}
    </Box>
  )
}
