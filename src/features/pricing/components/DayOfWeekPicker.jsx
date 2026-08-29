import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { ops } from 'src/styles/opsSurface'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

export { DAYS }

/**
 * Multi-select weekday picker for surge time windows.
 */
export default function DayOfWeekPicker({ value = [], onChange, disabled = false }) {
  return (
    <ToggleButtonGroup
      size='small'
      sx={{
        flexWrap: 'wrap',
        gap: 0.5,
        '& .MuiToggleButtonGroup-grouped': {
          border: `1px solid ${ops.hairline} !important`,
          borderRadius: `${ops.radiusSm} !important`,
          m: 0
        },
        '& .MuiToggleButton-root': {
          textTransform: 'none',
          fontFamily: ops.mono,
          fontSize: 11,
          px: 1,
          py: 0.35,
          color: ops.body,
          '&.Mui-selected': {
            bgcolor: ops.ink,
            color: '#fff',
            borderColor: `${ops.ink} !important`,
            '&:hover': { bgcolor: '#000' }
          }
        }
      }}
    >
      {DAYS.map(d => {
        const selected = value.includes(d.value)
        return (
          <ToggleButton
            key={d.value}
            value={d.value}
            selected={selected}
            disabled={disabled}
            onClick={() => {
              if (disabled) return
              const days = new Set(value)
              if (selected) days.delete(d.value)
              else days.add(d.value)
              onChange([...days].sort())
            }}
          >
            {d.label}
          </ToggleButton>
        )
      })}
    </ToggleButtonGroup>
  )
}
