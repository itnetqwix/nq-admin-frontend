// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const ModeToggler = props => {
  // ** Props
  const { settings, saveSettings } = props

  const handleModeChange = mode => {
    saveSettings({ ...settings, mode: mode })
  }

  const handleModeToggle = () => {
    if (settings.mode === 'light') {
      handleModeChange('dark')
    } else {
      handleModeChange('light')
    }
  }

  const isDark = settings.mode === 'dark'

  return (
    <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'} arrow>
      <IconButton
        color='inherit'
        aria-haspopup='true'
        onClick={handleModeToggle}
        aria-label='Toggle theme'
        sx={{
          p: 1,
          borderRadius: '8px',
          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
          color: isDark ? '#F59E0B' : '#64748B',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            color: isDark ? '#FBBF24' : '#0F172A'
          }
        }}
      >
        <Icon icon={isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'} fontSize={20} />
      </IconButton>
    </Tooltip>
  )
}

export default ModeToggler
