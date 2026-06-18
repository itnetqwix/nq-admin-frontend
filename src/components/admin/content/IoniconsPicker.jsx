import React, { useMemo, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import * as IoIcons from 'react-icons/io5'

/** Common Ionicons names used in mobile tips / dashboard (io5 pack mirrors Ionicons outline). */
const TIP_ICON_NAMES = [
  'bulb-outline',
  'megaphone-outline',
  'gift-outline',
  'star-outline',
  'heart-outline',
  'trophy-outline',
  'flash-outline',
  'rocket-outline',
  'book-outline',
  'school-outline',
  'fitness-outline',
  'golf-outline',
  'tennisball-outline',
  'football-outline',
  'basketball-outline',
  'medal-outline',
  'ribbon-outline',
  'pricetag-outline',
  'notifications-outline',
  'information-circle-outline',
  'help-circle-outline',
  'checkmark-circle-outline',
  'sparkles-outline',
  'calendar-outline',
  'time-outline',
  'wallet-outline',
  'card-outline',
  'people-outline',
  'person-outline',
  'chatbubble-outline'
]

function io5ComponentName(ionName) {
  const base = String(ionName || '')
    .replace(/-outline$/, '')
    .split('-')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  return `Io${base}Outline`
}

function resolveIcon(ionName) {
  const key = io5ComponentName(ionName)
  return IoIcons[key] || IoIcons.IoBulbOutline
}

export function IoniconsPreview({ name, size = 22, color = '#000080' }) {
  const Icon = resolveIcon(name || 'bulb-outline')
  return <Icon size={size} color={color} />
}

export default function IoniconsPicker({ value, onChange, label = 'Icon' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return TIP_ICON_NAMES
    return TIP_ICON_NAMES.filter(n => n.includes(s))
  }, [q])

  return (
    <>
      <TextField
        size='small'
        fullWidth
        label={label}
        value={value || ''}
        onClick={() => setOpen(true)}
        onChange={e => onChange?.(e.target.value)}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position='start'>
              <IoniconsPreview name={value || 'bulb-outline'} />
            </InputAdornment>
          )
        }}
        helperText='Tap to open icon picker — matches mobile Ionicons names'
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Choose icon</DialogTitle>
        <DialogContent>
          <TextField
            size='small'
            fullWidth
            placeholder='Search icons…'
            value={q}
            onChange={e => setQ(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
          <Grid container spacing={1}>
            {filtered.map(name => {
              const Icon = resolveIcon(name)
              const selected = value === name
              return (
                <Grid item xs={3} sm={2} key={name}>
                  <Tooltip title={name}>
                    <IconButton
                      onClick={() => {
                        onChange?.(name)
                        setOpen(false)
                      }}
                      sx={{
                        width: '100%',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        bgcolor: selected ? 'primary.50' : 'background.paper'
                      }}
                    >
                      <Icon size={22} color={selected ? '#1976d2' : '#333'} />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )
            })}
          </Grid>
          {!filtered.length ? (
            <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
              No icons match your search.
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
