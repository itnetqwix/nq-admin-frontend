import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import NextLink from 'next/link'
import toast from 'react-hot-toast'

import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import { useAdminConfirm } from 'src/components/admin'
import CmsEditorDrawer from 'src/components/admin/content/CmsEditorDrawer'
import CmsHtmlEditor from 'src/components/admin/content/CmsHtmlEditor'
import CmsCoverCropUploader from 'src/components/admin/content/CmsCoverCropUploader'
import ContentPlacementGuide from 'src/components/admin/content/ContentPlacementGuide'
import CmsPagePlacementPreview from 'src/components/admin/content/CmsPagePlacementPreview'
import MobileFramePreview from 'src/components/admin/content/MobileFramePreview'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { slugify } from 'src/utils/slugify'
import {
  listCmsPages,
  createCmsPage,
  updateCmsPage,
  toggleCmsPage,
  deleteCmsPage
} from 'src/services/cmsApi'

const AUDIENCES = ['guest', 'trainee', 'trainer', 'all']
const PAGE_TYPES = [
  { value: 'blog', label: 'Blog post' },
  { value: 'page', label: 'Static page' }
]

const EMPTY = {
  type: 'blog',
  title: '',
  slug: '',
  excerpt: '',
  body_html: '<p></p>',
  cover_image_url: '',
  video_url: '',
  cta_label: '',
  cta_url: '',
  audience: ['all'],
  sort_order: '0',
  published_at: '',
  is_active: true,
  seo_title: '',
  seo_description: '',
  og_image_url: ''
}

function audienceChip(audience) {
  const list = Array.isArray(audience) ? audience : [audience]
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {list.map(a => (
        <Chip key={a} label={a} size='small' />
      ))}
    </Box>
  )
}

