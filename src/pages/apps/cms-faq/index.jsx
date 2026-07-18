import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'
import toast from 'react-hot-toast'

import { useAdminConfirm } from 'src/components/admin'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import FaqDndEditor from 'src/components/admin/content/FaqDndEditor'
import FaqPreview from 'src/components/admin/content/FaqPreview'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getAdminFaq, publishFaq, saveFaqDraft, seedAdminFaq } from 'src/services/cmsApi'
import { ops } from 'src/styles/opsSurface'

const newId = () => `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const emptyItem = () => ({ id: newId(), q: '', a: '' })
const emptySection = () => ({ id: newId(), title: '', items: [emptyItem()] })

function toApiSections(sections) {
  return sections
    .map((sec, si) => {
      const title = String(sec.title || '').trim()
      if (!title) return null
      const items = (sec.items || [])
        .map((it, ii) => {
          const question = String(it.q || it.question || '').trim()
          const answer = String(it.a || it.answer || '').trim()
          if (!question || !answer) return null
          return { question, answer, sort_order: ii }
        })
        .filter(Boolean)
      if (!items.length) return null
      return { title, sort_order: si, items }
    })
    .filter(Boolean)
}

function fromApi(data) {
  const sections = data?.sections || []
  if (!sections.length) return [emptySection()]
  return sections.map(sec => ({
    id: newId(),
    title: sec.title || '',
    items: (sec.items || []).map(it => ({
      id: newId(),
      q: it.q || it.question || '',
      a: it.a || it.answer || ''
    }))
  }))
}

export default function CmsFaqPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [sections, setSections] = useState([emptySection()])
  const [version, setVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [hasUnpublished, setHasUnpublished] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getAdminFaq()
      const data = res.data
      setVersion(data?.version ?? 0)
      setSections(fromApi(data))
      setHasUnpublished(Boolean(data?.has_unpublished_changes))
      setDirty(false)
    } catch (e) {
      toast.error(e.message || 'Failed to load FAQ')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const markDirty = updater => {
    setDirty(true)
    updater()
  }

  const addSection = () => markDirty(() => setSections(prev => [...prev, emptySection()]))

  const removeSection = async id => {
    const sec = sections.find(s => s.id === id)
    const ok = await confirm({
      title: 'Remove FAQ section?',
      message: `"${sec?.title || 'Section'}" and all its questions will be removed from the draft.`,
      confirmLabel: 'Remove',
      variant: 'danger'
    })
    if (!ok) return
    markDirty(() => setSections(prev => (prev.length <= 1 ? [emptySection()] : prev.filter(s => s.id !== id))))
  }

  const addItem = sectionId =>
    markDirty(() =>
      setSections(prev =>
        prev.map(s => (s.id === sectionId ? { ...s, items: [...s.items, emptyItem()] } : s))
      )
    )

  const removeItem = async (sectionId, itemId) => {
    const sec = sections.find(s => s.id === sectionId)
    const it = sec?.items?.find(i => i.id === itemId)
    const ok = await confirm({
      title: 'Remove question?',
      message: `"${(it?.q || 'Question').slice(0, 80)}" will be removed from the draft.`,
      confirmLabel: 'Remove',
      variant: 'warning'
    })
    if (!ok) return
    markDirty(() =>
      setSections(prev =>
        prev.map(s =>
          s.id === sectionId
            ? { ...s, items: s.items.length <= 1 ? [emptyItem()] : s.items.filter(i => i.id !== itemId) }
            : s
        )
      )
    )
  }

  const stats = useMemo(() => {
    const sectionCount = sections.filter(s => s.title?.trim()).length
    const qCount = sections.reduce(
      (n, s) => n + (s.items || []).filter(it => it.q?.trim() && it.a?.trim()).length,
      0
    )
    return { sectionCount, qCount }
  }, [sections])

  const handleSaveDraft = async () => {
    const payload = toApiSections(sections)
    if (!payload.length) {
      toast.error('Add at least one section with a question and answer.')
      return
    }
    setSaving(true)
    try {
      const res = await saveFaqDraft({ sections: payload })
      const data = res.data
      setVersion(data?.version ?? version)
      setHasUnpublished(Boolean(data?.has_unpublished_changes))
      setDirty(false)
      toast.success('Draft saved — not visible in apps until you publish')
    } catch (e) {
      toast.error(e.message || 'Save draft failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const payload = toApiSections(sections)
    if (!payload.length && !hasUnpublished) {
      toast.error('Add at least one section with a question and answer.')
      return
    }
    const ok = await confirm({
      title: 'Publish FAQ to all apps?',
      message: 'Live FAQ content will be replaced. Signed-in users refresh instantly.',
      detail: `${payload.length || 'draft'} section(s) · ${stats.qCount} Q&As · version ${version || 'new'}`,
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return
    setPublishing(true)
    try {
      const res = await publishFaq(dirty && payload.length ? { sections: payload } : {})
      const data = res.data
      setVersion(data?.version ?? version)
      setHasUnpublished(false)
      setDirty(false)
      if (data) setSections(fromApi(data))
      toast.success('FAQ published — signed-in apps refresh instantly')
    } catch (e) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const handleSeed = async () => {
    const ok = await confirm({
      title: 'Import default FAQ?',
      message: 'Loads bundled mobile defaults into your draft. You can review before publishing.',
      confirmLabel: 'Import to draft',
      variant: 'warning'
    })
    if (!ok) return
    setSeeding(true)
    try {
      await seedAdminFaq({ force: true })
      toast.success('Defaults imported — review and publish when ready')
      await load()
    } catch (e) {
      toast.error(e.message || 'Import failed')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <AdminPageShell
      bare
      icon='mdi:help-circle-outline'
      eyebrow='CMS'
      title='FAQ'
      subtitle='Settings → FAQ — save drafts, then publish OTA to signed-in apps.'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip component={NextLink} href='/apps/cms' label='CMS overview' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} />
          <Button variant='outlined' size='small' onClick={() => void handleSeed()} disabled={seeding} sx={{ textTransform: 'none' }}>
            {seeding ? 'Importing…' : 'Import defaults'}
          </Button>
          <Button
            variant='outlined'
            size='small'
            onClick={() => void handleSaveDraft()}
            disabled={saving || !dirty}
            sx={{ textTransform: 'none' }}
          >
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            variant='contained'
            size='small'
            onClick={() => void handlePublish()}
            disabled={publishing || (!dirty && !hasUnpublished)}
            sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
          >
            {publishing ? 'Publishing…' : 'Publish to app'}
          </Button>
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:tag-outline'
            label='Version'
            value={version || '—'}
            hint='Live after publish'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:folder-outline'
            label='Sections'
            value={stats.sectionCount}
            hint='With titles'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:help-circle-outline'
            label='Q&As'
            value={stats.qCount}
            hint='Complete pairs'
            tone='success'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:alert-circle-outline'
            label='Draft state'
            value={dirty || hasUnpublished ? 'Pending' : 'Clean'}
            hint={dirty ? 'Local edits' : hasUnpublished ? 'Unpublished' : 'In sync'}
            tone={dirty || hasUnpublished ? 'warn' : 'success'}
          />
        </Grid>
      </Grid>

      {(dirty || hasUnpublished) && (
        <OpsSurfaceCard sx={{ mb: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: '#ab570a' }}>
            Unpublished changes — apps still serve the last published version until you publish.
          </Typography>
        </OpsSurfaceCard>
      )}

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
        <AdminPageSection>
          <ContentPlacementGuide kind='faq' defaultExpanded={false} />
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <FaqDndEditor
                sections={sections}
                setSections={setSections}
                markDirty={markDirty}
                onRemoveSection={removeSection}
                onAddSection={addSection}
                onAddItem={addItem}
                onRemoveItem={removeItem}
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
                <MobileFramePreview label='Mobile preview' subtitle='Settings → FAQ accordion' showDeviceToggle>
                  <FaqPreview sections={sections} />
                </MobileFramePreview>
              </Box>
            </Grid>
          </Grid>
        </AdminPageSection>
      </OpsSurfaceCard>
      {ConfirmDialog}
    </AdminPageShell>
  )
}
