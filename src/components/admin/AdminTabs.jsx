import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

/**
 * Consistent tab strip for finance, pricing, CMS sub-views, etc.
 */
export default function AdminTabs({ value, onChange, tabs, sx }) {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
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
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem'
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
