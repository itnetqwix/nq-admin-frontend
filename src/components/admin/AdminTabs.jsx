import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { ops } from 'src/styles/opsSurface'

/**
 * Ops Surface tab strip — hairline bottom, sentence-case labels.
 */
export default function AdminTabs({ value, onChange, tabs, sx }) {
  return (
    <Box
      sx={{
        borderBottom: `1px solid ${ops.hairline}`,
        mb: 2,
        ...sx
      }}
    >
      <Tabs
        value={value}
        onChange={(_, next) => onChange(next)}
        variant='scrollable'
        scrollButtons='auto'
        allowScrollButtonsMobile
        sx={{
          minHeight: 44,
          '& .MuiTabs-indicator': { bgcolor: ops.ink, height: 2 },
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 13,
            color: ops.mute,
            letterSpacing: '-0.01em',
            '&.Mui-selected': { color: ops.ink, fontWeight: 600 }
          }
        }}
      >
        {tabs.map(tab => (
          <Tab key={tab.value} value={tab.value} label={tab.label} disabled={tab.disabled} />
        ))}
      </Tabs>
    </Box>
  )
}
