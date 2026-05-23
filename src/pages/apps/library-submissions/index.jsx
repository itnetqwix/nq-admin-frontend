import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import moment from 'moment'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  approveLibrarySubmission,
  getClipTaxonomyAdmin,
  getLibrarySubmissions,
  markLibrarySubmissionUnderReview,
  rejectLibrarySubmission
} from 'src/services/clipsAdminApi'

export default function LibrarySubmissionsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [taxonomy, setTaxonomy] = useState([])
  const [drawer, setDrawer] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLibrarySubmissions({ limit: 100 })
      setRows(
        (data?.items || []).map((r, i) => ({
          id: r._id || i,
          title: r.source_clip_id?.title || 'Clip',
          requester: r.requester_user_id?.fullname || r.requester_user_id?.email,
          status: r.status,
          submitted: r.createdAt,
          raw: r
        }))
      )
    } catch (e) {
      toast.error(e?.message || 'Failed to load')
      setRows([])
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

  const openRow = row => {
    setDrawer(row.raw)
    setRejectReason('')
    setCategoryId('')
    setSubcategoryId('')
  }

  const handleApprove = async () => {
    if (!drawer?._id || !categoryId || !subcategoryId) {
      toast.error('Select category and subcategory')
      return
    }
    setActing(true)
    try {
      await approveLibrarySubmission(drawer._id, categoryId, subcategoryId)
      toast.success('Published to library')
      setDrawer(null)
      void load()
    } catch (e) {
      toast.error(e?.message)
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!drawer?._id || !rejectReason.trim()) {
      toast.error('Rejection reason required')
      return
    }
    setActing(true)
    try {
      await rejectLibrarySubmission(drawer._id, rejectReason.trim())
      toast.success('Submission rejected')
      setDrawer(null)
      void load()
    } catch (e) {
      toast.error(e?.message)
    } finally {
      setActing(false)
    }
  }

  const columns = [
    { field: 'title', headerName: 'Clip', flex: 1, minWidth: 160 },
    { field: 'requester', headerName: 'Requester', width: 180 },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'submitted',
      headerName: 'Submitted',
      width: 160,
      valueFormatter: ({ value }) => (value ? moment(value).format('MMM D, YYYY') : '')
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      renderCell: ({ row }) => (
        <Button size='small' onClick={() => openRow(row)}>
          Review
        </Button>
      )
    }
  ]

  return (
    <AdminPageShell title='Library submissions' subtitle='Review user requests to publish clips to Netqwix Library'>
      <AdminPageSection>
        <DataGrid autoHeight rows={rows} columns={columns} loading={loading} pageSizeOptions={[25, 50]} />
      </AdminPageSection>

      <Drawer anchor='right' open={Boolean(drawer)} onClose={() => setDrawer(null)}>
        <Box sx={{ width: 400, p: 3 }}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Review submission
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {drawer?.source_clip_id?.title}
          </Typography>
          <Stack spacing={2}>
            <Button
              variant='outlined'
              disabled={acting || drawer?.status !== 'submitted'}
              onClick={async () => {
                try {
                  await markLibrarySubmissionUnderReview(drawer._id)
                  toast.success('Marked under review')
                  void load()
                  setDrawer({ ...drawer, status: 'under_review' })
                } catch (e) {
                  toast.error(e?.message)
                }
              }}
            >
              Mark under review
            </Button>
            <FormControl fullWidth size='small'>
              <InputLabel>Category</InputLabel>
              <Select label='Category' value={categoryId} onChange={e => setCategoryId(e.target.value)}>
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
            <Button variant='contained' disabled={acting} onClick={() => void handleApprove()}>
              Approve & publish
            </Button>
            <TextField
              label='Rejection reason'
              multiline
              minRows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <Button variant='outlined' color='error' disabled={acting} onClick={() => void handleReject()}>
              Reject
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </AdminPageShell>
  )
}
