import React from 'react'
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

const VARIANTS = ['primary', 'secondary', 'ghost']
const MAX_CTAS = 4

/**
 * Up to 4 banner CTAs (Blinkit-style). When any CTA is set, legacy single CTA fields are ignored on save.
 */
export default function BannerCtaEditor({ ctas = [], onChange }) {
  const list = Array.isArray(ctas) ? ctas : []

  const updateAt = (index, field, value) => {
    const next = list.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    onChange(next)
  }

  const addRow = () => {
    if (list.length >= MAX_CTAS) return
    onChange([...list, { label: '', url: '', variant: 'primary' }])
  }

  const removeAt = index => {
    onChange(list.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant='subtitle2'>Call-to-action buttons (up to {MAX_CTAS})</Typography>
        <Button
          size='small'
          startIcon={<AddIcon />}
          onClick={addRow}
          disabled={list.length >= MAX_CTAS}
        >
          Add CTA
        </Button>
      </Box>
      {list.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          No buttons yet — add one or use the optional single CTA fields below.
        </Typography>
      ) : null}
      {list.map((row, index) => (
        <Grid container spacing={1.5} key={index} sx={{ mb: 1.5 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Label'
              fullWidth
              size='small'
              value={row.label || ''}
              onChange={e => updateAt(index, 'label', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label='URL / deep link'
              fullWidth
              size='small'
              value={row.url || ''}
              onChange={e => updateAt(index, 'url', e.target.value)}
              placeholder='netqwix://wallet'
            />
          </Grid>
          <Grid item xs={10} sm={2}>
            <FormControl fullWidth size='small'>
              <InputLabel>Style</InputLabel>
              <Select
                label='Style'
                value={row.variant || 'primary'}
                onChange={e => updateAt(index, 'variant', e.target.value)}
              >
                {VARIANTS.map(v => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={2} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size='small' color='error' onClick={() => removeAt(index)} aria-label='Remove CTA'>
              <DeleteOutlineIcon fontSize='small' />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </Box>
  )
}
