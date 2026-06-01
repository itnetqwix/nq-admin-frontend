import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  listCmsPages,
  createCmsPage,
  updateCmsPage,
  toggleCmsPage,
  deleteCmsPage
} from 'src/services/cmsApi'

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  body_html: '<p></p>',
  cover_image_url: '',
  video_url: '',
  cta_label: '',
  cta_url: '',
  sort_order: '0',
  is_active: true
}

export default function CmsBlogPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCmsPages('blog')
      setRows(res.data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setOpen(true)
  }

  const openEdit = row => {
    setEditId(row._id)
    setForm({
      title: row.title || '',
      slug: row.slug || '',
      excerpt: row.excerpt || '',
      body_html: row.body_html || '',
      cover_image_url: row.cover_image_url || '',
      video_url: row.video_url || '',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      sort_order: String(row.sort_order ?? 0),
      is_active: row.is_active !== false
    })
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        type: 'blog',
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        excerpt: form.excerpt.trim(),
        body_html: form.body_html,
        cover_image_url: form.cover_image_url || null,
        video_url: form.video_url || null,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        audience: ['all']
      }
      if (editId) await updateCmsPage(editId, payload)
      else await createCmsPage(payload)
      toast.success('Saved — apps refresh within ~60s')
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 180 },
    { field: 'slug', headerName: 'Slug', width: 140 },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.is_active ? 'Yes' : 'No'} size='small' color={row.is_active ? 'success' : 'default'} />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size='small' onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size='small'
            onClick={async () => {
              await toggleCmsPage(row._id)
              await load()
            }}
          >
            Toggle
          </Button>
          <Button
            size='small'
            color='error'
            onClick={async () => {
              if (!window.confirm('Delete this post?')) return
              await deleteCmsPage(row._id)
              await load()
            }}
          >
            Del
          </Button>
        </Box>
      )
    }
  ]

  return (
    <AdminPageShell
      title='Blog'
      subtitle='Articles in the mobile app — cover image, video link, HTML body'
      action={
        <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate}>
          New post
        </Button>
      }
    >
      <AdminPageSection>
        <AdminDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={r => r._id}
          autoHeight
        />
      </AdminPageSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{editId ? 'Edit post' : 'New post'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label='Title' value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <TextField label='Slug' value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          <TextField label='Excerpt' value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} multiline />
          <TextField label='Cover image URL' value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} />
          <TextField label='Video URL (optional)' value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
          <TextField label='CTA label' value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} />
          <TextField label='CTA URL' value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} />
          <TextField
            label='Body HTML'
            value={form.body_html}
            onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
            multiline
            minRows={10}
          />
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />}
            label='Active'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  )
}
