import React, { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { Alert, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import toast from 'react-hot-toast'

import { AdminRefreshButton, OpsSurfaceCard } from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import { getCmsSummary, getCmsAssetHealth } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

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
      (s?.legal?.documents || []).map(d => `${d.slug} v${d.version}`).join(' · ') || '—'
  }
]

function HealthAlerts({ summary, assetHealth }) {
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
  if (assetHealth?.broken?.length) {
    alerts.push({
      severity: 'error',
      text: `${assetHealth.broken.length} broken CMS image link(s) detected — check banners, tips, and blog covers.`
    })
  }
  if (!alerts.length) return null
  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      {alerts.map(a => (
        <Alert key={a.text} severity={a.severity} icon={<WarningAmberIcon fontSize='inherit' />} sx={{ borderRadius: ops.radiusSm }}>
          {a.text}
        </Alert>
      ))}
    </Stack>
  )
}

export default function CmsOverviewPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [assetHealth, setAssetHealth] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [summaryRes, healthRes] = await Promise.all([
        getCmsSummary(),
        getCmsAssetHealth().catch(() => null)
      ])
      setSummary(summaryRes.data || null)
      setAssetHealth(healthRes?.data || null)
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
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminPageSection>
        <HealthAlerts summary={summary} assetHealth={assetHealth} />

        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Live counts.</Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2.5 }}>
          <Chip
            label={`Banners ${summary?.live?.banners ?? '—'}`}
            component={NextLink}
            href='/apps/banners'
            clickable
            sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: ops.ink, color: '#fff' }}
          />
          {placementChips.map(c => (
            <Chip
              key={c.label}
              label={c.label}
              size='small'
              variant='outlined'
              component={NextLink}
              href={c.href}
              clickable
              sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
            />
          ))}
          <Chip
            label={`Tips ${summary?.live?.tips ?? '—'}`}
            component={NextLink}
            href='/apps/tips'
            clickable
            sx={{ fontFamily: ops.mono, fontSize: 11 }}
          />
          <Chip
            label={`FAQ ${summary?.faq?.active ? `v${summary.faq.version}` : 'off'}`}
            component={NextLink}
            href='/apps/cms-faq'
            clickable
            sx={{
              fontFamily: ops.mono,
              fontSize: 11,
              bgcolor: summary?.faq?.has_unpublished_changes ? ops.errorSoft : ops.canvasSoft2,
              color: summary?.faq?.has_unpublished_changes ? ops.warning : ops.body
            }}
          />
        </Stack>

        <Grid container spacing={2}>
          {SECTIONS.map(section => {
            const metric = section.metric(summary)
            const detail = section.detail?.(summary)
            return (
              <Grid key={section.href} item xs={12} sm={6} md={4}>
                <OpsSurfaceCard>
                  <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
                    <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>{section.title}</Typography>
                    {typeof metric === 'number' ? (
                      <Chip
                        size='small'
                        label={`${metric} live`}
                        sx={{ fontFamily: ops.mono, fontSize: 11, bgcolor: '#AAFFEC', color: '#1A8F76' }}
                      />
                    ) : null}
                  </Stack>
                  <Typography sx={{ fontSize: 13, color: ops.body, mt: 1, mb: 0.5, lineHeight: 1.5 }}>
                    {section.description}
                  </Typography>
                  {detail ? (
                    <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block', mb: 2 }}>
                      {detail}
                    </Typography>
                  ) : (
                    <Box sx={{ mb: 2 }} />
                  )}
                  <Button
                    component={NextLink}
                    href={section.href}
                    variant='contained'
                    size='small'
                    sx={{ textTransform: 'none', bgcolor: ops.ink, '&:hover': { bgcolor: '#000' } }}
                  >
                    Open →
                  </Button>
                </OpsSurfaceCard>
              </Grid>
            )
          })}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1.5 }}>Placement guides.</Typography>
          <ContentPlacementGuide kind='banners' />
          <ContentPlacementGuide kind='tips' />
          <ContentPlacementGuide kind='blog' />
          <ContentPlacementGuide kind='faq' />
          <ContentPlacementGuide kind='legal' />
        </Box>
        <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block', mt: 3 }}>
          Content version: {summary?.content_version ?? '—'} · Updated:{' '}
          {summary?.updated_at ? new Date(summary.updated_at).toLocaleString() : '—'}
        </Typography>
      </AdminPageSection>
    </AdminPageShell>
  )
}
