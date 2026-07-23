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
  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(1) : null
  const uploadNeedsSub = subs.length > 0

  const upload = async () => {
    if (!file || !title.trim() || !categoryId || (uploadNeedsSub && !subcategoryId)) {
      toast.error('Fill title, category' + (uploadNeedsSub ? ', subcategory' : '') + ', and choose a video')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Video must be 50 MB or smaller')
      return
    }

    const catName = activeCategories.find(c => catIdOf(c) === categoryId)?.name
    const subName = subs.find(s => catIdOf(s) === subcategoryId)?.name
    const ok = await confirm({
      title: 'Publish clip to library?',
      message: 'This uploads and publishes the video to the public NetQwix library.',
      detail: `"${title.trim()}" → ${catName}${subName ? ` › ${subName}` : ''}`,
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
        subcategory_id: subcategoryId || null
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
    if (editSubs.length > 0 && !editSubcategoryId) {
      toast.error('Pick a subcategory')
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
                    <MenuItem key={catIdOf(c)} value={catIdOf(c)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size='small' disabled={uploading || !categoryId || !subs.length}>
                <InputLabel>Subcategory</InputLabel>
                <Select
                  label='Subcategory'
                  value={subcategoryId}
                  onChange={e => setSubcategoryId(e.target.value)}
                >
                  {!subs.length ? <MenuItem value=''>General (none)</MenuItem> : null}
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
                uploading ||
                !file ||
                !title.trim() ||
                !categoryId ||
                (uploadNeedsSub && !subcategoryId) ||
                !activeCategories.length
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
                                    <Stack direction='row' spacing={0.5} sx={{ mt: 'auto', pt: 0.5 }} flexWrap='wrap' useFlexGap>
                                      <Button
                                        size='small'
                                        variant='contained'
                                        startIcon={<PlayArrowRoundedIcon />}
                                        disabled={busy}
                                        onClick={() => setPlayClipId(id)}
                                        sx={{ textTransform: 'none', bgcolor: ops.indigo, boxShadow: 'none' }}
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

      <Dialog open={Boolean(editClip)} onClose={() => !savingEdit && setEditClip(null)} fullWidth maxWidth='sm'>
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
              <InputLabel>Subcategory</InputLabel>
              <Select
                label='Subcategory'
                value={editSubcategoryId}
                onChange={e => setEditSubcategoryId(e.target.value)}
              >
                <MenuItem value=''>General (none)</MenuItem>
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
