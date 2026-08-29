import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { ops } from 'src/styles/opsSurface'

/**
 * Secondary pill nav inside a main tab — scrollable on narrow screens.
 * tabs: [{ value, label, disabled? }]
 */
export default function AdminSubTabs({ value, onChange, tabs = [], sx }) {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        mb: 2,
        pb: 0.25,
        ...sx
      }}
    >
      <Stack direction='row' spacing={0.75} sx={{ minWidth: 'max-content' }}>
        {tabs.map(tab => {
          const selected = tab.value === value
          return (
            <Button
              key={tab.value}
              size='small'
              disabled={tab.disabled}
              onClick={() => onChange(tab.value)}
              sx={{
                textTransform: 'none',
                fontWeight: selected ? 600 : 500,
                fontSize: 12,
                letterSpacing: '-0.01em',
                px: 1.5,
                py: 0.5,
                minHeight: 32,
                borderRadius: ops.radiusPill,
                border: `1px solid ${selected ? ops.ink : ops.hairline}`,
                bgcolor: selected ? ops.ink : ops.canvas,
                color: selected ? '#fff' : ops.body,
                '&:hover': {
                  bgcolor: selected ? '#000' : ops.canvasSoft,
                  borderColor: selected ? '#000' : ops.mute
                },
                '&.Mui-disabled': { opacity: 0.45 }
              }}
            >
              {tab.label}
            </Button>
          )
        })}
      </Stack>
    </Box>
  )
}
