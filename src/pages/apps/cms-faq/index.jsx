import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import toast from 'react-hot-toast'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getAdminFaq, publishAdminFaq, seedAdminFaq } from 'src/services/cmsApi'

const emptyItem = () => ({ q: '', a: '' })
const emptySection = () => ({ title: '', items: [emptyItem()] })

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
    title: sec.title || '',
    items: (sec.items || []).map(it => ({
      q: it.q || it.question || '',
      a: it.a || it.answer || ''
    }))
  }))
}

export default function CmsFaqPage() {
  const [sections, setSections] = useState([emptySection()])
  const [version, setVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getAdminFaq()
      const data = res.data
      setVersion(data?.version ?? 0)
      setSections(fromApi(data))
    } catch (e) {
      toast.error(e.message || 'Failed to load FAQ')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateSection = (si, field, value) => {
    setSections(prev => prev.map((s, i) => (i === si ? { ...s, [field]: value } : s)))
  }

  const updateItem = (si, ii, field, value) => {
    setSections(prev =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              items: s.items.map((it, j) => (j === ii ? { ...it, [field]: value } : it))
            }
          : s
      )
    )
  }

  const addSection = () => setSections(prev => [...prev, emptySection()])
  const removeSection = si => setSections(prev => prev.filter((_, i) => i !== si))
  const addItem = si =>
    setSections(prev =>
      prev.map((s, i) => (i === si ? { ...s, items: [...s.items, emptyItem()] } : s))
    )
  const removeItem = (si, ii) =>
    setSections(prev =>
      prev.map((s, i) =>
        i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s
      )
    )

  const handlePublish = async () => {
    const payload = toApiSections(sections)
    if (!payload.length) {
      toast.error('Add at least one section with a question and answer.')
      return
    }
    setSaving(true)
    try {
      await publishAdminFaq({ sections: payload, is_active: true })
      toast.success('FAQ published — signed-in apps refresh instantly')
      await load()
    } catch (e) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSeed = async () => {
    if (!window.confirm('Import default FAQ from the mobile app bundle? Existing content will be overwritten.')) {
      return
    }
    setSeeding(true)
    try {
      await seedAdminFaq({ force: true })
      toast.success('Defaults imported')
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
      subtitle='Help content in Settings → FAQ — no app store update required'
    >
      <AdminPageSection>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Version {version || '—'}. Signed-in users get instant updates via socket; guests refresh on the
          next manifest poll (~60s).
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Button variant='outlined' onClick={handleSeed} disabled={seeding}>
            {seeding ? 'Importing…' : 'Import app defaults'}
          </Button>
          <Button variant='outlined' startIcon={<AddIcon />} onClick={addSection}>
            Add section
          </Button>
          <Button variant='contained' onClick={handlePublish} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish to app'}
          </Button>
        </Box>

        {sections.map((sec, si) => (
          <Box key={si} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
              <TextField
                label='Section title'
                fullWidth
                size='small'
                value={sec.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
              />
              {sections.length > 1 ? (
                <IconButton color='error' onClick={() => removeSection(si)} aria-label='Remove section'>
                  <DeleteOutlineIcon />
                </IconButton>
              ) : null}
            </Box>
            {(sec.items || []).map((it, ii) => (
              <Box key={ii} sx={{ mb: 2, pl: 1 }}>
                <TextField
                  label='Question'
                  fullWidth
                  size='small'
                  value={it.q}
                  onChange={e => updateItem(si, ii, 'q', e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  label='Answer'
                  fullWidth
                  size='small'
                  multiline
                  minRows={2}
                  value={it.a}
                  onChange={e => updateItem(si, ii, 'a', e.target.value)}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size='small' onClick={() => addItem(si)}>
                    Add question
                  </Button>
                  {(sec.items || []).length > 1 ? (
                    <Button size='small' color='error' onClick={() => removeItem(si, ii)}>
                      Remove
                    </Button>
                  ) : null}
                </Box>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
          </Box>
        ))}
      </AdminPageSection>
    </AdminPageShell>
  )
}
