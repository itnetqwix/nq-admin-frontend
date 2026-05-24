import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { CHANNELS } from './constants'
import { smsSegmentInfo } from './utils'

export default function MessagePreview({
  title,
  plainText,
  htmlBody,
  selectedChannels,
  audience,
  statusFilter,
  recipientCount,
  previewLoading
}) {
  const sms = smsSegmentInfo(plainText)
  const activeChannels = CHANNELS.filter(c => selectedChannels.includes(c.key))

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        position: { md: 'sticky' },
        top: 88,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
        Live preview
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant='caption' color='text.secondary'>
            Audience
          </Typography>
          <Typography variant='body2'>
            {audience}
            {statusFilter ? ` · ${statusFilter}` : ' · all statuses'}
          </Typography>
          <Typography variant='body2' sx={{ mt: 0.5 }}>
            Recipients:{' '}
            <strong>{previewLoading ? '…' : recipientCount != null ? recipientCount : '—'}</strong>
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant='caption' color='text.secondary'>
            Channels
          </Typography>
          <Stack direction='row' flexWrap='wrap' gap={0.5} sx={{ mt: 0.5 }}>
            {activeChannels.length ? (
              activeChannels.map(c => <Chip key={c.key} size='small' label={c.label} />)
            ) : (
              <Typography variant='body2' color='text.secondary'>
                None selected
              </Typography>
            )}
          </Stack>
        </Box>

        {selectedChannels.includes('email') ? (
          <Box>
            <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
              Email preview
            </Typography>
            <Paper variant='outlined' sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
                {title || '(No subject)'}
              </Typography>
              <Box
                sx={{
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  maxHeight: 200,
                  overflow: 'auto',
                  '& p': { margin: '0 0 0.5em' }
                }}
                dangerouslySetInnerHTML={{
                  __html: htmlBody && htmlBody !== '<p></p>\n' ? htmlBody : '<p><em>Email body will appear here</em></p>'
                }}
              />
            </Paper>
          </Box>
        ) : null}

        {selectedChannels.some(c => ['sms', 'whatsapp', 'push'].includes(c)) ? (
          <Box>
            <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
              SMS / Push text
            </Typography>
            <Paper variant='outlined' sx={{ p: 1.5, bgcolor: 'grey.50', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
              {plainText || '(Empty message)'}
            </Paper>
            {selectedChannels.some(c => ['sms', 'whatsapp'].includes(c)) ? (
              <Typography variant='caption' color={sms.length > 1600 ? 'error.main' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
                {sms.length} chars · ~{sms.segments} segment{sms.segments !== 1 ? 's' : ''}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {selectedChannels.includes('in_app') ? (
          <Box>
            <Typography variant='caption' color='text.secondary'>
              In-app notification
            </Typography>
            <Paper variant='outlined' sx={{ p: 1.5, mt: 0.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0 }} />
              <Box>
                <Typography variant='subtitle2' fontWeight={600}>
                  {title || 'Notification title'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {plainText || title || 'Notification body'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : null}
      </Stack>
    </Paper>
  )
}
