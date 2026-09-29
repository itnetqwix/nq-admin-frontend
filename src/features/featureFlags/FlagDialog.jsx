import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'

const ROLES = ['Trainer', 'Trainee', 'guest']
export const EMPTY_FLAG = { key: '', description: '', enabled: false, rollout_percent: 100, roles: [] }

export default function FlagDialog({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FLAG)
  const [saving, setSaving] = useState(false)
  const isNew = !initial?.key

  useEffect(() => {
    if (open) setForm({ ...EMPTY_FLAG, ...(initial || {}) })
  }, [open, initial])

  const toggleRole = role =>
    setForm(f => ({ ...f, roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role] }))

  const submit = async () => {
    setSaving(true)
    try {
      await onSave({
        key: form.key.trim(),
        description: form.description,
        enabled: form.enabled,
        rollout_percent: Number(form.rollout_percent),
        roles: form.roles
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isNew ? 'New feature flag' : `Edit ${form.key}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label='Key'
            value={form.key}
            disabled={!isNew}
            helperText='Lowercase a-z, 0-9, _ . - (used in code)'
            onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase() }))}
          />
          <TextField
            label='Description'
            value={form.description}
            multiline
            minRows={2}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <FormControlLabel
            control={<Switch checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />}
            label='Enabled'
          />
          <TextField
            label='Rollout %'
            type='number'
            inputProps={{ min: 0, max: 100 }}
            value={form.rollout_percent}
            helperText='Sticky per signed-in user. Guests only see 100% rollouts.'
            onChange={e => setForm(f => ({ ...f, rollout_percent: e.target.value }))}
          />
          <div>
            <Typography variant='caption' color='text.secondary'>
              Audience (none selected = everyone)
            </Typography>
            <FormGroup row>
              {ROLES.map(r => (
                <FormControlLabel
                  key={r}
                  control={<Checkbox checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />}
                  label={r}
                />
              ))}
            </FormGroup>
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={submit} disabled={saving || !form.key.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
