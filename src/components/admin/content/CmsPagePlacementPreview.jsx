import React from 'react'
import { Box } from '@mui/material'

import BlogListCardPreview from './BlogListCardPreview'
import BlogPostPreview from './BlogPostPreview'
import StaticPagePreview from './StaticPagePreview'

export default function CmsPagePlacementPreview({ form, dark = false }) {
  const type = form?.type || 'blog'

  if (type === 'page') {
    return <StaticPagePreview form={form} dark={dark} />
  }

  return (
    <Box>
      <BlogListCardPreview form={form} />
      <BlogPostPreview form={form} dark={dark} />
    </Box>
  )
}
