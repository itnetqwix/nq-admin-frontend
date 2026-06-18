import React, { useCallback, useEffect, useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'

import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { listLegalDocuments, upsertLegalDocument } from 'src/services/cmsApi'

const SLUGS = [
  { slug: 'terms', label: 'Terms & conditions' },
  { slug: 'privacy', label: 'Privacy policy' }
]

export default function CmsLegalPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState(0)
  const [docs, setDocs] = useState({})
  const [title, setTitle] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [saving, setSaving] = useState(false)

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
  }, [docs, slug, tab])

  const handlePublish = async () => {
    const ok = await confirm({
      title: `Publish ${SLUGS[tab].label}?`,
      message: 'This replaces the live document in all mobile apps.',
      detail: `Slug: ${slug} · version ${docs[slug]?.version ?? 'new'}`,
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return
    setSaving(true)
    try {
      await upsertLegalDocument(slug, {
        title: title.trim(),
        body_html: bodyHtml,
        is_active: true
      })
      toast.success('Published — signed-in apps refresh instantly; guests within ~60s')
      await load()
    } catch (e) {
      toast.error(e.message || 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  const version = docs[slug]?.version

  return (
    <AdminPageShell title='Legal documents' subtitle='Terms & privacy — live in the app without a store update'>
      <AdminPageSection>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          HTML is rendered in-app. Version {version ?? '—'} is shown to users after publish.
        </Typography>
        <AdminTabs
          value={tab}
          onChange={setTab}
          tabs={SLUGS.map((s, i) => ({ value: i, label: s.label }))}
        />
        <TextField
          fullWidth
          label='Title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={16}
          label='Body (HTML)'
          value={bodyHtml}
          onChange={e => setBodyHtml(e.target.value)}
          sx={{ mb: 2, fontFamily: 'monospace' }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='contained' onClick={() => void handlePublish()} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish to app'}
          </Button>
        </Box>
      </AdminPageSection>
      {ConfirmDialog}
    </AdminPageShell>
  )
}
