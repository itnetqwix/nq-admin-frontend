import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { AdminLoadingState, OpsSurfaceCard, useAdminConfirm } from 'src/components/admin'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import { ClipPlayDialog, safeImg } from 'src/components/user360/user360Parts'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { ops } from 'src/styles/opsSurface'
import {
  confirmLibraryClip,
  deleteLibraryClip,
  getClipPlayUrl,
  getClipTaxonomyAdmin,
  getLibraryClipsGrouped,
  getLibrarySubmissions,
  presignLibraryClip,
  updateLibraryClip
} from 'src/services/clipsAdminApi'

const MAX_BYTES = 50 * 1024 * 1024
const MAX_BATCH = 5
const fmtInt = v => new Intl.NumberFormat('en-US').format(Number(v) || 0)

function fileStem(name) {
  return String(name || '').replace(/\.[^.]+$/, '') || 'Clip'
}

function batchTitle(prefix, file, index, total) {
  const base = String(prefix || '').trim() || fileStem(file.name)
  return total > 1 ? `${base} (${index + 1})` : base
}

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

async function publishLibraryFile(file, { title, categoryId, subcategoryId }) {
  const presign = await presignLibraryClip({
    fileName: file.name,
    contentType: file.type || 'video/mp4',
    fileSizeBytes: file.size
  })
  if (!presign?.videoUploadUrl || !presign?.videoKey) {
    throw new Error('Invalid presign response from server')
  }
  await putPresigned(presign.videoUploadUrl, file, file.type || 'video/mp4')
  let thumbBlob = null
  try {
    thumbBlob = await captureVideoThumbnail(file)
  } catch {
    thumbBlob = null
  }
  if (thumbBlob && presign.thumbnailUploadUrl) {
    await putPresigned(presign.thumbnailUploadUrl, thumbBlob, 'image/jpeg')
  }
  await confirmLibraryClip({
    title,
    videoKey: presign.videoKey,
    thumbnailKey: presign.thumbnailKey,
    fileType: file.type || 'video/mp4',
    fileSizeBytes: file.size,
    category_id: categoryId,
    subcategory_id: subcategoryId || null
  })
}

function catIdOf(c) {
  return String(c?.id || c?._id || '')
}

function LibraryClipThumb({ clip, onPlay }) {
  const [src, setSrc] = useState(() => clip?.thumbnailUrl || safeImg(clip?.thumbnail) || '')
  const [triedSigned, setTriedSigned] = useState(Boolean(clip?.thumbnailUrl))

  useEffect(() => {
    setSrc(clip?.thumbnailUrl || safeImg(clip?.thumbnail) || '')
    setTriedSigned(Boolean(clip?.thumbnailUrl))
  }, [clip?._id, clip?.thumbnail, clip?.thumbnailUrl])

  const onImgError = async () => {
    if (triedSigned || !clip?._id) {
      setSrc('')
      return
    }
    setTriedSigned(true)
    try {
      const urls = await getClipPlayUrl(String(clip._id))
      const next = urls?.thumbnailUrl || ''
      if (next) setSrc(next)
      else setSrc('')
    } catch {
      setSrc('')
    }
  }

  return (
    <Box
      onClick={onPlay}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay?.()
        }
      }}
      sx={{
        position: 'relative',
        pt: '56.25%',
        bgcolor: ops.canvasSoft2,
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover .playOverlay': { opacity: 1 }
      }}
    >
      {src ? (
        <Box
          component='img'
          src={src}
          alt=''
          onError={() => void onImgError()}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : null}
      <Box
        className='playOverlay'
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.35)',
          opacity: 0.85,
          transition: 'opacity 0.15s ease'
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 32, color: ops.indigo }} />
        </Box>
      </Box>
    </Box>
  )
}

