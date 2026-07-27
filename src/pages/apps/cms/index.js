import { useEffect, useState } from 'react'
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
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getCmsSummary } from 'src/services/cmsApi'
import { getWebPreviewBase } from 'src/configs/adminEnv'

/** Mobile React Query staleTime for GET /cms/home (NET-39). */
const CLIENT_CACHE_TTL_SEC = 60

export default function CmsHubPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setSummary(await getCmsSummary())
    } catch (e) {
      toast.error(e?.message || 'Failed to load CMS summary')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const live = summary?.live || {}
  const previewBase = getWebPreviewBase()

  return (
    <AdminPageShell
      title='CMS'
      subtitle='Banners & tips for mobile/web home. Not a headless rewrite — list → edit → publish.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button variant='outlined' onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant='contained'
            component='a'
            href={previewBase}
            target='_blank'
            rel='noopener noreferrer'
          >
            Preview site
          </Button>
        </Stack>
      }
    >
      <AdminPageSection>
        <Alert severity='info' sx={{ mb: 2 }}>
          Client cache TTL ≈ <strong>{CLIENT_CACHE_TTL_SEC}s</strong> (mobile{' '}
          <code>useCmsHome</code> staleTime). After publish, clients pick up via{' '}
          <code>content_version</code> / refetch — wait one minute before assuming stale.
          {summary?.content_version != null ? (
            <>
              {' '}
              Current version: <strong>{summary.content_version}</strong>
            </>
          ) : null}
        </Alert>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Live banners', value: live.banners, href: '/apps/cms/banners' },
            { label: 'Hero', value: live.banners_hero, href: '/apps/cms/banners?placement=hero' },
            { label: 'Strip', value: live.banners_strip, href: '/apps/cms/banners?placement=strip' },
            { label: 'Sticky', value: live.banners_sticky_bottom, href: '/apps/cms/banners?placement=sticky_bottom' },
            { label: 'Live tips', value: live.tips, href: '/apps/cms/tips' },
            { label: 'Scheduled off-window', value: summary?.scheduled_off_window, href: '/apps/cms/banners' }
          ].map(c => (
            <Grid item xs={6} sm={4} md={2} key={c.label}>
              <Card
                component={Link}
                href={c.href}
                elevation={0}
                sx={{ textDecoration: 'none', border: '1px solid', borderColor: 'divider', height: '100%' }}
              >
                <CardContent>
                  <Typography variant='h5' fontWeight={700}>
                    {loading ? '…' : c.value ?? '—'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {c.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap='wrap' useFlexGap>
          <Button component={Link} href='/apps/cms/banners' variant='contained'>
            Banners
          </Button>
          <Button component={Link} href='/apps/cms/tips' variant='contained' color='secondary'>
            Tips
          </Button>
          <Button component={Link} href='/apps/cms/uploads' variant='outlined'>
            Uploads / asset health
          </Button>
          <Button component={Link} href='/apps/broadcasts' variant='outlined'>
            Broadcasts
          </Button>
        </Stack>

        {summary?.health ? (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {summary.health.hero_empty ? <Chip color='warning' label='Hero empty' size='small' /> : null}
            {summary.health.scheduled_off_window ? (
              <Chip color='info' label='Scheduled banners off-window' size='small' />
            ) : null}
            {summary.health.faq_draft_pending ? (
              <Chip color='default' label='FAQ draft pending (API only)' size='small' />
            ) : null}
          </Box>
        ) : null}
      </AdminPageSection>
    </AdminPageShell>
  )
}
