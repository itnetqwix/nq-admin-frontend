import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import Link from 'next/link'
import toast from 'react-hot-toast'
import SubmissionStatusChip from 'src/components/clips/SubmissionStatusChip'
import {
  approveLibrarySubmission,
  getClipPlayUrl,
  getClipTaxonomyAdmin,
  getLibrarySubmissions,
  markLibrarySubmissionUnderReview,
  rejectLibrarySubmission
} from 'src/services/clipsAdminApi'
import { getImageUrl } from 'src/utils/utils'

const STATUS_TABS = [
  { value: '', label: 'Pending queue' },
  { value: 'submitted', label: 'New' },
  { value: 'under_review', label: 'In review' },
  { value: 'all', label: 'All history' },
  { value: 'accepted', label: 'Published' },
  { value: 'rejected', label: 'Rejected' }
]

function requesterLabel(user) {
  if (!user) return '—'
  const name = user.fullname || user.email || 'User'
  const role = user.account_type || ''
  return role ? `${name} (${role})` : name
}

function proposedLabel(sub) {
  const cat = sub?.proposed_category_id?.name
  const subcat = sub?.proposed_subcategory_id?.name
  if (cat && subcat) return `${cat} › ${subcat}`
  return cat || subcat || '—'
}

export default function LibrarySubmissionsPanel() {
  const [statusFilter, setStatusFilter] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState({ pending: 0, underReview: 0 })
  const [taxonomy, setTaxonomy] = useState([])
  const [drawer, setDrawer] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [acting, setActing] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [mediaLoading, setMediaLoading] = useState(false)

  const loadTaxonomy = useCallback(async () => {
    try {
      const data = await getClipTaxonomyAdmin()
      setTaxonomy(Array.isArray(data) ? data : [])
    } catch {
      setTaxonomy([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = { limit: 100 }
      if (statusFilter) query.status = statusFilter
      const data = await getLibrarySubmissions(query)
      setCounts({
        pending: data?.pendingCount ?? 0,
        underReview: data?.underReviewCount ?? 0
      })
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || i,
          title: r.source_clip_id?.title || 'Untitled clip',
          requester: requesterLabel(r.requester_user_id),
          requesterRole: r.requester_user_id?.account_type || '',
          requesterEmail: r.requester_user_id?.email || '',
          proposed: proposedLabel(r),
          status: r.status,
          submitted: r.createdAt,
          raw: r
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load submissions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadTaxonomy()
  }, [loadTaxonomy])

  useEffect(() => {
    void load()
  }, [load])

  const selectedCat = taxonomy.find(c => (c.id || c._id) === categoryId)
  const subs = selectedCat?.subcategories || []

  const openRow = async row => {
    const sub = row.raw
    setDrawer(sub)
    setRejectReason(sub?.rejection_reason || '')
    const proposedCat = sub?.proposed_category_id?._id || sub?.proposed_category_id
    const proposedSub = sub?.proposed_subcategory_id?._id || sub?.proposed_subcategory_id
    setCategoryId(proposedCat ? String(proposedCat) : '')
    setSubcategoryId(proposedSub ? String(proposedSub) : '')
    setVideoUrl('')
    setPosterUrl('')
    const clipId = sub?.source_clip_id?._id || sub?.source_clip_id
    if (clipId) {
      setMediaLoading(true)
      try {
        const media = await getClipPlayUrl(String(clipId))
        setVideoUrl(media?.videoUrl || media?.cdnFallbackVideo || '')
        setPosterUrl(media?.thumbnailUrl || '')
      } catch (e) {
        toast.error(e?.message || 'Could not load video preview')
      } finally {
        setMediaLoading(false)
      }
    }
  }

  const closeDrawer = () => {
    setDrawer(null)
    setVideoUrl('')
    setPosterUrl('')
  }

  const handleApprove = async () => {
    if (!drawer?._id || !categoryId || !subcategoryId) {
      toast.error('Select category and subcategory for the library')
      return
    }
    setActing(true)
    try {
      await approveLibrarySubmission(drawer._id, categoryId, subcategoryId)
      toast.success('Published to Netqwix Library')
      closeDrawer()
      void load()
    } catch (e) {
      toast.error(e?.message)
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!drawer?._id || !rejectReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setActing(true)
    try {
      await rejectLibrarySubmission(drawer._id, rejectReason.trim())
      toast.success('Request rejected — user will see your reason in the app')
      closeDrawer()
      void load()
    } catch (e) {
      toast.error(e?.message)
    } finally {
      setActing(false)
    }
  }

  const canModerate = drawer && ['submitted', 'under_review'].includes(drawer.status)

  const columns = useMemo(
    () => [
      {
        field: 'title',
        headerName: 'Clip',
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant='body2' fontWeight={600}>
              {row.title}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.proposed}
            </Typography>
          </Box>
        )
      },
      {
        field: 'requester',
        headerName: 'Requested by',
        width: 200,
        renderCell: ({ row }) => (
          <Stack direction='row' spacing={1} alignItems='center'>
            <Avatar
              src={getImageUrl(row.raw?.requester_user_id?.profile_picture)}
              sx={{ width: 28, height: 28 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' noWrap>
                {row.requester}
              </Typography>
              <Typography variant='caption' color='text.secondary' noWrap>
                {row.requesterEmail}
              </Typography>
            </Box>
          </Stack>
        )
      },
      {
        field: 'requesterRole',
        headerName: 'Role',
        width: 100,
        renderCell: ({ value }) => (
          <Chip size='small' label={value || '—'} variant='outlined' color={value === 'Trainer' ? 'primary' : 'default'} />
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: ({ value }) => <SubmissionStatusChip status={value} />
      },
      {
        field: 'submitted',
        headerName: 'Submitted',
        width: 120,
        valueFormatter: ({ value }) => (value ? moment(value).format('MMM D, YYYY') : '')
      },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        renderCell: ({ row }) => (
          <Button size='small' variant='contained' onClick={() => void openRow(row)}>
            Review
          </Button>
        )
      }
    ],
    []
  )

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <Chip label={`${counts.pending} new`} color='warning' variant='outlined' size='small' />
          <Chip label={`${counts.underReview} in review`} color='info' variant='outlined' size='small' />
        </Stack>
        <Button component={Link} href='/apps/clip-taxonomy' size='small' variant='text'>
          Manage categories →
        </Button>
      </Stack>

      <Tabs
        value={statusFilter}
        onChange={(_, v) => setStatusFilter(v)}
        variant='scrollable'
        scrollButtons='auto'
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {STATUS_TABS.map(tab => (
          <Tab key={tab.value || 'pending'} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      {statusFilter === '' && rows.length === 0 && !loading ? (
        <Alert severity='success' sx={{ mb: 2 }}>
          No pending library requests. Trainers and trainees can submit clips from the mobile app Clips tab.
        </Alert>
      ) : null}

      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        sx={{ border: 'none' }}
      />

      <Drawer anchor='right' open={Boolean(drawer)} onClose={closeDrawer} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
          <Typography variant='overline' color='text.secondary'>
            Library request
          </Typography>
          <Typography variant='h6' sx={{ mb: 0.5 }}>
            {drawer?.source_clip_id?.title || 'Clip'}
          </Typography>
          <SubmissionStatusChip status={drawer?.status} size='medium' />

          <Box
            sx={{
              mt: 2,
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'grey.900',
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mediaLoading ? (
              <CircularProgress size={32} sx={{ color: 'grey.400' }} />
            ) : videoUrl ? (
              <video
                key={videoUrl}
                controls
                playsInline
                poster={posterUrl || undefined}
                style={{ width: '100%', maxHeight: 280, display: 'block' }}
              >
                <source src={videoUrl} />
              </video>
            ) : (
              <Typography variant='body2' color='grey.500'>
                Video preview unavailable
              </Typography>
            )}
          </Box>

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant='subtitle2'>Requester</Typography>
            <Stack direction='row' spacing={1.5} alignItems='center'>
              <Avatar src={getImageUrl(drawer?.requester_user_id?.profile_picture)} />
              <Box>
                <Typography variant='body2' fontWeight={600}>
                  {drawer?.requester_user_id?.fullname || '—'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {drawer?.requester_user_id?.account_type} · {drawer?.requester_user_id?.email}
                </Typography>
              </Box>
            </Stack>
            <Typography variant='body2'>
              <strong>Proposed placement:</strong> {proposedLabel(drawer)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Submitted {drawer?.createdAt ? moment(drawer.createdAt).format('MMM D, YYYY h:mm A') : '—'}
            </Typography>
            {drawer?.rejection_reason ? (
              <Alert severity='error' variant='outlined'>
                Rejection reason: {drawer.rejection_reason}
              </Alert>
            ) : null}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {canModerate ? (
            <Stack spacing={2}>
              <Button
                variant='outlined'
                disabled={acting || drawer?.status !== 'submitted'}
                onClick={async () => {
                  try {
                    await markLibrarySubmissionUnderReview(drawer._id)
                    toast.success('Marked under review')
                    setDrawer({ ...drawer, status: 'under_review' })
                    void load()
                  } catch (e) {
                    toast.error(e?.message)
                  }
                }}
              >
                Mark under review
              </Button>

              <Typography variant='subtitle2'>Publish to library as</Typography>
              <FormControl fullWidth size='small'>
                <InputLabel>Category</InputLabel>
                <Select label='Category' value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId('') }}>
                  {taxonomy.map(c => (
                    <MenuItem key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size='small' disabled={!categoryId}>
                <InputLabel>Subcategory</InputLabel>
                <Select label='Subcategory' value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
                  {subs.map(s => (
                    <MenuItem key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant='contained' color='success' disabled={acting} onClick={() => void handleApprove()}>
                Approve & publish to Netqwix Library
              </Button>

              <TextField
                label='Rejection reason (shown to user)'
                multiline
                minRows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder='Explain why this clip cannot be added to the public library…'
              />
              <Button variant='outlined' color='error' disabled={acting} onClick={() => void handleReject()}>
                Reject request
              </Button>
            </Stack>
          ) : (
            <Alert severity='info'>This request has already been {drawer?.status}. No further action needed.</Alert>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
