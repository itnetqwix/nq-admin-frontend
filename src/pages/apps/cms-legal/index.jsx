import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import NextLink from 'next/link'
import toast from 'react-hot-toast'

import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import CmsHtmlEditor from 'src/components/admin/content/CmsHtmlEditor'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import LegalDocumentPreview from 'src/components/admin/content/LegalDocumentPreview'
import LegalPublishDialog from 'src/components/admin/content/LegalPublishDialog'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import { listLegalDocuments, publishLegal, saveLegalDraft, seedLegalDocuments } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

const SLUGS = [
  { slug: 'terms', label: 'Terms & conditions' },
  { slug: 'privacy', label: 'Privacy policy' },
  { slug: 'cancellation', label: 'Cancellation policy' },
  { slug: 'refund', label: 'Refund policy' }
]

const WRITING_TIPS = [
  'Use short paragraphs (2–4 sentences) for mobile readability.',
  'Structure with <h2> section headings — users scan on phones.',
  'Link support emails with <a href="mailto:..."> for tap-to-email.',
  'Avoid inline styles; the app applies theme colors automatically.',
  'Publish increments version — users see updates without a store release.'
]

export default function CmsLegalPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState(0)
  const [docs, setDocs] = useState({})
  const [title, setTitle] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [previewDark, setPreviewDark] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const slug = SLUGS[tab].slug

  const load = useCallback(async () => {
    try {
      const res = await listLegalDocuments()
      const map = {}
      ;(res.data || []).forEach(d => {
        map[d.slug] = d
      })
      setDocs(map)
    } catch (e) {
      toast.error(e.message || 'Failed to load legal documents')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const doc = docs[slug]
    setTitle(doc?.title || SLUGS[tab].label)
    setBodyHtml(doc?.body_html || '<p>Enter HTML content here.</p>')
    setDirty(false)
  }, [docs, slug, tab])

  const handleSeed = async () => {
    const ok = await confirm({
      title: 'Seed legal templates?',
      message: 'Loads starter Terms, Privacy, Cancellation & Refund HTML. Skips documents that already exist unless you force overwrite.',
      confirmLabel: 'Seed',
      variant: 'info'
    })
    if (!ok) return
    setSeeding(true)
    try {
      await seedLegalDocuments({ slug })
      toast.success('Template loaded — review and publish when ready')
      await load()
    } catch (e) {
      toast.error(e.message || 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await saveLegalDraft(slug, {
        title: title.trim(),
        body_html: bodyHtml
      })
      toast.success('Draft saved — not visible in apps until you publish')
      setDirty(false)
      await load()
    } catch (e) {
      toast.error(e.message || 'Save draft failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (notifyPayload = {}) => {
    setPublishing(true)
    try {
      const body = {
        ...(dirty ? { title: title.trim(), body_html: bodyHtml } : {}),
        is_active: true,
        ...notifyPayload
      }
      const res = await publishLegal(slug, body)
      const emailNotify = res.data?.email_notify
      if (emailNotify?.queued > 0) {
        const pushPart =
          emailNotify.push_sent > 0 ? ` · push ${emailNotify.push_sent}` : ''
        toast.success(
          `Published · emails ${emailNotify.sent}/${emailNotify.queued}${pushPart}` +
            (emailNotify.failed ? ` (${emailNotify.failed} email failed)` : '')
        )
      } else {
        toast.success('Published — signed-in apps refresh instantly; guests within ~60s')
      }
      setDirty(false)
      setPublishOpen(false)
      await load()
    } catch (e) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const version = docs[slug]?.version
  const hasUnpublished = Boolean(docs[slug]?.has_unpublished_changes)
  const pendingDocs = SLUGS.filter(s => docs[s.slug]?.has_unpublished_changes).length

  return (
    <AdminPageShell
      bare
      icon='mdi:file-document-outline'
      eyebrow='CMS'
      title='Legal documents'
      subtitle='Terms, privacy, cancellation & refund — versioned OTA. Publish can notify users by email.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip component={NextLink} href='/apps/cms' label='CMS overview' clickable variant='outlined' size='small' />
          <Chip component={NextLink} href='/apps/cms-faq' label='FAQ' clickable variant='outlined' size='small' />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {SLUGS.map((s, i) => {
          const d = docs[s.slug]
          const pending = Boolean(d?.has_unpublished_changes)
          return (
            <Grid item xs={6} sm={3} key={s.slug}>
              <OpsMetricTile
                icon='mdi:file-document-outline'
                label={s.label}
                value={d?.version != null ? `v${d.version}` : '—'}
                hint={pending ? 'Draft pending' : d ? 'Published' : 'Missing'}
                tone={pending ? 'warn' : d ? 'success' : 'default'}
                onClick={() => setTab(i)}
              />
            </Grid>
          )
        })}
      </Grid>

      {(dirty || hasUnpublished) && (
        <OpsSurfaceCard sx={{ mb: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: '#ab570a' }}>
            {SLUGS[tab].label} has unpublished changes
            {pendingDocs > 1 ? ` · ${pendingDocs} docs with drafts` : ''}.
          </Typography>
        </OpsSurfaceCard>
      )}

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <ContentPlacementGuide kind='legal' defaultExpanded={false} />
          <OpsSurfaceCard sx={{ mb: 2, bgcolor: ops.canvas }}>
            <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              Writing tips
            </Typography>
            {WRITING_TIPS.map(tip => (
              <Typography key={tip} sx={{ fontSize: 13, color: ops.body, mb: 0.5, lineHeight: 1.5 }}>
                · {tip}
              </Typography>
            ))}
          </OpsSurfaceCard>

          <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
            <Chip
              size='small'
              label={`Version ${version ?? '—'}`}
              sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
              variant='outlined'
            />
            {dirty || hasUnpublished ? (
              <Chip
                size='small'
                label='Unpublished changes'
                sx={{ fontFamily: ops.mono, fontSize: 10, bgcolor: '#ffefcf', color: '#ab570a' }}
              />
            ) : (
              <Chip
                size='small'
                label='In sync'
                sx={{ fontFamily: ops.mono, fontSize: 10, bgcolor: '#AAFFEC', color: '#1A8F76' }}
              />
            )}
          </Stack>

          <AdminTabs
            value={tab}
            onChange={setTab}
            tabs={SLUGS.map((s, i) => ({ value: i, label: s.label }))}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Title'
                value={title}
                onChange={e => {
                  setDirty(true)
                  setTitle(e.target.value)
                }}
                sx={{ mb: 2 }}
              />
              <CmsHtmlEditor
                label='Body'
                value={bodyHtml}
                onChange={html => {
                  setDirty(true)
                  setBodyHtml(html)
                }}
                minHeight={360}
                helperText='Use headings for sections. Publish increments version for OTA refresh.'
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant='outlined' onClick={() => void handleSeed()} disabled={seeding} sx={{ textTransform: 'none' }}>
                  {seeding ? 'Loading…' : 'Load template'}
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => void handleSaveDraft()}
                  disabled={saving || !dirty}
                  sx={{ textTransform: 'none' }}
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </Button>
                <Button
                  variant='contained'
                  onClick={() => setPublishOpen(true)}
                  disabled={publishing || (!dirty && !hasUnpublished)}
                  sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
                >
                  {publishing ? 'Publishing…' : 'Publish to app'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <MobileFramePreview
                label='App preview'
                subtitle={`${SLUGS[tab].label} · Signup · Settings`}
                dark={previewDark}
              >
                <LegalDocumentPreview
                  title={title}
                  bodyHtml={bodyHtml}
                  version={version}
                  dark={previewDark}
                  onDarkChange={setPreviewDark}
                />
              </MobileFramePreview>
            </Grid>
          </Grid>
        </AdminPageSection>
      </OpsSurfaceCard>
      <LegalPublishDialog
        open={publishOpen}
        onClose={() => !publishing && setPublishOpen(false)}
        onConfirm={payload => void handlePublish(payload)}
        slug={slug}
        documentTitle={title || SLUGS[tab].label}
        version={(docs[slug]?.version ?? 0) + 1}
        publishing={publishing}
      />
      {ConfirmDialog}
    </AdminPageShell>
  )
}
