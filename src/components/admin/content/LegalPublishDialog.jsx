import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { getLegalNotifyCount } from 'src/services/cmsApi'

const NOTIFY_SLUGS = new Set(['terms', 'privacy'])

const DEFAULT_INTRO = {
  privacy:
    "We're writing to inform you about some updates to our Privacy Policy.\n\nWe encourage you to read the updated policy in full. A summary of key changes is below.",
  terms:
    "We're writing to inform you about some updates to our Terms & Conditions.\n\nPlease review the updated terms at your convenience."
}

export default function LegalPublishDialog({
  open,
  onClose,
  onConfirm,
  slug,
  documentTitle,
  version,
  publishing = false
}) {
  const canNotify = NOTIFY_SLUGS.has(slug)
  const [notifyUsers, setNotifyUsers] = useState(canNotify)
  const [notifyPush, setNotifyPush] = useState(true)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailIntro, setEmailIntro] = useState('')
  const [summaryLines, setSummaryLines] = useState([''])
  const [recipientCount, setRecipientCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    if (!open) return
    setNotifyUsers(canNotify)
    setNotifyPush(true)
    setEmailSubject(`We're updating our ${documentTitle}`)
    setEmailIntro(DEFAULT_INTRO[slug] || `We're writing to inform you about updates to our ${documentTitle}.`)
    setSummaryLines([''])
  }, [open, slug, documentTitle, canNotify])

  useEffect(() => {
    if (!open || !canNotify) return
    let cancelled = false
    setLoadingCount(true)
    getLegalNotifyCount()
      .then(res => {
        if (!cancelled) setRecipientCount(res.data?.count ?? 0)
      })
      .catch(() => {
        if (!cancelled) setRecipientCount(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingCount(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, canNotify])

  const previewSummary = useMemo(
    () =>
      summaryLines
        .map(l => l.trim())
        .filter(Boolean)
        .map((line, i) => `${i + 1}. ${line}`)
        .join('\n'),
    [summaryLines]
  )

  const handleConfirm = () => {
    const payload = {
      notify_users: canNotify && notifyUsers,
      notify_push: canNotify && notifyUsers && notifyPush,
      email_subject: emailSubject.trim() || undefined,
      email_intro: emailIntro.trim() || undefined,
      email_summary_lines: summaryLines.map(l => l.trim()).filter(Boolean)
    }
    onConfirm(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Publish {documentTitle}</DialogTitle>
      <DialogContent dividers>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          This replaces the live document in all mobile apps (version {version ?? 'new'}). Apps refresh
          instantly for signed-in users.
        </Typography>

        {canNotify ? (
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifyUsers}
                  onChange={e => setNotifyUsers(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant='body2' fontWeight={600}>
                    Email all NetQwix users about this update
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {loadingCount
                      ? 'Counting recipients…'
                      : recipientCount != null
                        ? `${recipientCount.toLocaleString()} trainers & trainees with email on file`
                        : 'Could not load recipient count'}
                  </Typography>
                </Box>
              }
            />

            {notifyUsers ? (
              <>
                <FormControlLabel
                  control={
                    <Checkbox checked={notifyPush} onChange={e => setNotifyPush(e.target.checked)} />
                  }
                  label='Also send push notification to open the app'
                />
                <TextField
                  fullWidth
                  label='Email subject'
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  size='small'
                />
                <TextField
                  fullWidth
                  label='Introduction'
                  value={emailIntro}
                  onChange={e => setEmailIntro(e.target.value)}
                  multiline
                  minRows={4}
                  helperText='Shown after “Hello {name},” in the email.'
                />
                <Box>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Key changes (numbered in email)
                  </Typography>
                  {summaryLines.map((line, idx) => (
                    <Stack key={idx} direction='row' spacing={1} sx={{ mb: 1 }} alignItems='flex-start'>
                      <Typography variant='body2' color='text.secondary' sx={{ pt: 1.25, minWidth: 20 }}>
                        {idx + 1}.
                      </Typography>
                      <TextField
                        fullWidth
                        size='small'
                        placeholder='e.g. Multi-step tasks and connected apps — how data flows to third parties'
                        value={line}
                        onChange={e => {
                          const next = [...summaryLines]
                          next[idx] = e.target.value
                          setSummaryLines(next)
                        }}
                      />
                      <IconButton
                        size='small'
                        aria-label='Remove line'
                        disabled={summaryLines.length <= 1}
                        onClick={() => setSummaryLines(summaryLines.filter((_, i) => i !== idx))}
                      >
                        <DeleteOutlineIcon fontSize='small' />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={() => setSummaryLines([...summaryLines, ''])}
                  >
                    Add change
                  </Button>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant='overline' color='text.secondary'>
                    Email preview
                  </Typography>
                  <Typography variant='body2' fontWeight={600} sx={{ mt: 1 }}>
                    Hello [Name],
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {emailIntro || '—'}
                  </Typography>
                  {previewSummary ? (
                    <>
                      <Typography variant='body2' fontWeight={700} sx={{ mt: 2 }}>
                        What&apos;s changing?
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        component='pre'
                        sx={{ mt: 0.5, fontFamily: 'inherit', whiteSpace: 'pre-wrap', m: 0 }}
                      >
                        {previewSummary}
                      </Typography>
                    </>
                  ) : null}
                  <Typography variant='body2' color='primary' sx={{ mt: 2 }}>
                    Review the updated policy →
                  </Typography>
                </Box>
              </>
            ) : null}
          </Stack>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Cancellation and refund policies update in-app only — user emails are sent for Terms and Privacy.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={publishing}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleConfirm} disabled={publishing}>
          {publishing ? 'Publishing…' : notifyUsers && canNotify ? 'Publish & send emails' : 'Publish to app'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
