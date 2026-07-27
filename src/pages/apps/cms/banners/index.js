import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField
} from '@mui/material'
import toast from 'react-hot-toast'
import moment from 'moment'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'
import {
  createBanner,
  deleteBanner,
  listBanners,
  toggleBanner,
  updateBanner,
  uploadCmsAsset
} from 'src/services/cmsApi'

const emptyForm = () => ({
  title: '',
  body: '',
  image_url: '',
  background_image_url: '',
  placement: 'hero',
  audience: ['all'],
  severity: 'info',
  cta_label: '',
  cta_url: '',
  sort_order: 0,
  is_active: true,
  auto_advance_sec: 5
})

export default function CmsBannersPage() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [placement, setPlacement] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [uploadPct, setUploadPct] = useState(null)

  useEffect(() => {
    if (!router.isReady) return
    const p = router.query.placement
    if (p) setPlacement(String(Array.isArray(p) ? p[0] : p))
  }, [router.isReady, router.query.placement])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listBanners({
        page: page + 1,
        pageSize,
        search: search.trim(),
        placement: placement || undefined
      })
      const items = data?.items || []
      setRows(items.map(r => ({ ...r, id: r._id })))
      setTotal(data?.total ?? items.length)
    } catch (e) {
      setError(e?.message || 'Load failed')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, placement])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = row => {
    setEditing(row)
    setForm({
      title: row.title || '',
      body: row.body || '',
      image_url: row.image_url || '',
      background_image_url: row.background_image_url || '',
      placement: row.placement || 'hero',
      audience: Array.isArray(row.audience) ? row.audience : ['all'],
      severity: row.severity || 'info',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      sort_order: row.sort_order ?? 0,
      is_active: !!row.is_active,
      auto_advance_sec: row.auto_advance_sec ?? 5
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Title required')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        title: form.title.trim(),
        sort_order: Number(form.sort_order) || 0,
        auto_advance_sec: Number(form.auto_advance_sec) || 5
      }
      if (editing) await updateBanner(editing._id, body)
      else await createBanner(body)
      toast.success(editing ? 'Banner updated' : 'Banner published')
      setDialogOpen(false)
      await load()
    } catch (e) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadPct(0)
    try {
      const { mediaUrl } = await uploadCmsAsset(file, 'banners', setUploadPct)
      setForm(f => ({ ...f, image_url: mediaUrl }))
      toast.success('Uploaded')
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setUploadPct(null)
    }
  }

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    { field: 'placement', headerName: 'Place', width: 110 },
    {
      field: 'audience',
      headerName: 'Audience',
      width: 140,
      valueGetter: p => (Array.isArray(p.row.audience) ? p.row.audience.join(', ') : p.row.audience)
    },
    {
      field: 'is_active',
      headerName: 'Live',
      width: 90,
      renderCell: p => (
        <Switch
          size='small'
          checked={!!p.value}
          onChange={async () => {
            try {
              await toggleBanner(p.row._id)
              await load()
            } catch (e) {
              toast.error(e?.message || 'Toggle failed')
            }
          }}
        />
      )
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 150,
      valueFormatter: p => (p.value ? moment(p.value).format('YYYY-MM-DD HH:mm') : '—')
    },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      renderCell: p => (
        <Stack direction='row' spacing={0.5}>
          <Button size='small' onClick={() => openEdit(p.row)}>
            Edit
          </Button>
          <Button
            size='small'
            color='error'
            onClick={async () => {
              if (!window.confirm('Delete banner?')) return
              try {
                await deleteBanner(p.row._id)
                toast.success('Deleted')
                await load()
              } catch (e) {
                toast.error(e?.message || 'Delete failed')
              }
            }}
          >
            Del
          </Button>
        </Stack>
      )
    }
  ]

  return (
    <AdminPageShell
      title='Banners'
      subtitle='Hero / strip / sticky. Toggle = publish. Client cache ~60s.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button component={Link} href='/apps/cms' variant='outlined'>
            CMS hub
          </Button>
          <Button variant='contained' onClick={openCreate}>
            New banner
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              size='small'
              fullWidth
              label='Placement'
              value={placement}
              onChange={e => {
                setPage(0)
                setPlacement(e.target.value)
              }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='hero'>Hero</MenuItem>
              <MenuItem value='strip'>Strip</MenuItem>
              <MenuItem value='sticky_bottom'>Sticky</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <AdminDataTable
          rows={rows}
          columns={columns}
          loading={loading}
          error={error}
          total={total}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={m => {
            setPage(m.page)
            setPageSize(m.pageSize)
          }}
          search={search}
          onSearchChange={v => {
            setPage(0)
            setSearch(v)
          }}
          onRetry={() => void load()}
          emptyMessage='No banners'
        />
      </AdminPageSection>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? 'Edit banner' : 'New banner'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Title'
              size='small'
              fullWidth
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label='Body'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
            <TextField select size='small' label='Placement' value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}>
              <MenuItem value='hero'>Hero</MenuItem>
              <MenuItem value='strip'>Strip</MenuItem>
              <MenuItem value='sticky_bottom'>Sticky</MenuItem>
            </TextField>
            <TextField select size='small' label='Severity' value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {['info', 'promo', 'maintenance', 'critical', 'success'].map(s => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <Box>
              {['all', 'guest', 'trainer', 'trainee'].map(a => (
                <FormControlLabel
                  key={a}
                  control={
                    <Checkbox
                      checked={form.audience.includes(a)}
                      onChange={e => {
                        setForm(f => {
                          const next = e.target.checked
                            ? [...new Set([...f.audience, a])]
                            : f.audience.filter(x => x !== a)
                          return { ...f, audience: next.length ? next : ['all'] }
                        })
                      }}
                    />
                  }
                  label={a}
                />
              ))}
            </Box>
            <Stack direction='row' spacing={1} alignItems='center'>
              <TextField
                label='Image URL'
                size='small'
                fullWidth
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              />
              <Button component='label' variant='outlined' disabled={uploadPct != null}>
                {uploadPct != null ? `${uploadPct}%` : 'Upload'}
                <input hidden type='file' accept='image/jpeg,image/png,image/webp' onChange={onUpload} />
              </Button>
            </Stack>
            <TextField
              label='CTA label'
              size='small'
              value={form.cta_label}
              onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))}
            />
            <TextField
              label='CTA URL'
              size='small'
              fullWidth
              value={form.cta_url}
              onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              }
              label='Active (published)'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  )
}
