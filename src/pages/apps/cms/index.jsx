import React, { useCallback, useEffect, useState } from 'react'
import NextLink from 'next/link'
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import toast from 'react-hot-toast'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import { getCmsSummary } from 'src/services/cmsApi'

/**
 * CMS overview — landing page that links to each CMS surface and exposes the
 * live/scheduled counts the backend already aggregates at /admin/cms/summary.
 */
const SECTIONS = [
  {
    title: 'Banners',
    href: '/apps/banners',
    description: 'Home hero carousel, announcement strip, and sticky bottom promos.',
    metric: s => s?.live?.banners
  },
  {
    title: 'Tips',
    href: '/apps/tips',
    description: 'Coaching tips shown on the trainee home feed.',
    metric: s => s?.live?.tips
  },
  {
    title: 'Blog & pages',
    href: '/apps/cms-blog',
    description: 'Editorial posts and standalone screens like About / Methodology.',
    metric: s => (s?.pages?.live_blogs ?? 0) + (s?.pages?.live_static_pages ?? 0)
  },
  {
    title: 'FAQ',
    href: '/apps/cms-faq',
    description: 'Settings → FAQ content, instantly publishable to mobile.',
    metric: s => (s?.faq?.active ? 1 : 0)
  },
  {
    title: 'Legal',
    href: '/apps/cms-legal',
    description: 'Terms of service and Privacy policy — versioned for OTA refresh.',
    metric: s => s?.legal?.active_documents ?? 0
  }
]

export default function CmsOverviewPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCmsSummary()
      setSummary(res.data || null)
    } catch (e) {
      toast.error(e.message || 'Failed to load CMS summary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AdminPageShell
      title='Mobile content'
      subtitle='Manage marketplace home placements on the mobile app. Changes publish via CMS_UPDATED socket.'
      actions={
        <Button variant='outlined' startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      }
    >
      <AdminPageSection>
        <Stack direction='row' spacing={2} flexWrap='wrap' sx={{ mb: 3 }}>
          <Chip label={`Live banners: ${summary?.live?.banners ?? '—'}`} color='primary' component={NextLink} href='/apps/banners' clickable />
          <Chip label={`Live tips: ${summary?.live?.tips ?? '—'}`} color='primary' component={NextLink} href='/apps/tips' clickable />
          <Chip
            label={`Scheduled (off-window): ${summary?.scheduled_off_window ?? '—'}`}
            component={NextLink}
            href='/apps/banners'
            clickable
            variant='outlined'
          />
          <Chip label={`Inactive banners: ${summary?.inactive?.banners ?? '—'}`} color='default' />
          <Chip label={`Inactive tips: ${summary?.inactive?.tips ?? '—'}`} color='default' />
          <Chip label={`Legal docs: ${summary?.legal?.active_documents ?? '—'}`} />
          <Chip label={`FAQ: ${summary?.faq?.active ? 'live' : '—'}`} />
          <Chip
            label={`Pages: ${(summary?.pages?.live_blogs ?? 0) + (summary?.pages?.live_static_pages ?? 0)} live`}
          />
        </Stack>

        <Grid container spacing={2}>
          {SECTIONS.map(section => {
            const metric = section.metric(summary)
            return (
              <Grid key={section.href} item xs={12} sm={6} md={4}>
                <Card variant='outlined' sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                      <Typography variant='h6'>{section.title}</Typography>
                      {typeof metric === 'number' ? (
                        <Chip size='small' color='success' label={`${metric} live`} />
                      ) : null}
                    </Stack>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 2 }}>
                      {section.description}
                    </Typography>
                    <Button component={NextLink} href={section.href} variant='contained' size='small'>
                      Open
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant='subtitle1' fontWeight={700} gutterBottom>
            Placement guides
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Collapsed by default on editor pages — expand here for the full reference.
          </Typography>
          <ContentPlacementGuide kind='banners' />
          <ContentPlacementGuide kind='tips' />
          <ContentPlacementGuide kind='blog' />
          <ContentPlacementGuide kind='legal' />
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
            Content version: {summary?.content_version ?? '—'} · Updated:{' '}
            {summary?.updated_at ? new Date(summary.updated_at).toLocaleString() : '—'}
          </Typography>
        </Box>
      </AdminPageSection>
    </AdminPageShell>
  )
}
