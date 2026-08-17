import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import toast from 'react-hot-toast'
import { ops } from 'src/styles/opsSurface'
import { getCareerApplicationResume, updateCareerApplicationStatus } from 'src/services/careersApi'
import { APPLICATION_STATUSES, statusChip } from './helpers'

export default function ApplicationDrawer({ row, onClose, onUpdated }) {
  const [status, setStatus] = useState(row?.status || 'new')
  const [note, setNote] = useState(row?.admin_note || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(row?.status || 'new')
    setNote(row?.admin_note || '')
  }, [row?._id])

  if (!row) return null

  const save = async () => {
    setSaving(true)
    try {
      const res = await updateCareerApplicationStatus(row._id, { status, admin_note: note })
      toast.success('Application updated.')
      onUpdated?.(res.data)
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const downloadResume = async () => {
    try {
      const res = await getCareerApplicationResume(row._id)
      const url = res?.data?.url
      if (!url) throw new Error('Resume URL missing')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err.message || 'Could not open resume')
    }
  }

  return (
    <Drawer
      anchor='right'
      open={Boolean(row)}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 0 } }}
    >
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${ops.hairline}` }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{row.full_name}</Typography>
          <Typography sx={{ fontSize: 13, color: ops.body }}>{row.job_title}</Typography>
        </Box>
        <IconButton onClick={onClose} aria-label='Close'>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.25} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13 }}>{row.email}</Typography>
          <Typography sx={{ fontSize: 13 }}>{row.phone}</Typography>
          <Typography sx={{ fontSize: 13 }}>
            Age {row.age} · {row.years_experience} years experience
          </Typography>
          {row.current_role ? <Typography sx={{ fontSize: 13 }}>Latest role: {row.current_role}</Typography> : null}
          {row.linkedin_url ? (
            <Typography sx={{ fontSize: 13 }}>
              <a href={row.linkedin_url} target='_blank' rel='noreferrer'>
                LinkedIn
              </a>
            </Typography>
          ) : null}
          <Box>{statusChip(row.status, APPLICATION_STATUSES)}</Box>
        </Stack>
        {row.cover_letter ? (
          <>
            <Typography variant='subtitle2'>Cover letter</Typography>
            <Typography sx={{ fontSize: 13, whiteSpace: 'pre-wrap', mb: 2 }}>{row.cover_letter}</Typography>
          </>
        ) : null}
        {(row.answers || []).length ? (
          <>
            <Typography variant='subtitle2'>Answers</Typography>
            {(row.answers || []).map(a => (
              <Box key={a.question_id} sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 11, color: ops.mute }}>{a.label || a.question_id}</Typography>
                <Typography sx={{ fontSize: 13 }}>{a.value || '—'}</Typography>
              </Box>
            ))}
          </>
        ) : null}
        <Button onClick={downloadResume} sx={{ textTransform: 'none', mb: 2 }}>
          Download resume ({row.resume?.filename || 'PDF'})
        </Button>
        <Divider sx={{ my: 2 }} />
        <FormControl fullWidth size='small' sx={{ mb: 1.5 }}>
          <InputLabel>Status</InputLabel>
          <Select label='Status' value={status} onChange={e => setStatus(e.target.value)}>
            {APPLICATION_STATUSES.map(s => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label='Admin note'
          fullWidth
          size='small'
          multiline
          minRows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <Stack direction='row' justifyContent='flex-end' sx={{ mt: 2 }}>
          <Button variant='contained' onClick={save} disabled={saving} sx={{ textTransform: 'none', bgcolor: ops.ink }}>
            Save
          </Button>
        </Stack>
      </Box>
    </Drawer>
  )
}
