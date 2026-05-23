import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
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

const MAX_BYTES = 50 * 1024 * 1024

async function putPresigned(url, body, contentType) {
  const res = await fetch(url, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType }
  })
  if (!res.ok) {
    const hint = await res.text().catch(() => '')
    throw new Error(
      `Storage upload failed (${res.status})${hint ? `: ${hint.slice(0, 160)}` : ''}`
    )
  }
}

/** Capture a JPEG thumbnail from a local video file (admin browser upload). */
function captureVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const objectUrl = URL.createObjectURL(file)
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Could not create thumbnail'))
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(objectUrl)
          if (blob) resolve(blob)
          else reject(new Error('Thumbnail capture failed'))
        },
        'image/jpeg',
        0.85
      )
    }
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read video for thumbnail'))
    }
    video.src = objectUrl
  })
}

export default function NetqwixLibraryPage() {
  const [groups, setGroups] = useState([])
  const [taxonomy, setTaxonomy] = useState([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
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
    void getClipTaxonomyAdmin()
      .then(rows => {
        const list = Array.isArray(rows) ? rows : []
        setTaxonomy(list.filter(c => c.is_active !== false))
      })
      .catch(() => {
        toast.error('Could not load clip categories')
        setTaxonomy([])
      })
  }, [load])

  const activeCategories = useMemo(
    () => taxonomy.filter(c => c.is_active !== false),
    [taxonomy]
  )

  const selectedCat = activeCategories.find(c => (c.id || c._id) === categoryId)
  const subs = (selectedCat?.subcategories || []).filter(s => s.is_active !== false)

  const onCategoryChange = id => {
    setCategoryId(id)
    setSubcategoryId('')
  }

  const upload = async () => {
    if (!file || !title.trim() || !categoryId || !subcategoryId) {
      toast.error('Fill all fields and choose a video file')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Video must be 50 MB or smaller')
      return
    }

    setUploading(true)
    try {
      setUploadStep('Preparing upload…')
      const presign = await presignLibraryClip({
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        fileSizeBytes: file.size
      })

      if (!presign?.videoUploadUrl || !presign?.videoKey) {
        throw new Error('Invalid presign response from server')
      }

      setUploadStep('Uploading video…')
      await putPresigned(
        presign.videoUploadUrl,
        file,
        file.type || 'video/mp4'
      )

      setUploadStep('Uploading thumbnail…')
      let thumbBlob
      try {
        thumbBlob = await captureVideoThumbnail(file)
      } catch {
        thumbBlob = null
      }
      if (thumbBlob) {
        await putPresigned(presign.thumbnailUploadUrl, thumbBlob, 'image/jpeg')
      }

      setUploadStep('Saving to library…')
      await confirmLibraryClip({
        title: title.trim(),
        videoKey: presign.videoKey,
        thumbnailKey: presign.thumbnailKey,
        fileType: file.type || 'video/mp4',
        fileSizeBytes: file.size,
        category_id: categoryId,
        subcategory_id: subcategoryId
      })

      toast.success('Library clip published')
      setTitle('')
      setCategoryId('')
      setSubcategoryId('')
      setFile(null)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadStep('')
    }
  }

  let clipCount = 0
  for (const g of groups) {
    for (const s of g.subcategories || []) clipCount += (s.clips || []).length
  }

  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(1) : null

  return (
    <AdminPageShell
      title='Netqwix Library'
      subtitle={loading ? 'Loading published clips…' : `${clipCount} published clips`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      <AdminPageSection title='Upload library clip'>
        <Card variant='outlined' sx={{ maxWidth: 720 }}>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant='body2' color='text.secondary'>
                Upload a coaching clip to the public Netqwix library. Max size 50 MB. Clips appear in
                the mobile app under Locker → Netqwix Library.
              </Typography>

              <TextField
                label='Clip title'
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                size='small'
                disabled={uploading}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size='small' disabled={uploading || !activeCategories.length}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label='Category'
                    value={categoryId}
                    onChange={e => onCategoryChange(e.target.value)}
                  >
                    {activeCategories.map(c => (
                      <MenuItem key={c.id || c._id} value={c.id || c._id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size='small' disabled={uploading || !categoryId}>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    label='Subcategory'
                    value={subcategoryId}
                    onChange={e => setSubcategoryId(e.target.value)}
                  >
                    {subs.map(s => (
                      <MenuItem key={s.id || s._id} value={s.id || s._id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {!activeCategories.length ? (
                <Typography variant='body2' color='warning.main'>
                  No active clip categories. Add categories under Clip Taxonomy first.
                </Typography>
              ) : null}

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: file ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'action.hover'
                }}
              >
                <Button variant='outlined' component='label' disabled={uploading}>
                  {file ? 'Replace video' : 'Choose video file'}
                  <input
                    type='file'
                    hidden
                    accept='video/*'
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {file ? (
                  <Stack spacing={0.5} sx={{ mt: 1.5 }} alignItems='center'>
                    <Typography variant='body2' fontWeight={600}>
                      {file.name}
                    </Typography>
                    <Chip size='small' label={`${fileSizeMb} MB`} />
                  </Stack>
                ) : (
                  <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 1 }}>
                    MP4, MOV, or other video formats
                  </Typography>
                )}
              </Box>

              {uploading ? (
                <Box>
                  <Typography variant='caption' color='text.secondary' gutterBottom display='block'>
                    {uploadStep}
                  </Typography>
                  <LinearProgress />
                </Box>
              ) : null}

              <Button
                variant='contained'
                size='large'
                disabled={
                  uploading ||
                  !file ||
                  !title.trim() ||
                  !categoryId ||
                  !subcategoryId ||
                  !activeCategories.length
                }
                onClick={() => void upload()}
              >
                {uploading ? 'Uploading…' : 'Publish to library'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </AdminPageSection>

      <AdminPageSection title='Published clips'>
        {loading ? (
          <AdminLoadingState message='Loading library…' minHeight={200} />
        ) : groups.length === 0 ? (
          <Typography color='text.secondary'>No library clips yet.</Typography>
        ) : (
          groups.map(cat => (
            <Card key={cat.categoryId || cat.categoryName} variant='outlined' sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                  {cat.categoryName}
                </Typography>
                {(cat.subcategories || []).map(sub => (
                  <Box key={sub.subcategoryId || sub.subcategoryName} sx={{ pl: 1, mt: 1.5 }}>
                    <Typography variant='body2' color='text.secondary' fontWeight={600}>
                      {sub.subcategoryName}{' '}
                      <Chip size='small' label={(sub.clips || []).length} sx={{ ml: 0.5 }} />
                    </Typography>
                    <Stack component='ul' sx={{ m: 0, pl: 2.5, mt: 0.5 }} spacing={0.25}>
                      {(sub.clips || []).map(c => (
                        <Typography component='li' key={c._id} variant='body2'>
                          {c.title}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </AdminPageSection>
    </AdminPageShell>
  )
}
