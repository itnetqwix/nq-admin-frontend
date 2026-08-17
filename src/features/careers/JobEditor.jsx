import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CmsEditorDrawer from 'src/components/admin/content/CmsEditorDrawer'
import CmsHtmlEditor from 'src/components/admin/content/CmsHtmlEditor'
import {
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  LOCATION_TYPES,
  QUESTION_TYPES
} from './helpers'

export default function JobEditor({ formOpen, setFormOpen, editId, form, setForm, handleSave, saving }) {
  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        { id: '', label: '', type: 'text', required: false, options: [], optionsText: '' }
      ]
    }))
  }

  const updateQuestion = (idx, patch) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    }))
  }

  const removeQuestion = idx => {
    setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }))
  }

  return (
    <CmsEditorDrawer
      open={formOpen}
      onClose={() => setFormOpen(false)}
      title={editId ? 'Edit job' : 'New job'}
      subtitle='Published roles appear on netqwix.com/careers'
      onSave={handleSave}
      saving={saving}
      saveLabel={editId ? 'Update' : 'Create'}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField
            label='Title'
            fullWidth
            size='small'
            value={form.title}
            onChange={e => set('title', e.target.value)}
            inputProps={{ maxLength: 160 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size='small'>
            <InputLabel>Status</InputLabel>
            <Select label='Status' value={form.status} onChange={e => set('status', e.target.value)}>
              {JOB_STATUSES.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Department</InputLabel>
            <Select label='Department' value={form.department} onChange={e => set('department', e.target.value)}>
              {DEPARTMENTS.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Employment</InputLabel>
            <Select
              label='Employment'
              value={form.employment_type}
              onChange={e => set('employment_type', e.target.value)}
            >
              {EMPLOYMENT_TYPES.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size='small'>
            <InputLabel>Location type</InputLabel>
            <Select
              label='Location type'
              value={form.location_type}
              onChange={e => set('location_type', e.target.value)}
            >
              {LOCATION_TYPES.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label='Location'
            fullWidth
            size='small'
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder='New York, NY'
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label='Compensation'
            fullWidth
            size='small'
            value={form.compensation}
            onChange={e => set('compensation', e.target.value)}
            placeholder='Competitive / range'
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label='Closes'
            type='date'
            fullWidth
            size='small'
            value={form.closes_at}
            onChange={e => set('closes_at', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label='Sort'
            fullWidth
            size='small'
            value={form.sort_order}
            onChange={e => set('sort_order', e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label='Summary'
            fullWidth
            size='small'
            multiline
            minRows={2}
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            inputProps={{ maxLength: 400 }}
          />
        </Grid>
        <Grid item xs={12}>
          <CmsHtmlEditor
            key={`${editId || 'new'}-desc`}
            label='Responsibilities'
            value={form.description_html}
            onChange={html => set('description_html', html)}
            minHeight={220}
          />
        </Grid>
        <Grid item xs={12}>
          <CmsHtmlEditor
            key={`${editId || 'new'}-req`}
            label='Requirements'
            value={form.requirements_html}
            onChange={html => set('requirements_html', html)}
            minHeight={180}
          />
        </Grid>
        <Grid item xs={12}>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
            <Typography variant='subtitle2' fontWeight={600}>
              Application questions
            </Typography>
            <Button size='small' startIcon={<AddIcon />} onClick={addQuestion} sx={{ textTransform: 'none' }}>
              Add question
            </Button>
          </Stack>
          {(form.questions || []).map((q, idx) => (
            <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1.5 }}>
              <Stack direction='row' spacing={1} alignItems='flex-start'>
                <TextField
                  label='Question'
                  size='small'
                  fullWidth
                  value={q.label}
                  onChange={e => updateQuestion(idx, { label: e.target.value })}
                />
                <FormControl size='small' sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    label='Type'
                    value={q.type}
                    onChange={e => updateQuestion(idx, { type: e.target.value })}
                  >
                    {QUESTION_TYPES.map(t => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={q.required === true}
                      onChange={e => updateQuestion(idx, { required: e.target.checked })}
                    />
                  }
                  label='Required'
                />
                <IconButton onClick={() => removeQuestion(idx)} aria-label='Remove question'>
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              {q.type === 'select' ? (
                <TextField
                  sx={{ mt: 1 }}
                  label='Options (one per line)'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  value={q.optionsText ?? (q.options || []).join('\n')}
                  onChange={e => updateQuestion(idx, { optionsText: e.target.value })}
                />
              ) : null}
            </Box>
          ))}
        </Grid>
      </Grid>
    </CmsEditorDrawer>
  )
}