export default function CmsBlogPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [previewRow, setPreviewRow] = useState(null)
  const [search, setSearch] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      r =>
        String(r.title || '').toLowerCase().includes(q) ||
        String(r.slug || '').toLowerCase().includes(q) ||
        String(r.excerpt || '').toLowerCase().includes(q)
    )
  }, [rows, search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCmsPages(typeFilter || undefined)
      setRows(res.data || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY })
    setSlugTouched(false)
    setOpen(true)
  }

  const openEdit = row => {
    setEditId(row._id)
    const pub = row.published_at ? String(row.published_at).slice(0, 10) : ''
    setSlugTouched(true)
    setForm({
      type: row.type === 'page' ? 'page' : 'blog',
      title: row.title || '',
      slug: row.slug || '',
      excerpt: row.excerpt || '',
      body_html: row.body_html || '',
      cover_image_url: row.cover_image_url || '',
      video_url: row.video_url || '',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      audience: Array.isArray(row.audience) && row.audience.length ? row.audience : ['all'],
      sort_order: String(row.sort_order ?? 0),
      published_at: pub,
      is_active: row.is_active !== false,
      seo_title: row.seo_title || '',
      seo_description: row.seo_description || '',
      og_image_url: row.og_image_url || ''
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    const slug = (form.slug || slugify(form.title)).trim().toLowerCase()
    if (!slug) {
      toast.error('Slug is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        type: form.type === 'page' ? 'page' : 'blog',
        title: form.title.trim(),
        slug,
        excerpt: form.excerpt.trim(),
        body_html: form.body_html,
        cover_image_url: form.cover_image_url || null,
        video_url: form.video_url || null,
        cta_label: form.cta_label || null,
        cta_url: form.cta_url || null,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
        audience: form.audience?.length ? form.audience : ['all'],
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        seo_title: form.seo_title?.trim() || null,
        seo_description: form.seo_description?.trim() || null,
        og_image_url: form.og_image_url || null
      }
      if (editId) await updateCmsPage(editId, payload)
      else await createCmsPage(payload)
      toast.success('Saved — mobile app refreshes on CMS_UPDATED')
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    { field: 'slug', headerName: 'Slug', width: 120 },
    {
      field: 'type',
      headerName: 'Type',
      width: 90,
      renderCell: ({ row }) => <Chip label={row.type || 'blog'} size='small' />
    },
    {
      field: 'audience',
      headerName: 'Audience',
      width: 140,
      renderCell: ({ row }) => audienceChip(row.audience)
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 80,
      renderCell: ({ row }) => (
        <Chip label={row.is_active ? 'Yes' : 'No'} size='small' color={row.is_active ? 'success' : 'default'} />
      )
    },
    {
      field: 'preview',
      headerName: '',
      width: 52,
      sortable: false,
      renderCell: ({ row }) => (
        <IconButton size='small' aria-label='Preview' onClick={() => setPreviewRow(row)}>
          <VisibilityIcon fontSize='small' />
        </IconButton>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => openEdit(row)}>
              <EditIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Toggle active'>
            <IconButton
              size='small'
              onClick={async e => {
                e.stopPropagation()
                await toggleCmsPage(row._id)
                await load()
              }}
            >
              <ToggleOnIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton
              size='small'
              color='error'
              onClick={async e => {
                e.stopPropagation()
                const ok = await confirm({
                  title: 'Delete this page?',
                  message: 'The blog or static page will be removed from the mobile app.',
                  detail: row.title,
                  confirmLabel: 'Delete',
                  variant: 'danger'
                })
                if (!ok) return
                await deleteCmsPage(row._id)
                await load()
              }}
            >
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  return (
    <AdminPageShell
      icon='mdi:post-outline'
      title='Blog & pages'
      subtitle='Articles and static pages in the mobile app'
      actions={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button component={NextLink} href='/apps/cms' variant='outlined' size='small'>
            CMS overview
          </Button>
          <Button component={NextLink} href='/apps/banners' variant='outlined' size='small'>
            Banners
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={openCreate}>
            New
          </Button>
        </Box>
      }
    >
      <AdminPageSection>
        <ContentPlacementGuide kind='blog' defaultExpanded={false} />
        <AdminFilterBar
          searchPlaceholder='Search title, slug, excerpt…'
          searchValue={search}
          onSearchChange={e => setSearch(e.target.value)}
          onRefresh={() => void load()}
          refreshLoading={loading}
          resultCount={filteredRows.length}
        >
          <FormControl fullWidth size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Filter type</InputLabel>
            <Select label='Filter type' value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='blog'>Blog</MenuItem>
              <MenuItem value='page'>Page</MenuItem>
            </Select>
          </FormControl>
        </AdminFilterBar>
        <AdminDataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={r => r._id}
          autoHeight
          onRowClick={p => openEdit(p.row)}
          clickableRows
        />
      </AdminPageSection>

      <CmsEditorDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Edit page' : 'Create page'}
        subtitle={form.type === 'page' ? 'Static WebView page' : 'Blog post with list card + article view'}
        onSave={handleSave}
        saving={saving}
        saveLabel={editId ? 'Update' : 'Create'}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Type</InputLabel>
                <Select
                  label='Type'
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  {PAGE_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label='Title'
                fullWidth
                size='small'
                value={form.title}
                onChange={e => {
                  const title = e.target.value
                  setForm(f => ({
                    ...f,
                    title,
                    slug: !slugTouched && !editId ? slugify(title) : f.slug
                  }))
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Slug'
                fullWidth
                size='small'
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true)
                  setForm(f => ({ ...f, slug: e.target.value }))
                }}
                helperText='URL path in the app · auto-generated from title'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Audience</InputLabel>
                <Select
                  label='Audience'
                  multiple
                  value={form.audience}
                  onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  renderValue={v => v.join(', ')}
                >
                  {AUDIENCES.map(a => (
                    <MenuItem key={a} value={a}>
                      {a}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Excerpt'
                fullWidth
                size='small'
                multiline
                minRows={2}
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <CmsCoverCropUploader
                label='Cover image'
                kind='pages'
                value={form.cover_image_url}
                onChange={v => setForm(f => ({ ...f, cover_image_url: v }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='SEO title'
                fullWidth
                size='small'
                value={form.seo_title}
                onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))}
                inputProps={{ maxLength: 70 }}
                helperText={`${(form.seo_title || '').length}/70`}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='SEO description'
                fullWidth
                size='small'
                multiline
                minRows={2}
                value={form.seo_description}
                onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
                inputProps={{ maxLength: 160 }}
                helperText={`${(form.seo_description || '').length}/160`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Open Graph image URL (optional)'
                fullWidth
                size='small'
                value={form.og_image_url}
                onChange={e => setForm(f => ({ ...f, og_image_url: e.target.value }))}
                placeholder='Defaults to cover image when empty'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Video URL (optional)'
                fullWidth
                size='small'
                value={form.video_url}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Publish date (optional)'
                fullWidth
                size='small'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={form.published_at}
                onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='CTA label'
                fullWidth
                size='small'
                value={form.cta_label}
                onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='CTA URL'
                fullWidth
                size='small'
                value={form.cta_url}
                onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label='Sort order'
                fullWidth
                size='small'
                type='number'
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <CmsHtmlEditor
                label='Body'
                value={form.body_html}
                onChange={html => setForm(f => ({ ...f, body_html: html }))}
                minHeight={320}
                helperText='Rendered in-app via WebView — use headings and lists for readability.'
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                }
                label='Active'
              />
            </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 8 } }}>
              <MobileFramePreview
                label='App preview'
                subtitle={form.type === 'page' ? 'Static WebView page' : 'Blog list + article'}
                showDeviceToggle
              >
                <CmsPagePlacementPreview form={form} />
              </MobileFramePreview>
              </Box>
            </Grid>
          </Grid>
      </CmsEditorDrawer>

      <Dialog open={!!previewRow} onClose={() => setPreviewRow(null)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {previewRow
            ? `Preview · ${previewRow.type === 'page' ? 'Static page' : 'Blog'} · ${previewRow.title}`
            : 'Preview'}
        </DialogTitle>
        <DialogContent dividers>
          {previewRow ? (
            <MobileFramePreview label='Mobile preview' showDeviceToggle>
              <CmsPagePlacementPreview form={previewRow} />
            </MobileFramePreview>
          ) : null}
        </DialogContent>
        <DialogActions>
          {previewRow ? (
            <Button
              onClick={() => {
                setPreviewRow(null)
                openEdit(previewRow)
              }}
            >
              Edit
            </Button>
          ) : null}
          <Button onClick={() => setPreviewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {ConfirmDialog}
    </AdminPageShell>
  )
}
