import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import toast from 'react-hot-toast'
import { AdminLoadingState } from 'src/components/admin/AdminLoadingState'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  confirmLibraryClip,
  getClipTaxonomyAdmin,
  getLibraryClipsGrouped,
  presignLibraryClip
} from 'src/services/clipsAdminApi'

export default function NetqwixLibraryPage() {
  const [groups, setGroups] = useState([])
  const [taxonomy, setTaxonomy] = useState([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLibraryClipsGrouped()
      setGroups(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.message || 'Failed to load library')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void getClipTaxonomyAdmin().then(setTaxonomy).catch(() => setTaxonomy([]))
  }, [load])

  const selectedCat = taxonomy.find(c => (c.id || c._id) === categoryId)
  const subs = selectedCat?.subcategories || []

  const upload = async () => {
    if (!file || !title.trim() || !categoryId || !subcategoryId) {
      toast.error('Fill all fields and choose a video file')
      return
    }
    setUploading(true)
    try {
      const presign = await presignLibraryClip({
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        fileSizeBytes: file.size
      })
      await fetch(presign.videoUploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'video/mp4' }
      })
      const thumbBlob = new Blob([], { type: 'image/jpeg' })
      await fetch(presign.thumbnailUploadUrl, {
        method: 'PUT',
        body: thumbBlob,
        headers: { 'Content-Type': 'image/jpeg' }
      })
      await confirmLibraryClip({
        title: title.trim(),
        videoKey: presign.videoKey,
        thumbnailKey: presign.thumbnailKey,
        fileType: file.type || 'video/mp4',
        fileSizeBytes: file.size,
        category_id: categoryId,
        subcategory_id: subcategoryId
      })
      toast.success('Library clip uploaded')
      setTitle('')
      setFile(null)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  let clipCount = 0
  for (const g of groups) {
    for (const s of g.subcategories || []) clipCount += (s.clips || []).length
  }

  return (
    <AdminPageShell
      title='Netqwix Library'
      subtitle={loading ? 'Loading published clips…' : `${clipCount} published clips`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminPageSection title='Upload library clip'>
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          <TextField label='Title' value={title} onChange={e => setTitle(e.target.value)} size='small' />
          <FormControl size='small'>
            <InputLabel>Category</InputLabel>
            <Select label='Category' value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {taxonomy.map(c => (
                <MenuItem key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' disabled={!categoryId}>
            <InputLabel>Subcategory</InputLabel>
            <Select label='Subcategory' value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
              {subs.map(s => (
                <MenuItem key={s.id || s._id} value={s.id || s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant='outlined' component='label'>
            {file ? file.name : 'Choose video'}
            <input
              type='file'
              hidden
              accept='video/*'
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </Button>
          <Button variant='contained' disabled={uploading} onClick={() => void upload()}>
            {uploading ? 'Uploading…' : 'Upload to library'}
          </Button>
        </Stack>
      </AdminPageSection>
      <AdminPageSection title='Published clips'>
        {loading ? (
          <AdminLoadingState message='Loading library…' minHeight={200} />
        ) : null}
        {!loading &&
          groups.map(cat => (
          <Box key={cat.categoryId || cat.categoryName} sx={{ mb: 2 }}>
            <Typography variant='subtitle1' fontWeight={700}>
              {cat.categoryName}
            </Typography>
            {(cat.subcategories || []).map(sub => (
              <Box key={sub.subcategoryId || sub.subcategoryName} sx={{ pl: 2, mt: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  {sub.subcategoryName} ({(sub.clips || []).length})
                </Typography>
                {(sub.clips || []).map(c => (
                  <Typography key={c._id} variant='body2' sx={{ pl: 1 }}>
                    • {c.title}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
          ))}
      </AdminPageSection>
    </AdminPageShell>
  )
}
