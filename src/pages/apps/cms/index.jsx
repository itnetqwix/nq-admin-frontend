import React, { useMemo, useState } from 'react'
import NextLink from 'next/link'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import toast from 'react-hot-toast'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import { getCmsSummary } from 'src/services/cmsApi'

const SECTIONS = [
  {
    title: 'Banners',
    href: '/apps/banners',
    description: 'Home hero carousel, announcement strip, and sticky bottom promos.',
    metric: s => s?.live?.banners,
    detail: s =>
      `Hero ${s?.live?.banners_hero ?? 0} · Strip ${s?.live?.banners_strip ?? 0} · Sticky ${s?.live?.banners_sticky_bottom ?? 0}`
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
    metric: s => (s?.pages?.live_blogs ?? 0) + (s?.pages?.live_static_pages ?? 0),
    detail: s => `${s?.pages?.live_blogs ?? 0} blogs · ${s?.pages?.live_static_pages ?? 0} pages`
  },
  {
    title: 'FAQ',
    href: '/apps/cms-faq',
    description: 'Settings → FAQ content, instantly publishable to mobile.',
    metric: s => (s?.faq?.active ? 1 : 0),
    detail: s =>
      s?.faq?.has_unpublished_changes
        ? `v${s?.faq?.version ?? 0} · draft pending`
        : `v${s?.faq?.version ?? 0} live`
  },
  {
    title: 'Legal',
    href: '/apps/cms-legal',
    description: 'Terms, privacy, cancellation & refund — versioned for OTA refresh.',
    metric: s => s?.legal?.active_documents ?? 0,
    detail: s =>
      (s?.legal?.documents || [])
        .map(d => `${d.slug} v${d.version}`)
        .join(' · ') || '—'
  }
]

function HealthAlerts({ summary }) {
  const alerts = []
  if (summary?.health?.hero_empty) {
    alerts.push({ severity: 'warning', text: 'No live hero banners — home carousel may be empty.' })
  }
  if (summary?.health?.scheduled_off_window > 0) {
    alerts.push({
      severity: 'info',
      text: `${summary.health.scheduled_off_window} banner(s) scheduled but outside their active date window.`
    })
  }
  if (summary?.health?.faq_draft_pending) {
    alerts.push({ severity: 'warning', text: 'FAQ has unpublished draft changes.' })
  }
  if (!alerts.length) return null
  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      {alerts.map(a => (
        <Alert key={a.text} severity={a.severity} icon={<WarningAmberIcon fontSize='inherit' />}>
          {a.text}
        </Alert>
      ))}
    </Stack>
  )
}

export default function CmsOverviewPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getCmsSummary()
      setSummary(res.data || null)
    } catch (e) {
      toast.error(e.message || 'Failed to load CMS summary')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void load()
  }, [])

  const placementChips = useMemo(
    () => [
      { label: `Hero ${summary?.live?.banners_hero ?? '—'}`, href: '/apps/banners' },
      { label: `Strip ${summary?.live?.banners_strip ?? '—'}`, href: '/apps/banners' },
      { label: `Sticky ${summary?.live?.banners_sticky_bottom ?? '—'}`, href: '/apps/banners' }
    ],
    [summary]
  )

  return (
    <AdminPageShell
      title='Mobile content'
      subtitle='CMS health dashboard — placements, drafts, and legal versions across the app.'
      actions={
        <Button variant='outlined' startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      }
    >
      <AdminPageSection>
        <HealthAlerts summary={summary} />

        <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1 }}>
          Live counts
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          <Chip label={`Banners ${summary?.live?.banners ?? '—'}`} color='primary' component={NextLink} href='/apps/banners' clickable />
          {placementChips.map(c => (
            <Chip key={c.label} label={c.label} size='small' variant='outlined' component={NextLink} href={c.href} clickable />
          ))}
          <Chip label={`Tips ${summary?.live?.tips ?? '—'}`} color='primary' component={NextLink} href='/apps/tips' clickable />
          <Chip
            label={`FAQ ${summary?.faq?.active ? `v${summary.faq.version}` : 'off'}`}
            color={summary?.faq?.has_unpublished_changes ? 'warning' : 'default'}
            component={NextLink}
            href='/apps/cms-faq'
            clickable
          />
          <Chip label={`Inactive banners ${summary?.inactive?.banners ?? '—'}`} size='small' />
          <Chip label={`Inactive tips ${summary?.inactive?.tips ?? '—'}`} size='small' />
        </Stack>

        <Grid container spacing={2}>
          {SECTIONS.map(section => {
            const metric = section.metric(summary)
            const detail = section.detail?.(summary)
            return (
              <Grid key={section.href} item xs={12} sm={6} md={4}>
                <Card variant='outlined' sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
                      <Typography variant='h6'>{section.title}</Typography>
                      {typeof metric === 'number' ? (
                        <Chip size='small' color='success' label={`${metric} live`} />
                      ) : null}
                    </Stack>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 0.5 }}>
                      {section.description}
                    </Typography>
                    {detail ? (
                      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 2 }}>
                        {detail}
                      </Typography>
                    ) : (
                      <Box sx={{ mb: 2 }} />
                    )}
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
          <ContentPlacementGuide kind='banners' />
          <ContentPlacementGuide kind='tips' />
          <ContentPlacementGuide kind='blog' />
          <ContentPlacementGuide kind='faq' />
          <ContentPlacementGuide kind='legal' />
        </Box>
        <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 3 }}>
          Content version: {summary?.content_version ?? '—'} · Updated:{' '}
          {summary?.updated_at ? new Date(summary.updated_at).toLocaleString() : '—'}
        </Typography>
      </AdminPageSection>
    </AdminPageShell>
  )
}
