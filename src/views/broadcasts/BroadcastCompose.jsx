import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import toast from 'react-hot-toast'
import { EditorState, ContentState, convertToRaw } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import { EditorWrapper } from 'src/@core/styles/libs/react-draft-wysiwyg'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { getRecipientPreviewCount } from 'src/services/broadcastApi'
import ChannelPicker from './ChannelPicker'
import MessagePreview from './MessagePreview'
import { AUDIENCE_OPTIONS, MESSAGE_TEMPLATES, STATUS_FILTER_OPTIONS } from './constants'
import { stripHtml } from './utils'

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false })

const STEPS = ['Audience & channels', 'Compose message', 'Review & send']

const emptyEditor = () => EditorState.createEmpty()

function editorFromHtml(html) {
  if (!html?.trim()) return emptyEditor()
  const text = stripHtml(html)
  if (!text.trim()) return emptyEditor()
  return EditorState.createWithContent(ContentState.createFromText(text))
}

export default function BroadcastCompose({ initialDraft, onSent, onCancelDraft }) {
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [editorState, setEditorState] = useState(emptyEditor)
  const [plainText, setPlainText] = useState('')
  const [audience, setAudience] = useState('All')
  const [statusFilter, setStatusFilter] = useState('approved')
  const [selectedChannels, setSelectedChannels] = useState([])
  const [templateId, setTemplateId] = useState('blank')
  const [recipientCount, setRecipientCount] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimer = useRef(null)

  useEffect(() => {
    if (!initialDraft) return
    setTitle(initialDraft.title || '')
    setPlainText(initialDraft.body || '')
    setAudience(initialDraft.audience || 'All')
    const st = initialDraft.audience_filter?.status
    setStatusFilter(Array.isArray(st) && st[0] ? st[0] : 'approved')
    setSelectedChannels(initialDraft.channels || [])
    setEditorState(editorFromHtml(initialDraft.html_body || ''))
    setStep(1)
    if (onCancelDraft) onCancelDraft()
    toast.success('Loaded broadcast into composer — review and send when ready.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft?._id])

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
    }, 400)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [audience, statusFilter])

  const getHtmlBody = () => draftToHtml(convertToRaw(editorState.getCurrentContent()))

  const handleEditorChange = state => {
    setEditorState(state)
    const html = draftToHtml(convertToRaw(state.getCurrentContent()))
    setPlainText(stripHtml(html))
  }

  const applyTemplate = id => {
    setTemplateId(id)
    const t = MESSAGE_TEMPLATES.find(x => x.id === id)
    if (!t || id === 'blank') return
    setTitle(t.title)
    setPlainText(t.plainText)
    if (t.htmlHint) setEditorState(editorFromHtml(t.htmlHint))
  }

  const resetCompose = () => {
    setStep(0)
    setTitle('')
    setEditorState(emptyEditor())
    setPlainText('')
    setAudience('All')
    setStatusFilter('approved')
    setSelectedChannels([])
    setTemplateId('blank')
  }

  const validateStep = s => {
    if (s === 0) {
      if (!selectedChannels.length) {
        toast.error('Select at least one channel.')
        return false
      }
      if (recipientCount === 0) {
        toast.error('No recipients match this audience. Adjust filters.')
        return false
      }
      return true
    }
    if (s === 1) {
      if (!title.trim()) {
        toast.error('Title is required.')
        return false
      }
      if (selectedChannels.includes('email')) {
        const html = getHtmlBody()
        if (!html || html === '<p></p>\n' || !stripHtml(html).trim()) {
          toast.error('HTML body is required for email.')
          return false
        }
      }
      const needsText = selectedChannels.some(c => ['sms', 'whatsapp', 'push'].includes(c))
      if (needsText && !plainText.trim()) {
        toast.error('Plain text is required for SMS, WhatsApp, or Push.')
        return false
      }
      if (plainText.length > 1600 && selectedChannels.some(c => ['sms', 'whatsapp'].includes(c))) {
        toast.error('Plain text must be 1600 characters or fewer for SMS/WhatsApp.')
        return false
      }
      return true
    }
    return true
  }

  const next = () => {
    if (!validateStep(step)) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep(s => Math.max(s - 1, 0))

  const buildPayload = () => ({
    title: title.trim(),
    body: plainText.trim(),
    html_body: getHtmlBody(),
    channels: selectedChannels,
    audience,
    audience_filter: { status: statusFilter ? [statusFilter] : ['approved'] }
  })

  return (
    <AdminPageSection>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={step === 1 ? 8 : 12}>
          {step === 0 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 1.5 }}>
                  Who should receive this?
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={audience}
                  onChange={(_, v) => v && setAudience(v)}
                  size='small'
                  sx={{ flexWrap: 'wrap' }}
                >
                  {AUDIENCE_OPTIONS.map(opt => (
                    <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', px: 2 }}>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant='body2' fontWeight={600}>
                          {opt.label}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {opt.hint}
                        </Typography>
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <FormControl fullWidth size='small' sx={{ maxWidth: 360 }}>
                <InputLabel>Account status</InputLabel>
                <Select
                  label='Account status'
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map(o => (
                    <MenuItem key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity={recipientCount === 0 ? 'warning' : 'info'}>
                <strong>{previewLoading ? '…' : recipientCount ?? '—'}</strong> users match this audience
                {recipientCount === 0 ? ' — broaden filters to send.' : '.'}
              </Alert>

              <ChannelPicker
                selected={selectedChannels}
                onChange={setSelectedChannels}
                onSelectAll={() => setSelectedChannels(['email', 'sms', 'whatsapp', 'in_app', 'push'])}
                onClear={() => setSelectedChannels([])}
              />
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={3}>
              <FormControl fullWidth size='small' sx={{ maxWidth: 320 }}>
                <InputLabel>Quick template</InputLabel>
                <Select label='Quick template' value={templateId} onChange={e => applyTemplate(e.target.value)}>
                  {MESSAGE_TEMPLATES.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label='Title / subject'
                fullWidth
                size='small'
                value={title}
                onChange={e => setTitle(e.target.value)}
                inputProps={{ maxLength: 200 }}
                helperText={`${title.length}/200 — used as email subject and notification title`}
              />

              {selectedChannels.includes('email') ? (
                <Box>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Email body (rich text)
                  </Typography>
                  <EditorWrapper>
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={handleEditorChange}
                      wrapperClassName='rdw-editor-wrapper'
                      editorClassName='rdw-editor-main'
                      toolbarClassName='rdw-editor-toolbar'
                      toolbar={{
                        options: [
                          'inline',
                          'blockType',
                          'fontSize',
                          'list',
                          'textAlign',
                          'colorPicker',
                          'link',
                          'history'
                        ]
                      }}
                      editorStyle={{ minHeight: 220, padding: '0 14px' }}
                    />
                  </EditorWrapper>
                </Box>
              ) : null}

              <TextField
                label='Plain text message'
                fullWidth
                size='small'
                multiline
                minRows={4}
                value={plainText}
                onChange={e => setPlainText(e.target.value)}
                inputProps={{ maxLength: 1600 }}
                helperText={`${plainText.length}/1600 — SMS, WhatsApp, push; synced from email when you edit rich text`}
              />
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <Alert severity='warning' icon={false}>
                Sending to <strong>{recipientCount ?? '?'}</strong> users cannot be undone. Delivery runs in the
                background — check History for progress.
              </Alert>
              <MessagePreview
                title={title}
                plainText={plainText}
                htmlBody={getHtmlBody()}
                selectedChannels={selectedChannels}
                audience={audience}
                statusFilter={statusFilter}
                recipientCount={recipientCount}
                previewLoading={previewLoading}
              />
            </Stack>
          )}
        </Grid>

        {step === 1 ? (
          <Grid item xs={12} md={4}>
            <MessagePreview
              title={title}
              plainText={plainText}
              htmlBody={getHtmlBody()}
              selectedChannels={selectedChannels}
              audience={audience}
              statusFilter={statusFilter}
              recipientCount={recipientCount}
              previewLoading={previewLoading}
            />
          </Grid>
        ) : null}
      </Grid>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent='space-between'
        sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}
      >
        <Button variant='outlined' onClick={resetCompose}>
          Reset
        </Button>
        <Stack direction='row' spacing={1}>
          {step > 0 ? (
            <Button startIcon={<NavigateBeforeIcon />} onClick={back}>
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button variant='contained' endIcon={<NavigateNextIcon />} onClick={next}>
              Continue
            </Button>
          ) : (
            <Button
              variant='contained'
              startIcon={<SendIcon />}
              onClick={() => onSent(buildPayload())}
              sx={{ bgcolor: 'primary.main' }}
            >
              Review & send…
            </Button>
          )}
        </Stack>
      </Stack>
    </AdminPageSection>
  )
}