export default function NetqwixLibraryPage() {
  const router = useRouter()
  const theme = useTheme()
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'))
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [groups, setGroups] = useState([])
  const [taxonomy, setTaxonomy] = useState([])
  const [pendingQueue, setPendingQueue] = useState(0)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [busyId, setBusyId] = useState('')
  const [playClipId, setPlayClipId] = useState('')
  const [editClip, setEditClip] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editSubcategoryId, setEditSubcategoryId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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
  const selectedCat = activeCategories.find(c => catIdOf(c) === categoryId)
  const subs = (selectedCat?.subcategories || []).filter(s => s.is_active !== false)
  const editCat = activeCategories.find(c => catIdOf(c) === editCategoryId)
  const editSubs = (editCat?.subcategories || []).filter(s => s.is_active !== false)

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

  const showingCount = filteredGroups.reduce(
    (n, g) => n + (g.subcategories || []).reduce((m, s) => m + (s.clips || []).length, 0),
    0
  )

  const addFiles = picked => {
    const incoming = Array.from(picked || [])
    const kept = []
    for (const f of incoming) {
      if (f.size > MAX_BYTES) toast.error(`${f.name} is over 50 MB`)
      else kept.push(f)
    }
    if (!kept.length) return
    setFiles(prev => {
      const next = [...prev, ...kept]
      if (next.length > MAX_BATCH) {
        toast.error(`Up to ${MAX_BATCH} videos at a time`)
        return next.slice(0, MAX_BATCH)
      }
      return next
    })
  }

  const upload = async () => {
    if (!files.length || !title.trim() || !categoryId) {
      toast.error('Fill title, category, and choose at least one video')
      return
    }

    const catName = activeCategories.find(c => catIdOf(c) === categoryId)?.name
    const subName = subs.find(s => catIdOf(s) === subcategoryId)?.name
    const ok = await confirm({
      title: files.length > 1 ? `Publish ${files.length} clips to library?` : 'Publish clip to library?',
      message: 'This uploads and publishes to the public NetQwix library.',
      detail: `${files.length} video${files.length > 1 ? 's' : ''} → ${catName}${subName ? ` › ${subName}` : ' › General'}`,
      confirmLabel: 'Publish',
      variant: 'warning'
    })
    if (!ok) return

    setUploading(true)
    let published = 0
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        setUploadStep(`Uploading ${i + 1} of ${files.length}…`)
        // ponytail: sequential presign/PUT/confirm; parallelize if 5-file latency hurts
        await publishLibraryFile(f, {
          title: batchTitle(title, f, i, files.length),
          categoryId,
          subcategoryId
        })
        published += 1
      }
      toast.success(published === 1 ? 'Library clip published' : `${published} library clips published`)
      setTitle('')
      setCategoryId('')
      setSubcategoryId('')
      setFiles([])
      void load()
    } catch (e) {
      toast.error(
        published
          ? `${published} published, then failed: ${e?.message || 'Upload failed'}`
          : e?.message || 'Upload failed'
      )
      if (published) {
        setFiles(prev => prev.slice(published))
        void load()
      }
    } finally {
      setUploading(false)
      setUploadStep('')
    }
  }

  const openEdit = (clip, catGroup, subGroup) => {
    setEditClip(clip)
    setEditTitle(String(clip?.title || ''))
    setEditCategoryId(String(clip?.category_id || catGroup?.categoryId || ''))
    setEditSubcategoryId(String(clip?.subcategory_id || subGroup?.subcategoryId || '') || '')
  }

  const saveEdit = async () => {
    if (!editClip?._id) return
    if (!editTitle.trim() || !editCategoryId) {
      toast.error('Title and category are required')
      return
    }
    setSavingEdit(true)
    try {
      await updateLibraryClip(String(editClip._id), {
        title: editTitle.trim(),
        category_id: editCategoryId,
        subcategory_id: editSubcategoryId || null
      })
      toast.success('Clip updated')
      setEditClip(null)
      void load()
    } catch (e) {
      toast.error(e?.message || 'Update failed')
    } finally {
      setSavingEdit(false)
    }
  }

  const onDownload = async clip => {
    const id = String(clip?._id || '')
    if (!id) return
    setBusyId(id)
    try {
      const urls = await getClipPlayUrl(id)
      const videoUrl = urls?.videoUrl || urls?.cdnFallbackVideo
      if (!videoUrl) throw new Error('No download URL')
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = `${String(clip.title || 'clip').replace(/[^\w.-]+/g, '_')}.mp4`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      toast.error(e?.message || 'Download failed')
    } finally {
      setBusyId('')
    }
  }

  const onDelete = async clip => {
    const id = String(clip?._id || '')
    if (!id) return
    const ok = await confirm({
      title: 'Delete library clip?',
      message: 'This permanently removes the clip from the NetQwix library.',
      detail: clip?.title || id,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    setBusyId(id)
    try {
      await deleteLibraryClip(id)
      toast.success('Clip deleted')
      void load()
    } catch (e) {
      toast.error(e?.message || 'Delete failed')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminPageShell
      bare
      icon='mdi:library-outline'
      eyebrow='Library'
      title='Published clips'
      subtitle='Public NetQwix Library — upload, edit category, download, or delete clips.'
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

      <AdminPageSection title='Upload library clips'>
        <OpsSurfaceCard sx={{ maxWidth: 720 }}>
          <Stack spacing={2.5}>
            <Typography sx={{ fontSize: 13, color: ops.body, lineHeight: 1.5 }}>
              Upload up to {MAX_BATCH} coaching clips at once. Max 50 MB each. Subcategory is optional (defaults to
              General). Appears under Locker → NetQwix Library.
            </Typography>

            <TextField
              label={files.length > 1 ? 'Title prefix' : 'Clip title'}
              helperText={files.length > 1 ? `Saved as "${title.trim() || 'Title'} (1)", (2), …` : undefined}
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
                    <MenuItem key={catIdOf(c)} value={catIdOf(c)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size='small' disabled={uploading || !categoryId}>
                <InputLabel>Subcategory (optional)</InputLabel>
                <Select
                  label='Subcategory (optional)'
                  value={subcategoryId}
                  onChange={e => setSubcategoryId(e.target.value)}
                >
                  <MenuItem value=''>None — General</MenuItem>
                  {subs.map(s => (
                    <MenuItem key={catIdOf(s)} value={catIdOf(s)}>
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
                border: `1px dashed ${files.length ? ops.indigo : ops.hairline}`,
                borderRadius: ops.radiusMd,
                p: { xs: 2, sm: 3 },
                textAlign: 'center',
                bgcolor: ops.canvasSoft
              }}
            >
              <Button
                variant='outlined'
                component='label'
                disabled={uploading || files.length >= MAX_BATCH}
                sx={{ textTransform: 'none' }}
              >
                {files.length ? 'Add more videos' : 'Choose video files'}
                <input
                  type='file'
                  hidden
                  multiple
                  accept='video/*'
                  onChange={e => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </Button>
              {files.length ? (
                <Stack spacing={1} sx={{ mt: 1.5 }} alignItems='stretch'>
                  {files.map((f, i) => (
                    <Stack
                      key={`${f.name}-${f.size}-${i}`}
                      direction='row'
                      spacing={1}
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: ops.canvas,
                        textAlign: 'left'
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
                          {f.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: ops.mute, fontFamily: ops.mono }}>
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </Typography>
                      </Box>
                      <IconButton
                        size='small'
                        disabled={uploading}
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <DeleteOutlineIcon fontSize='small' />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 12, color: ops.mute, display: 'block', mt: 1 }}>
                  MP4, MOV, or other video formats — select multiple
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
              disabled={uploading || !files.length || !title.trim() || !categoryId || !activeCategories.length}
              onClick={() => void upload()}
              sx={{ bgcolor: ops.indigo, boxShadow: 'none', textTransform: 'none', fontWeight: 500 }}
            >
              {uploading
                ? 'Uploading…'
                : files.length > 1
                  ? `Publish ${files.length} clips`
                  : 'Publish to library'}
            </Button>
          </Stack>
        </OpsSurfaceCard>
      </AdminPageSection>

      <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden', mt: 2 }}>
        <AdminPageSection
          title='Browse published'
          subtitle='Cards by category › subcategory — play, edit, download, or delete.'
        >
          <AdminFilterBar
            searchPlaceholder='Search clip titles…'
            searchValue={search}
            onSearchChange={e => setSearch(e.target.value)}
            resultCount={showingCount}
          >
            <FormControl size='small' sx={{ minWidth: { xs: '100%', sm: 200 } }}>
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
          </AdminFilterBar>

          {loading ? (
            <AdminLoadingState message='Loading library…' minHeight={200} />
          ) : filteredGroups.length === 0 ? (
            <Typography sx={{ color: ops.mute, fontSize: 13 }}>No clips match.</Typography>
          ) : (
            <Stack spacing={3}>
              {filteredGroups.map(cat => (
                <Box key={cat.categoryId || cat.categoryName}>
                  <Typography sx={{ fontWeight: 700, letterSpacing: '-0.32px', mb: 1.5, fontSize: 18 }}>
                    {cat.categoryName}
                  </Typography>
                  <Stack spacing={2.5}>
                    {(cat.subcategories || []).map(sub => (
                      <Box key={sub.subcategoryId || sub.subcategoryName}>
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.25 }}>
                          <Typography sx={{ fontSize: 14, color: ops.body, fontWeight: 600 }}>
                            {sub.subcategoryName}
                          </Typography>
                          <Chip
                            size='small'
                            label={(sub.clips || []).length}
                            sx={{ fontFamily: ops.mono, fontSize: 11, height: 20 }}
                          />
                        </Stack>
                        <Grid container spacing={2}>
                          {(sub.clips || []).map(c => {
                            const id = String(c._id)
                            const busy = busyId === id
                            return (
                              <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
                                <OpsSurfaceCard
                                  sx={{
                                    p: 0,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    bgcolor: ops.canvas
                                  }}
                                >
                                  <LibraryClipThumb clip={c} onPlay={() => setPlayClipId(id)} />
                                  <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography
                                      sx={{
                                        fontWeight: 600,
                                        letterSpacing: '-0.28px',
                                        lineHeight: 1.3,
                                        fontSize: 14
                                      }}
                                      noWrap
                                      title={c.title}
                                    >
                                      {c.title || 'Untitled'}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: ops.mute }}>
                                      {cat.categoryName}
                                      {sub.subcategoryName ? ` · ${sub.subcategoryName}` : ''}
                                    </Typography>
                                    <Stack
                                      direction='row'
                                      spacing={0.5}
                                      sx={{ mt: 'auto', pt: 0.5 }}
                                      flexWrap='wrap'
                                      useFlexGap
                                      alignItems='center'
                                    >
                                      <Button
                                        size='small'
                                        variant='contained'
                                        startIcon={<PlayArrowRoundedIcon />}
                                        disabled={busy}
                                        onClick={() => setPlayClipId(id)}
                                        sx={{
                                          textTransform: 'none',
                                          bgcolor: ops.indigo,
                                          boxShadow: 'none',
                                          flex: { xs: 1, sm: 'none' }
                                        }}
                                      >
                                        Play
                                      </Button>
                                      <Tooltip title='Edit'>
                                        <span>
                                          <IconButton
                                            size='small'
                                            disabled={busy}
                                            onClick={() => openEdit(c, cat, sub)}
                                            aria-label='Edit clip'
                                          >
                                            <EditOutlinedIcon fontSize='small' />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title='Download'>
                                        <span>
                                          <IconButton
                                            size='small'
                                            disabled={busy}
                                            onClick={() => void onDownload(c)}
                                            aria-label='Download clip'
                                          >
                                            <DownloadOutlinedIcon fontSize='small' />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title='Delete permanently'>
                                        <span>
                                          <IconButton
                                            size='small'
                                            color='error'
                                            disabled={busy}
                                            onClick={() => void onDelete(c)}
                                            aria-label='Delete clip'
                                          >
                                            <DeleteOutlineIcon fontSize='small' />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Stack>
                                  </Box>
                                </OpsSurfaceCard>
                              </Grid>
                            )
                          })}
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </AdminPageSection>
      </OpsSurfaceCard>

      <ClipPlayDialog
        clipId={playClipId}
        open={Boolean(playClipId)}
        onClose={() => setPlayClipId('')}
      />

      <Dialog
        open={Boolean(editClip)}
        onClose={() => !savingEdit && setEditClip(null)}
        fullWidth
        maxWidth='sm'
        fullScreen={isPhone}
      >
        <DialogTitle>Edit library clip</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label='Title'
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              fullWidth
              size='small'
              disabled={savingEdit}
            />
            <FormControl fullWidth size='small' disabled={savingEdit}>
              <InputLabel>Category</InputLabel>
              <Select
                label='Category'
                value={editCategoryId}
                onChange={e => {
                  setEditCategoryId(e.target.value)
                  setEditSubcategoryId('')
                }}
              >
                {activeCategories.map(c => (
                  <MenuItem key={catIdOf(c)} value={catIdOf(c)}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size='small' disabled={savingEdit || !editCategoryId}>
              <InputLabel>Subcategory (optional)</InputLabel>
              <Select
                label='Subcategory (optional)'
                value={editSubcategoryId}
                onChange={e => setEditSubcategoryId(e.target.value)}
              >
                <MenuItem value=''>None — General</MenuItem>
                {editSubs.map(s => (
                  <MenuItem key={catIdOf(s)} value={catIdOf(s)}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditClip(null)} disabled={savingEdit} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => void saveEdit()}
            disabled={savingEdit}
            sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
          >
            {savingEdit ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {ConfirmDialog}
    </AdminPageShell>
  )
}
