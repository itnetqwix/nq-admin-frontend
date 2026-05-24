import { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import HistoryIcon from '@mui/icons-material/History'
import toast from 'react-hot-toast'

import AdminPageShell from 'src/layouts/components/AdminPageShell'
import {
  createBroadcast,
  getBroadcastById,
  resendBroadcast,
  deleteBroadcast
} from 'src/services/broadcastApi'
import BroadcastCompose from 'src/views/broadcasts/BroadcastCompose'
import BroadcastHistory from 'src/views/broadcasts/BroadcastHistory'
import BroadcastDetailDrawer from 'src/views/broadcasts/BroadcastDetailDrawer'

export default function BroadcastsPage() {
  const [tab, setTab] = useState(0)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [sending, setSending] = useState(false)

  const [composeDraft, setComposeDraft] = useState(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const openConfirmSend = payload => {
    setPendingPayload(payload)
    setConfirmOpen(true)
  }

  const handleSend = async () => {
    if (!pendingPayload) return
    setSending(true)
    try {
      await createBroadcast(pendingPayload)
      toast.success('Broadcast queued — delivery runs in the background.')
      setConfirmOpen(false)
      setPendingPayload(null)
      setTab(1)
      setHistoryRefresh(k => k + 1)
    } catch (err) {
      toast.error(err.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  const openDetail = async row => {
    setDetailLoading(true)
    setDetailOpen(true)
    setDetailData(null)
    try {
      const data = await getBroadcastById(row._id)
      setDetailData(data?.result || row)
    } catch (err) {
      toast.error(err.message || 'Failed to load details')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleResend = async id => {
    try {
      await resendBroadcast(id)
      toast.success('Broadcast resend started.')
      setDetailOpen(false)
      setHistoryRefresh(k => k + 1)
    } catch (err) {
      toast.error(err.message || 'Resend failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteBroadcast(deleteTarget._id)
      toast.success('Broadcast deleted.')
      setDeleteTarget(null)
      setHistoryRefresh(k => k + 1)
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDuplicate = row => {
    setComposeDraft({
      _id: `dup-${row._id}`,
      title: row.title ? `${row.title} (copy)` : '',
      body: row.body,
      html_body: row.html_body,
      channels: row.channels || [],
      audience: row.audience,
      audience_filter: row.audience_filter
    })
    setTab(0)
    setDetailOpen(false)
  }

  return (
    <>
      <AdminPageShell
        title='Broadcasts'
        subtitle='Reach trainers and trainees by email, SMS, WhatsApp, in-app alerts, and push — with audience filters and delivery tracking.'
        actions={
          tab === 0 ? (
            <Button variant='outlined' size='small' startIcon={<HistoryIcon />} onClick={() => setTab(1)}>
              View history
            </Button>
          ) : (
            <Button variant='contained' size='small' startIcon={<SendIcon />} onClick={() => setTab(0)}>
              New broadcast
            </Button>
          )
        }
        contentSx={{ p: 0 }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 3 } }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label='Compose' icon={<SendIcon fontSize='small' />} iconPosition='start' />
            <Tab
              label={
                <Badge color='warning' variant='dot' invisible={historyRefresh === 0}>
                  History
                </Badge>
              }
              icon={<HistoryIcon fontSize='small' />}
              iconPosition='start'
            />
          </Tabs>
        </Box>

        {tab === 0 ? (
          <BroadcastCompose
            initialDraft={composeDraft}
            onCancelDraft={() => setComposeDraft(null)}
            onSent={openConfirmSend}
          />
        ) : (
          <BroadcastHistory
            refreshKey={historyRefresh}
            onView={openDetail}
            onDelete={setDeleteTarget}
            onResend={handleResend}
            onDuplicate={row => {
              if (row.html_body || row.body) {
                handleDuplicate(row)
              } else {
                getBroadcastById(row._id)
                  .then(data => handleDuplicate(data?.result || row))
                  .catch(() => toast.error('Could not load broadcast to duplicate'))
              }
            }}
          />
        )}
      </AdminPageShell>

      <Dialog open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirm broadcast</DialogTitle>
        <DialogContent dividers>
          {pendingPayload ? (
            <Box>
              <Typography variant='body1' sx={{ mb: 2 }}>
                You are about to send <strong>{pendingPayload.title}</strong> to{' '}
                <strong>{pendingPayload.audience === 'All' ? 'all users' : `${pendingPayload.audience}s`}</strong>
                {pendingPayload.audience_filter?.status?.length
                  ? ` (${pendingPayload.audience_filter.status.join(', ')})`
                  : ''}
                .
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                <strong>Channels:</strong> {pendingPayload.channels.join(', ')}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Delivery is processed in the background. Track progress under History.
              </Typography>
              {pendingPayload.body ? (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    maxHeight: 120,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {pendingPayload.body}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSend} disabled={sending} startIcon={<SendIcon />}>
            {sending ? 'Sending…' : 'Send now'}
          </Button>
        </DialogActions>
      </Dialog>

      <BroadcastDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={detailData}
        loading={detailLoading}
        onResend={handleResend}
        onDuplicate={handleDuplicate}
      />

      <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete broadcast?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            Permanently delete &quot;{deleteTarget?.title}&quot;? Delivery logs will be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
