import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { createTip, deleteTip, listTips, toggleTip, updateTip, uploadCmsAsset } from 'src/services/cmsApi'

const emptyForm = () => ({
  title: '',
  body: '',
  image_url: '',
  icon: '',
  audience: 'all',
  cta_label: '',
  cta_url: '',
  sort_order: 0,
  is_active: true
})

export default function CmsTipsPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [uploadPct, setUploadPct] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listTips({ page: page + 1, pageSize, search: search.trim() })
      const items = data?.items || []
      setRows(items.map(r => ({ ...r, id: r._id })))
      setTotal(data?.total ?? items.length)
    } catch (e) {
      setError(e?.message || 'Load failed')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

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
      icon: row.icon || '',
      audience: row.audience || 'all',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
      sort_order: row.sort_order ?? 0,
      is_active: !!row.is_active
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body required')
      return
    }
    setSaving(true)
    try {
      const body = { ...form, title: form.title.trim(), body: form.body.trim(), sort_order: Number(form.sort_order) || 0 }
      if (editing) await updateTip(editing._id, body)
      else await createTip(body)
      toast.success(editing ? 'Tip updated' : 'Tip published')
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
      const { mediaUrl } = await uploadCmsAsset(file, 'tips', setUploadPct)
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
    { field: 'audience', headerName: 'Audience', width: 110 },
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
              await toggleTip(p.row._id)
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
              if (!window.confirm('Delete tip?')) return
              try {
                await deleteTip(p.row._id)
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
      title='Tips'
      subtitle='Home “tips for you”. Publish via active toggle. Client cache ~60s.'
      actions={
        <Stack direction='row' spacing={1}>
          <Button component={Link} href='/apps/cms' variant='outlined'>
            CMS hub
          </Button>
          <Button variant='contained' onClick={openCreate}>
            New tip
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
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
          emptyMessage='No tips'
        />
      </AdminPageSection>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? 'Edit tip' : 'New tip'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label='Title' size='small' fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <TextField
              label='Body'
              size='small'
              fullWidth
              multiline
              minRows={3}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
            <TextField select size='small' label='Audience' value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='trainer'>Trainer</MenuItem>
              <MenuItem value='trainee'>Trainee</MenuItem>
            </TextField>
            <Stack direction='row' spacing={1}>
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
            <TextField label='CTA label' size='small' value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} />
            <TextField label='CTA URL' size='small' fullWidth value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} />
            <Stack direction='row' alignItems='center'>
              <Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Active (published)
            </Stack>
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
