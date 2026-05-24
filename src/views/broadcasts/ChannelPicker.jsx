import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { CHANNELS } from './constants'

export default function ChannelPicker({ selected, onChange, onSelectAll, onClear }) {
  const toggle = key => {
    onChange(
      selected.includes(key) ? selected.filter(c => c !== key) : [...selected, key]
    )
  }

  return (
    <Box>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }} flexWrap='wrap' useFlexGap>
        <Typography variant='subtitle2' sx={{ flex: 1 }}>
          Delivery channels
        </Typography>
        <Chip size='small' label='Select all' variant='outlined' onClick={onSelectAll} clickable />
        <Chip size='small' label='Clear' variant='outlined' onClick={onClear} clickable />
        <Chip
          size='small'
          color={selected.length ? 'primary' : 'default'}
          label={`${selected.length} selected`}
        />
      </Stack>
      <Grid container spacing={2}>
        {CHANNELS.map(ch => {
          const active = selected.includes(ch.key)
          return (
            <Grid item xs={12} sm={6} md={4} key={ch.key}>
              <Card
                variant='outlined'
                sx={{
                  borderColor: active ? 'primary.main' : 'divider',
                  borderWidth: active ? 2 : 1,
                  bgcolor: active ? 'action.selected' : 'background.paper',
                  height: '100%'
                }}
              >
                <CardActionArea onClick={() => toggle(ch.key)} sx={{ height: '100%', p: 2 }}>
                  <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                    <Checkbox checked={active} tabIndex={-1} disableRipple sx={{ p: 0, mt: 0.25 }} />
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
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
                      <Typography variant='subtitle2' fontWeight={600}>
                        {ch.label}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.4 }}>
                        {ch.description}
                      </Typography>
                      {ch.requiresHtml ? (
                        <Chip size='small' label='Needs HTML' sx={{ mt: 1 }} variant='outlined' />
                      ) : null}
                      {ch.requiresText ? (
                        <Chip size='small' label='Needs plain text' sx={{ mt: 1, ml: ch.requiresHtml ? 0.5 : 0 }} variant='outlined' />
                      ) : null}
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
