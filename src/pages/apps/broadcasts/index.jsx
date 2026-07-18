import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormGroup, Grid, IconButton, InputLabel, MenuItem,
  Radio, RadioGroup, Select, TextField, Tooltip, Typography
} from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import SendIcon from '@mui/icons-material/Send'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ReplayIcon from '@mui/icons-material/Replay'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { EditorState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { EditorWrapper } from 'src/@core/styles/libs/react-draft-wysiwyg'
import {
  listBroadcasts,
  getBroadcastById,
  createBroadcast,
  resendBroadcast,
  deleteBroadcast,
  getRecipientPreviewCount
} from 'src/services/broadcastApi'

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false })

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'in_app', label: 'In-App Notification' },
  { key: 'push', label: 'Push Notification' },
]

const STATUS_COLORS = {
  draft: 'default',
  sending: 'warning',
  completed: 'success',
  failed: 'error',
}

function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html || ''
  return tmp.textContent || tmp.innerText || ''
}

export default function BroadcastsPage() {
  const { confirm, ConfirmDialog } = useAdminConfirm()
  const [tab, setTab] = useState(0)

  // ─── Compose state ──────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const [plainText, setPlainText] = useState('')
  const [audience, setAudience] = useState('All')
  const [statusFilter, setStatusFilter] = useState('approved')
  const [selectedChannels, setSelectedChannels] = useState([])
  const [recipientCount, setRecipientCount] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const previewTimer = useRef(null)

  // ─── History state ──────────────────────────────────────────
  const [broadcasts, setBroadcasts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const searchTimer = useRef(null)

  // ─── Detail dialog state ───────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ─── Recipient Preview ────────────────────────────────────
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const q = { audience }
        if (statusFilter) q.status = statusFilter
        const data = await getRecipientPreviewCount(q)
        setRecipientCount(data?.result?.count ?? 0)
      } catch {
        setRecipientCount(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 500)
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current) }
  }, [audience, statusFilter])

  // ─── Editor → HTML → Plain Text sync ──────────────────────
  const getHtmlBody = () => draftToHtml(convertToRaw(editorState.getCurrentContent()))

  const handleEditorChange = state => {
    setEditorState(state)
    const html = draftToHtml(convertToRaw(state.getCurrentContent()))
    setPlainText(stripHtml(html))
  }

  // ─── Channel toggle ───────────────────────────────────────
  const toggleChannel = key => {
    setSelectedChannels(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  // ─── Send Broadcast ───────────────────────────────────────
  const handleSend = async () => {
    const htmlBody = getHtmlBody()
    const body = {
      title: title.trim(),
      body: plainText.trim(),
      html_body: htmlBody,
      channels: selectedChannels,
      audience,
      audience_filter: { status: statusFilter ? [statusFilter] : ['approved'] },
    }
    setSending(true)
    try {
      await createBroadcast(body)
      toast.success('Broadcast sent successfully!')
      setConfirmOpen(false)
      resetCompose()
      setTab(1)
      fetchHistory()
    } catch (err) {
      toast.error(err.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  const resetCompose = () => {
    setTitle('')
    setEditorState(EditorState.createEmpty())
    setPlainText('')
    setAudience('All')
    setStatusFilter('approved')
    setSelectedChannels([])
  }

  const validateCompose = () => {
    if (!title.trim()) { toast.error('Title is required.'); return false }
    if (!selectedChannels.length) { toast.error('Select at least one channel.'); return false }
    if (selectedChannels.includes('email')) {
      const html = getHtmlBody()
      if (!html || html === '<p></p>\n' || !stripHtml(html).trim()) {
        toast.error('HTML body is required for email channel.')
        return false
      }
    }
    const needsText = selectedChannels.some(c => ['sms', 'whatsapp', 'push'].includes(c))
    if (needsText && !plainText.trim()) {
      toast.error('Plain text body is required for SMS/WhatsApp/Push channels.')
      return false
    }
    if (plainText.length > 1600 && selectedChannels.some(c => ['sms', 'whatsapp'].includes(c))) {
      toast.error('Plain text body must be 1600 chars or fewer for SMS/WhatsApp.')
      return false
    }
    return true
  }

  const onSendClick = () => {
    if (!validateCompose()) return
    setConfirmOpen(true)
  }

  // ─── History fetch ────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listBroadcasts({ search, page, limit: pageSize })
      const list = data?.result?.broadcasts || []
      setBroadcasts(list.map(b => ({ ...b, id: b._id })))
      setTotal(data?.result?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load broadcasts')
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize])

  useEffect(() => {
    if (tab === 1) fetchHistory()
  }, [tab, fetchHistory])

  const handleSearchChange = e => {
    const val = e.target.value
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  // ─── Detail ───────────────────────────────────────────────
  const openDetail = async row => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const data = await getBroadcastById(row._id)
      setDetailData(data?.result || row)
    } catch (err) {
      toast.error(err.message || 'Failed to load broadcast details')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const requestResend = async id => {
    const ok = await confirm({
      title: 'Resend broadcast?',
      message: 'Delivery will be retried for failed recipients.',
      confirmLabel: 'Resend',
      variant: 'warning'
    })
    if (!ok) return
    try {
      await resendBroadcast(id)
      toast.success('Broadcast resend initiated.')
      fetchHistory()
      if (detailOpen) setDetailOpen(false)
    } catch (err) {
      toast.error(err.message || 'Resend failed')
    }
  }

  const requestDelete = async row => {
    const ok = await confirm({
      title: 'Delete broadcast?',
      message: `"${row.title}" will be removed permanently.`,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await deleteBroadcast(row._id)
      toast.success('Broadcast deleted.')
      fetchHistory()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  // ─── History Columns ──────────────────────────────────────
  const historyColumns = useMemo(() => [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'audience',
      headerName: 'Audience',
      width: 110,
    },
    {
      field: 'channels',
      headerName: 'Channels',
      width: 220,
      renderCell: p => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(p.value || []).map(ch => (
            <Chip key={ch} label={ch} size='small' variant='outlined' />
          ))}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: p => (
        <Chip label={p.value} size='small' color={STATUS_COLORS[p.value] || 'default'} />
      ),
    },
    {
      field: 'stats',
      headerName: 'Recipients',
      width: 110,
      renderCell: p => p.value?.total_recipients ?? '--',
    },
    {
      field: 'sent_at',
      headerName: 'Sent At',
      width: 170,
      renderCell: p => p.value ? new Date(p.value).toLocaleString() : '--',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: p => (
        <Box>
          <Tooltip title='View Details'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); openDetail(p.row) }}>
              <VisibilityIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {p.row.status === 'failed' && (
            <Tooltip title='Resend'>
              <IconButton size='small' color='warning' onClick={e => { e.stopPropagation(); void requestResend(p.row._id) }}>
                <ReplayIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title='Delete'>
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); void requestDelete(p.row) }}>
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [])

  // ─── Delivery log columns ────────────────────────────────
  const logColumns = useMemo(() => [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      renderCell: p => p.row.user_id?.fullname || p.row.user_id?.email || String(p.row.user_id || '--'),
    },
    { field: 'channel', headerName: 'Channel', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: p => (
        <Chip label={p.value} size='small' color={p.value === 'sent' ? 'success' : 'error'} />
      ),
    },
    { field: 'error', headerName: 'Error', flex: 1, renderCell: p => p.value || '--' },
    {
      field: 'sent_at',
      headerName: 'Time',
      width: 160,
      renderCell: p => p.value ? new Date(p.value).toLocaleString() : '--',
    },
  ], [])

  const logRows = useMemo(
    () => (detailData?.delivery_log || []).map((l, i) => ({ ...l, id: l._id || `log-${i}` })),
    [detailData]
  )

  // ─── Render ───────────────────────────────────────────────
  return (
    <>
      <AdminPageShell
        icon='mdi:bullhorn-outline'
        title='Broadcasts'
        subtitle='Send messages to your users via Email, SMS, WhatsApp, In-App notifications, and Push notifications.'
        contentSx={{ p: 0 }}
      >
        <AdminTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 0, label: 'Compose' },
            { value: 1, label: 'History' }
          ]}
        />

        {/* ─── COMPOSE TAB ─────────────────────────────────── */}
        {tab === 0 && (
          <AdminPageSection>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  label='Title / Subject'
                  fullWidth
                  size='small'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  inputProps={{ maxLength: 200 }}
                  helperText={`${title.length}/200`}
                />
              </Grid>

              {/* Rich Text Editor */}
              <Grid item xs={12}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Body (Rich Text — used for Email)
                </Typography>
                <EditorWrapper>
                  <Editor
                    editorState={editorState}
                    onEditorStateChange={handleEditorChange}
                    wrapperClassName='rdw-editor-wrapper'
                    editorClassName='rdw-editor-main'
                    toolbarClassName='rdw-editor-toolbar'
                    toolbar={{
                      options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'image', 'history'],
                    }}
                    editorStyle={{ minHeight: 200, padding: '0 14px' }}
                  />
                </EditorWrapper>
              </Grid>

              {/* Plain Text Preview */}
              <Grid item xs={12}>
                <TextField
                  label='Plain Text (for SMS / WhatsApp / Push)'
                  fullWidth
                  size='small'
                  multiline
                  rows={3}
                  value={plainText}
                  onChange={e => setPlainText(e.target.value)}
                  inputProps={{ maxLength: 1600 }}
                  helperText={`${plainText.length}/1600 — auto-generated from HTML, editable`}
                />
              </Grid>

              {/* Audience */}
              <Grid item xs={12} sm={6}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>Audience</Typography>
                <RadioGroup row value={audience} onChange={e => setAudience(e.target.value)}>
                  <FormControlLabel value='Trainer' control={<Radio />} label='Trainers' />
                  <FormControlLabel value='Trainee' control={<Radio />} label='Trainees' />
                  <FormControlLabel value='All' control={<Radio />} label='All Users' />
                </RadioGroup>
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size='small'>
                  <InputLabel>User Status Filter</InputLabel>
                  <Select
                    label='User Status Filter'
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value='approved'>Approved</MenuItem>
                    <MenuItem value='pending'>Pending</MenuItem>
                    <MenuItem value=''>All Statuses</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Channels */}
              <Grid item xs={12}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>Channels</Typography>
                <FormGroup row>
                  {CHANNELS.map(ch => (
                    <FormControlLabel
                      key={ch.key}
                      control={
                        <Checkbox
                          checked={selectedChannels.includes(ch.key)}
                          onChange={() => toggleChannel(ch.key)}
                        />
                      }
                      label={ch.label}
                    />
                  ))}
                </FormGroup>
              </Grid>

              {/* Recipient Count Preview */}
              <Grid item xs={12}>
                <Alert severity='info' icon={false} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2'>
                    Estimated recipients:{' '}
                    <strong>
                      {previewLoading ? 'Loading...' : recipientCount != null ? recipientCount : '--'}
                    </strong>
                  </Typography>
                </Alert>
              </Grid>

              {/* Send Button */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant='outlined' onClick={resetCompose}>Reset</Button>
                <Button
                  variant='contained'
                  startIcon={<SendIcon />}
                  onClick={onSendClick}
                  disabled={sending}
                  sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
                >
                  Send Broadcast
                </Button>
              </Grid>
            </Grid>
          </AdminPageSection>
        )}

        {/* ─── HISTORY TAB ─────────────────────────────────── */}
        {tab === 1 && (
          <AdminPageSection>
            <AdminFilterBar
              searchPlaceholder='Search broadcasts…'
              onSearchChange={handleSearchChange}
              resultCount={total}
              onRefresh={() => void fetchHistory()}
              refreshLoading={loading}
            />
            <AdminDataGrid
              rows={broadcasts}
              columns={historyColumns}
              loading={loading}
              rowCount={total}
              paginationMode='server'
              paginationModel={{ page: page - 1, pageSize }}
              onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
              sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
            />
          </AdminPageSection>
        )}
      </AdminPageShell>

      {/* ─── SEND CONFIRMATION DIALOG ──────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirm Broadcast</DialogTitle>
        <DialogContent dividers>
          <Typography variant='body1' sx={{ mb: 2 }}>
            You are about to send a broadcast to{' '}
            <strong>{recipientCount ?? '?'}</strong> {audience === 'All' ? 'users' : audience + 's'}.
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            <strong>Title:</strong> {title}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            <strong>Channels:</strong> {selectedChannels.join(', ') || 'None'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            <strong>Audience:</strong> {audience} ({statusFilter || 'all statuses'})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSend}
            disabled={sending}
            startIcon={<SendIcon />}
            sx={{ bgcolor: '#000080', '&:hover': { bgcolor: '#0000a0' } }}
          >
            {sending ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── DETAIL DIALOG ─────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>
          Broadcast Details
          {detailData?.title ? ` — ${detailData.title}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Typography>Loading...</Typography>
          ) : detailData ? (
            <>
              {/* Status + Meta */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={detailData.status} size='small' color={STATUS_COLORS[detailData.status] || 'default'} />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Audience</Typography>
                  <Typography variant='body1'>{detailData.audience}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Sent At</Typography>
                  <Typography variant='body2'>
                    {detailData.sent_at ? new Date(detailData.sent_at).toLocaleString() : '--'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant='caption' color='text.secondary'>Total Recipients</Typography>
                  <Typography variant='h6'>{detailData.stats?.total_recipients ?? 0}</Typography>
                </Grid>
              </Grid>

              {/* Channel Stats */}
              <Typography variant='subtitle2' sx={{ mb: 1 }}>Channel Stats</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(detailData.channels || []).map(ch => {
                  const s = detailData.stats?.[ch] || {}
                  return (
                    <Grid item xs={6} sm={2.4} key={ch}>
                      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase' }}>
                          {ch}
                        </Typography>
                        <Typography variant='body2' color='success.main'>
                          Sent: {s.sent ?? 0}
                        </Typography>
                        <Typography variant='body2' color='error.main'>
                          Failed: {s.failed ?? 0}
                        </Typography>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>

              {/* HTML Content */}
              {detailData.html_body && (
                <>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>Email Content</Typography>
                  <Box
                    sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: detailData.html_body }}
                  />
                </>
              )}

              {/* Plain Text */}
              {detailData.body && (
                <>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>Plain Text</Typography>
                  <Box sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                    {detailData.body}
                  </Box>
                </>
              )}

              {/* Delivery Log */}
              <Typography variant='subtitle2' sx={{ mb: 1 }}>Delivery Log</Typography>
              <AdminDataGrid
                rows={logRows}
                columns={logColumns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{ border: 'none' }}
              />
              {logRows.length === 0 && (
                <Typography color='text.secondary' textAlign='center' sx={{ py: 3 }}>
                  No delivery log entries.
                </Typography>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          {detailData?.status === 'failed' && (
            <Button
              color='warning'
              startIcon={<ReplayIcon />}
              onClick={() => void requestResend(detailData._id)}
            >
              Resend
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── DELETE CONFIRMATION ───────────────────────────── */}
      {ConfirmDialog}
    </>
  )
}
