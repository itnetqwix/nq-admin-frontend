import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'

import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import CmsHtmlEditor from 'src/components/admin/content/CmsHtmlEditor'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import LegalDocumentPreview from 'src/components/admin/content/LegalDocumentPreview'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import { listLegalDocuments, publishLegal, saveLegalDraft, seedLegalDocuments } from 'src/services/cmsApi'

const SLUGS = [
  { slug: 'terms', label: 'Terms & conditions' },
  { slug: 'privacy', label: 'Privacy policy' }
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
      message: 'Loads starter Terms & Privacy HTML. Skips documents that already exist unless you force overwrite.',
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

  const handlePublish = async () => {
    const ok = await confirm({
      title: `Publish ${SLUGS[tab].label}?`,
      message: 'This replaces the live document in all mobile apps.',
      detail: `Slug: ${slug} · version ${docs[slug]?.version ?? 'new'}`,
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return
    setPublishing(true)
    try {
      const body =
        dirty
          ? { title: title.trim(), body_html: bodyHtml, is_active: true }
          : { is_active: true }
      await publishLegal(slug, body)
      toast.success('Published — signed-in apps refresh instantly; guests within ~60s')
      setDirty(false)
      await load()
    } catch (e) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const version = docs[slug]?.version
  const hasUnpublished = Boolean(docs[slug]?.has_unpublished_changes)

  return (
    <AdminPageShell title='Legal documents' subtitle='Terms & privacy — live in the app without a store update'>
      <AdminPageSection>
        <ContentPlacementGuide kind='legal' defaultExpanded={false} />
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          HTML is rendered in-app. Version {version ?? '—'} is shown to users after publish.
        </Typography>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          <Chip label={`Version ${version ?? '—'}`} size='small' variant='outlined' />
          {dirty || hasUnpublished ? (
            <Chip label='Unpublished changes' size='small' color='warning' />
          ) : null}
        </Stack>
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant='subtitle2' sx={{ mb: 1 }}>
            Writing tips
          </Typography>
          {WRITING_TIPS.map(tip => (
            <Typography key={tip} variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
              • {tip}
            </Typography>
          ))}
        </Box>
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
              <Button variant='outlined' onClick={() => void handleSeed()} disabled={seeding}>
                {seeding ? 'Loading…' : 'Load template'}
              </Button>
              <Button variant='outlined' onClick={() => void handleSaveDraft()} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save draft'}
              </Button>
              <Button
                variant='contained'
                onClick={() => void handlePublish()}
                disabled={publishing || (!dirty && !hasUnpublished)}
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
      {ConfirmDialog}
    </AdminPageShell>
  )
}
