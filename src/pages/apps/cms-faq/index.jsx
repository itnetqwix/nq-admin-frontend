import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import toast from 'react-hot-toast'

import { useAdminConfirm } from 'src/components/admin'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import CmsHtmlEditor from 'src/components/admin/content/CmsHtmlEditor'
import FaqPreview from 'src/components/admin/content/FaqPreview'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getAdminFaq, publishFaq, saveFaqDraft, seedAdminFaq } from 'src/services/cmsApi'

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

  const updateSection = (id, field, value) => {
    markDirty(() => setSections(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s))))
  }

  const updateItem = (sectionId, itemId, field, value) => {
    markDirty(() =>
      setSections(prev =>
        prev.map(s =>
          s.id === sectionId
            ? { ...s, items: s.items.map(it => (it.id === itemId ? { ...it, [field]: value } : it)) }
            : s
        )
      )
    )
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
      title='FAQ'
      subtitle='Help content in Settings → FAQ — publish without an app store update'
      actions={
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <AdminRefreshButton onClick={() => void load()} />
          <Button variant='outlined' onClick={() => void handleSeed()} disabled={seeding}>
            {seeding ? 'Importing…' : 'Import defaults'}
          </Button>
          <Button variant='outlined' onClick={() => void handleSaveDraft()} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button variant='contained' onClick={() => void handlePublish()} disabled={publishing || (!dirty && !hasUnpublished)}>
            {publishing ? 'Publishing…' : 'Publish to app'}
          </Button>
        </Stack>
      }
    >
      <AdminPageSection>
        <ContentPlacementGuide kind='faq' defaultExpanded={false} />
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 2 }}>
          <Chip label={`Version ${version || '—'}`} size='small' variant='outlined' />
          <Chip label={`${stats.sectionCount} sections`} size='small' />
          <Chip label={`${stats.qCount} Q&As`} size='small' color='primary' variant='outlined' />
          {dirty || hasUnpublished ? (
            <Chip label='Unpublished changes' size='small' color='warning' />
          ) : null}
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
              <Typography variant='subtitle1' fontWeight={700}>
                Editor
              </Typography>
              <Button size='small' startIcon={<AddIcon />} onClick={addSection}>
                Add section
              </Button>
            </Stack>

            {sections.map((sec, si) => (
              <Box
                key={sec.id}
                sx={{ mb: 2.5, p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
              >
                <Stack direction='row' spacing={1} alignItems='flex-start' sx={{ mb: 2 }}>
                  <DragIndicatorIcon sx={{ color: 'text.disabled', mt: 1 }} fontSize='small' />
                  <TextField
                    label={`Section ${si + 1} title`}
                    fullWidth
                    size='small'
                    value={sec.title}
                    onChange={e => updateSection(sec.id, 'title', e.target.value)}
                    placeholder='e.g. Getting started'
                  />
                  <IconButton color='error' onClick={() => void removeSection(sec.id)} aria-label='Remove section'>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>

                {(sec.items || []).map((it, ii) => (
                  <Box key={it.id} sx={{ mb: 2, pl: 3, borderLeft: '2px solid', borderColor: 'divider' }}>
                    <TextField
                      label={`Question ${ii + 1}`}
                      fullWidth
                      size='small'
                      value={it.q}
                      onChange={e => updateItem(sec.id, it.id, 'q', e.target.value)}
                      sx={{ mb: 1.5 }}
                    />
                    <CmsHtmlEditor
                      label='Answer'
                      value={it.a}
                      onChange={html => updateItem(sec.id, it.id, 'a', html)}
                      minHeight={160}
                      helperText='Rich text supported — links and lists render in the app.'
                    />
                    <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
                      <Button size='small' onClick={() => addItem(sec.id)}>
                        Add question
                      </Button>
                      {(sec.items || []).length > 1 ? (
                        <Button size='small' color='error' onClick={() => void removeItem(sec.id, it.id)}>
                          Remove
                        </Button>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </Box>
            ))}
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
      {ConfirmDialog}
    </AdminPageShell>
  )
}
