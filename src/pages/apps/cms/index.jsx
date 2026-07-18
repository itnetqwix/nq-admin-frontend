import { useCallback, useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { Alert, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import toast from 'react-hot-toast'
import moment from 'moment'

import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import { getCmsSummary, getCmsAssetHealth } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

const SECTIONS = [
  {
    title: 'Banners',
    href: '/apps/banners',
    icon: 'mdi:image-multiple-outline',
    description: 'Hero carousel, announcement strip, and sticky bottom promos.',
    metric: s => s?.live?.banners,
    detail: s =>
      `Hero ${s?.live?.banners_hero ?? 0} · Strip ${s?.live?.banners_strip ?? 0} · Sticky ${s?.live?.banners_sticky_bottom ?? 0}`,
    tone: 'accent'
  },
  {
    title: 'Tips (offers)',
    href: '/apps/tips',
    icon: 'mdi:lightbulb-on-outline',
    description: 'Coaching tips on the trainee home feed.',
    metric: s => s?.live?.tips,
    detail: s => `${s?.inactive?.tips ?? 0} inactive`,
    tone: 'success'
  },
  {
    title: 'Blog & pages',
    href: '/apps/cms-blog',
    icon: 'mdi:post-outline',
    description: 'Editorial posts and standalone screens (About, Methodology).',
    metric: s => (s?.pages?.live_blogs ?? 0) + (s?.pages?.live_static_pages ?? 0),
    detail: s => `${s?.pages?.live_blogs ?? 0} blogs · ${s?.pages?.live_static_pages ?? 0} pages`
  },
  {
    title: 'FAQ',
    href: '/apps/cms-faq',
    icon: 'mdi:help-circle-outline',
    description: 'Settings → FAQ — publish drafts to mobile OTA.',
    metric: s => (s?.faq?.active ? 1 : 0),
    detail: s =>
      s?.faq?.has_unpublished_changes
        ? `v${s?.faq?.version ?? 0} · draft pending`
        : `v${s?.faq?.version ?? 0} live`,
    tone: s => (s?.faq?.has_unpublished_changes ? 'warn' : 'default')
  },
  {
    title: 'Legal',
    href: '/apps/cms-legal',
    icon: 'mdi:file-document-outline',
    description: 'Terms, privacy, cancellation — versioned for OTA refresh.',
    metric: s => s?.legal?.active_documents ?? 0,
    detail: s => (s?.legal?.documents || []).map(d => `${d.slug} v${d.version}`).join(' · ') || '—'
  }
]

function buildAlerts(summary, assetHealth) {
  const alerts = []
  if (summary?.health?.hero_empty) {
    alerts.push({
      severity: 'warning',
      text: 'No live hero banners — home carousel may be empty.',
      href: '/apps/banners?placement=hero&status=active'
    })
  }
  const offWindow = Number(summary?.scheduled_off_window) || 0
  if (offWindow > 0 || summary?.health?.scheduled_off_window) {
    alerts.push({
      severity: 'info',
      text: `${offWindow || 'Some'} banner(s) scheduled but outside their active date window.`,
      href: '/apps/banners'
    })
  }
  if (summary?.health?.faq_draft_pending) {
    alerts.push({
      severity: 'warning',
      text: 'FAQ has unpublished draft changes.',
      href: '/apps/cms-faq'
    })
  }
  if (assetHealth?.broken?.length) {
    alerts.push({
      severity: 'error',
      text: `${assetHealth.broken.length} broken CMS image link(s) — check banners, tips, and blog covers.`,
      href: '/apps/banners'
    })
  }
  return alerts
}

export default function CmsOverviewPage() {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [assetHealth, setAssetHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState('all') // all | placements | content | guides

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const alerts = useMemo(() => buildAlerts(summary, assetHealth), [summary, assetHealth])
  const show = key => focus === 'all' || focus === key

  const placementTiles = [
    {
      icon: 'mdi:view-carousel-outline',
      label: 'Hero live',
      value: summary ? fmtInt(summary.live?.banners_hero) : '—',
      hint: 'Home carousel',
      tone: summary?.health?.hero_empty ? 'danger' : 'accent',
      onClick: () => router.push('/apps/banners?placement=hero')
    },
    {
      icon: 'mdi:page-layout-header',
      label: 'Strip live',
      value: summary ? fmtInt(summary.live?.banners_strip) : '—',
      hint: 'Announcement bar',
      onClick: () => router.push('/apps/banners?placement=strip')
    },
    {
      icon: 'mdi:dock-bottom',
      label: 'Sticky live',
      value: summary ? fmtInt(summary.live?.banners_sticky_bottom) : '—',
      hint: 'Above tab bar',
      onClick: () => router.push('/apps/banners?placement=sticky_bottom')
    },
    {
      icon: 'mdi:image-off-outline',
      label: 'Inactive banners',
      value: summary ? fmtInt(summary.inactive?.banners) : '—',
      hint: 'Off / paused',
      tone: 'warn',
      onClick: () => router.push('/apps/banners?status=inactive')
    },
    {
      icon: 'mdi:calendar-clock',
      label: 'Off-window',
      value: summary ? fmtInt(summary.scheduled_off_window) : '—',
      hint: 'Scheduled but not in range',
      tone: (summary?.scheduled_off_window || 0) > 0 ? 'warn' : 'default',
      onClick: () => router.push('/apps/banners')
    },
    {
      icon: 'mdi:lightbulb-on-outline',
      label: 'Tips live',
      value: summary ? fmtInt(summary.live?.tips) : '—',
      hint: 'Home offers',
      tone: 'success',
      onClick: () => router.push('/apps/tips')
    }
  ]

  return (
    <AdminPageShell
      bare
      loading={loading && !summary}
      loadingMessage='Loading CMS overview…'
      icon='mdi:newspaper-variant-outline'
      eyebrow='Content'
      title='CMS & placements'
      subtitle='Live placements, drafts, asset health, and shortcuts — one screen for mobile content.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          <Chip
            size='small'
            variant='outlined'
            label={`v${summary?.content_version ?? '—'}`}
            sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
          />
          {summary?.updated_at ? (
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute }}>
              Synced {moment(summary.updated_at).fromNow()}
            </Typography>
          ) : null}
        </Stack>
      }
    >
      <AdminFilterBar
        onRefresh={() => void load()}
        refreshLoading={loading}
        helperText='Focus filters the sections below. Placement tiles jump into Banners with the right filter.'
      >
        {[
          { id: 'all', label: 'All' },
          { id: 'placements', label: 'Placements' },
          { id: 'content', label: 'Content hubs' },
          { id: 'guides', label: 'Guides' }
        ].map(f => (
          <Chip
            key={f.id}
            size='small'
            clickable
            label={f.label}
            onClick={() => setFocus(f.id)}
            sx={{
              height: 28,
              fontFamily: ops.mono,
              fontSize: 11,
              fontWeight: focus === f.id ? 600 : 500,
              bgcolor: focus === f.id ? ops.softIndigo : ops.canvas,
              color: focus === f.id ? ops.indigoDeep : ops.body,
              border: `1px solid ${focus === f.id ? ops.indigo : ops.hairline}`
            }}
          />
        ))}
        <Button
          size='small'
          variant='outlined'
          component={NextLink}
          href='/apps/banners'
          sx={{ textTransform: 'none', height: 28, fontSize: 12 }}
        >
          Open banners →
        </Button>
      </AdminFilterBar>

      {alerts.length ? (
        <Stack spacing={1} sx={{ mb: 2.5 }}>
          {alerts.map(a => (
            <Alert
              key={a.text}
              severity={a.severity}
              icon={<WarningAmberIcon fontSize='inherit' />}
              action={
                a.href ? (
                  <Button
                    color='inherit'
                    size='small'
                    component={NextLink}
                    href={a.href}
                    sx={{ textTransform: 'none' }}
                  >
                    Fix →
                  </Button>
                ) : null
              }
              sx={{ borderRadius: ops.radiusSm }}
            >
              {a.text}
            </Alert>
          ))}
        </Stack>
      ) : (
        <OpsSurfaceCard sx={{ mb: 2.5, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: ops.body }}>
            No attention items — hero is live, FAQ published, assets healthy.
          </Typography>
        </OpsSurfaceCard>
      )}

      {show('placements') ? (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
            Placements · live now
          </Typography>
          <Grid container spacing={1.5}>
            {placementTiles.map(t => (
              <Grid item xs={6} sm={4} md={2} key={t.label}>
                <OpsMetricTile {...t} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}

      {show('content') ? (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 1.5 }}>
            Content hubs
          </Typography>
          <Grid container spacing={2}>
            {SECTIONS.map(section => {
              const metric = section.metric(summary)
              const detail = section.detail?.(summary)
              const tone =
                typeof section.tone === 'function' ? section.tone(summary) : section.tone || 'default'
              return (
                <Grid key={section.href} item xs={12} sm={6} md={4}>
                  <OpsSurfaceCard sx={{ height: '100%' }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px' }}>{section.title}</Typography>
                        <Typography sx={{ fontSize: 13, color: ops.body, mt: 1, lineHeight: 1.5 }}>
                          {section.description}
                        </Typography>
                      </Box>
                      {typeof metric === 'number' ? (
                        <Chip
                          size='small'
                          label={`${metric} live`}
                          sx={{
                            fontFamily: ops.mono,
                            fontSize: 10,
                            height: 22,
                            bgcolor:
                              tone === 'warn'
                                ? '#ffefcf'
                                : tone === 'success'
                                  ? '#AAFFEC'
                                  : tone === 'accent'
                                    ? ops.softIndigo
                                    : ops.canvasSoft2,
                            color:
                              tone === 'warn'
                                ? '#ab570a'
                                : tone === 'success'
                                  ? '#1A8F76'
                                  : tone === 'accent'
                                    ? ops.indigoDeep
                                    : ops.body
                          }}
                        />
                      ) : null}
                    </Stack>
                    {detail ? (
                      <Typography
                        sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, display: 'block', mt: 1.5, mb: 2 }}
                      >
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
                      sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
                    >
                      Open →
                    </Button>
                  </OpsSurfaceCard>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      ) : null}

      {show('guides') ? (
        <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
          <AdminPageSection
            title='Placement guides'
            subtitle='Where each content type appears in the app — match audience tags to surfaces.'
            icon='mdi:map-marker-path'
          >
            <ContentPlacementGuide kind='banners' defaultExpanded />
            <ContentPlacementGuide kind='tips' />
            <ContentPlacementGuide kind='blog' />
            <ContentPlacementGuide kind='faq' />
            <ContentPlacementGuide kind='legal' />
          </AdminPageSection>
        </OpsSurfaceCard>
      ) : null}
    </AdminPageShell>
  )
}
