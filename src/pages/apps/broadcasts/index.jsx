<<<<<<< HEAD
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
=======
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
import {
  Alert,
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormGroup, Grid, IconButton, InputLabel, MenuItem,
<<<<<<< HEAD
  Radio, RadioGroup, Select, TextField, Tooltip, Typography
} from '@mui/material'
import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminFilterBar from 'src/components/admin/AdminFilterBar'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import AdminTabs from 'src/components/admin/AdminTabs'
import { useAdminConfirm } from 'src/components/admin'
import AdminRefreshButton from 'src/components/admin/AdminRefreshButton'
import OpsMetricTile from 'src/components/admin/OpsMetricTile'
import OpsSurfaceCard from 'src/components/admin/OpsSurfaceCard'
import SendIcon from '@mui/icons-material/Send'
=======
  Radio, RadioGroup, Select, Tab, Tabs, TextField, Tooltip, Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import SendIcon from '@mui/icons-material/Send'
import RefreshIcon from '@mui/icons-material/Refresh'
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ReplayIcon from '@mui/icons-material/Replay'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
<<<<<<< HEAD
import { EditorState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { AbilityContext } from 'src/layouts/components/acl/Can'
import { ops } from 'src/styles/opsSurface'
import MiniSparkline, { fillDailySeries } from 'src/components/admin/MiniSparkline'
=======
import { EditorState, convertToRaw, ContentState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import htmlToDraft from 'html-to-draftjs'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import styles from 'styles/common.module.css'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
import { EditorWrapper } from 'src/@core/styles/libs/react-draft-wysiwyg'
import {
  listBroadcasts,
  getBroadcastById,
  createBroadcast,
  resendBroadcast,
  deleteBroadcast,
<<<<<<< HEAD
  getRecipientPreviewCount,
  getBroadcastDeliveryStats
=======
  getRecipientPreviewCount
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
  const ability = useContext(AbilityContext)
  const fullAccess = ability?.can('manage', 'all') ?? false
  const canSend = fullAccess || (ability?.can('create', 'admin-action-broadcast') ?? false)
  const canDelete = fullAccess || (ability?.can('delete', 'admin-action-broadcast') ?? false)
  const { confirm, ConfirmDialog } = useAdminConfirm()
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
  const [deliveryStats, setDeliveryStats] = useState(null)
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)

  // ─── Detail dialog state ───────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

<<<<<<< HEAD
=======
  // ─── Delete state ──────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
    if (!canSend) {
      toast.error('You cannot send broadcasts')
      return
    }
=======
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    if (!validateCompose()) return
    setConfirmOpen(true)
  }

  // ─── History fetch ────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
<<<<<<< HEAD
      const [data, statsRes] = await Promise.all([
        listBroadcasts({ search, page, limit: pageSize }),
        getBroadcastDeliveryStats(14).catch(() => null)
      ])
      const list = data?.result?.broadcasts || []
      setBroadcasts(list.map(b => ({ ...b, id: b._id })))
      setTotal(data?.result?.total || 0)
      const stats = statsRes?.result || statsRes?.data || statsRes
      if (stats?.dailyDeliveries) setDeliveryStats(stats)
=======
      const data = await listBroadcasts({ search, page, limit: pageSize })
      const list = data?.result?.broadcasts || []
      setBroadcasts(list.map(b => ({ ...b, id: b._id })))
      setTotal(data?.result?.total || 0)
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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

<<<<<<< HEAD
  const requestResend = async id => {
    const ok = await confirm({
      title: 'Resend broadcast?',
      message: 'Delivery will be retried for failed recipients.',
      confirmLabel: 'Resend',
      variant: 'warning'
    })
    if (!ok) return
=======
  // ─── Resend ───────────────────────────────────────────────
  const handleResend = async id => {
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    try {
      await resendBroadcast(id)
      toast.success('Broadcast resend initiated.')
      fetchHistory()
      if (detailOpen) setDetailOpen(false)
    } catch (err) {
      toast.error(err.message || 'Resend failed')
    }
  }

<<<<<<< HEAD
  const requestDelete = async row => {
    if (!canDelete) {
      toast.error('You cannot delete broadcasts')
      return
    }
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
=======
  // ─── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteBroadcast(deleteTarget._id)
      toast.success('Broadcast deleted.')
      setDeleteTarget(null)
      fetchHistory()
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    }
  }

  // ─── History Columns ──────────────────────────────────────
  const historyColumns = useMemo(() => [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 200,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    },
    {
      field: 'audience',
      headerName: 'Audience',
      width: 110,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    },
    {
      field: 'channels',
      headerName: 'Channels',
      width: 220,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => (
        <Chip label={p.value} size='small' color={STATUS_COLORS[p.value] || 'default'} />
      ),
    },
    {
      field: 'stats',
      headerName: 'Recipients',
      width: 110,
<<<<<<< HEAD
      renderCell: p => p.value?.total_recipients ?? '--',
    },
    {
      field: 'delivery_spark',
      headerName: '14d sent',
      width: 100,
      sortable: false,
      renderCell: p => (
        <MiniSparkline
          values={
            Array.isArray(p.row.delivery_daily) && p.row.delivery_daily.length
              ? p.row.delivery_daily
              : []
          }
          width={80}
        />
      ),
    },
    {
      field: 'sent_at',
      headerName: 'Sent At',
      width: 170,
=======
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
      renderCell: p => p.value?.total_recipients ?? '--',
    },
    {
      field: 'sent_at',
      headerName: 'Sent At',
      width: 170,
      headerClassName: styles['header-class'],
      cellClassName: styles['cell-class'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => p.value ? new Date(p.value).toLocaleString() : '--',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
<<<<<<< HEAD
=======
      headerClassName: styles['header-class-last'],
      cellClassName: styles['cell-class-last'],
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
      renderCell: p => (
        <Box>
          <Tooltip title='View Details'>
            <IconButton size='small' onClick={e => { e.stopPropagation(); openDetail(p.row) }}>
              <VisibilityIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {p.row.status === 'failed' && (
            <Tooltip title='Resend'>
<<<<<<< HEAD
              <IconButton size='small' color='warning' onClick={e => { e.stopPropagation(); void requestResend(p.row._id) }}>
=======
              <IconButton size='small' color='warning' onClick={e => { e.stopPropagation(); handleResend(p.row._id) }}>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
                <ReplayIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title='Delete'>
<<<<<<< HEAD
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); void requestDelete(p.row) }}>
=======
            <IconButton size='small' color='error' onClick={e => { e.stopPropagation(); setDeleteTarget(p.row) }}>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
        bare
        eyebrow='Revenue · broadcasts'
        icon='mdi:bullhorn-outline'
        title='Broadcasts.'
        subtitle='Compose and send across email, SMS, WhatsApp, in-app, and push. Send / delete respect RBAC.'
        actions={
          !canSend ? <Chip label='Send disabled for your role' size='small' sx={{ fontFamily: ops.mono }} /> : null
        }
      >
        <AdminTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 0, label: 'Compose' },
            { value: 1, label: 'History' }
          ]}
        />
=======
        title='Broadcasts'
        subtitle='Send messages to your users via Email, SMS, WhatsApp, In-App notifications, and Push notifications.'
        contentSx={{ p: 0 }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label='Compose' />
            <Tab label='History' />
          </Tabs>
        </Box>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)

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
<<<<<<< HEAD
            {(() => {
              const sentSeries = deliveryStats?.dailyDeliveries?.length
                ? fillDailySeries(deliveryStats.dailyDeliveries, 14, 'sent')
                : []
              const failedSeries = deliveryStats?.dailyDeliveries?.length
                ? fillDailySeries(deliveryStats.dailyDeliveries, 14, 'failed')
                : []
              const sentTotal = sentSeries.reduce((a, b) => a + b, 0)
              const failedTotal = failedSeries.reduce((a, b) => a + b, 0)
              return (
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  <Grid item xs={6} sm={3}>
                    <OpsMetricTile
                      icon='mdi:send-check'
                      label='Sent (14d)'
                      value={String(sentTotal)}
                      hint='Platform deliveries'
                      tone='accent'
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <OpsMetricTile
                      icon='mdi:alert-circle-outline'
                      label='Failed (14d)'
                      value={String(failedTotal)}
                      hint='Delivery errors'
                      tone={failedTotal > 0 ? 'danger' : 'default'}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <OpsMetricTile
                      icon='mdi:history'
                      label='In this view'
                      value={String(total)}
                      hint='Matching search'
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        px: 1,
                        py: 1.5,
                        borderRadius: ops.radiusMd,
                        border: `1px solid ${ops.hairline}`,
                        bgcolor: ops.canvasSoft
                      }}
                    >
                      <Typography sx={{ fontFamily: ops.mono, fontSize: 10, color: ops.mute, mb: 0.5 }}>
                        14d trend
                      </Typography>
                      <MiniSparkline values={sentSeries} width={96} height={28} />
                    </Box>
                  </Grid>
                </Grid>
              )
            })()}
            <OpsSurfaceCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${ops.hairline}` }}>
                <AdminFilterBar
                  searchPlaceholder='Search broadcasts…'
                  onSearchChange={handleSearchChange}
                  resultCount={total}
                  onRefresh={() => void fetchHistory()}
                  refreshLoading={loading}
                />
              </Box>
              <AdminGridContainer>
                <AdminDataGrid
                  autoHeight={false}
                  rows={broadcasts}
                  columns={historyColumns}
                  loading={loading}
                  rowCount={total}
                  paginationMode='server'
                  paginationModel={{ page: page - 1, pageSize }}
                  onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
                  sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
                  emptyMessage='No broadcasts in this view.'
                />
              </AdminGridContainer>
            </OpsSurfaceCard>
=======
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                size='small'
                placeholder='Search broadcasts...'
                onChange={handleSearchChange}
                sx={{ width: { xs: '100%', sm: 320 } }}
              />
              <Tooltip title='Refresh'>
                <IconButton onClick={fetchHistory}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <DataGrid
              rows={broadcasts}
              columns={historyColumns}
              loading={loading}
              rowCount={total}
              paginationMode='server'
              paginationModel={{ page: page - 1, pageSize }}
              onPaginationModelChange={m => { setPage(m.page + 1); setPageSize(m.pageSize) }}
              pageSizeOptions={[25, 50, 100]}
              disableRowSelectionOnClick
              autoHeight
              getRowClassName={p => p.indexRelativeToCurrentPage % 2 === 0 ? styles['even-row'] : styles['odd-row']}
              sx={{ border: 'none', '& .MuiDataGrid-cell': { py: 1 } }}
            />
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
              <AdminDataGrid
                rows={logRows}
                columns={logColumns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
=======
              <DataGrid
                rows={logRows}
                columns={logColumns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
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
<<<<<<< HEAD
              onClick={() => void requestResend(detailData._id)}
=======
              onClick={() => handleResend(detailData._id)}
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
            >
              Resend
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── DELETE CONFIRMATION ───────────────────────────── */}
<<<<<<< HEAD
      {ConfirmDialog}
=======
      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete Broadcast</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the broadcast &quot;{deleteTarget?.title}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={deleteLoading}
            startIcon={<DeleteOutlineIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
>>>>>>> 7da6433 (Add Promo Codes management functionality including new page, API integration, and navigation updates. Enhance ACL rules for access control and update navigation structure to include Promo Codes section.)
    </>
  )
}
