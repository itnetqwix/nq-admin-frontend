import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { AdminLoadingState, OpsSurfaceCard, useAdminConfirm } from 'src/components/admin'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import {
  confirmLibraryClip,
  getClipTaxonomyAdmin,
  getLibraryClipsGrouped,
  getLibrarySubmissions,
  presignLibraryClip
} from 'src/services/clipsAdminApi'

const MAX_BYTES = 50 * 1024 * 1024
const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

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
  const router = useRouter()
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [groups, setGroups] = useState([])
  const [taxonomy, setTaxonomy] = useState([])
  const [pendingQueue, setPendingQueue] = useState(0)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, queue] = await Promise.all([
        getLibraryClipsGrouped(),
        getLibrarySubmissions({ limit: 1 }).catch(() => null)
      ])
      setGroups(Array.isArray(data) ? data : [])
      setPendingQueue((queue?.pendingCount || 0) + (queue?.underReviewCount || 0))
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

  const activeCategories = useMemo(() => taxonomy.filter(c => c.is_active !== false), [taxonomy])
  const selectedCat = activeCategories.find(c => (c.id || c._id) === categoryId)
  const subs = (selectedCat?.subcategories || []).filter(s => s.is_active !== false)

  const onCategoryChange = id => {
    setCategoryId(id)
    setSubcategoryId('')
  }

  let clipCount = 0
  const categoryCount = groups.length
  for (const g of groups) {
    for (const s of g.subcategories || []) clipCount += (s.clips || []).length
  }

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups
      .filter(g => !categoryFilter || String(g.categoryId || g.categoryName) === categoryFilter)
      .map(g => {
        if (!q) return g
        const subsFiltered = (g.subcategories || [])
          .map(sub => ({
            ...sub,
            clips: (sub.clips || []).filter(c => String(c.title || '').toLowerCase().includes(q))
          }))
          .filter(
            sub =>
              (sub.clips || []).length > 0 || String(sub.subcategoryName || '').toLowerCase().includes(q)
          )
        if (!subsFiltered.length && !String(g.categoryName || '').toLowerCase().includes(q)) return null
        return { ...g, subcategories: subsFiltered.length ? subsFiltered : g.subcategories }
      })
      .filter(Boolean)
  }, [groups, search, categoryFilter])

  const upload = async () => {
    if (!file || !title.trim() || !categoryId || !subcategoryId) {
      toast.error('Fill all fields and choose a video file')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Video must be 50 MB or smaller')
      return
    }

    const catName = activeCategories.find(c => (c.id || c._id) === categoryId)?.name
    const subName = subs.find(s => (s.id || s._id) === subcategoryId)?.name
    const ok = await confirm({
      title: 'Publish clip to library?',
      message: 'This uploads and publishes the video to the public NetQwix library.',
      detail: `"${title.trim()}" → ${catName} › ${subName}`,
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return

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
      await putPresigned(presign.videoUploadUrl, file, file.type || 'video/mp4')

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

  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(1) : null
  const showingCount = filteredGroups.reduce(
    (n, g) => n + (g.subcategories || []).reduce((m, s) => m + (s.clips || []).length, 0),
    0
  )

  return (
    <AdminPageShell
      bare
      icon='mdi:library-outline'
      eyebrow='Library'
      title='Published clips'
      subtitle='Public NetQwix Library — upload admin clips or browse by category.'
      actions={
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          <Chip
            component={Link}
            href='/apps/library-submissions'
            label={pendingQueue ? `Requests · ${pendingQueue}` : 'Requests'}
            clickable
            variant='outlined'
            size='small'
          />
          <Chip component={Link} href='/apps/clip-taxonomy' label='Categories' clickable variant='outlined' size='small' />
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </Stack>
      }
    >
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:play-box-multiple-outline'
            label='Published'
            value={fmtInt(clipCount)}
            hint='All clips'
            tone='accent'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:folder-outline' label='Categories' value={fmtInt(categoryCount)} hint='With clips' />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile
            icon='mdi:clipboard-check-outline'
            label='Open requests'
            value={fmtInt(pendingQueue)}
            hint='Pending + review'
            tone={pendingQueue > 0 ? 'warn' : 'success'}
            onClick={() => router.push('/apps/library-submissions')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <OpsMetricTile icon='mdi:filter-variant' label='Showing' value={fmtInt(showingCount)} hint='After search' />
        </Grid>
      </Grid>

      <AdminPageSection title='Upload library clip'>
        <OpsSurfaceCard sx={{ maxWidth: 720 }}>
          <Stack spacing={2.5}>
            <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
              Upload a coaching clip to the public library. Max 50 MB. Appears under Locker → NetQwix Library.
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
                <Select label='Category' value={categoryId} onChange={e => onCategoryChange(e.target.value)}>
                  {activeCategories.map(c => (
                    <MenuItem key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size='small' disabled={uploading || !categoryId}>
                <InputLabel>Subcategory</InputLabel>
                <Select label='Subcategory' value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
                  {subs.map(s => (
                    <MenuItem key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {!activeCategories.length ? (
              <Typography sx={{ fontSize: 13, color: '#ab570a' }}>
                No active categories — add some under Categories first.
              </Typography>
            ) : null}

            <Box
              sx={{
                border: `1px dashed ${file ? ops.indigo : ops.hairline}`,
                borderRadius: ops.radiusMd,
                p: 3,
                textAlign: 'center',
                bgcolor: ops.canvasSoft
              }}
            >
              <Button variant='outlined' component='label' disabled={uploading} sx={{ textTransform: 'none' }}>
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
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{file.name}</Typography>
                  <Chip size='small' label={`${fileSizeMb} MB`} sx={{ fontFamily: ops.mono, fontSize: 11 }} />
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 12, color: ops.mute, display: 'block', mt: 1 }}>
                  MP4, MOV, or other video formats
                </Typography>
              )}
            </Box>

            {uploading ? (
              <Box>
                <Typography sx={{ fontFamily: ops.mono, fontSize: 11, color: ops.mute, mb: 1 }}>{uploadStep}</Typography>
                <LinearProgress
                  sx={{
                    borderRadius: 1,
                    bgcolor: ops.canvasSoft2,
                    '& .MuiLinearProgress-bar': { bgcolor: ops.indigo }
                  }}
                />
              </Box>
            ) : null}

            <Button
              variant='contained'
              disabled={
                uploading || !file || !title.trim() || !categoryId || !subcategoryId || !activeCategories.length
              }
              onClick={() => void upload()}
              sx={{ bgcolor: ops.indigo, boxShadow: 'none', textTransform: 'none', fontWeight: 500 }}
            >
              {uploading ? 'Uploading…' : 'Publish to library'}
            </Button>
          </Stack>
        </OpsSurfaceCard>
      </AdminPageSection>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', mt: 2 }}>
        <AdminPageSection title='Browse published' subtitle='Search titles or filter by category.'>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size='small'
              placeholder='Search clip titles…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 240, flex: 1 }}
            />
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select label='Category' value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <MenuItem value=''>All categories</MenuItem>
                {groups.map(g => (
                  <MenuItem key={g.categoryId || g.categoryName} value={String(g.categoryId || g.categoryName)}>
                    {g.categoryName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <AdminLoadingState message='Loading library…' minHeight={200} />
          ) : filteredGroups.length === 0 ? (
            <Typography sx={{ color: ops.mute, fontSize: 13 }}>No clips match.</Typography>
          ) : (
            <Stack spacing={2}>
              {filteredGroups.map(cat => (
                <OpsSurfaceCard key={cat.categoryId || cat.categoryName} sx={{ bgcolor: ops.canvas }}>
                  <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', mb: 1 }}>
                    {cat.categoryName}
                  </Typography>
                  {(cat.subcategories || []).map(sub => (
                    <Box key={sub.subcategoryId || sub.subcategoryName} sx={{ pl: 0.5, mt: 1.5 }}>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <Typography sx={{ fontSize: 13, color: ops.body, fontWeight: 600 }}>
                          {sub.subcategoryName}
                        </Typography>
                        <Chip
                          size='small'
                          label={(sub.clips || []).length}
                          sx={{ fontFamily: ops.mono, fontSize: 11, height: 20 }}
                        />
                      </Stack>
                      <Stack component='ul' sx={{ m: 0, pl: 2.5, mt: 0.5 }} spacing={0.25}>
                        {(sub.clips || []).map(c => (
                          <Typography component='li' key={c._id} sx={{ fontSize: 13, color: ops.ink }}>
                            {c.title}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </OpsSurfaceCard>
              ))}
            </Stack>
          )}
        </AdminPageSection>
      </OpsSurfaceCard>
      {ConfirmDialog}
    </AdminPageShell>
  )
}
