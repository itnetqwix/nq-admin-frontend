import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'
import { CHANNELS } from './constants'

export default function ChannelPicker({ selected, onChange, onSelectAll, onClear }) {
  const toggle = key => {
    onChange(selected.includes(key) ? selected.filter(c => c !== key) : [...selected, key])
  }

  return (
    <Box>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Typography sx={{ flex: 1, fontWeight: 600, letterSpacing: '-0.28px', fontSize: 14 }}>
          Delivery channels.
        </Typography>
        <Chip
          size='small'
          label='Select all'
          variant='outlined'
          onClick={onSelectAll}
          clickable
          sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
        />
        <Chip
          size='small'
          label='Clear'
          variant='outlined'
          onClick={onClear}
          clickable
          sx={{ fontFamily: ops.mono, fontSize: 11, borderColor: ops.hairline }}
        />
        <Chip
          size='small'
          label={`${selected.length} selected`}
          sx={{
            fontFamily: ops.mono,
            fontSize: 11,
            bgcolor: selected.length ? ops.ink : ops.canvasSoft2,
            color: selected.length ? '#fff' : ops.mute
          }}
        />
      </Stack>
      <Grid container spacing={2}>
        {CHANNELS.map(ch => {
          const active = selected.includes(ch.key)
          return (
            <Grid item xs={12} sm={6} md={4} key={ch.key}>
              <Box
                onClick={() => toggle(ch.key)}
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') toggle(ch.key)
                }}
                sx={{
                  p: 2,
                  height: '100%',
                  bgcolor: ops.canvas,
                  borderRadius: ops.radiusLg,
                  boxShadow: active
                    ? `0 0 0 2px ${ops.ink}, ${ops.shadowCard}`
                    : ops.shadowCard,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.12s ease',
                  '&:hover': { bgcolor: ops.canvasSoft }
                }}
              >
                <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                  <Checkbox checked={active} tabIndex={-1} disableRipple sx={{ p: 0, mt: 0.25 }} />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: ops.radiusMd,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${ch.color}18`,
                      color: ch.color,
                      flexShrink: 0
                    }}
                  >
                    <Icon icon={ch.icon} fontSize={22} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 14 }}>
                      {ch.label}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: ops.body, display: 'block', lineHeight: 1.4 }}>
                      {ch.description}
                    </Typography>
                    {ch.requiresHtml ? (
                      <Chip
                        size='small'
                        label='Needs HTML'
                        sx={{ mt: 1, fontFamily: ops.mono, fontSize: 10 }}
                      />
                    ) : null}
                    {ch.requiresText ? (
                      <Chip
                        size='small'
                        label='Needs plain text'
                        sx={{ mt: 1, ml: ch.requiresHtml ? 0.5 : 0, fontFamily: ops.mono, fontSize: 10 }}
                      />
                    ) : null}
                  </Box>
                </Stack>
              </Box>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
