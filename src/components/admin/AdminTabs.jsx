import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Icon from 'src/@core/components/icon'
import { ops } from 'src/styles/opsSurface'

function TabLabel({ label, description, icon }) {
  if (!description && !icon) return label
  return (
    <Stack direction='row' spacing={1} alignItems='center' sx={{ py: description ? 0.5 : 0 }}>
      {icon ? <Icon icon={icon} fontSize={18} /> : null}
      <Box sx={{ textAlign: 'left' }}>
        <Typography component='span' sx={{ display: 'block', fontSize: 13, fontWeight: 'inherit', lineHeight: 1.2 }}>
          {label}
        </Typography>
        {description ? (
          <Typography
            component='span'
            sx={{ display: { xs: 'none', md: 'block' }, fontSize: 11, fontWeight: 400, color: ops.mute, mt: 0.25 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )
}

/**
 * Ops Surface tab strip — hairline bottom, sentence-case labels.
 * tabs: [{ value, label, description?, icon?, disabled? }]
 */
export default function AdminTabs({ value, onChange, tabs, sx }) {
  const hasDescriptions = tabs.some(t => t.description)

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
          minHeight: hasDescriptions ? 56 : 44,
          '& .MuiTabs-indicator': { bgcolor: ops.ink, height: 2 },
          '& .MuiTab-root': {
            minHeight: hasDescriptions ? 56 : 44,
            minWidth: 0,
            px: { xs: 1.5, sm: 2 },
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 13,
            color: ops.mute,
            letterSpacing: '-0.01em',
            alignItems: 'flex-start',
            '&.Mui-selected': { color: ops.ink, fontWeight: 600 }
          }
        }}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            label={<TabLabel label={tab.label} description={tab.description} icon={tab.icon} />}
          />
        ))}
      </Tabs>
    </Box>
  )
}
