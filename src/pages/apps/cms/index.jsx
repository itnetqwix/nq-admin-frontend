import React from 'react'
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import NextLink from 'next/link'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'

const LINKS = [
  {
    title: 'Banners',
    description: 'Hero carousel, announcement strip, sticky bottom promo',
    href: '/apps/banners',
    color: '#000080'
  },
  {
    title: 'Tips (offers)',
    description: '“Offers for you” carousel on mobile home',
    href: '/apps/tips',
    color: '#1565c0'
  },
  {
    title: 'Blog & pages',
    description: 'In-app articles and static pages',
    href: '/apps/cms-blog',
    color: '#2e7d32'
  },
  {
    title: 'Legal',
    description: 'Terms of service and privacy policy',
    href: '/apps/cms-legal',
    color: '#6a1b9a'
  },
  {
    title: 'FAQ',
    description: 'Mobile help center sections',
    href: '/apps/cms-faq',
    color: '#ef6c00'
  }
]

export default function CmsHubPage() {
  return (
    <AdminPageShell
      title='Content & ads'
      subtitle='Manage marketplace home placements on the mobile app. Changes publish via CMS_UPDATED socket.'
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {LINKS.map(link => (
            <Grid item xs={12} sm={6} md={4} key={link.href}>
              <Card variant='outlined' sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' fontWeight={700} gutterBottom>
                    {link.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, minHeight: 40 }}>
                    {link.description}
                  </Typography>
                  <Button
                    component={NextLink}
                    href={link.href}
                    variant='contained'
                    size='small'
                    sx={{ bgcolor: link.color, '&:hover': { bgcolor: link.color, opacity: 0.9 } }}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box>
          <Typography variant='subtitle1' fontWeight={700} gutterBottom>
            Placement guide
          </Typography>
          <ContentPlacementGuide kind='banners' />
        </Box>
      </AdminPageSection>
    </AdminPageShell>
  )
}
